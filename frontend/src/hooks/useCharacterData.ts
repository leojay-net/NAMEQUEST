'use client';

import { useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { namehash } from 'viem/ens';
import { CONTRACTS, DEMO_MODE } from '@/lib/wagmi';
import { baseSepolia } from 'wagmi/chains';

// Minimal ABI for the functions we use
const CHARACTER_REGISTRY_ABI = [
    {
        type: 'function',
        name: 'playerToNode',
        stateMutability: 'view',
        inputs: [{ name: 'player', type: 'address' }],
        outputs: [{ name: '', type: 'bytes32' }],
    },
    {
        type: 'function',
        name: 'getCharacterStats',
        stateMutability: 'view',
        inputs: [{ name: 'player', type: 'address' }],
        outputs: [
            { name: 'level', type: 'uint256' },
            { name: 'experience', type: 'uint256' },
            { name: 'questsCompleted', type: 'uint256' },
            { name: 'primarySubname', type: 'string' },
        ],
    },
    {
        type: 'function',
        name: 'getStat',
        stateMutability: 'view',
        inputs: [
            { name: 'player', type: 'address' },
            { name: 'statName', type: 'string' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        type: 'function',
        name: 'hasCharacter',
        stateMutability: 'view',
        inputs: [{ name: 'player', type: 'address' }],
        outputs: [{ name: '', type: 'bool' }],
    },
    {
        type: 'function',
        name: 'createCharacter',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'node', type: 'bytes32' }],
        outputs: [],
    },
    {
        type: 'function',
        name: 'createCharacter',
        stateMutability: 'nonpayable',
        inputs: [],
        outputs: [],
    },
    {
        type: 'function',
        name: 'linkEns',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'node', type: 'bytes32' }],
        outputs: [],
    },
    {
        type: 'function',
        name: 'setPrimarySubname',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'subname', type: 'string' }],
        outputs: [],
    },
] as const;

export function useCharacterData() {
    const { address } = useAccount();
    const demo = DEMO_MODE;

    const registry = useMemo(() => {
        const addr = CONTRACTS.characterRegistry;
        if (addr && addr.startsWith('0x') && addr.length === 42) {
            return addr as `0x${string}`;
        }
        return undefined;
    }, []);
    const enabled = Boolean(address && registry && !demo);

    // Determine if the player has a character: ENS-linked (playerToNode != 0) OR address-only via hasCharacter()
    const { data: nodeHash, isLoading: nodeLoading, refetch: refetchNode } = useReadContract({
        address: enabled ? registry : undefined,
        abi: CHARACTER_REGISTRY_ABI,
        functionName: 'playerToNode',
        args: address ? [address] : undefined,
        chainId: baseSepolia.id,
        query: { enabled, retry: 1, refetchOnWindowFocus: false },
    });

    const { data: hasCharFlag, isLoading: hasCharLoading, refetch: refetchHasChar } = useReadContract({
        address: enabled ? registry : undefined,
        abi: CHARACTER_REGISTRY_ABI,
        functionName: 'hasCharacter',
        args: address ? [address] : undefined,
        chainId: baseSepolia.id,
        query: { enabled, retry: 1, refetchOnWindowFocus: false },
    });

    const hasCharacter = useMemo(() => {
        if (demo) return true;
        const hasNode = typeof nodeHash === 'string' && nodeHash !== '0x0000000000000000000000000000000000000000000000000000000000000000';
        return Boolean(hasCharFlag) || hasNode;
    }, [demo, nodeHash, hasCharFlag]);

    const { data: characterStatsRaw, isLoading: statsLoading, refetch: refetchStats } = useReadContract({
        address: enabled ? registry : undefined,
        abi: CHARACTER_REGISTRY_ABI,
        functionName: 'getCharacterStats',
        args: address ? [address] : undefined,
        chainId: baseSepolia.id,
        query: { enabled: enabled && hasCharacter, retry: 1, refetchOnWindowFocus: false },
    });

    const { data: strength } = useReadContract({
        address: enabled ? registry : undefined,
        abi: CHARACTER_REGISTRY_ABI,
        functionName: 'getStat',
        args: address ? [address, 'strength'] : undefined,
        chainId: baseSepolia.id,
        query: { enabled: enabled && hasCharacter, retry: 1, refetchOnWindowFocus: false },
    });
    const { data: magic } = useReadContract({
        address: enabled ? registry : undefined,
        abi: CHARACTER_REGISTRY_ABI,
        functionName: 'getStat',
        args: address ? [address, 'magic'] : undefined,
        chainId: baseSepolia.id,
        query: { enabled: enabled && hasCharacter, retry: 1, refetchOnWindowFocus: false },
    });
    const { data: agility } = useReadContract({
        address: enabled ? registry : undefined,
        abi: CHARACTER_REGISTRY_ABI,
        functionName: 'getStat',
        args: address ? [address, 'agility'] : undefined,
        chainId: baseSepolia.id,
        query: { enabled: enabled && hasCharacter, retry: 1, refetchOnWindowFocus: false },
    });
    const { data: intellect } = useReadContract({
        address: enabled ? registry : undefined,
        abi: CHARACTER_REGISTRY_ABI,
        functionName: 'getStat',
        args: address ? [address, 'intellect'] : undefined,
        chainId: baseSepolia.id,
        query: { enabled: enabled && hasCharacter, retry: 1, refetchOnWindowFocus: false },
    });

    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const createCharacter = async (ensName?: string): Promise<void> => {
        if (demo) {
            return Promise.resolve();
        }
        if (ensName && ensName.length > 0) {
            const node = namehash(ensName);
            return writeContract({
                address: registry as `0x${string}`,
                abi: CHARACTER_REGISTRY_ABI,
                functionName: 'createCharacter',
                args: [node],
            });
        }
        // Non-ENS path
        return writeContract({
            address: registry as `0x${string}`,
            abi: CHARACTER_REGISTRY_ABI,
            functionName: 'createCharacter',
            args: [],
        });
    };

    const setPrimarySubname = async (subname: string): Promise<void> => {
        if (demo) return Promise.resolve();
        return writeContract({
            address: registry as `0x${string}`,
            abi: CHARACTER_REGISTRY_ABI,
            functionName: 'setPrimarySubname',
            args: [subname],
        });
    };

    const linkEns = async (ensName: string): Promise<void> => {
        if (demo) return Promise.resolve();
        const node = namehash(ensName);
        return writeContract({
            address: registry as `0x${string}`,
            abi: CHARACTER_REGISTRY_ABI,
            functionName: 'linkEns',
            args: [node],
        });
    };

    const refetchCharacterData = () => {
        refetchNode();
        refetchHasChar();
        refetchStats();
    };

    const characterStats = useMemo(() => {
        if (!characterStatsRaw) return null;
        const [level, experience, questsCompleted, primarySubname] = characterStatsRaw as unknown as [bigint, bigint, bigint, string];
        return {
            level: Number(level),
            experience: Number(experience),
            questsCompleted: Number(questsCompleted),
            primarySubname,
            stats: {
                strength: strength ? Number(strength as bigint) : undefined,
                magic: magic ? Number(magic as bigint) : undefined,
                agility: agility ? Number(agility as bigint) : undefined,
                intellect: intellect ? Number(intellect as bigint) : undefined,
            },
        };
    }, [characterStatsRaw, strength, magic, agility, intellect]);

    return {
        hasCharacter,
        isLoading: demo ? false : (nodeLoading || hasCharLoading || statsLoading),
        characterStats: demo
            ? {
                level: 3,
                experience: 250,
                questsCompleted: 7,
                primarySubname: 'demo.namequest.eth',
                stats: { strength: 8, magic: 6, agility: 7, intellect: 5 },
            }
            : characterStats,
        createCharacter,
        setPrimarySubname,
        linkEns,
        isCreating: demo ? false : (isPending || isConfirming),
        isSuccess: demo ? true : isSuccess,
        refetchCharacterData,
    } as const;
}

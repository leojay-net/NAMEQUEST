'use client';

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

// Quest Manager ABI - simplified for demo
const QUEST_MANAGER_ABI = [
    {
        name: 'getActiveQuests',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [{ name: '', type: 'uint256[]' }]
    },
    {
        name: 'acceptQuest',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'questId', type: 'uint256' }],
        outputs: []
    },
    {
        name: 'completeQuest',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'questId', type: 'uint256' }],
        outputs: []
    }
] as const;

const QUEST_MANAGER_ADDRESS = '0x2345678901234567890123456789012345678901';

export interface Quest {
    id: number;
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Epic';
    category: 'Social' | 'Technical' | 'Creative' | 'Community';
    reward: {
        experience: number;
        reputation: number;
        tokens?: number;
        achievement?: string;
    };
    requirements: string[];
    timeLimit?: string;
    participants: number;
    maxParticipants?: number;
    status: 'available' | 'active' | 'completed' | 'failed';
}

export function useQuestData() {
    // account address not required for mock data; keep API minimal for now
    const [quests, setQuests] = useState<Quest[]>([]);

    // For now, we'll use mock data since we don't have the full contract deployed
    useEffect(() => {
        const loadMockQuests = async () => {
            const mockQuests: Quest[] = [
                {
                    id: 1,
                    title: 'ENS Social Explorer',
                    description: 'Follow 10 different ENS users and engage with their content',
                    difficulty: 'Easy',
                    category: 'Social',
                    reward: { experience: 100, reputation: 20 },
                    requirements: ['Have an ENS name', 'Connect to EFP protocol'],
                    participants: 45,
                    maxParticipants: 100,
                    status: 'available'
                },
                {
                    id: 2,
                    title: 'Guild Founder',
                    description: 'Create a new guild and recruit 5 members',
                    difficulty: 'Hard',
                    category: 'Community',
                    reward: { experience: 500, reputation: 100, tokens: 1000, achievement: 'Guild Master' },
                    requirements: ['Level 5+', '500+ reputation'],
                    participants: 12,
                    maxParticipants: 20,
                    status: 'available'
                },
                {
                    id: 3,
                    title: 'Smart Contract Auditor',
                    description: 'Review and verify a community-submitted smart contract',
                    difficulty: 'Epic',
                    category: 'Technical',
                    reward: { experience: 1000, reputation: 200, tokens: 2000 },
                    requirements: ['Technical Badge', 'Level 10+'],
                    timeLimit: '7 days',
                    participants: 3,
                    maxParticipants: 5,
                    status: 'available'
                },
                {
                    id: 4,
                    title: 'First Steps',
                    description: 'Complete your character setup and make your first social connection',
                    difficulty: 'Easy',
                    category: 'Social',
                    reward: { experience: 50, reputation: 10 },
                    requirements: ['None'],
                    participants: 1,
                    status: 'active'
                }
            ];

            setQuests(mockQuests);
        };

        loadMockQuests();
    }, []);

    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const acceptQuest = async (questId: number) => {
        try {
            writeContract({
                address: QUEST_MANAGER_ADDRESS,
                abi: QUEST_MANAGER_ABI,
                functionName: 'acceptQuest',
                args: [BigInt(questId)],
            });
        } catch (error) {
            console.error('Error accepting quest:', error);
            throw error;
        }
    };

    const completeQuest = async (questId: number) => {
        try {
            writeContract({
                address: QUEST_MANAGER_ADDRESS,
                abi: QUEST_MANAGER_ABI,
                functionName: 'completeQuest',
                args: [BigInt(questId)],
            });
        } catch (error) {
            console.error('Error completing quest:', error);
            throw error;
        }
    };

    return {
        quests,
        acceptQuest,
        completeQuest,
        isTransacting: isPending || isConfirming,
        isSuccess
    };
}

import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { namehash, normalize } from 'viem/ens';

const mainnetRpc = process.env.NEXT_PUBLIC_MAINNET_RPC_URL;

// Dedicated ENS client on mainnet
export const ensClient = createPublicClient({
    chain: mainnet,
    transport: http(mainnetRpc),
});

export function normalizeEns(name: string): string {
    // Throws if invalid; caller should catch and report
    return normalize(name.trim());
}

export function ensNamehash(name: string): `0x${string}` {
    return namehash(name);
}

function evmChainIdToCoinType(chainId: number): number {
    // ENSIP-11 coinType encoding for EVM chains
    return (0x80000000 | chainId) >>> 0;
}

export async function resolveEnsAddress(
    name: string,
    opts?: { preferBase?: boolean }
): Promise<{ address: `0x${string}` | null; error?: string }> {
    try {
        const normalized = normalizeEns(name);
        // Prefer Base coin type if requested; fall back to default EVM address
        if (opts?.preferBase) {
            const baseCoinType = evmChainIdToCoinType(8453); // Base mainnet coin type per ENSIP-11
            const baseAddr = await ensClient.getEnsAddress({ name: normalized, coinType: BigInt(baseCoinType) });
            if (baseAddr) return { address: baseAddr };
            // Fall back to default address if Base-specific not set
            const def = await ensClient.getEnsAddress({ name: normalized });
            if (def) return { address: def };
            return {
                address: null,
                error:
                    'ENS name resolves to no address on Base. Set a Base (ENSIP-11) address for this name or continue without ENS.',
            };
        }

        const addr = await ensClient.getEnsAddress({ name: normalized });
        if (!addr)
            return {
                address: null,
                error: 'ENS name does not resolve to an address.',
            };
        return { address: addr };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Invalid ENS name.';
        return { address: null, error: message };
    }
}

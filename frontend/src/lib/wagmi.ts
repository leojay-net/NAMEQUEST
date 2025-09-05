import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia, mainnet } from 'wagmi/chains';
import { createConfig, http } from 'wagmi';
import { createPublicClient, http as viemHttp } from 'viem';

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;
const baseSepoliaRpc = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL;
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === '1';
export const ALLOW_NON_ENS = process.env.NEXT_PUBLIC_ALLOW_NON_ENS === '1';

export const config = projectId
    ? getDefaultConfig({
        appName: 'NameQuest',
        projectId,
        // Prefer Base Sepolia first so wallet UIs default to it
        chains: [baseSepolia, base, mainnet],
        ssr: true,
    })
    : createConfig({
        // Prefer Base Sepolia first for read-only defaults
        chains: [baseSepolia, base, mainnet],
        transports: {
            [base.id]: http(),
            [baseSepolia.id]: http(baseSepoliaRpc),
            [mainnet.id]: http(),
        },
        multiInjectedProviderDiscovery: false,
        ssr: true,
    });

// Shared read-only public client (Base Sepolia) for client-side utilities
export const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: viemHttp(baseSepoliaRpc, { timeout: 10000 }),
});

// Contract addresses on Base
export const CONTRACTS = {
    questToken: process.env.NEXT_PUBLIC_QUEST_TOKEN_ADDRESS || '',
    achievementNFT: process.env.NEXT_PUBLIC_ACHIEVEMENT_NFT_ADDRESS || '',
    characterRegistry: process.env.NEXT_PUBLIC_CHARACTER_REGISTRY_ADDRESS || '',
    reputationOracle: process.env.NEXT_PUBLIC_REPUTATION_ORACLE_ADDRESS || '',
    questManager: process.env.NEXT_PUBLIC_QUEST_MANAGER_ADDRESS || '',
    subnameFactory: process.env.NEXT_PUBLIC_SUBNAME_FACTORY_ADDRESS || '',
    guildManager: process.env.NEXT_PUBLIC_GUILD_MANAGER_ADDRESS || '',
    socialQuestManager: process.env.NEXT_PUBLIC_SOCIAL_QUEST_MANAGER_ADDRESS || '',
    tournamentManager: process.env.NEXT_PUBLIC_TOURNAMENT_MANAGER_ADDRESS || '',
    marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || '',
} as const;

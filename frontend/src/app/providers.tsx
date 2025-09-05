'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from '../lib/wagmi';
const hasProjectId = Boolean(process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID);
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                {hasProjectId ? (
                    <RainbowKitProvider>{children}</RainbowKitProvider>
                ) : (
                    children
                )}
            </QueryClientProvider>
        </WagmiProvider>
    );
}

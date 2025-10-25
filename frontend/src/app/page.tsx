
'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccount, useEnsName, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import ConnectButton from '@/components/ConnectButton';
import LandingPage from '@/components/LandingPage';
import CharacterCreation from '@/components/CharacterCreation';
import Dashboard from '@/components/Dashboard';
import QuestBoard from '@/components/QuestBoard';
import GuildHub from '@/components/GuildHub';
import TournamentArena from '@/components/TournamentArena';
import MarketPlace from '@/components/MarketPlace';
import Navigation from '@/components/Navigation';
import { useCharacterData } from '@/hooks/useCharacterData';
import { DEMO_MODE } from '@/lib/wagmi';

function HomeInner() {
  const { address, isConnected, chain } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { switchChain, isPending: switching } = useSwitchChain();
  const [activeTab, setActiveTab] = useState('dashboard');
  const { hasCharacter, isLoading, refetchCharacterData } = useCharacterData();
  const hasWalletConnect = Boolean(process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID);
  const searchParams = useSearchParams();
  const [exploreMode, setExploreMode] = useState(false);

  const onWrongNetwork = useMemo(() => {
    return isConnected && chain && chain.id !== baseSepolia.id;
  }, [isConnected, chain]);

  useEffect(() => {
    // Explore mode: allow read-only browsing without a wallet
    const qp = searchParams?.get('explore') === '1';
    const ls = typeof window !== 'undefined' && window.localStorage.getItem('nq_explore') === '1';
    if (qp || ls) setExploreMode(true);
  }, [searchParams]);

  // Show landing page if not connected
  if (!isConnected && !exploreMode && !DEMO_MODE) {
    return <LandingPage />;
  }

  // Show wrong network prompt
  if (onWrongNetwork && !DEMO_MODE) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="game-card p-8 text-center space-y-4">
          <p className="text-lg">Please switch to Base Sepolia to continue</p>
          <button
            className="btn-primary"
            onClick={() => switchChain({ chainId: baseSepolia.id })}
            disabled={switching}
          >
            {switching ? 'Switching...' : 'Switch to Base Sepolia'}
          </button>
          <p className="text-sm text-slate-400">Or click Explore Without Wallet on the landing page for read-only mode.</p>
        </div>
      </main>
    );
  }

  // Show loading state (bounded; if reads fail, the hooks won’t retry infinitely)
  if (isLoading && !DEMO_MODE) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="game-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-lg">Loading your character...</p>
          <p className="text-sm text-slate-400 mt-2">If this takes too long, confirm you are on Base Sepolia.</p>
        </div>
      </main>
    );
  }

  // Show character creation if no character exists
  if (!hasCharacter && isConnected && !DEMO_MODE) {
    return (
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Create Your Character</h1>
            {hasWalletConnect ? (
              <ConnectButton />
            ) : (
              <button className="btn-pixel opacity-60 cursor-not-allowed" disabled>
                Connect (setup required)
              </button>
            )}
          </div>
          <CharacterCreation
            ensName={ensName ?? undefined}
            onCharacterCreated={() => {
              // Ensure we immediately re-check character presence after tx confirmation
              refetchCharacterData();
            }}
          />
        </div>
      </main>
    );
  }

  // Show main game interface
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {DEMO_MODE && (
          <div className="mb-4 p-3 rounded border border-yellow-600 bg-yellow-900/20 text-yellow-300 text-sm">
            Demo Mode: onchain interactions are mocked. Disable by removing NEXT_PUBLIC_DEMO_MODE=1.
          </div>
        )}
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-blue-400">
              NameQuest
            </h1>
            {ensName && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-400">Playing as</span>
                <span className="font-medium text-blue-400">{ensName}</span>
              </div>
            )}
          </div>
          {hasWalletConnect ? (
            <ConnectButton />
          ) : (
            <button className="btn-pixel opacity-60 cursor-not-allowed" disabled>
              Connect (setup required)
            </button>
          )}
        </header>

        {/* Navigation */}
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content */}
        <div className="mt-8">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'quests' && <QuestBoard />}
          {activeTab === 'guilds' && <GuildHub />}
          {activeTab === 'tournaments' && <TournamentArena />}
          {activeTab === 'marketplace' && <MarketPlace />}
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <HomeInner />
    </Suspense>
  );
}
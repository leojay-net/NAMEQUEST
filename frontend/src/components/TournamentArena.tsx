'use client';

import { FC, useState, useEffect } from 'react';
import Icon from './Icon';
import { DEMO_MODE } from '@/lib/wagmi';
import { DEMO_KEYS, loadDemo, saveDemo } from '@/lib/demo';

interface Tournament {
    id: number;
    name: string;
    description: string;
    type: 'Bracket' | 'Points' | 'Survival' | 'Team';
    status: 'upcoming' | 'registration' | 'active' | 'completed';
    startTime: string;
    endTime: string;
    entryFee: number;
    prizePool: number;
    maxParticipants: number;
    currentParticipants: number;
    requirements: string[];
    isRegistered: boolean;
}

interface Leaderboard {
    rank: number;
    player: string;
    score: number;
    guild?: string;
}

const TournamentArena: FC = () => {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [leaderboard, setLeaderboard] = useState<Leaderboard[]>([]);
    const [activeTab, setActiveTab] = useState<'tournaments' | 'leaderboard'>('tournaments');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTournaments();
        loadLeaderboard();
    }, []);

    const loadTournaments = async () => {
        // TODO: Load tournaments from smart contract
        const stored = loadDemo<Tournament[]>(DEMO_KEYS.tournaments, []);
        const mockTournaments: Tournament[] = stored.length ? stored : [
            {
                id: 1,
                name: 'ENS Winter Championships',
                description: 'Epic tournament featuring the best questers across all categories',
                type: 'Points',
                status: 'registration',
                startTime: 'Dec 25, 2024',
                endTime: 'Jan 15, 2025',
                entryFee: 100,
                prizePool: 10000,
                maxParticipants: 128,
                currentParticipants: 87,
                requirements: ['Level 5+', '500+ reputation'],
                isRegistered: false
            },
            {
                id: 2,
                name: 'Guild Wars: Season 1',
                description: 'Inter-guild competition with team-based challenges',
                type: 'Team',
                status: 'upcoming',
                startTime: 'Jan 1, 2025',
                endTime: 'Jan 31, 2025',
                entryFee: 0,
                prizePool: 25000,
                maxParticipants: 200,
                currentParticipants: 156,
                requirements: ['Guild membership', 'Level 8+'],
                isRegistered: true
            },
            {
                id: 3,
                name: 'Speed Questing',
                description: 'Fast-paced quest completion tournament',
                type: 'Bracket',
                status: 'active',
                startTime: 'Dec 15, 2024',
                endTime: 'Dec 22, 2024',
                entryFee: 50,
                prizePool: 5000,
                maxParticipants: 64,
                currentParticipants: 64,
                requirements: ['Level 3+'],
                isRegistered: true
            }
        ];

        setTournaments(mockTournaments);
        saveDemo(DEMO_KEYS.tournaments, mockTournaments);
    };

    const loadLeaderboard = async () => {
        // TODO: Load leaderboard from smart contract
        const mockLeaderboard: Leaderboard[] = [
            { rank: 1, player: 'legend.eth', score: 15420, guild: 'Quest Masters' },
            { rank: 2, player: 'champion.eth', score: 14890, guild: 'ENS Builders' },
            { rank: 3, player: 'hero.eth', score: 13250, guild: 'Quest Masters' },
            { rank: 4, player: 'warrior.eth', score: 12100, guild: 'Social Butterflies' },
            { rank: 5, player: 'mage.eth', score: 11800, guild: 'Creative Collective' },
            { rank: 6, player: 'rogue.eth', score: 10950, guild: 'ENS Builders' },
            { rank: 7, player: 'paladin.eth', score: 9750, guild: 'Quest Masters' },
            { rank: 8, player: 'archer.eth', score: 9200, guild: 'Social Butterflies' }
        ];

        setTimeout(() => {
            setLeaderboard(mockLeaderboard);
            setIsLoading(false);
        }, 500);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
            </div>
        );
    }

    const getStatusColor = (status: Tournament['status']) => {
        switch (status) {
            case 'upcoming': return 'bg-blue-900/30 text-blue-400';
            case 'registration': return 'bg-green-900/30 text-green-400';
            case 'active': return 'bg-orange-900/30 text-orange-400';
            case 'completed': return 'bg-gray-900/30 text-gray-400';
        }
    };

    const getRankColor = (rank: number) => {
        if (rank === 1) return 'text-yellow-400';
        if (rank === 2) return 'text-gray-400';
        if (rank === 3) return 'text-orange-400';
        return 'text-gray-300';
    };

    const handleRegister = async (tournamentId: number) => {
        if (DEMO_MODE) {
            setTournaments((prev) => {
                const next = prev.map((t) => t.id === tournamentId ? { ...t, isRegistered: true, currentParticipants: Math.min(t.maxParticipants, t.currentParticipants + 1) } : t);
                saveDemo(DEMO_KEYS.tournaments, next);
                return next;
            });
            return;
        }
        // TODO: onchain register
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="game-card p-6">
                <h2 className="text-2xl font-bold mb-4">Tournament Arena</h2>
                <p className="text-gray-400 mb-6">Compete against other players in epic tournaments</p>

                {/* Tab Navigation */}
                <div className="flex space-x-4">
                    <button
                        onClick={() => setActiveTab('tournaments')}
                        className={`
              px-4 py-2 rounded-lg transition-colors
              ${activeTab === 'tournaments'
                                ? 'bg-orange-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }
            `}
                    >
                        <span className="inline-flex items-center gap-2"><Icon name="tournament" size={16} /> Tournaments</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('leaderboard')}
                        className={`
              px-4 py-2 rounded-lg transition-colors
              ${activeTab === 'leaderboard'
                                ? 'bg-orange-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }
            `}
                    >
                        <span className="inline-flex items-center gap-2"><Icon name="dashboard" size={16} /> Leaderboard</span>
                    </button>
                </div>
            </div>

            {/* Tournament List */}
            {activeTab === 'tournaments' && (
                <div className="space-y-4">
                    {tournaments.map((tournament) => (
                        <div key={tournament.id} className="game-card p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="text-xl font-bold">{tournament.name}</h3>
                                        <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(tournament.status)}`}>
                                            {tournament.status}
                                        </span>
                                    </div>
                                    <p className="text-gray-300 mb-3">{tournament.description}</p>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-400">Type</p>
                                            <p className="font-medium">{tournament.type}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Start</p>
                                            <p className="font-medium">{tournament.startTime}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Entry Fee</p>
                                            <p className="font-medium">{tournament.entryFee} QT</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Prize Pool</p>
                                            <p className="font-medium text-yellow-400">{tournament.prizePool} QT</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Participants */}
                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Participants</span>
                                    <span>{tournament.currentParticipants}/{tournament.maxParticipants}</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-orange-400 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${(tournament.currentParticipants / tournament.maxParticipants) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Requirements */}
                            <div className="mb-4">
                                <p className="text-sm text-gray-400 mb-2">Requirements:</p>
                                <div className="flex flex-wrap gap-1">
                                    {tournament.requirements.map((req, index) => (
                                        <span key={index} className="text-xs bg-gray-700 px-2 py-1 rounded">
                                            {req}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end space-x-3">
                                {tournament.status === 'registration' && !tournament.isRegistered && (
                                    <button
                                        onClick={() => handleRegister(tournament.id)}
                                        className="btn-primary"
                                    >
                                        Register ({tournament.entryFee} QT)
                                    </button>
                                )}
                                {tournament.isRegistered && (
                                    <div className="flex items-center space-x-2 text-green-400">
                                        <span>✓</span>
                                        <span>Registered</span>
                                    </div>
                                )}
                                <button className="btn-secondary">
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Leaderboard */}
            {activeTab === 'leaderboard' && (
                <div className="game-card p-6">
                    <h3 className="text-xl font-bold mb-6">Global Leaderboard</h3>
                    <div className="space-y-3">
                        {leaderboard.map((entry) => (
                            <div key={entry.rank} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <div className={`text-2xl font-bold ${getRankColor(entry.rank)}`}>
                                        #{entry.rank}
                                    </div>
                                    <div>
                                        <p className="font-medium">{entry.player}</p>
                                        {entry.guild && (
                                            <p className="text-sm text-gray-400">{entry.guild}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-blue-400">{entry.score.toLocaleString()}</p>
                                    <p className="text-xs text-gray-400">Tournament Points</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TournamentArena;

'use client';

import { FC, useState, useEffect } from 'react';
import Icon from './Icon';
import { DEMO_MODE } from '@/lib/wagmi';
import { DEMO_KEYS, loadDemo, saveDemo } from '@/lib/demo';
import { useDemoProgress } from '@/hooks/useDemoProgress';

interface Guild {
    id: number;
    name: string;
    description: string;
    memberCount: number;
    maxMembers: number;
    level: number;
    reputation: number;
    leader: string;
    tags: string[];
    requirements: string[];
    perks: string[];
    isJoined: boolean;
    applicationStatus?: 'pending' | 'approved' | 'rejected';
}

const GuildHub: FC = () => {
    const [guilds, setGuilds] = useState<Guild[]>([]);
    const [filter, setFilter] = useState<'all' | 'available' | 'joined'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateGuild, setShowCreateGuild] = useState(false);
    const progress = useDemoProgress();

    useEffect(() => {
        loadGuilds();
    }, []);

    const loadGuilds = async () => {
        // TODO: Load guilds from smart contract
        const stored = loadDemo<Guild[]>(DEMO_KEYS.guilds, []);
        const mockGuilds: Guild[] = stored.length ? stored : [
            {
                id: 1,
                name: 'ENS Builders',
                description: 'A guild for developers building on ENS and related protocols',
                memberCount: 25,
                maxMembers: 50,
                level: 3,
                reputation: 1250,
                leader: 'builder.eth',
                tags: ['Technical', 'ENS', 'Development'],
                requirements: ['Level 5+', 'Technical achievement'],
                perks: ['Weekly dev calls', 'Code review sessions', 'Priority support'],
                isJoined: false
            },
            {
                id: 2,
                name: 'Quest Masters',
                description: 'Elite questers who tackle the hardest challenges',
                memberCount: 18,
                maxMembers: 30,
                level: 5,
                reputation: 2100,
                leader: 'questmaster.eth',
                tags: ['Elite', 'Questing', 'Hardcore'],
                requirements: ['Level 10+', '1000+ reputation', 'Epic quest completed'],
                perks: ['Exclusive epic quests', 'Higher rewards', 'Leadership roles'],
                isJoined: true
            },
            {
                id: 3,
                name: 'Social Butterflies',
                description: 'Community-focused guild for networking and social quests',
                memberCount: 67,
                maxMembers: 100,
                level: 2,
                reputation: 800,
                leader: 'social.eth',
                tags: ['Social', 'Community', 'Networking'],
                requirements: ['Level 2+'],
                perks: ['Social quest bonuses', 'Community events', 'Networking opportunities'],
                isJoined: false
            },
            {
                id: 4,
                name: 'Creative Collective',
                description: 'Artists, designers, and creators collaborating on projects',
                memberCount: 32,
                maxMembers: 75,
                level: 4,
                reputation: 1500,
                leader: 'artist.eth',
                tags: ['Creative', 'Art', 'Design'],
                requirements: ['Creative achievement', 'Portfolio submission'],
                perks: ['Art challenges', 'Design tools access', 'Exhibition opportunities'],
                isJoined: false
            }
        ];

        setTimeout(() => {
            setGuilds(mockGuilds);
            saveDemo(DEMO_KEYS.guilds, mockGuilds);
            setIsLoading(false);
        }, 400);
    };

    const filteredGuilds = guilds.filter(guild => {
        if (filter === 'joined' && !guild.isJoined) return false;
        if (filter === 'available' && guild.isJoined) return false;
        if (searchTerm && !guild.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !guild.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    const handleJoinGuild = async (guildId: number) => {
        if (DEMO_MODE) {
            setGuilds((prev) => {
                const next = prev.map((g) => g.id === guildId ? { ...g, isJoined: true, memberCount: Math.min(g.maxMembers, g.memberCount + 1) } : g);
                saveDemo(DEMO_KEYS.guilds, next);
                const joined = next.find(g => g.id === guildId);
                if (joined) {
                    progress.joinGuild(joined.name);
                }
                return next;
            });
            return;
        }
        // TODO: onchain join
    };

    const handleLeaveGuild = async (guildId: number) => {
        if (DEMO_MODE) {
            setGuilds((prev) => {
                const next = prev.map((g) => g.id === guildId ? { ...g, isJoined: false, memberCount: Math.max(0, g.memberCount - 1) } : g);
                saveDemo(DEMO_KEYS.guilds, next);
                if (progress.guild && prev.find(g => g.id === guildId)?.name === progress.guild) {
                    progress.leaveGuild();
                }
                return next;
            });
            return;
        }
        // TODO: onchain leave
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="game-card p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Guild Hub</h2>
                    <button
                        onClick={() => setShowCreateGuild(true)}
                        className="btn-primary"
                    >
                        Create Guild
                    </button>
                </div>
                <p className="text-gray-400 mb-6">Join guilds to collaborate, compete, and unlock exclusive content</p>

                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search guilds..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-400"
                        />
                    </div>
                    <div className="flex space-x-2">
                        {(['all', 'available', 'joined'] as const).map((filterOption) => (
                            <button
                                key={filterOption}
                                onClick={() => setFilter(filterOption)}
                                className={`
                  px-4 py-2 text-sm rounded-lg transition-colors capitalize
                  ${filter === filterOption
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }
                `}
                            >
                                {filterOption}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Guild List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredGuilds.map((guild) => (
                    <div key={guild.id} className={`game-card p-6 ${guild.isJoined ? 'guild-highlight' : ''}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold mb-1">{guild.name}</h3>
                                <p className="text-sm text-gray-400">Led by {guild.leader}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-purple-400 font-medium">Level {guild.level}</div>
                                <div className="text-xs text-gray-400">{guild.reputation} reputation</div>
                            </div>
                        </div>

                        <p className="text-gray-300 mb-4">{guild.description}</p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mb-4">
                            {guild.tags.map((tag, index) => (
                                <span key={index} className="text-xs bg-gray-700 px-2 py-1 rounded">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        {/* Member Count */}
                        <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span>Members</span>
                                <span>{guild.memberCount}/{guild.maxMembers}</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-purple-400 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${(guild.memberCount / guild.maxMembers) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Requirements */}
                        <div className="mb-4">
                            <p className="text-sm text-gray-400 mb-2">Requirements:</p>
                            <div className="flex flex-wrap gap-1">
                                {guild.requirements.map((req, index) => (
                                    <span key={index} className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded">
                                        {req}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Perks */}
                        <div className="mb-4">
                            <p className="text-sm text-gray-400 mb-2">Guild Perks:</p>
                            <div className="space-y-1">
                                {guild.perks.map((perk, index) => (
                                    <div key={index} className="text-sm text-green-400 flex items-center space-x-2">
                                        <Icon name="achievement" size={14} />
                                        <span>{perk}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between items-center">
                            <div className="text-xs text-gray-500">
                                {guild.maxMembers - guild.memberCount} spots left
                            </div>

                            {guild.isJoined ? (
                                <div className="flex space-x-2">
                                    <button className="btn-secondary px-4 py-2 text-sm">
                                        Guild Chat
                                    </button>
                                    <button
                                        onClick={() => handleLeaveGuild(guild.id)}
                                        className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                    >
                                        Leave
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleJoinGuild(guild.id)}
                                    disabled={guild.memberCount >= guild.maxMembers}
                                    className={`
                    px-4 py-2 text-sm rounded-lg transition-colors
                    ${guild.memberCount >= guild.maxMembers
                                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                            : 'btn-primary'
                                        }
                  `}
                                >
                                    {guild.memberCount >= guild.maxMembers ? 'Full' : 'Join Guild'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredGuilds.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4 text-gray-600"><Icon name="guild" size={56} /></div>
                    <p className="text-lg text-gray-400">No guilds found</p>
                    <p className="text-gray-500 mb-4">Be the first to create a guild!</p>
                    <button
                        onClick={() => setShowCreateGuild(true)}
                        className="btn-primary"
                    >
                        Create Your Guild
                    </button>
                </div>
            )}

            {/* Create Guild Modal */}
            {showCreateGuild && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="game-card p-8 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold mb-4">Create New Guild</h3>
                        <p className="text-gray-400 mb-6">Create your own guild and invite others to join your quest!</p>

                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Guild name"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-400"
                            />
                            <textarea
                                placeholder="Guild description"
                                rows={3}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-400 resize-none"
                            />
                            <input
                                type="number"
                                placeholder="Max members (10-100)"
                                min="10"
                                max="100"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-400"
                            />
                        </div>

                        <div className="flex space-x-4 mt-6">
                            <button
                                onClick={() => setShowCreateGuild(false)}
                                className="flex-1 btn-secondary"
                            >
                                Cancel
                            </button>
                            <button className="flex-1 btn-primary">
                                Create Guild
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GuildHub;

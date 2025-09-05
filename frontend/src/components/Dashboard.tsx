'use client';

import { FC } from 'react';
import { useAccount } from 'wagmi';
import { DEMO_MODE } from '@/lib/wagmi';
import { useDemoProgress } from '@/hooks/useDemoProgress';
import Icon from './Icon';

type DashboardProps = Record<string, never>;

const Dashboard: FC<DashboardProps> = () => {
    const { address } = useAccount();
    const demo = DEMO_MODE;
    const progress = useDemoProgress();
    const stats = {
        strength: 7 + progress.level,
        intelligence: 4 + Math.floor(progress.level / 2),
        dexterity: 5 + progress.level,
        luck: 5 + Math.floor(progress.level / 3)
    };

    const progressPercentage = demo ? (progress.currentLevelExp / progress.nextLevelExp) * 100 : 0;

    return (
        <div className="space-y-8">
            {/* Character Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Character Card */}
                <div className="lg:col-span-1">
                    <div className="game-card p-6">
                        <div className="text-center mb-4">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full mx-auto mb-3 flex items-center justify-center">
                                <Icon name="sword" size={40} />
                            </div>
                            <h2 className="text-xl font-bold">{demo ? 'Demo Hero' : 'Hero'}</h2>
                            <p className="text-sm text-gray-400">{demo ? 'Adventurer' : ''}</p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Level {demo ? progress.level : 1}</span>
                                    <span>{demo ? progress.currentLevelExp : 0}/{demo ? progress.nextLevelExp : 1000} XP</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${progressPercentage}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="border-t border-gray-600 pt-3">
                                <p className="text-sm text-gray-400 mb-2">Reputation</p>
                                <p className="text-lg font-bold text-purple-400">{demo ? Math.floor(progress.level * 10) : 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats & Guild */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Character Stats */}
                    <div className="game-card p-6">
                        <h3 className="text-lg font-bold mb-4">Character Stats</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(stats).map(([stat, value]) => (
                                <div key={stat} className="text-center">
                                    <p className="text-sm text-gray-400 capitalize">{stat}</p>
                                    <p className="text-2xl font-bold text-blue-400">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Guild Status */}
                    <div className="game-card p-6">
                        <h3 className="text-lg font-bold mb-4">Guild Status</h3>
                        {demo && progress.guild ? (
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                                    <Icon name="shield" size={28} />
                                </div>
                                <div>
                                    <p className="font-medium">{progress.guild}</p>
                                    <p className="text-sm text-gray-400">Member since Jan 2024</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-gray-400 mb-3">You&apos;re not in a guild yet</p>
                                <button className="btn-secondary">Explore Guilds</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Active Quests */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="game-card p-6">
                    <h3 className="text-lg font-bold mb-4">Active Quests</h3>
                    <div className="space-y-3">
                        {demo && progress.quests.filter(q => !q.completed).map((quest) => (
                            <div key={quest.id} className="bg-gray-800 rounded-lg p-4 quest-active">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-medium">{quest.title}</h4>
                                    <span className="text-xs bg-orange-600 px-2 py-1 rounded">Active</span>
                                </div>
                                <p className="text-sm text-gray-400 mb-3">Progress your quest objectives.</p>
                                <div className="flex justify-between items-center">
                                    <div className="text-sm">
                                        <span className="text-blue-400">{quest.progress}/{quest.target}</span>
                                    </div>
                                    <div className="text-sm text-yellow-400">{quest.xp} XP</div>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                                    <div
                                        className="bg-orange-400 h-1.5 rounded-full transition-all duration-500"
                                        style={{ width: `${(quest.progress / quest.target) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="game-card p-6">
                    <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                        {demo && progress.activities.slice(0, 8).map((activity) => (
                            <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-800 rounded-lg">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs">
                                    {activity.type === 'quest' && <Icon name="quest" size={16} />}
                                    {activity.type === 'achievement' && <Icon name="achievement" size={16} />}
                                    {activity.type === 'guild' && <Icon name="guild" size={16} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{activity.message}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-xs text-gray-400">{new Date(activity.timestamp).toLocaleTimeString()}</p>
                                        {activity.reward && <span className="text-xs text-green-400">{activity.reward}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="game-card p-6">
                <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button className="btn-secondary py-3">
                        <div className="text-center flex flex-col items-center">
                            <Icon name="target" size={28} className="mb-2" />
                            <span>New Quest</span>
                        </div>
                    </button>
                    <button className="btn-secondary py-3">
                        <div className="text-center flex flex-col items-center">
                            <Icon name="shield" size={28} className="mb-2" />
                            <span>Join Guild</span>
                        </div>
                    </button>
                    <button className="btn-secondary py-3">
                        <div className="text-center flex flex-col items-center">
                            <Icon name="tournament" size={28} className="mb-2" />
                            <span>Tournament</span>
                        </div>
                    </button>
                    <button className="btn-secondary py-3">
                        <div className="text-center flex flex-col items-center">
                            <Icon name="marketplace" size={28} className="mb-2" />
                            <span>Marketplace</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

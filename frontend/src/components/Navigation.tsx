'use client';

import { FC } from 'react';
import Icon from './Icon';

interface NavigationProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const Navigation: FC<NavigationProps> = ({ activeTab, onTabChange }) => {
    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' as const },
        { id: 'quests', label: 'Quests', icon: 'quest' as const },
        { id: 'guilds', label: 'Guilds', icon: 'guild' as const },
        { id: 'tournaments', label: 'Tournaments', icon: 'tournament' as const },
        { id: 'marketplace', label: 'Marketplace', icon: 'marketplace' as const },
    ];

    return (
        <nav className="game-card p-4">
            <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200
              ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
                            }
            `}
                    >
                        <Icon name={tab.icon} size={18} className="text-current" />
                        <span className="font-medium">{tab.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};

export default Navigation;

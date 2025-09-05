'use client';

import { FC, useState, useEffect } from 'react';
import { DEMO_MODE } from '@/lib/wagmi';
import { DEMO_KEYS, loadDemo, saveDemo } from '@/lib/demo';

interface MarketItem {
    id: number;
    name: string;
    description: string;
    category: 'Equipment' | 'Consumable' | 'Achievement' | 'Cosmetic';
    price: number;
    currency: 'QT' | 'ETH';
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
    seller: string;
    image: string;
    stats?: Record<string, number>;
    isOwned: boolean;
}

const MarketPlace: FC = () => {
    const [items, setItems] = useState<MarketItem[]>([]);
    const [filter, setFilter] = useState<'all' | MarketItem['category']>('all');
    const [sortBy, setSortBy] = useState<'price' | 'rarity' | 'newest'>('newest');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [userBalance, setUserBalance] = useState(() => loadDemo(DEMO_KEYS.balances, { QT: 1250, ETH: 0.5 }));

    useEffect(() => {
        loadMarketItems();
    }, []);

    const loadMarketItems = async () => {
        // TODO: Load market items from smart contract
        const stored = loadDemo<MarketItem[]>(DEMO_KEYS.marketItems, []);
        const mockItems: MarketItem[] = stored.length ? stored : [
            {
                id: 1,
                name: 'Mystic Sword of ENS',
                description: 'A legendary blade that grows stronger with your ENS reputation',
                category: 'Equipment',
                price: 500,
                currency: 'QT',
                rarity: 'Legendary',
                seller: 'blacksmith.eth',
                image: '⚔️',
                stats: { strength: 15, luck: 5 },
                isOwned: false
            },
            {
                id: 2,
                name: 'Experience Potion',
                description: 'Doubles XP gain for the next 3 quests completed',
                category: 'Consumable',
                price: 75,
                currency: 'QT',
                rarity: 'Rare',
                seller: 'alchemist.eth',
                image: '🧪',
                isOwned: false
            },
            {
                id: 3,
                name: 'Guild Master Badge',
                description: 'Exclusive badge showing your leadership in the community',
                category: 'Achievement',
                price: 1000,
                currency: 'QT',
                rarity: 'Epic',
                seller: 'guildmaster.eth',
                image: '🛡️',
                isOwned: false
            },
            {
                id: 4,
                name: 'Rainbow Aura',
                description: 'Cosmetic aura that shows rainbow colors around your character',
                category: 'Cosmetic',
                price: 0.1,
                currency: 'ETH',
                rarity: 'Rare',
                seller: 'artist.eth',
                image: '🌈',
                isOwned: true
            },
            {
                id: 5,
                name: 'Wisdom Scroll',
                description: 'Increases intelligence stat by 2 permanently',
                category: 'Consumable',
                price: 300,
                currency: 'QT',
                rarity: 'Epic',
                seller: 'sage.eth',
                image: '📜',
                stats: { intelligence: 2 },
                isOwned: false
            }
        ];

        setTimeout(() => {
            setItems(mockItems);
            saveDemo(DEMO_KEYS.marketItems, mockItems);
            setIsLoading(false);
        }, 300);
    };

    const filteredAndSortedItems = items
        .filter(item => {
            if (filter !== 'all' && item.category !== filter) return false;
            if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !item.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            return true;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'price':
                    // Convert ETH to QT for comparison (assuming 1 ETH = 10000 QT)
                    const priceA = a.currency === 'ETH' ? a.price * 10000 : a.price;
                    const priceB = b.currency === 'ETH' ? b.price * 10000 : b.price;
                    return priceA - priceB;
                case 'rarity':
                    const rarityOrder = { 'Common': 1, 'Rare': 2, 'Epic': 3, 'Legendary': 4 };
                    return rarityOrder[b.rarity] - rarityOrder[a.rarity];
                default:
                    return b.id - a.id;
            }
        });

    const getRarityColor = (rarity: MarketItem['rarity']) => {
        switch (rarity) {
            case 'Common': return 'text-gray-400 bg-gray-900/30';
            case 'Rare': return 'text-blue-400 bg-blue-900/30';
            case 'Epic': return 'text-purple-400 bg-purple-900/30';
            case 'Legendary': return 'text-yellow-400 bg-yellow-900/30';
        }
    };

    const handlePurchase = async (itemId: number) => {
        if (DEMO_MODE) {
            setItems((prev) => {
                const next = prev.map((it) => it.id === itemId ? { ...it, isOwned: true } as MarketItem : it);
                saveDemo(DEMO_KEYS.marketItems, next);
                return next;
            });
            // Deduct balance
            const item = items.find((i) => i.id === itemId);
            if (item) {
                const nb = { ...userBalance };
                if (item.currency === 'QT') nb.QT = Math.max(0, nb.QT - item.price);
                if (item.currency === 'ETH') nb.ETH = Math.max(0, Number((nb.ETH - item.price).toFixed(4)));
                setUserBalance(nb);
                saveDemo(DEMO_KEYS.balances, nb);
            }
            return;
        }
        // TODO: onchain purchase
    };

    const handleSell = async (itemId: number) => {
        if (DEMO_MODE) {
            const item = items.find((i) => i.id === itemId);
            setItems((prev) => {
                const next = prev.map((it) => it.id === itemId ? { ...it, isOwned: false } as MarketItem : it);
                saveDemo(DEMO_KEYS.marketItems, next);
                return next;
            });
            if (item) {
                const nb = { ...userBalance };
                if (item.currency === 'QT') nb.QT = nb.QT + item.price;
                if (item.currency === 'ETH') nb.ETH = Number((nb.ETH + item.price).toFixed(4));
                setUserBalance(nb);
                saveDemo(DEMO_KEYS.balances, nb);
            }
            return;
        }
        // TODO: onchain sell/listing
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="game-card p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Marketplace</h2>
                    <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-2">
                            <span className="text-yellow-400">💰</span>
                            <span>{userBalance.QT} QT</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-blue-400">💎</span>
                            <span>{userBalance.ETH} ETH</span>
                        </div>
                    </div>
                </div>
                <p className="text-gray-400 mb-6">Buy and sell items, equipment, and achievements</p>

                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
                        />
                    </div>

                    <div className="flex space-x-2">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as 'all' | MarketItem['category'])}
                            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none"
                        >
                            <option value="all">All Categories</option>
                            <option value="Equipment">Equipment</option>
                            <option value="Consumable">Consumables</option>
                            <option value="Achievement">Achievements</option>
                            <option value="Cosmetic">Cosmetics</option>
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'price' | 'rarity' | 'newest')}
                            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none"
                        >
                            <option value="newest">Newest</option>
                            <option value="price">Price: Low to High</option>
                            <option value="rarity">Rarity: High to Low</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedItems.map((item) => (
                    <div key={item.id} className={`game-card p-6 ${item.isOwned ? 'border-green-400' : ''}`}>
                        <div className="text-center mb-4">
                            <div className="text-4xl mb-3">{item.image}</div>
                            <h3 className="text-lg font-bold mb-1">{item.name}</h3>
                            <div className="flex justify-center space-x-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${getRarityColor(item.rarity)}`}>
                                    {item.rarity}
                                </span>
                                <span className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded-full">
                                    {item.category}
                                </span>
                            </div>
                        </div>

                        <p className="text-sm text-gray-400 mb-4 text-center">{item.description}</p>

                        {/* Stats */}
                        {item.stats && (
                            <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                                <p className="text-sm text-gray-400 mb-2">Stats:</p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {Object.entries(item.stats).map(([stat, value]) => (
                                        <div key={stat} className="flex justify-between">
                                            <span className="capitalize">{stat}:</span>
                                            <span className="text-green-400 font-medium">+{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Price and Actions */}
                        <div className="border-t border-gray-600 pt-4">
                            <div className="flex justify-between items-center mb-3">
                                <div className="text-lg font-bold">
                                    {item.price} {item.currency}
                                </div>
                                <div className="text-xs text-gray-400">
                                    by {item.seller}
                                </div>
                            </div>

                            {item.isOwned ? (
                                <div className="flex space-x-2">
                                    <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg">
                                        ✓ Owned
                                    </button>
                                    <button
                                        onClick={() => handleSell(item.id)}
                                        className="btn-secondary px-4 py-2"
                                    >
                                        Sell
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handlePurchase(item.id)}
                                    disabled={
                                        (item.currency === 'QT' && userBalance.QT < item.price) ||
                                        (item.currency === 'ETH' && userBalance.ETH < item.price)
                                    }
                                    className={`
                    w-full py-2 rounded-lg transition-colors
                    ${(item.currency === 'QT' && userBalance.QT < item.price) ||
                                            (item.currency === 'ETH' && userBalance.ETH < item.price)
                                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                            : 'btn-primary'
                                        }
                  `}
                                >
                                    {(item.currency === 'QT' && userBalance.QT < item.price) ||
                                        (item.currency === 'ETH' && userBalance.ETH < item.price)
                                        ? 'Insufficient Funds'
                                        : 'Purchase'
                                    }
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredAndSortedItems.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">🏪</div>
                    <p className="text-lg text-gray-400">No items found</p>
                    <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
                    <button
                        onClick={() => { setSearchTerm(''); setFilter('all'); }}
                        className="btn-primary"
                    >
                        Clear Filters
                    </button>
                </div>
            )}
        </div>
    );
};

export default MarketPlace;

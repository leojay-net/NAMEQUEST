'use client';

import { FC, useEffect, useState } from 'react';
import { useCharacterData } from '@/hooks/useCharacterData';
import { DEMO_MODE, ALLOW_NON_ENS } from '@/lib/wagmi';
import { normalizeEns, resolveEnsAddress } from '@/lib/ens';
import Icon, { IconName } from './Icon';

interface CharacterCreationProps {
    ensName?: string;
    onCharacterCreated: () => void;
}

const CharacterCreation: FC<CharacterCreationProps> = ({
    ensName,
    onCharacterCreated
}) => {
    const [characterName, setCharacterName] = useState(ensName || '');
    const [selectedClass, setSelectedClass] = useState('');
    const [ensError, setEnsError] = useState<string | null>(null);
    const [resolving, setResolving] = useState(false);
    const { createCharacter, isCreating, isSuccess, refetchCharacterData } = useCharacterData();

    const characterClasses = [
        {
            id: 'warrior',
            name: 'Warrior',
            description: 'Master of combat and strength',
            icon: 'sword' as IconName,
            stats: { strength: 8, intelligence: 4, dexterity: 6, luck: 5 }
        },
        {
            id: 'mage',
            name: 'Mage',
            description: 'Wielder of arcane magic',
            icon: 'target' as IconName,
            stats: { strength: 3, intelligence: 9, dexterity: 5, luck: 6 }
        },
        {
            id: 'rogue',
            name: 'Rogue',
            description: 'Master of stealth and cunning',
            icon: 'shield' as IconName,
            stats: { strength: 5, intelligence: 6, dexterity: 9, luck: 8 }
        },
        {
            id: 'paladin',
            name: 'Paladin',
            description: 'Holy warrior with divine power',
            icon: 'achievement' as IconName,
            stats: { strength: 7, intelligence: 6, dexterity: 4, luck: 7 }
        }
    ];

    const handleCreateCharacter = async () => {
        if (!selectedClass || !characterName) return;
        try {
            if (DEMO_MODE) {
                onCharacterCreated();
                return;
            }
            // ENS validation and resolution before sending tx
            setEnsError(null);
            setResolving(true);
            const input = ensName || characterName;
            const normalized = normalizeEns(input);
            const { address, error } = await resolveEnsAddress(normalized, { preferBase: true });
            if (error || !address) {
                setEnsError(error || 'Unable to resolve ENS to an address.');
                setResolving(false);
                return;
            }
            await createCharacter(normalized);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to create character.';
            console.error('Error creating character:', error);
            setEnsError(message);
        } finally {
            setResolving(false);
        }
    };

    const handleContinueWithoutEns = () => {
        // In demo mode, just move forward; otherwise, inform the user about contract support requirement
        if (DEMO_MODE) {
            onCharacterCreated();
            return;
        }
        if (ALLOW_NON_ENS) {
            // Try to create character without ENS on-chain
            setEnsError(null);
            setResolving(true);
            (async () => {
                try {
                    await createCharacter();
                } catch (e: unknown) {
                    const message = e instanceof Error ? e.message : 'Failed to create without ENS.';
                    setEnsError(message);
                } finally {
                    setResolving(false);
                }
            })();
            return;
        }
        setEnsError('Non-ENS creation requires a contract update. Please use Demo mode or connect an ENS name.');
    };

    // When tx confirms, refetch and notify parent so app can advance
    useEffect(() => {
        if (isSuccess) {
            refetchCharacterData();
            onCharacterCreated();
        }
    }, [isSuccess, onCharacterCreated, refetchCharacterData]);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="game-card p-8 mb-8">
                {DEMO_MODE && (
                    <div className="mb-6 p-3 rounded border border-yellow-600 bg-yellow-900/20 text-yellow-300 text-sm">
                        Demo Mode: creation is mocked. Click Begin Your Quest to continue.
                    </div>
                )}
                <h2 className="text-2xl font-bold mb-6">Create Your Hero</h2>

                {/* Character Name */}
                <div className="mb-8">
                    <label className="block text-sm font-medium mb-2">Character Name</label>
                    <input
                        type="text"
                        value={characterName}
                        onChange={(e) => setCharacterName(e.target.value)}
                        placeholder={ensName ? `Using ENS: ${ensName}` : 'Enter character name'}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-400 transition-colors"
                        disabled={!!ensName}
                    />
                    {ensError && (
                        <div className="mt-2 space-y-1">
                            <p className="text-sm text-red-400">{ensError}</p>
                            <p className="text-xs text-gray-400">
                                Need help? See our guide: {""}
                                <a className="underline" href="/guides/ens-base" target="_blank" rel="noreferrer">Set Base coin-type in ENS</a>.
                            </p>
                        </div>
                    )}
                    {ensName && (
                        <p className="text-sm text-blue-400 mt-2">
                            ✨ ENS name detected! You get bonus stats and special abilities.
                        </p>
                    )}
                </div>

                {/* Class Selection */}
                <div className="mb-8">
                    <label className="block text-sm font-medium mb-4">Choose Your Class</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {characterClasses.map((charClass) => (
                            <label key={charClass.id} className="block">
                                <input
                                    type="radio"
                                    name="character-class"
                                    value={charClass.id}
                                    className="hidden"
                                    checked={selectedClass === charClass.id}
                                    onChange={() => setSelectedClass(charClass.id)}
                                />
                                <div
                                    role="button"
                                    aria-pressed={selectedClass === charClass.id}
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setSelectedClass(charClass.id);
                                        }
                                    }}
                                    className={`
                  game-card p-6 cursor-pointer transition-all duration-200
                  ${selectedClass === charClass.id
                                            ? 'border-blue-400 bg-blue-900/20 shadow-glow'
                                            : 'hover:border-gray-500'
                                        }
                `}
                                >
                                    <div className="flex items-center space-x-3 mb-3">
                                        <span className="text-3xl"><Icon name={charClass.icon} size={36} /></span>
                                        <div>
                                            <h3 className="text-lg font-bold">{charClass.name}</h3>
                                            <p className="text-sm text-gray-400">{charClass.description}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Strength:</span>
                                            <span className="font-medium">{charClass.stats.strength}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Intelligence:</span>
                                            <span className="font-medium">{charClass.stats.intelligence}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Dexterity:</span>
                                            <span className="font-medium">{charClass.stats.dexterity}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Luck:</span>
                                            <span className="font-medium">{charClass.stats.luck}</span>
                                        </div>
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Create Button */}
                <div className="text-center space-y-3">
                    <button
                        onClick={handleCreateCharacter}
                        disabled={!selectedClass || !characterName || isCreating || resolving}
                        className={`
              btn-primary px-8 py-3 text-lg
              ${(!selectedClass || !characterName || isCreating || resolving)
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:scale-105'
                            }
            `}
                    >
                        {isCreating || resolving ? (
                            <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>{resolving ? 'Resolving ENS…' : 'Confirming transaction...'}</span>
                            </div>
                        ) : (
                            'Begin Your Quest'
                        )}
                    </button>
                    <div>
                        <button
                            type="button"
                            onClick={handleContinueWithoutEns}
                            className="text-sm text-gray-300 underline hover:text-white"
                        >
                            {ALLOW_NON_ENS ? 'Create without ENS' : 'Continue without ENS (demo)'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CharacterCreation;

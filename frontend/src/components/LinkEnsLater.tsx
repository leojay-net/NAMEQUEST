"use client";

import { useState } from 'react';
import { normalizeEns, resolveEnsAddress } from '@/lib/ens';
import { useCharacterData } from '@/hooks/useCharacterData';

export default function LinkEnsLater() {
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const { linkEns, isCreating, isSuccess, refetchCharacterData } = useCharacterData();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const normalized = normalizeEns(name);
            setSubmitting(true);
            const { address, error } = await resolveEnsAddress(normalized, { preferBase: true });
            if (error || !address) {
                setError(error || 'Name does not resolve to an address.');
                setSubmitting(false);
                return;
            }
            await linkEns(normalized);
            refetchCharacterData();
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Failed to link ENS name.';
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="game-card p-6">
            <h3 className="text-lg font-semibold mb-3">Link ENS later</h3>
            <p className="text-sm text-gray-400 mb-4">
                Already created a character without ENS? Link one now for bonuses.
            </p>
            <form onSubmit={onSubmit} className="space-y-3">
                <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-400"
                    placeholder="yourname.eth"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                {error && <p className="text-sm text-red-400">{error}</p>}
                {isSuccess && (
                    <p className="text-sm text-green-400">Linked! You may need to refresh data.</p>
                )}
                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={!name || submitting || isCreating}
                        className={`btn-primary px-5 py-2 ${(!name || submitting || isCreating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {submitting || isCreating ? 'Linking…' : 'Link ENS name'}
                    </button>
                    <a className="text-sm underline text-gray-300" href="/guides/ens-base" target="_blank" rel="noreferrer">
                        How to set Base address
                    </a>
                </div>
            </form>
        </div>
    );
}

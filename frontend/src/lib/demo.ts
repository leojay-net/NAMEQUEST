// Lightweight helpers for Demo Mode state persistence using localStorage

export const DEMO_KEYS = {
    quests: 'nq_demo_quests',
    marketItems: 'nq_demo_market_items',
    balances: 'nq_demo_balances',
    guilds: 'nq_demo_guilds',
    tournaments: 'nq_demo_tournaments',
} as const;

export function loadDemo<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

export function saveDemo<T>(key: string, value: T) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // ignore quota errors in demo
    }
}

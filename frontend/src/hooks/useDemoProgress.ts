"use client";
import { useCallback, useEffect, useState } from 'react';
import { loadDemo, saveDemo } from '@/lib/demo';

interface DemoActivity {
    id: string;
    type: 'quest' | 'guild' | 'achievement' | 'level';
    message: string;
    timestamp: number;
    reward?: string;
}

interface DemoQuestProgress {
    id: number;
    progress: number;
    target: number;
    title: string;
    completed: boolean;
    xp: number;
}

interface DemoStatePersisted {
    xp: number;
    guild: string | null;
    quests: DemoQuestProgress[];
    activities: DemoActivity[];
}

const STORAGE_KEY = 'nq_demo_progress_v1';
const XP_PER_LEVEL = 1000;

function loadInitial(): DemoStatePersisted {
    return loadDemo<DemoStatePersisted>(STORAGE_KEY, {
        xp: 0,
        guild: null,
        quests: [
            { id: 1, title: 'Social Butterfly', progress: 0, target: 5, completed: false, xp: 100 },
            { id: 2, title: 'Guild Explorer', progress: 0, target: 1, completed: false, xp: 200 },
        ],
        activities: [],
    });
}

export function useDemoProgress() {
    const [state, setState] = useState<DemoStatePersisted>(() => loadInitial());

    // Persist
    useEffect(() => {
        saveDemo(STORAGE_KEY, state);
    }, [state]);

    const level = Math.floor(state.xp / XP_PER_LEVEL) + 1;
    const nextLevelExp = XP_PER_LEVEL;
    const currentLevelExp = state.xp % XP_PER_LEVEL;

    const addActivity = useCallback((act: Omit<DemoActivity, 'id' | 'timestamp'>) => {
        setState((prev) => ({
            ...prev,
            activities: [
                { id: crypto.randomUUID(), timestamp: Date.now(), ...act },
                ...prev.activities.slice(0, 49),
            ],
        }));
    }, []);

    const addExperience = useCallback((amount: number, reason?: string) => {
        if (amount <= 0) return;
        setState((prev) => ({ ...prev, xp: prev.xp + amount }));
        addActivity({ type: 'quest', message: `Gained ${amount} XP${reason ? ` (${reason})` : ''}`, reward: `+${amount} XP` });
    }, [addActivity]);

    const incrementQuest = useCallback((questId: number, inc = 1) => {
        setState((prev) => ({
            ...prev,
            quests: prev.quests.map((q) => {
                if (q.id !== questId) return q;
                if (q.completed) return q;
                const progress = Math.min(q.target, q.progress + inc);
                const completed = progress >= q.target;
                return { ...q, progress, completed };
            }),
        }));
    }, []);

    const completeQuest = useCallback((questId: number) => {
        setState((prev) => ({
            ...prev,
            quests: prev.quests.map((q) => q.id === questId ? { ...q, completed: true, progress: q.target } : q),
        }));
        const q = state.quests.find(q => q.id === questId);
        if (q && !q.completed) {
            addExperience(q.xp, q.title);
            addActivity({ type: 'quest', message: `Completed quest: ${q.title}`, reward: `+${q.xp} XP` });
        }
    }, [state.quests, addExperience, addActivity]);

    const joinGuild = useCallback((name: string) => {
        setState((prev) => ({ ...prev, guild: name }));
        addActivity({ type: 'guild', message: `Joined guild: ${name}` });
    }, [addActivity]);

    const leaveGuild = useCallback((name?: string) => {
        setState((prev) => ({ ...prev, guild: null }));
        if (name) addActivity({ type: 'guild', message: `Left guild: ${name}` });
    }, [addActivity]);

    return {
        level,
        experience: state.xp,
        nextLevelExp,
        currentLevelExp,
        guild: state.guild,
        quests: state.quests,
        activities: state.activities,
        addExperience,
        incrementQuest,
        completeQuest,
        joinGuild,
        leaveGuild,
    } as const;
}

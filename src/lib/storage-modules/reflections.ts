import { Reflection, PriorityTask } from '../types';
import { cache, provider, generateId, hydrateTable, notifyListeners, suppressSnapshot } from './core';
import { getTomorrowDateString } from '../time-utils';

/** @deprecated Use getReflectionsAsync for better performance */
export const getReflections = (): Reflection[] => {
    return cache.reflections || [];
};

export const getReflectionsAsync = async (): Promise<Reflection[]> => {
    const reflections = await hydrateTable('reflections') as Reflection[];

    // Deduplicate by Date (keep latest updated)
    const uniqueMap = new Map<string, Reflection>();

    // Process all reflections and normalize data
    for (let r of reflections) {
        // Normalize fields to prevent UI crashes from old/corrupt data
        r = {
            ...r,
            priorities: Array.isArray(r.priorities) ? r.priorities : [],
            images: Array.isArray(r.images) ? r.images : [],
            todayRoutines: Array.isArray(r.todayRoutines) ? r.todayRoutines : [],
            todayPriorities: Array.isArray(r.todayPriorities) ? r.todayPriorities : [],
            winOfDay: r.winOfDay || '',
            hurdle: r.hurdle || '',
            smallChange: r.smallChange || '',
        };

        const dateKey = new Date(r.date).toDateString();
        const existing = uniqueMap.get(dateKey);

        // Logic to keep the "better" version (prefer newer updatedAt)
        if (!existing) {
            uniqueMap.set(dateKey, r);
            continue;
        }

        const currTime = r.updatedAt ? new Date(r.updatedAt).getTime() : 0;
        const existTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;

        if (currTime > existTime) {
            uniqueMap.set(dateKey, r);
        }
    }

    return Array.from(uniqueMap.values()).sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );
};

export const saveReflection = async (reflection: Omit<Reflection, 'id'>, reason: string = 'Manual Save') => {
    console.log(`Storage: saveReflection triggered by [${reason}]`);
    // Ensure we have latest data
    const reflections = await getReflectionsAsync();
    const today = new Date().toDateString();
    const todayIndex = reflections.findIndex(r => new Date(r.date).toDateString() === today);

    let savedItem: Reflection;

    if (todayIndex !== -1) {
        // Update existing reflection for today
        savedItem = {
            ...reflections[todayIndex],
            ...reflection,
            todayRoutines: reflection.todayRoutines || reflections[todayIndex].todayRoutines,
            todayPriorities: reflection.todayPriorities || reflections[todayIndex].todayPriorities,
        };
        // Optimistic update
        cache.reflections![todayIndex] = savedItem;
    } else {
        // Create new for today
        savedItem = {
            ...reflection,
            id: generateId('ref'),
        };
        // Optimistic update
        cache.reflections = [savedItem, ...reflections];
    }

    await provider.saveReflection(savedItem, reason);

    // Suppress automatic snapshot for 5 seconds to avoid double-firing
    suppressSnapshot(5000);


    // Add tomorrow's priorities from reflection (MERGE, not replace!)
    if (reflection.priorities && reflection.priorities.length > 0) {
        const { getPriorities } = await import('./priorities');
        const existingPriorities = getPriorities('Reflections');
        const existingTexts = new Set(existingPriorities.map(p => p.text.toLowerCase().trim()));

        const newPriorityTexts = reflection.priorities
            .filter(p => p.trim())
            .filter(text => !existingTexts.has(text.toLowerCase().trim()));

        if (newPriorityTexts.length > 0) {
            const tomorrowStr = getTomorrowDateString();
            const now = new Date().toISOString();

            const newPriorities = newPriorityTexts.map(text => ({
                id: generateId('priority'),
                text,
                completed: false,
                scheduledFor: tomorrowStr,
                updatedAt: now,
            }));

            cache.priorities = [...(cache.priorities || []), ...newPriorities];

            try {
                // Batch save new priorities
                await provider.savePriorities?.(newPriorities, 'From Reflection');
            } catch (error) {
                console.error("Failed to save priorities from reflection", error);
            }
        }
    }

    notifyListeners();
    return savedItem;
};

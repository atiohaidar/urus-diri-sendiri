import { Reflection, PriorityTask } from '../types';
import { cache, provider, generateId, hydrateTable } from './core';
import { savePriorities } from './priorities';

/** @deprecated Use getReflectionsAsync for better performance */
export const getReflections = (): Reflection[] => {
    return cache.reflections || [];
};

export const getReflectionsAsync = async (): Promise<Reflection[]> => {
    const reflections = await hydrateTable('reflections') as Reflection[];

    // Deduplicate by Date (keep latest updated)
    const uniqueMap = new Map<string, Reflection>();

    // Process all reflections
    for (const r of reflections) {
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

export const saveReflection = async (reflection: Omit<Reflection, 'id'>) => {
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

    await provider.saveReflection(savedItem);

    // Update tomorrow's priorities based on reflection
    if (reflection.priorities) {
        const newPriorities: PriorityTask[] = reflection.priorities
            .filter(p => p.trim())
            .map((text, index) => ({
                id: `priority-${Date.now()}-${index}`,
                text,
                completed: false,
                updatedAt: new Date().toISOString(),
            }));
        savePriorities(newPriorities);
    }

    return savedItem;
};

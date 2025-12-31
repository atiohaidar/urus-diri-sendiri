import { Reflection, PriorityTask } from '../types';
import { cache, provider, generateId, hydrateTable } from './core';
import { savePriorities } from './priorities';

/** @deprecated Use getReflectionsAsync for better performance */
export const getReflections = (): Reflection[] => {
    return cache.reflections || [];
};

export const getReflectionsAsync = async (): Promise<Reflection[]> => {
    return hydrateTable('reflections');
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

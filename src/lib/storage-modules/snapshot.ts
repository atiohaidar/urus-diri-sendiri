import { Reflection, PriorityTask } from '../types';
import { cache, provider, generateId } from './core';
import { getReflectionsAsync } from './reflections';
import { getRoutines } from './routines';
import { getVisiblePriorities } from './priorities';

// Lock to prevent concurrent updates to snapshot
let isUpdatingSnapshot = false;

export const updateDailySnapshot = async () => {
    if (isUpdatingSnapshot) return;
    isUpdatingSnapshot = true;

    try {
        const reflections = await getReflectionsAsync();
        const todayDate = new Date();
        const todayStr = todayDate.toDateString();
        const todayIndex = reflections.findIndex(r => new Date(r.date).toDateString() === todayStr);

        const currentRoutines = getRoutines();
        const currentPriorities = getVisiblePriorities();

        if (todayIndex !== -1) {
            // Update existing reflection
            const updatedReflection = {
                ...reflections[todayIndex],
                todayRoutines: currentRoutines,
                todayPriorities: currentPriorities,
                updatedAt: new Date().toISOString(), // Ensure sync triggers
            };

            // Optimistic
            cache.reflections![todayIndex] = updatedReflection;
            await provider.saveReflection(updatedReflection);
        } else {
            // Create a new "Passive" reflection entry if at least one thing is checked
            const hasProgress = currentRoutines.some(r => r.completedAt) || currentPriorities.some(p => p.completed);

            if (hasProgress) {
                const now = new Date().toISOString();
                const newReflection: Reflection = {
                    id: generateId('ref'),
                    date: now,
                    winOfDay: "",
                    hurdle: "",
                    priorities: [],
                    smallChange: "",
                    todayRoutines: currentRoutines,
                    todayPriorities: currentPriorities,
                    updatedAt: now, // Ensure sync triggers
                };

                // Optimistic
                cache.reflections = [newReflection, ...reflections];
                await provider.saveReflection(newReflection);
            }
        }
    } finally {
        isUpdatingSnapshot = false;
    }
};

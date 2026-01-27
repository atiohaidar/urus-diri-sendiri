import { Reflection, PriorityTask } from '../types';
import { cache, provider, generateId } from './core';
import { getReflectionsAsync } from './reflections';
import { getRoutines } from './routines';
import { getPriorities } from './priorities';

// Lock to prevent concurrent updates to snapshot
let snapshotTimeout: any = null;

export const updateDailySnapshot = async () => {
    // Debounce: Wait 2 seconds before saving snapshot
    if (snapshotTimeout) clearTimeout(snapshotTimeout);

    snapshotTimeout = setTimeout(async () => {
        try {
            const reflections = await getReflectionsAsync();
            const todayDate = new Date();
            const todayStr = todayDate.toDateString();
            const todayIndex = reflections.findIndex(r => new Date(r.date).toDateString() === todayStr);

            // Avoid saving if data isn't loaded yet
            if (!provider || !cache.routines || !cache.priorities) return;

            const currentRoutines = getRoutines();
            const currentPriorities = getPriorities();

            // Check if there's actual change to avoid redundant writes?
            // For now, just simplistic override.

            if (todayIndex !== -1) {
                // Update existing reflection
                const updatedReflection = {
                    ...reflections[todayIndex],
                    todayRoutines: currentRoutines,
                    todayPriorities: currentPriorities,
                    updatedAt: new Date().toISOString(), // Ensure sync triggers
                };

                // Compare if changed to avoid loop
                const currentStr = JSON.stringify({
                    r: reflections[todayIndex].todayRoutines,
                    p: reflections[todayIndex].todayPriorities
                });
                const newStr = JSON.stringify({
                    r: updatedReflection.todayRoutines,
                    p: updatedReflection.todayPriorities
                });

                if (currentStr === newStr) return;

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
        } catch (e) {
            console.error("Snapshot update failed", e);
        }
    }, 2000);
};

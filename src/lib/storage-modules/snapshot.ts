import { Reflection, PriorityTask } from '../types';
import { cache, provider, generateId, isSnapshotSuppressed } from './core';
import { getReflectionsAsync } from './reflections';
import { getRoutines } from './routines';
import { getPriorities } from './priorities';

// Lock to prevent concurrent updates to snapshot
let snapshotTimeout: any = null;

export const updateDailySnapshot = async () => {
    // If a manual save just happened, don't auto-snapshot
    if (isSnapshotSuppressed()) return;

    // Debounce: Wait 2 seconds before saving snapshot
    if (snapshotTimeout) clearTimeout(snapshotTimeout);

    snapshotTimeout = setTimeout(async () => {
        try {
            // Avoid saving if core data isn't loaded yet
            if (!provider || !cache.routines || !cache.priorities || !cache.reflections) return;

            const reflections = await getReflectionsAsync();
            const todayDate = new Date();
            const todayStr = todayDate.toDateString();
            const existingReflection = reflections.find(r => new Date(r.date).toDateString() === todayStr);

            const currentRoutines = getRoutines();
            const currentPriorities = getPriorities('Snapshot');

            // SENSITIVITY FIX: Only compare content-essential fields for routines and priorities.
            // This ignores 'updatedAt' changes that come from background syncs, which was causing the "PUT loop".
            const simplifyRoutine = (r: any) => ({
                id: String(r.id),
                c: r.completedAt ? r.completedAt.split('T')[0] : null,
                n: r.completionNote || r.note || ""
            });
            const simplifyPriority = (p: any) => ({
                id: String(p.id),
                c: !!p.completed
            });

            // IMPORTANT: Sort by ID to make comparison order-independent
            const currentRoutinesSimplified = currentRoutines.map(simplifyRoutine).sort((a, b) => a.id.localeCompare(b.id));
            const currentPrioritiesSimplified = currentPriorities.map(simplifyPriority).sort((a, b) => a.id.localeCompare(b.id));

            if (existingReflection) {
                // Compare with what we already have in the reflection snapshot
                const existingRoutinesSimplified = (existingReflection.todayRoutines || []).map(simplifyRoutine).sort((a, b) => a.id.localeCompare(b.id));
                const existingPrioritiesSimplified = (existingReflection.todayPriorities || []).map(simplifyPriority).sort((a, b) => a.id.localeCompare(b.id));

                const routinesChanged = JSON.stringify(currentRoutinesSimplified) !== JSON.stringify(existingRoutinesSimplified);
                const prioritiesChanged = JSON.stringify(currentPrioritiesSimplified) !== JSON.stringify(existingPrioritiesSimplified);

                if (!routinesChanged && !prioritiesChanged) return;

                // DETAILED LOGGING OF CHANGES
                const logDiff = (label: string, cur: any[], old: any[]) => {
                    const curMap = new Map(cur.map(i => [i.id, i]));
                    const oldMap = new Map(old.map(i => [i.id, i]));
                    const changes: string[] = [];

                    cur.forEach(c => {
                        const o = oldMap.get(c.id);
                        if (!o) { changes.push(`Added ${c.id}`); return; }
                        Object.keys(c).forEach(k => {
                            if (c[k] !== o[k]) changes.push(`${c.id}.${k}: ${o[k]}->${c[k]}`);
                        });
                    });
                    old.forEach(o => { if (!curMap.has(o.id)) changes.push(`Removed ${o.id}`); });

                    if (changes.length > 0) console.log(`[Snapshot ${label}] Changes: ${changes.join(', ')}`);
                };

                if (routinesChanged) logDiff('Routines', currentRoutinesSimplified, existingRoutinesSimplified);
                if (prioritiesChanged) logDiff('Priorities', currentPrioritiesSimplified, existingPrioritiesSimplified);

                // Update existing reflection
                const updatedReflection = {
                    ...existingReflection,
                    todayRoutines: currentRoutines,
                    todayPriorities: currentPriorities,
                    updatedAt: new Date().toISOString(),
                };

                // FIX: Search cache by ID instead of using index from sorted/deduplicated array
                const cacheIndex = cache.reflections.findIndex(r => r.id === existingReflection.id);
                if (cacheIndex !== -1) {
                    cache.reflections[cacheIndex] = updatedReflection;
                } else {
                    cache.reflections.unshift(updatedReflection);
                }

                await provider.saveReflection(updatedReflection, 'Auto-Snapshot');
            } else {
                // Create a new "Passive" reflection entry if some progress exists
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
                        updatedAt: now,
                    };

                    cache.reflections = [newReflection, ...(cache.reflections || [])];
                    await provider.saveReflection(newReflection, 'Auto-Snapshot (New Day)');
                }
            }
        } catch (e) {
            console.error("Snapshot update failed", e);
        }
    }, 2000);
};

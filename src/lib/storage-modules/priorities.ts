import { PriorityTask } from '../types';
import { cache, provider, generateId, notifyListeners, handleSaveError } from './core';
import { getTodayDateString } from '../time-utils';

// Flag to prevent concurrent reset operations
let isResettingPriorities = false;

/**
 * Resets completed priorities from previous days.
 * Should be called once during app initialization or day change.
 */
export const resetOldCompletions = async (): Promise<void> => {
    if (isResettingPriorities) return;
    isResettingPriorities = true;

    try {
        const priorities = cache.priorities || [];
        const todayISO = getTodayDateString();

        let hasChanges = false;
        const updatedPriorities = priorities.map(p => {
            // Skip reset if scheduled for future
            if (p.scheduledFor && p.scheduledFor > todayISO) {
                return p;
            }

            // Check if priority was updated on a previous day and is completed
            if (p.updatedAt) {
                const priorityDateISO = p.updatedAt.split('T')[0]; // Extract YYYY-MM-DD
                if (priorityDateISO < todayISO && p.completed) {
                    hasChanges = true;
                    return {
                        ...p,
                        completed: false,
                        updatedAt: new Date().toISOString()
                    };
                }
            }
            return p;
        });

        if (hasChanges) {
            cache.priorities = updatedPriorities;
            await provider.savePriorities(updatedPriorities);
            notifyListeners();
        }
    } finally {
        isResettingPriorities = false;
    }
};

export const getPriorities = (): PriorityTask[] => {
    // Return cache directly - reset is handled separately during initialization
    const priorities = cache.priorities || [];
    const todayISO = getTodayDateString();

    // Filter out future-scheduled priorities for display (non-mutating)
    return priorities.filter(p => !p.scheduledFor || p.scheduledFor <= todayISO);
};

export const savePriorities = (priorities: PriorityTask[]) => {
    cache.priorities = priorities;
    // Async save with proper error handling
    provider.savePriorities(priorities).catch((error) => {
        handleSaveError(error, 'Menyimpan prioritas', () => savePriorities(priorities));
    });
};

export const updatePriorityCompletion = (id: string, completed: boolean, note?: string) => {
    const priorities = getPriorities();
    const now = new Date().toISOString();
    const updated = priorities.map(p =>
        p.id === id ? {
            ...p,
            completed,
            completionNote: note !== undefined ? note : p.completionNote,
            updatedAt: now
        } : p
    );
    savePriorities(updated);
    notifyListeners(); // Auto-update snapshot
    return updated;
};

export const addPriority = (text: string, scheduledFor?: string) => {
    const priorities = getPriorities();
    const newPriority: PriorityTask = {
        id: generateId('priority'),
        text,
        completed: false,
        scheduledFor,
        updatedAt: new Date().toISOString(),
    };
    const updated = [...priorities, newPriority];
    savePriorities(updated);
    notifyListeners(); // Auto-update snapshot
    return updated;
};

export const deletePriority = (id: string) => {
    const priorities = getPriorities();
    const updated = priorities.filter(p => p.id !== id);
    savePriorities(updated);
    notifyListeners();
    return updated;
};

export const updatePriorityText = (id: string, text: string) => {
    const priorities = getPriorities();
    const updated = priorities.map(p =>
        p.id === id ? { ...p, text, updatedAt: new Date().toISOString() } : p
    );
    savePriorities(updated);
    notifyListeners();
    return updated;
};

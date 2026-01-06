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

            // NEW: Skip reset if this is a one-time task (has a scheduled date)
            // Dated tasks should stay completed once they are done.
            if (p.scheduledFor) {
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
    const priorities = cache.priorities || [];
    const todayISO = getTodayDateString();

    return priorities
        .filter(p => {
            // 1. Never show future tasks
            if (p.scheduledFor && p.scheduledFor > todayISO) return false;

            // 2. Hide completed tasks from previous days
            // If it's completed, we only show it if it was scheduled for today OR updated today
            if (p.completed) {
                const isScheduledToday = p.scheduledFor === todayISO;
                const isUpdatedToday = p.updatedAt?.startsWith(todayISO);
                const isUnscheduled = !p.scheduledFor; // Unscheduled recurring tasks being shown today

                return isScheduledToday || isUpdatedToday || isUnscheduled;
            }

            // 3. Show all incomplete tasks (Today and Overdue)
            return true;
        })
        .sort((a, b) => {
            // Sort by completion (Incomplete first)
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }

            // Secondary: Sort by date (Today tasks first, then overdue tasks)
            // We treat null (daily recurring) as "today"
            const dateA = a.scheduledFor || todayISO;
            const dateB = b.scheduledFor || todayISO;

            if (dateA !== dateB) {
                // Descending to put today (larger date) at the top of active list
                return dateB.localeCompare(dateA);
            }

            // Final: Newest updated first
            return (b.updatedAt || "").localeCompare(a.updatedAt || "");
        });
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

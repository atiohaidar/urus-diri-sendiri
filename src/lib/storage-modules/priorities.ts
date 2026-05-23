import { PriorityTask } from '../types';
import { cache, provider, generateId, notifyListeners, handleSaveError, getIsCloudActive } from './core';
import { getTodayDateString, toLocalISODate } from '../time-utils';

// Flag to prevent concurrent reset operations
let isResettingPriorities = false;

/**
 * Helper to get ALL priorities (including hidden/future ones)
 * strictly for internal state manipulation.
 */
const getAllPriorities = (): PriorityTask[] => {
    return cache.priorities || [];
};

/**
 * Resets completed priorities from previous days.
 * Should be called once during app initialization or day change.
 */
export const resetOldCompletions = async (): Promise<void> => {
    if (isResettingPriorities) return;
    isResettingPriorities = true;

    try {
        // If cloud is active, delegate to backend (source of truth)
        if (getIsCloudActive()) {
            const { pageDataApi } = await import('../api/cloudflare-api');
            const result = await pageDataApi.resetPriorities();
            if (result?.resetCount > 0) {
                console.log(`Storage: Backend reset ${result.resetCount} old completions`);
                notifyListeners();
            }
            return;
        }

        // Local-only mode fallback
        const priorities = getAllPriorities();
        const todayISO = getTodayDateString();

        let hasChanges = false;
        const updatedPriorities = priorities.map(p => {
            if (p.scheduledFor && p.scheduledFor > todayISO) return p;
            if (p.scheduledFor) return p;
            if (p.updatedAt) {
                const priorityDateISO = toLocalISODate(p.updatedAt);
                if (priorityDateISO < todayISO && p.completed) {
                    hasChanges = true;
                    return { ...p, completed: false, updatedAt: new Date().toISOString() };
                }
            }
            return p;
        });

        if (hasChanges) {
            cache.priorities = updatedPriorities;
            const resetItems = updatedPriorities.filter((p, i) => p !== priorities[i]);
            await provider.savePriorities(resetItems, 'Reset Old Completions');
            notifyListeners();
        }
    } finally {
        isResettingPriorities = false;
    }
};

export const getPriorities = (caller: string = 'Unknown'): PriorityTask[] => {
    console.log(`Storage: getPriorities called by [${caller}]`);
    const priorities = getAllPriorities();
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

export const savePriorities = async (priorities: PriorityTask[], reason: string = 'UI Update') => {
    cache.priorities = priorities;
    try {
        await provider.savePriorities(priorities, reason);
    } catch (error) {
        handleSaveError(error, 'Menyimpan prioritas', () => savePriorities(priorities, reason));
    }
};

export const updatePriorityCompletion = async (id: string, completed: boolean, note?: string) => {
    const priorities = getAllPriorities();
    const now = new Date().toISOString();
    const updated = priorities.map(p =>
        p.id === id ? {
            ...p,
            completed,
            completionNote: note !== undefined ? note : p.completionNote,
            updatedAt: now
        } : p
    );
    const updatedItem = updated.find(p => p.id === id);
    cache.priorities = updated;
    notifyListeners();
    if (updatedItem) {
        try {
            await provider.savePriorities([updatedItem], `Update Completion (${completed})`);
        } catch (error) {
            handleSaveError(error, 'Update status prioritas');
        }
    }
    return updated;
};

export const addPriority = async (text: string, scheduledFor?: string) => {
    const priorities = getAllPriorities();
    const newPriority: PriorityTask = {
        id: generateId('priority'),
        text,
        completed: false,
        scheduledFor,
        updatedAt: new Date().toISOString(),
    };
    const updated = [...priorities, newPriority];
    cache.priorities = updated;
    notifyListeners();
    try {
        await provider.savePriorities([newPriority], 'Add Priority');
    } catch (error) {
        handleSaveError(error, 'Menambah prioritas');
    }
    return updated;
};

export const deletePriority = async (id: string) => {
    const priorities = getAllPriorities();
    const updated = priorities.filter(p => p.id !== id);
    cache.priorities = updated;
    notifyListeners();
    try {
        await provider.deletePriority(id);
    } catch (error) {
        handleSaveError(error, 'Menghapus prioritas', () => deletePriority(id));
    }
    return updated;
};

export const updatePriorityText = async (id: string, text: string) => {
    const priorities = getAllPriorities();
    const now = new Date().toISOString();
    const updated = priorities.map(p =>
        p.id === id ? { ...p, text, updatedAt: now } : p
    );
    cache.priorities = updated;
    notifyListeners();
    const updatedItem = updated.find(p => p.id === id);
    if (updatedItem) {
        try {
            await provider.savePriorities([updatedItem], 'Update Text');
        } catch (error) {
            handleSaveError(error, 'Update teks prioritas');
        }
    }
    return updated;
};

/**
 * Update the scheduledFor date of a priority.
 */
export const updatePrioritySchedule = async (id: string, scheduledFor: string | undefined) => {
    const priorities = getAllPriorities();
    const now = new Date().toISOString();
    const updated = priorities.map(p =>
        p.id === id ? {
            ...p,
            scheduledFor,
            completed: scheduledFor && scheduledFor > getTodayDateString() ? false : p.completed,
            updatedAt: now
        } : p
    );
    cache.priorities = updated;
    notifyListeners();
    const updatedItem = updated.find(p => p.id === id);
    if (updatedItem) {
        try {
            await provider.savePriorities([updatedItem], 'Update Schedule');
        } catch (error) {
            handleSaveError(error, 'Update jadwal prioritas');
        }
    }
    return updated;
};

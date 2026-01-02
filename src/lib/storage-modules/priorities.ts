import { PriorityTask } from '../types';
import { cache, provider, generateId, notifyListeners, handleSaveError } from './core';
import { getTodayDateString } from '../time-utils';

export const getPriorities = (): PriorityTask[] => {
    // Fallback to empty array if cache not ready
    let priorities = cache.priorities || [];
    const today = new Date().toDateString();
    const todayISO = getTodayDateString();

    // Check each priority individually and only reset the ones that are outdated
    let hasChanges = false;
    const updatedPriorities = priorities.map(p => {
        // Skip reset if scheduled for future
        if (p.scheduledFor && p.scheduledFor > todayISO) {
            return p;
        }

        // Only reset if this specific priority is completed and from a previous day
        const priorityDate = p.updatedAt ? new Date(p.updatedAt).toDateString() : today;
        if (priorityDate !== today && p.completed) {
            hasChanges = true;
            return {
                ...p,
                completed: false,
                updatedAt: new Date().toISOString()
            };
        }
        return p;
    });

    if (hasChanges) {
        savePriorities(updatedPriorities);
        return updatedPriorities;
    }

    return priorities;
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

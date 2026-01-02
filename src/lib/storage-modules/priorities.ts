import { PriorityTask } from '../types';
import { cache, provider, generateId, notifyListeners } from './core';

export const getPriorities = (): PriorityTask[] => {
    // Fallback to empty array if cache not ready
    let priorities = cache.priorities || [];

    // Check if these priorities are from a previous day
    const today = new Date().toDateString();
    const needsReset = priorities.some(p => p.updatedAt && new Date(p.updatedAt).toDateString() !== today);

    if (needsReset) {
        const resetPriorities = priorities.map(p => ({
            ...p,
            completed: false, // Reset for the new day
            updatedAt: new Date().toISOString()
        }));
        savePriorities(resetPriorities);
        return resetPriorities;
    }

    return priorities;
};

export const savePriorities = (priorities: PriorityTask[]) => {
    cache.priorities = priorities;
    // Fire and forget async save
    provider.savePriorities(priorities).catch(console.error);
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

export const addPriority = (text: string) => {
    const priorities = getPriorities();
    const newPriority: PriorityTask = {
        id: generateId('priority'),
        text,
        completed: false,
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

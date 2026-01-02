import { RoutineItem } from '../types';
import { STORAGE_KEYS } from '../constants';
import { toggleRoutineCompletion as toggleRoutineHelper } from '../routine-helpers';
import { cache, provider, notifyListeners, handleSaveError } from './core';

export const getRoutines = (): RoutineItem[] => {
    const today = new Date().toDateString();
    const lastOpen = localStorage.getItem(STORAGE_KEYS.LAST_OPEN_DATE);

    // If cache is empty, we might be in trouble if hydration hasn't finished.
    // But for now we proceed assuming initializeStorage was called.
    let routines = cache.routines || [];

    if (lastOpen !== today) {
        // IT'S A NEW DAY! 
        const resetRoutines = routines.map(r => ({
            ...r,
            completedAt: null,
            updatedAt: undefined
        }));

        cache.routines = resetRoutines;
        provider.saveRoutines(resetRoutines).catch((error) => {
            handleSaveError(error, 'Reset rutinitas harian');
        });
        localStorage.setItem(STORAGE_KEYS.LAST_OPEN_DATE, today);
        return resetRoutines;
    }

    return routines;
};

export const saveRoutines = (routines: RoutineItem[]) => {
    cache.routines = routines;
    provider.saveRoutines(routines).catch((error) => {
        handleSaveError(error, 'Menyimpan rutinitas', () => saveRoutines(routines));
    });
};

export const toggleRoutineCompletion = (id: string, routines: RoutineItem[], note?: string) => {
    const updated = toggleRoutineHelper(id, routines, note);
    saveRoutines(updated);
    notifyListeners(); // Auto-update snapshot
    return updated;
};


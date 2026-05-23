import { RoutineItem } from '../types';
import { STORAGE_KEYS } from '../constants';
import { toggleRoutineCompletion as toggleRoutineHelper } from '../routine-helpers';
import { parseTimeToMinutes } from '../time-utils';
import { cache, provider, notifyListeners, handleSaveError, getIsCloudActive } from './core';

// Helper to sort routines by startTime
const sortByStartTime = (routines: RoutineItem[]): RoutineItem[] => {
    return [...routines].sort((a, b) =>
        parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)
    );
};

const getAllRoutines = (): RoutineItem[] => {
    return cache.routines || [];
};

export const getRoutines = (): RoutineItem[] => {
    // When cloud active, backend handles daily reset via computed routes
    if (getIsCloudActive()) {
        return sortByStartTime(cache.routines || []);
    }

    const today = new Date().toDateString();
    const lastOpen = localStorage.getItem(STORAGE_KEYS.LAST_OPEN_DATE);

    let routines = cache.routines || [];

    if (lastOpen !== today) {
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
        return sortByStartTime(resetRoutines);
    }

    return sortByStartTime(routines);
};

export const saveRoutines = async (routines: RoutineItem[]) => {
    cache.routines = routines;
    try {
        await provider.saveRoutines(routines);
    } catch (error) {
        handleSaveError(error, 'Menyimpan rutinitas', () => saveRoutines(routines));
    }
};

export const deleteRoutine = async (id: string) => {
    const routines = getAllRoutines();
    const updated = routines.filter(r => r.id !== id);
    cache.routines = updated;
    notifyListeners();
    try {
        await provider.deleteRoutine(id);
    } catch (error) {
        handleSaveError(error, 'Menghapus rutinitas', () => deleteRoutine(id));
    }
    return updated;
};

export const toggleRoutineCompletion = async (id: string, routines: RoutineItem[], note?: string) => {
    const updated = toggleRoutineHelper(id, routines, note);
    cache.routines = updated;
    notifyListeners();
    const updatedItem = updated.find(r => r.id === id);
    if (updatedItem) {
        try {
            await provider.saveRoutines([updatedItem]);
        } catch (error) {
            handleSaveError(error, 'Update status rutinitas');
        }
    }
    return updated;
};


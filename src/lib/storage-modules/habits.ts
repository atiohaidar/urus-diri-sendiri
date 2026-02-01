import { Habit, HabitLog } from '../types';
import { cache, generateId, notifyListeners, handleSaveError, provider, getIsCloudActive } from './core';

// --- Cache Getters/Setters ---

export const getHabits = (): Habit[] => {
    return (cache.habits || []).filter(h => !h.deletedAt && !h.isArchived);
};

export const getAllHabits = (): Habit[] => {
    return cache.habits || [];
};

export const getHabitById = (id: string): Habit | undefined => {
    return cache.habits?.find(h => h.id === id);
};

export const getHabitLogs = (): HabitLog[] => {
    return (cache.habitLogs || []).filter(l => !l.deletedAt);
};

export const getHabitLogsByHabitId = (habitId: string): HabitLog[] => {
    return getHabitLogs().filter(l => l.habitId === habitId);
};

export const getHabitLogByDate = (habitId: string, date: string): HabitLog | undefined => {
    return getHabitLogs().find(l => l.habitId === habitId && l.date === date);
};

// --- CRUD Operations ---

export const addHabit = (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>): Habit[] => {
    const now = new Date().toISOString();
    const newHabit: Habit = {
        ...habit,
        id: generateId('habit'),
        createdAt: now,
        updatedAt: now,
        allowedDayOff: habit.allowedDayOff ?? 1,
    };

    cache.habits = [...(cache.habits || []), newHabit];

    // Persist - only send the new habit, not the entire list
    try {
        provider.saveHabits?.([newHabit]);
    } catch (error) {
        handleSaveError(error, 'addHabit', () => addHabit(habit));
    }

    notifyListeners();
    return getHabits();
};

export const updateHabit = (id: string, updates: Partial<Habit>): Habit[] => {
    const now = new Date().toISOString();

    cache.habits = (cache.habits || []).map(h => {
        if (h.id === id) {
            return { ...h, ...updates, updatedAt: now };
        }
        return h;
    });

    const updatedHabit = (cache.habits || []).find(h => h.id === id);

    try {
        if (updatedHabit) provider.saveHabits?.([updatedHabit]);
    } catch (error) {
        handleSaveError(error, 'updateHabit', () => updateHabit(id, updates));
    }

    notifyListeners();
    return getHabits();
};

export const deleteHabit = (id: string): Habit[] => {
    const now = new Date().toISOString();

    // Soft delete
    cache.habits = (cache.habits || []).map(h => {
        if (h.id === id) {
            return { ...h, deletedAt: now, updatedAt: now };
        }
        return h;
    });

    const deletedHabit = (cache.habits || []).find(h => h.id === id);

    try {
        if (deletedHabit) provider.saveHabits?.([deletedHabit]);
    } catch (error) {
        handleSaveError(error, 'deleteHabit', () => deleteHabit(id));
    }

    notifyListeners();
    return getHabits();
};

export const archiveHabit = (id: string, archived: boolean = true): Habit[] => {
    return updateHabit(id, { isArchived: archived });
};

// --- Habit Logs ---

export const logHabitCompletion = (habitId: string, date: string, note?: string): HabitLog[] => {
    const now = new Date().toISOString();

    // Check if log already exists for this date
    const existingLog = getHabitLogByDate(habitId, date);

    let logToSave: HabitLog;
    if (existingLog) {
        logToSave = { ...existingLog, completed: true, completedAt: now, note, updatedAt: now };
        cache.habitLogs = (cache.habitLogs || []).map(l => l.id === existingLog.id ? logToSave : l);
    } else {
        logToSave = {
            id: generateId('hlog'),
            habitId,
            date,
            completed: true,
            completedAt: now,
            note,
            createdAt: now,
            updatedAt: now,
        };
        cache.habitLogs = [...(cache.habitLogs || []), logToSave];
    }

    try {
        provider.saveHabitLogs?.([logToSave]);
    } catch (error) {
        handleSaveError(error, 'logHabitCompletion', () => logHabitCompletion(habitId, date, note));
    }

    notifyListeners();
    return getHabitLogs();
};

export const unlogHabitCompletion = (habitId: string, date: string): HabitLog[] => {
    const now = new Date().toISOString();
    const existingLog = getHabitLogByDate(habitId, date);

    if (existingLog) {
        const updatedLog = { ...existingLog, completed: false, deletedAt: now, updatedAt: now };
        cache.habitLogs = (cache.habitLogs || []).map(l => {
            if (l.id === existingLog.id) {
                return updatedLog;
            }
            return l;
        });

        try {
            provider.saveHabitLogs?.([updatedLog]);
        } catch (error) {
            handleSaveError(error, 'unlogHabitCompletion', () => unlogHabitCompletion(habitId, date));
        }

        notifyListeners();
    }

    return getHabitLogs();
};

export const toggleHabitCompletion = (habitId: string, date: string, note?: string): HabitLog[] => {
    const existingLog = getHabitLogByDate(habitId, date);

    if (existingLog && existingLog.completed) {
        return unlogHabitCompletion(habitId, date);
    } else {
        return logHabitCompletion(habitId, date, note);
    }
};

// --- Helpers ---

/**
 * Format date to YYYY-MM-DD string
 */
export const formatDateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

/**
 * Get today's date as YYYY-MM-DD
 */
export const getTodayString = (): string => {
    return formatDateString(new Date());
};

/**
 * Check if a habit is scheduled for a specific date
 */
export const isHabitScheduledFor = (habit: Habit, date: Date): boolean => {
    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, etc.

    switch (habit.frequency) {
        case 'daily':
            return true;

        case 'weekly': {
            // Weekly from creation date
            const createdDate = new Date(habit.createdAt);
            const diffDays = Math.floor((date.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
            return diffDays % 7 === 0;
        }

        case 'every_n_days': {
            const interval = habit.interval || 1;
            const createdDate = new Date(habit.createdAt);
            const diffDays = Math.floor((date.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
            return diffDays % interval === 0;
        }

        case 'specific_days':
            return (habit.specificDays || []).includes(dayOfWeek);

        default:
            return false;
    }
};

/**
 * Get frequency display text
 */
export const getFrequencyText = (habit: Habit): string => {
    switch (habit.frequency) {
        case 'daily':
            return 'Daily';
        case 'weekly':
            return 'Weekly';
        case 'every_n_days':
            return `Every ${habit.interval || 1} days`;
        case 'specific_days': {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const days = (habit.specificDays || []).map(d => dayNames[d]).join(', ');
            return days || 'No days selected';
        }
        default:
            return 'Unknown';
    }
};

/**
 * Calculate current streak for a habit
 */
export const calculateStreak = (habitId: string): number => {
    const habit = getHabitById(habitId);
    if (!habit) return 0;

    const logs = getHabitLogsByHabitId(habitId);
    const allowedDayOff = habit.allowedDayOff ?? 1;

    let streak = 0;
    let missedScheduledDays = 0;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Go back in time day by day
    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(currentDate);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = formatDateString(checkDate);

        const isScheduled = isHabitScheduledFor(habit, checkDate);
        const log = logs.find(l => l.date === dateStr && l.completed);

        if (isScheduled) {
            if (log) {
                streak++;
                missedScheduledDays = 0; // Reset missed counter
            } else {
                missedScheduledDays++;
                if (missedScheduledDays > allowedDayOff) {
                    break; // Streak broken
                }
            }
        }
        // Non-scheduled days don't affect streak
    }

    return streak;
};

/**
 * Calculate longest streak for a habit
 */
export const calculateLongestStreak = (habitId: string): number => {
    const habit = getHabitById(habitId);
    if (!habit) return 0;

    const logs = getHabitLogsByHabitId(habitId);
    const allowedDayOff = habit.allowedDayOff ?? 1;

    let longestStreak = 0;
    let currentStreak = 0;
    let missedScheduledDays = 0;

    // Sort logs by date
    const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));

    if (sortedLogs.length === 0) return 0;

    const startDate = new Date(sortedLogs[0].date);
    const endDate = new Date();
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const dateStr = formatDateString(currentDate);
        const isScheduled = isHabitScheduledFor(habit, currentDate);
        const log = logs.find(l => l.date === dateStr && l.completed);

        if (isScheduled) {
            if (log) {
                currentStreak++;
                missedScheduledDays = 0;
                longestStreak = Math.max(longestStreak, currentStreak);
            } else {
                missedScheduledDays++;
                if (missedScheduledDays > allowedDayOff) {
                    currentStreak = 0;
                    missedScheduledDays = 0;
                }
            }
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return longestStreak;
};

/**
 * Calculate completion rate for a habit in a date range
 */
export const calculateCompletionRate = (
    habitId: string,
    startDate: Date,
    endDate: Date
): { completed: number; total: number; rate: number } => {
    const habit = getHabitById(habitId);
    if (!habit) return { completed: 0, total: 0, rate: 0 };

    const logs = getHabitLogsByHabitId(habitId);
    let completed = 0;
    let total = 0;

    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    while (currentDate <= end) {
        if (isHabitScheduledFor(habit, currentDate)) {
            total++;
            const dateStr = formatDateString(currentDate);
            const log = logs.find(l => l.date === dateStr && l.completed);
            if (log) completed++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, rate };
};

/**
 * Get habits that are due today with their completion status
 */
export const getTodayHabits = (): Array<Habit & { isCompletedToday: boolean; currentStreak: number }> => {
    const habits = getHabits();
    const today = new Date();
    const todayStr = getTodayString();

    return habits
        .filter(habit => isHabitScheduledFor(habit, today))
        .map(habit => {
            const log = getHabitLogByDate(habit.id, todayStr);
            return {
                ...habit,
                isCompletedToday: !!log?.completed,
                currentStreak: calculateStreak(habit.id),
            };
        });
};

/**
 * Get all habits with their today status (even if not scheduled)
 */
export const getHabitsWithStatus = (): Array<Habit & {
    isScheduledToday: boolean;
    isCompletedToday: boolean;
    currentStreak: number;
}> => {
    const habits = getHabits();
    const today = new Date();
    const todayStr = getTodayString();

    return habits.map(habit => {
        const log = getHabitLogByDate(habit.id, todayStr);
        return {
            ...habit,
            isScheduledToday: isHabitScheduledFor(habit, today),
            isCompletedToday: !!log?.completed,
            currentStreak: calculateStreak(habit.id),
        };
    });
};

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
    getHabits,
    getHabitsWithStatus,
    getTodayHabits,
    addHabit,
    updateHabit,
    deleteHabit,
    archiveHabit,
    toggleHabitCompletion,
    calculateStreak,
    calculateLongestStreak,
    calculateCompletionRate,
    getTodayString,
    initializeStorage,
    registerListener,
    type Habit,
    type HabitFrequency,
} from '@/lib/storage';

export interface HabitWithStatus extends Habit {
    isScheduledToday: boolean;
    isCompletedToday: boolean;
    currentStreak: number;
}

export interface TodayHabit extends Habit {
    isCompletedToday: boolean;
    currentStreak: number;
    isScheduledToday: boolean;
}

export const useHabits = () => {
    const [habits, setHabits] = useState<HabitWithStatus[]>([]);
    const [todayHabits, setTodayHabits] = useState<TodayHabit[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            await initializeStorage();
            const habitsWithStatus = getHabitsWithStatus();

            // Fix: Map habits in the today only list to ensure isScheduledToday is true
            // This prevents the "Not scheduled today" badge from appearing in the Today section
            const todayOnly = getTodayHabits().map(h => ({
                ...h,
                isScheduledToday: true
            }));

            setHabits(habitsWithStatus);
            setTodayHabits(todayOnly);
        } catch (error) {
            console.error("Failed to load habits:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();

        const unsubscribe = registerListener(() => {
            console.log("♻️ UI: Habits updated from storage event");
            loadData();
        });

        return () => { unsubscribe(); };
    }, [loadData]);

    // --- Actions ---

    const handleAddHabit = useCallback((habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => {
        addHabit(habit);
        toast.success("Habit created! 🔥");
        loadData();
    }, [loadData]);

    const handleUpdateHabit = useCallback((id: string, updates: Partial<Habit>) => {
        updateHabit(id, updates);
        toast.success("Habit updated!");
        loadData();
    }, [loadData]);

    const handleDeleteHabit = useCallback((id: string) => {
        deleteHabit(id);
        toast.success("Habit deleted");
        loadData();
    }, [loadData]);

    const handleArchiveHabit = useCallback((id: string, archived: boolean = true) => {
        archiveHabit(id, archived);
        toast.success(archived ? "Habit archived" : "Habit restored");
        loadData();
    }, [loadData]);

    const handleToggleCompletion = useCallback((habitId: string, date?: string, note?: string) => {
        const targetDate = date || getTodayString();
        toggleHabitCompletion(habitId, targetDate, note);

        // Find the habit to show appropriate toast
        const habit = habits.find(h => h.id === habitId);
        const wasCompleted = habit?.isCompletedToday;

        if (!wasCompleted) {
            const streak = calculateStreak(habitId);
            toast.success(`Great job! 🔥 ${streak} day streak!`, {
                action: {
                    label: "Undo",
                    onClick: () => handleToggleCompletion(habitId, targetDate)
                }
            });
        }

        loadData();
    }, [habits, loadData]);

    // --- Stats Helpers ---

    const getHabitStreak = useCallback((habitId: string) => {
        return calculateStreak(habitId);
    }, []);

    const getHabitLongestStreak = useCallback((habitId: string) => {
        return calculateLongestStreak(habitId);
    }, []);

    const getHabitCompletionRate = useCallback((
        habitId: string,
        period: 'week' | 'month' = 'week'
    ) => {
        const now = new Date();
        let startDate: Date;

        if (period === 'week') {
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
        } else {
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
        }

        return calculateCompletionRate(habitId, startDate, now);
    }, []);

    return {
        // Data
        habits,
        todayHabits,
        isLoading,

        // Actions
        addHabit: handleAddHabit,
        updateHabit: handleUpdateHabit,
        deleteHabit: handleDeleteHabit,
        archiveHabit: handleArchiveHabit,
        toggleCompletion: handleToggleCompletion,

        // Stats
        getHabitStreak,
        getHabitLongestStreak,
        getHabitCompletionRate,

        // Utils
        refreshData: loadData,
    };
};

// Re-export types for convenience
export type { Habit, HabitFrequency };

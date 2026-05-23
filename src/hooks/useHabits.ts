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
    syncTable,
    getIsCloudActive,
    type Habit,
    type HabitFrequency,
} from '@/lib/storage';
import { pageDataApi } from '@/lib/api/cloudflare-api';

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

            if (getIsCloudActive()) {
                // Use backend unified page-data endpoint (1 request for all data)
                const data = await pageDataApi.fetch('habits');
                setHabits(data.habits || []);
                setTodayHabits((data.todayHabits || []).map((h: any) => ({ ...h, isScheduledToday: true })));
            } else {
                // Local mode: use local logic
                const habitsWithStatus = getHabitsWithStatus();
                const todayOnly = getTodayHabits().map(h => ({
                    ...h,
                    isScheduledToday: true
                }));
                setHabits(habitsWithStatus);
                setTodayHabits(todayOnly);
            }
        } catch (error) {
            console.error("Failed to load habits:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();

        // Background sync only needed for local mode
        if (!getIsCloudActive()) {
            syncTable('habits');
            syncTable('habitLogs');
        }

        const unsubscribe = registerListener(() => {
            loadData();
        });

        return () => { unsubscribe(); };
    }, [loadData]);

    // --- Actions ---

    const handleAddHabit = useCallback(async (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => {
        await addHabit(habit);
        toast.success("Habit created! 🔥");
        loadData();
    }, [loadData]);

    const handleUpdateHabit = useCallback(async (id: string, updates: Partial<Habit>) => {
        await updateHabit(id, updates);
        toast.success("Habit updated!");
        loadData();
    }, [loadData]);

    const handleDeleteHabit = useCallback(async (id: string) => {
        await deleteHabit(id);
        toast.success("Habit deleted");
        loadData();
    }, [loadData]);

    const handleArchiveHabit = useCallback(async (id: string, archived: boolean = true) => {
        await archiveHabit(id, archived);
        toast.success(archived ? "Habit archived" : "Habit restored");
        loadData();
    }, [loadData]);

    const handleToggleCompletion = useCallback(async (habitId: string, date?: string, note?: string) => {
        const targetDate = date || getTodayString();

        if (getIsCloudActive()) {
            try {
                const result = await pageDataApi.toggleHabit(habitId, targetDate, note);
                if (result.completed) {
                    toast.success(`Great job! 🔥`, {
                        action: {
                            label: "Undo",
                            onClick: () => handleToggleCompletion(habitId, targetDate)
                        }
                    });
                }
                loadData();
                return;
            } catch (err) {
                console.warn("Backend toggle failed, falling back to local:", err);
            }
        }

        // Fallback: local logic
        toggleHabitCompletion(habitId, targetDate, note);

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
    // Note: When cloud is active, prefer using pageDataApi.fetch('habit-detail') directly
    // These local fallbacks still work for offline mode

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

    /** Async version: fetches stats from backend when cloud is active */
    const getHabitStatsAsync = useCallback(async (
        habitId: string,
        startDate?: string,
        endDate?: string
    ) => {
        if (getIsCloudActive()) {
            try {
                return await pageDataApi.fetch('habit-detail', { habitId });
            } catch (err) {
                console.warn("Backend stats failed, using local:", err);
            }
        }
        // Fallback
        const now = new Date();
        const start = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : now;
        return {
            currentStreak: calculateStreak(habitId),
            longestStreak: calculateLongestStreak(habitId),
            completionRate: calculateCompletionRate(habitId, start, end),
        };
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
        getHabitStatsAsync,

        // Utils
        refreshData: loadData,
    };
};

// Re-export types for convenience
export type { Habit, HabitFrequency };

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
    getRoutines,
    getPriorities,
    updatePriorityCompletion,
    findCurrentRoutineIndex,
    toggleRoutineCompletion,
    getCompletionStats,
    addPriority,
    initializeStorage,
    hydrateCache,
    type RoutineItem,
    type PriorityTask,
    deletePriority,
    updatePriorityText,
    updatePrioritySchedule,
    registerListener,
    getTodayDateString
} from '@/lib/storage';

export const useRoutines = () => {
    const [routines, setRoutines] = useState<RoutineItem[]>([]);
    const [priorities, setPriorities] = useState<PriorityTask[]>([]);
    const [stats, setStats] = useState({ total: 0, completed: 0, percent: 0 });
    const [activeIndex, setActiveIndex] = useState(0);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const loadData = useCallback(async (force = false) => {
        setIsLoading(true);
        try {
            // Ensure storage is initialized before loading
            await initializeStorage();

            // Force refresh from storage if requested
            if (force) {
                await hydrateCache(true);
            }

            const loadedRoutines = getRoutines();
            setRoutines(loadedRoutines);

            // Priorities: Load using centralized intelligent filter/sort
            const visiblePriorities = getPriorities();
            setPriorities(visiblePriorities);
            setStats(getCompletionStats(loadedRoutines));

            // Find current routine index
            const currentIndex = findCurrentRoutineIndex(loadedRoutines);
            setActiveIndex(currentIndex);
        } catch (error) {
            console.error("Failed to load routines:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Initial load
        loadData(false);

        // Subscribe to storage changes (e.g. background sync or re-hydration)
        const unsubscribe = registerListener(() => {
            console.log("♻️ UI: Routines updated from storage event");
            loadData(false);
        });

        return () => { unsubscribe(); };
    }, [loadData]);

    // Timer for current date updates - optimized to run once per minute
    // instead of every second to reduce unnecessary re-renders
    useEffect(() => {
        // Calculate ms until next minute boundary for precise alignment
        const now = new Date();
        const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

        // Initial update aligned to next minute
        const initialTimeout = setTimeout(() => {
            setCurrentDate(new Date());

            // Then set regular interval every 60 seconds
            const timer = setInterval(() => {
                setCurrentDate(new Date());
            }, 60000);

            // Store timer ID in ref for cleanup
            intervalRef.current = timer;
        }, msUntilNextMinute);

        return () => {
            clearTimeout(initialTimeout);
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, []);

    // Update active index when minutes change
    useEffect(() => {
        if (routines.length > 0) {
            const index = findCurrentRoutineIndex(routines);
            setActiveIndex(index);
        }
    }, [currentDate.getMinutes(), routines]);

    // Handlers
    const handleTogglePriority = (id: string, completed: boolean, note?: string) => {
        const updated = updatePriorityCompletion(id, completed, note);
        setPriorities(updated);

        if (completed) {
            toast.success("Prioritas selesai!", {
                action: {
                    label: "Batal",
                    onClick: () => handleTogglePriority(id, false)
                }
            });
        }
    };

    const handleAddPriority = (text: string) => {
        const updated = addPriority(text);
        setPriorities(updated);
        toast.success("Prioritas ditambahkan!");
    };

    const handleDeletePriority = (id: string) => {
        const updated = deletePriority(id);
        setPriorities(updated);
        toast.success("Prioritas dihapus");
    };

    const handleUpdatePriorityText = (id: string, text: string) => {
        const updated = updatePriorityText(id, text);
        setPriorities(updated);
    };

    const handleCheckIn = (id: string, note?: string) => {
        const updated = toggleRoutineCompletion(id, routines, note);
        setRoutines(updated);
        setStats(getCompletionStats(updated));

        // Start haptic was triggered in UI

        // Find if it was completed or uncompleted
        const routine = updated.find(r => r.id === id);
        const isCompleted = !!routine?.completedAt;

        if (isCompleted) {
            toast.success("Progress updated! Keep it up! 🚀", {
                action: {
                    label: "Batal",
                    onClick: () => handleCheckIn(id) // Toggle back
                }
            });
        }
    };

    const handleUpdatePrioritySchedule = (id: string, scheduledFor: string | undefined) => {
        const updated = updatePrioritySchedule(id, scheduledFor);
        setPriorities(updated);
        if (scheduledFor) {
            toast.success(`Dijadwalkan untuk ${scheduledFor}`);
        } else {
            toast.success("Diubah ke tugas harian");
        }
    };

    return {
        routines,
        priorities,
        stats,
        activeIndex,
        currentDate,
        isLoading,
        handleTogglePriority,
        handleAddPriority,
        handleDeletePriority,
        handleUpdatePriorityText,
        handleUpdatePrioritySchedule,
        handleCheckIn,
        refreshData: () => loadData(true)
    };
};

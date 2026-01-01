import { useState, useEffect, useCallback } from 'react';
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
    updatePriorityText
} from '@/lib/storage';

export const useRoutines = () => {
    const [routines, setRoutines] = useState<RoutineItem[]>([]);
    const [priorities, setPriorities] = useState<PriorityTask[]>([]);
    const [stats, setStats] = useState({ total: 0, completed: 0, percent: 0 });
    const [activeIndex, setActiveIndex] = useState(0);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);

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
            setPriorities(getPriorities());
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
        // Initial load - don't force refresh every time component mounts
        // Only fetch updates in the background or use cache
        loadData(false);
    }, [loadData]);

    // Timer for current date updates
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDate(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Update active index when minutes change
    useEffect(() => {
        if (routines.length > 0) {
            const index = findCurrentRoutineIndex(routines);
            setActiveIndex(index);
        }
    }, [currentDate.getMinutes(), routines]);

    // Handlers
    const handleTogglePriority = (id: string, completed: boolean) => {
        const updated = updatePriorityCompletion(id, completed);
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

    const handleCheckIn = (id: string) => {
        const updated = toggleRoutineCompletion(id, routines);
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
        handleCheckIn,
        refreshData: () => loadData(true)
    };
};

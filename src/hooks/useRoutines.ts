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
    type RoutineItem,
    type PriorityTask
} from '@/lib/storage';

export const useRoutines = () => {
    const [routines, setRoutines] = useState<RoutineItem[]>([]);
    const [priorities, setPriorities] = useState<PriorityTask[]>([]);
    const [stats, setStats] = useState({ total: 0, completed: 0, percent: 0 });
    const [activeIndex, setActiveIndex] = useState(0);
    const [currentDate, setCurrentDate] = useState(new Date());

    const loadData = useCallback(async () => {
        // Ensure storage is initialized before loading
        await initializeStorage();

        const loadedRoutines = getRoutines();
        setRoutines(loadedRoutines);
        setPriorities(getPriorities());
        setStats(getCompletionStats(loadedRoutines));

        // Find current routine index
        const currentIndex = findCurrentRoutineIndex(loadedRoutines);
        setActiveIndex(currentIndex);
    }, []);

    useEffect(() => {
        loadData();
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
    };

    const handleAddPriority = (text: string) => {
        const updated = addPriority(text);
        setPriorities(updated);
        toast.success("Priority added!");
    };

    const handleCheckIn = (id: string) => {
        const updated = toggleRoutineCompletion(id, routines);
        setRoutines(updated);
        setStats(getCompletionStats(updated));

        toast.success("Progress updated! Keep it up! 🚀");
    };

    return {
        routines,
        priorities,
        stats,
        activeIndex,
        currentDate,
        handleTogglePriority,
        handleAddPriority,
        handleCheckIn,
        refreshData: loadData
    };
};

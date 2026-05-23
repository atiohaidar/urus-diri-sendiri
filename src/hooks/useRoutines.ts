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
    syncTable,
    getIsCloudActive,
    type RoutineItem,
    type PriorityTask,
    deletePriority,
    updatePriorityText,
    updatePrioritySchedule,
    registerListener,
    getTodayDateString
} from '@/lib/storage';
import { pageDataApi } from '@/lib/api/cloudflare-api';

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

            if (getIsCloudActive()) {
                // Use backend unified page-data endpoint (1 request for all data)
                const data = await pageDataApi.fetch('home');
                setRoutines(data.routines || []);
                setPriorities(data.priorities || []);
                setStats(data.routineStats || { total: 0, completed: 0, percent: 0 });
                setActiveIndex(data.activeIndex ?? 0);
            } else {
                const loadedRoutines = getRoutines();
                setRoutines(loadedRoutines);

                // Priorities: Load using centralized intelligent filter/sort
                const visiblePriorities = getPriorities('useRoutines');
                setPriorities(visiblePriorities);
                setStats(getCompletionStats(loadedRoutines));

                // Find current routine index
                const currentIndex = findCurrentRoutineIndex(loadedRoutines);
                setActiveIndex(currentIndex);
            }
        } catch (error) {
            console.error("Failed to load routines:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);
    useEffect(() => {
        loadData(false);

        // Background sync only needed for local mode
        if (!getIsCloudActive()) {
            syncTable('routines');
            syncTable('priorities');
        }

        const unsubscribe = registerListener(() => {
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
    const handleTogglePriority = async (id: string, completed: boolean, note?: string) => {
        const updated = await updatePriorityCompletion(id, completed, note);
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

    const handleAddPriority = async (text: string) => {
        const todayDate = getTodayDateString();
        const updated = await addPriority(text, todayDate);
        setPriorities(updated);
        toast.success("Prioritas ditambahkan!");
    };

    const handleDeletePriority = async (id: string) => {
        const updated = await deletePriority(id);
        setPriorities(updated);
        toast.success("Prioritas dihapus");
    };

    const handleUpdatePriorityText = async (id: string, text: string) => {
        const updated = await updatePriorityText(id, text);
        setPriorities(updated);
    };

    const handleCheckIn = async (id: string, note?: string) => {
        if (getIsCloudActive()) {
            const result = await pageDataApi.toggleRoutine(id, note);
            if (result.completed) {
                toast.success("Progress updated! Keep it up! 🚀", {
                    action: {
                        label: "Batal",
                        onClick: () => handleCheckIn(id)
                    }
                });
            }
            loadData();
            return;
        }

        // Local mode
        const updated = await toggleRoutineCompletion(id, routines, note);
        setRoutines(updated);
        setStats(getCompletionStats(updated));

        const routine = updated.find(r => r.id === id);
        const isCompleted = !!routine?.completedAt;

        if (isCompleted) {
            toast.success("Progress updated! Keep it up! 🚀", {
                action: {
                    label: "Batal",
                    onClick: () => handleCheckIn(id)
                }
            });
        }
    };

    const handleUpdatePrioritySchedule = async (id: string, scheduledFor: string | undefined) => {
        const updated = await updatePrioritySchedule(id, scheduledFor);
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

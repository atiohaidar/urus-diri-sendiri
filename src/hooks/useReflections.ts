import { useState, useEffect } from 'react';
import { getReflectionsAsync, initializeStorage, registerListener, type Reflection } from '@/lib/storage';

export const useReflections = () => {
    const [reflections, setReflections] = useState<Reflection[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const data = await getReflectionsAsync();
                setReflections(data);
            } finally {
                setIsLoading(false);
            }
        };

        // Initialize and load
        initializeStorage().then(load);

        // Subscribe to changes
        const unsubscribe = registerListener(() => {
            // Re-fetch with deduplication on any storage change
            getReflectionsAsync().then(setReflections);
        });

        return () => { unsubscribe(); };
    }, []);

    const refreshReflections = async () => {
        setIsLoading(true);
        try {
            const data = await getReflectionsAsync();
            setReflections(data);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        reflections,
        isLoading,
        refreshReflections
    };
};

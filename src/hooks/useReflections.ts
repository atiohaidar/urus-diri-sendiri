import { useState, useEffect } from 'react';
import { getReflections, initializeStorage, registerListener, type Reflection } from '@/lib/storage';

export const useReflections = () => {
    const [reflections, setReflections] = useState<Reflection[]>([]);

    useEffect(() => {
        const load = () => {
            setReflections(getReflections());
        };

        // Initialize and load
        initializeStorage().then(load);

        // Subscribe to changes
        const unsubscribe = registerListener(load);

        return () => { unsubscribe(); };
    }, []);

    // Future improvements: Add functionality to delete or update reflections if needed

    return {
        reflections,
        refreshReflections: () => setReflections(getReflections())
    };
};

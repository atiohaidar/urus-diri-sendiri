import { useState, useEffect } from 'react';
import { getReflections, type Reflection } from '@/lib/storage';

export const useReflections = () => {
    const [reflections, setReflections] = useState<Reflection[]>([]);

    useEffect(() => {
        setReflections(getReflections());
    }, []);

    // Future improvements: Add functionality to delete or update reflections if needed

    return {
        reflections,
        refreshReflections: () => setReflections(getReflections())
    };
};

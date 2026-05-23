import { useState, useEffect } from 'react';
import { getReflectionsAsync, initializeStorage, registerListener, syncTable, getIsCloudActive, type Reflection } from '@/lib/storage';
import { pageDataApi } from '@/lib/api/cloudflare-api';

export const useReflections = () => {
    const [reflections, setReflections] = useState<Reflection[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                if (getIsCloudActive()) {
                    // Use backend unified page-data endpoint
                    try {
                        const data = await pageDataApi.fetch('history', { historyTab: 'reflections' });
                        setReflections(data.reflections || []);
                        return;
                    } catch (err) {
                        console.warn("Backend page-data failed, falling back to local:", err);
                    }
                }
                // Fallback: local logic with deduplication
                const data = await getReflectionsAsync();
                setReflections(data);
            } finally {
                setIsLoading(false);
            }
        };

        // Initialize and load
        initializeStorage().then(() => {
            load();
            // Trigger background sync for reflections
            syncTable('reflections');
        });

        // Subscribe to changes
        const unsubscribe = registerListener(() => {
            if (getIsCloudActive()) {
                pageDataApi.fetch('history', { historyTab: 'reflections' })
                    .then((data: any) => setReflections(data.reflections || []))
                    .catch(() => getReflectionsAsync().then(setReflections));
            } else {
                getReflectionsAsync().then(setReflections);
            }
        });

        return () => { unsubscribe(); };
    }, []);

    const refreshReflections = async () => {
        setIsLoading(true);
        try {
            if (getIsCloudActive()) {
                try {
                    const data = await pageDataApi.fetch('history', { historyTab: 'reflections' });
                    setReflections(data.reflections || []);
                    return;
                } catch (err) {
                    console.warn("Backend page-data failed, falling back to local:", err);
                }
            }
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

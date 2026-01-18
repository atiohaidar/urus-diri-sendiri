/**
 * useAuthSync Hook
 * 
 * React hook untuk subscribe ke Auth Sync Manager.
 * Memberikan state auth yang terpusat dan konsisten di seluruh aplikasi.
 */

import { useState, useEffect, useCallback } from 'react';
import {
    subscribeToAuthSync,
    getAuthSyncStatus,
    waitForAuthSync,
    type AuthSyncStatus
} from '@/lib/auth-sync-manager';

/**
 * Hook untuk mendapatkan status auth sync terkini
 * Status ini akan otomatis update ketika auth/sync berubah
 */
export const useAuthSync = () => {
    const [status, setStatus] = useState<AuthSyncStatus>(getAuthSyncStatus);

    useEffect(() => {
        // Subscribe ke perubahan auth sync
        const unsubscribe = subscribeToAuthSync((newStatus) => {
            setStatus(newStatus);
        });

        return unsubscribe;
    }, []);

    // Helper function untuk menunggu sync selesai
    const waitForSync = useCallback(async () => {
        return waitForAuthSync();
    }, []);

    return {
        ...status,
        // Tambahan helpers
        isLoading: status.state === 'syncing',
        hasError: status.state === 'error',
        waitForSync,
    };
};

/**
 * Hook untuk menunggu auth sync selesai sebelum melakukan aksi
 * Berguna untuk komponen yang butuh data yang sudah di-sync
 */
export const useWaitForAuthSync = (): { isReady: boolean; error: Error | null } => {
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let mounted = true;

        waitForAuthSync().then((status) => {
            if (mounted) {
                setIsReady(status.state === 'ready');
                setError(status.error);
            }
        });

        return () => {
            mounted = false;
        };
    }, []);

    return { isReady, error };
};

export default useAuthSync;

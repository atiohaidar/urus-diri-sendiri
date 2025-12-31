import { ActivityLog } from '../types';
import { cache, provider, generateId, hydrateTable } from './core';

/** @deprecated Use getLogsAsync */
export const getLogs = (): ActivityLog[] => {
    return cache.logs || [];
};

export const getLogsAsync = async (): Promise<ActivityLog[]> => {
    return hydrateTable('logs');
};

export const saveLog = async (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const now = new Date().toISOString();

    const newLog: ActivityLog = {
        ...log,
        id: generateId('log'),
        timestamp: now,
    };

    // Optimistic Cache Update
    if (cache.logs) {
        cache.logs = [newLog, ...cache.logs];
    } else {
        cache.logs = [newLog];
    }

    await provider.saveLog(newLog);

    return newLog;
};

export const deleteLog = async (id: string) => {
    // Optimistic Cache Update
    if (cache.logs) {
        cache.logs = cache.logs.filter(l => l.id !== id);
    }

    await provider.deleteLog(id);
};

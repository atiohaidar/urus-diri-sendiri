import { getAllAppDataAsync, initializeStorage, restoreData } from './storage';
import { PriorityTask, Reflection, Note, RoutineItem, ActivityLog } from './types';

export const exportData = async () => {
    try {
        await initializeStorage();
        const appData = await getAllAppDataAsync();

        const data = {
            priorities: appData.priorities,
            reflections: appData.reflections,
            notes: appData.notes,
            routines: appData.routines,
            logs: appData.logs,
            version: 1,
            timestamp: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `urus-diri-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return true;
    } catch (error) {
        console.error('Export failed:', error);
        return false;
    }
};

export const importData = (file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);

                // Basic validation
                if (!data || typeof data !== 'object') {
                    throw new Error('Invalid backup file format');
                }

                await initializeStorage();
                await restoreData(data);

                resolve(true);
            } catch (err) {
                console.error('Import failed:', err);
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('File reading failed'));
        reader.readAsText(file);
    });
};

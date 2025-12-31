import { savePriorities, saveRoutines } from './storage';

import { STORAGE_KEYS } from './constants';

export const exportData = () => {
    try {
        const data = {
            priorities: JSON.parse(localStorage.getItem(STORAGE_KEYS.PRIORITIES) || '[]'),
            reflections: JSON.parse(localStorage.getItem(STORAGE_KEYS.REFLECTIONS) || '[]'),
            notes: JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES) || '[]'),
            routines: JSON.parse(localStorage.getItem(STORAGE_KEYS.ROUTINES) || '[]'),
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
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);

                // Basic validation
                if (!data || typeof data !== 'object') {
                    throw new Error('Invalid backup file format');
                }

                if (data.priorities) localStorage.setItem(STORAGE_KEYS.PRIORITIES, JSON.stringify(data.priorities));
                if (data.reflections) localStorage.setItem(STORAGE_KEYS.REFLECTIONS, JSON.stringify(data.reflections));
                if (data.notes) localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(data.notes));
                if (data.routines) localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(data.routines));

                // Trigger an event or reload to update UI?
                // For now, caller needs to handle reload.
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

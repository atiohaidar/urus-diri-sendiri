import { STORAGE_KEYS } from '../constants';
import { provider, hydrateCache } from './core';
import { getImage } from '../idb';

const CENTRAL_PROXY_URL = import.meta.env.VITE_CENTRAL_PROXY_URL;

export const getCloudConfig = () => {
    return {
        sheetUrl: localStorage.getItem(STORAGE_KEYS.GOOGLE_SHEET_URL) || '',
        folderUrl: localStorage.getItem('google_drive_folder_url') || '',
    };
};

export const saveCloudConfig = (sheetUrl: string, folderUrl?: string) => {
    localStorage.setItem(STORAGE_KEYS.GOOGLE_SHEET_URL, sheetUrl);
    if (folderUrl !== undefined) {
        localStorage.setItem('google_drive_folder_url', folderUrl);
    }
};

export const getAllAppDataAsync = async () => {
    return {
        priorities: await provider.getPriorities(),
        reflections: await provider.getReflections(),
        notes: await provider.getNotes(),
        routines: await provider.getRoutines(),
        logs: await provider.getLogs(),
    };
};

export const pushToCloud = async (overrideSheetUrl?: string, overrideFolderUrl?: string) => {
    const { sheetUrl, folderUrl } = getCloudConfig();
    const finalSheetUrl = overrideSheetUrl || sheetUrl;
    const finalFolderUrl = overrideFolderUrl || folderUrl;

    if (!finalSheetUrl) throw new Error("Google Sheet URL not configured");

    const appData = await getAllAppDataAsync();

    // Hydrate images for upload
    const hydratedReflections = await Promise.all(appData.reflections.map(async (r) => {
        if (r.imageIds && r.imageIds.length > 0) {
            const idbImages: string[] = [];
            for (const id of r.imageIds) {
                const img = await getImage(id);
                if (img) idbImages.push(img);
            }
            return { ...r, images: [...(r.images || []), ...idbImages] };
        }
        return r;
    }));

    const payload = {
        ...appData,
        reflections: hydratedReflections
    };

    const response = await fetch(finalSheetUrl ? CENTRAL_PROXY_URL : '', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
        },
        body: JSON.stringify({
            action: 'push',
            token: "PUBLIC",
            sheetUrl: finalSheetUrl,
            folderUrl: finalFolderUrl,
            payload
        }),
    });

    const result = await response.json();
    if (result.status === "error") throw new Error(result.message);

    return response.ok;
};

export const pullFromCloud = async (overrideSheetUrl?: string) => {
    const { sheetUrl } = getCloudConfig();
    const finalSheetUrl = overrideSheetUrl || sheetUrl;

    if (!finalSheetUrl) throw new Error("Google Sheet URL not configured");

    const response = await fetch(finalSheetUrl ? CENTRAL_PROXY_URL : '', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
        },
        body: JSON.stringify({
            action: 'pull',
            token: "PUBLIC",
            sheetUrl: finalSheetUrl
        }),
    });
    const result = await response.json();

    if (result.status === "success" && result.payload) {
        const data = result.payload;

        if (data.priorities) await provider.savePriorities(data.priorities, 'Cloud Pull');

        if (data.reflections) {
            for (const r of data.reflections) {
                await provider.saveReflection(r, 'Cloud Pull');
            }
        }

        if (data.notes) await provider.saveNotes(data.notes);

        if (data.routines) await provider.saveRoutines(data.routines);

        if (data.logs) {
            for (const l of data.logs) {
                await provider.saveLog(l);
            }
        }

        // Refresh cache
        await hydrateCache();

        return true;
    }

    throw new Error(result.message || "Failed to pull data");
};

export const restoreData = async (data: any) => {
    if (data.priorities) await provider.savePriorities(data.priorities, 'Restore');

    if (data.reflections) {
        for (const r of data.reflections) {
            await provider.saveReflection(r, 'Restore');
        }
    }

    if (data.notes) await provider.saveNotes(data.notes);

    if (data.routines) await provider.saveRoutines(data.routines);

    if (data.logs) {
        for (const l of data.logs) {
            await provider.saveLog(l);
        }
    }

    // Refresh cache
    await hydrateCache();
};

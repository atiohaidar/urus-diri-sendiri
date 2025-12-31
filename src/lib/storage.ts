import { PriorityTask, Reflection, Note, RoutineItem, ActivityLog } from './types';
import { toggleRoutineCompletion as toggleRoutineHelper } from './routine-helpers';
import { getImage, IDB_STORES } from './idb'; // Keeping for image hydration and types
import { STORAGE_KEYS } from './constants';
import { IStorageProvider } from './storage-interface';
import { LocalStorageProvider } from './providers/local-storage-provider';

// Re-export types and utils for backward compatibility
export * from './types';
export * from './time-utils';
export * from './routine-helpers';

// --- State Management ---
// Default to LocalStorageProvider for now. 
// In the future, this can be swapped via a configuration or `setProvider` function.
let provider: IStorageProvider = new LocalStorageProvider();

export const setStorageProvider = (newProvider: IStorageProvider) => {
  provider = newProvider;
  // Re-hydrate cache when provider changes
  hydrateCache();
};

// In-memory cache to maintain synchronous API compatibility
const cache: {
  priorities: PriorityTask[] | null;
  reflections: Reflection[] | null;
  notes: Note[] | null;
  routines: RoutineItem[] | null;
  logs: ActivityLog[] | null;
} = {
  priorities: null,
  reflections: null,
  notes: null,
  routines: null,
  logs: null,
};

// --- Migration & Initialization ---

let initPromise: Promise<void> | null = null;

export const initializeStorage = () => {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // 1. Check for Reflections migration (Legacy LS -> IDB/Provider)
    const oldReflections = localStorage.getItem(STORAGE_KEYS.REFLECTIONS);
    if (oldReflections) {
      try {
        const reflections: Reflection[] = JSON.parse(oldReflections);
        for (const r of reflections) {
          await provider.saveReflection(r);
        }
        localStorage.removeItem(STORAGE_KEYS.REFLECTIONS);
        console.log('Migrated reflections to Provider');
      } catch (e) {
        console.error('Failed to migrate reflections', e);
      }
    }

    // 2. Check for Logs migration (Legacy LS -> IDB/Provider)
    const oldLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (oldLogs) {
      try {
        const logs: ActivityLog[] = JSON.parse(oldLogs);
        for (const l of logs) {
          await provider.saveLog(l);
        }
        localStorage.removeItem(STORAGE_KEYS.LOGS);
        console.log('Migrated logs to Provider');
      } catch (e) {
        console.error('Failed to migrate logs', e);
      }
    }

    // 3. Hydrate Cache from Provider
    await hydrateCache();
  })();

  return initPromise;
};


const hydrateCache = async () => {
  try {
    const [priorities, reflections, notes, routines, logs] = await Promise.all([
      provider.getPriorities(),
      provider.getReflections(),
      provider.getNotes(),
      provider.getRoutines(),
      provider.getLogs(),
    ]);

    cache.priorities = priorities;
    cache.reflections = reflections;
    cache.notes = notes;
    cache.routines = routines;
    cache.logs = logs;
  } catch (error) {
    console.error("Failed to hydrate storage cache:", error);
  }
};

// --- Priorities ---
export const getPriorities = (): PriorityTask[] => {
  // Fallback to empty array if cache not ready (should adhere to initializeStorage wait)
  let priorities = cache.priorities || [];

  // Check if these priorities are from a previous day
  const today = new Date().toDateString();
  const needsReset = priorities.some(p => p.updatedAt && new Date(p.updatedAt).toDateString() !== today);

  if (needsReset) {
    const resetPriorities = priorities.map(p => ({
      ...p,
      completed: false, // Reset for the new day
      updatedAt: new Date().toISOString()
    }));
    savePriorities(resetPriorities);
    return resetPriorities;
  }

  return priorities;
};

export const savePriorities = (priorities: PriorityTask[]) => {
  cache.priorities = priorities;
  // Fire and forget async save
  provider.savePriorities(priorities).catch(console.error);
};

export const updatePriorityCompletion = (id: string, completed: boolean) => {
  const priorities = getPriorities();
  const now = new Date().toISOString();
  const updated = priorities.map(p =>
    p.id === id ? { ...p, completed, updatedAt: now } : p
  );
  savePriorities(updated);
  updateDailySnapshot(); // Auto-update snapshot
  return updated;
};

export const addPriority = (text: string) => {
  const priorities = getPriorities();
  const newPriority: PriorityTask = {
    id: `priority-${Date.now()}`,
    text,
    completed: false,
    updatedAt: new Date().toISOString(),
  };
  const updated = [...priorities, newPriority];
  savePriorities(updated);
  updateDailySnapshot(); // Auto-update snapshot
  return updated;
};

// --- Reflections ---

/** @deprecated Use getReflectionsAsync for better performance */
export const getReflections = (): Reflection[] => {
  return cache.reflections || [];
};

export const getReflectionsAsync = async (): Promise<Reflection[]> => {
  if (cache.reflections) return cache.reflections;

  const reflections = await provider.getReflections();
  cache.reflections = reflections;
  return reflections;
};

export const saveReflection = async (reflection: Omit<Reflection, 'id'>) => {
  // Ensure we have latest data
  const reflections = await getReflectionsAsync();
  const today = new Date().toDateString();
  const todayIndex = reflections.findIndex(r => new Date(r.date).toDateString() === today);

  let savedItem: Reflection;

  if (todayIndex !== -1) {
    // Update existing reflection for today
    savedItem = {
      ...reflections[todayIndex],
      ...reflection,
      todayRoutines: reflection.todayRoutines || reflections[todayIndex].todayRoutines,
      todayPriorities: reflection.todayPriorities || reflections[todayIndex].todayPriorities,
    };
    // Optimistic update
    cache.reflections![todayIndex] = savedItem;
  } else {
    // Create new for today
    savedItem = {
      ...reflection,
      id: Date.now().toString(),
    };
    // Optimistic update
    cache.reflections = [savedItem, ...reflections];
  }

  await provider.saveReflection(savedItem);

  // Update tomorrow's priorities based on reflection
  if (reflection.priorities) {
    const newPriorities: PriorityTask[] = reflection.priorities
      .filter(p => p.trim())
      .map((text, index) => ({
        id: `priority-${Date.now()}-${index}`,
        text,
        completed: false,
        updatedAt: new Date().toISOString(),
      }));
    savePriorities(newPriorities);
  }

  return savedItem;
};

// --- Notes ---
export const getNotes = (): Note[] => {
  return cache.notes || [];
};

export const saveNote = (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
  const notes = getNotes();
  const now = new Date().toISOString();
  const newNote: Note = {
    ...note,
    id: Date.now().toString(),
    createdAt: now,
    updatedAt: now,
  };
  const updated = [newNote, ...notes];

  cache.notes = updated;
  provider.saveNotes(updated).catch(console.error);

  return newNote;
};

export const updateNote = (id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => {
  const notes = getNotes();
  const updated = notes.map(n =>
    n.id === id
      ? { ...n, ...updates, updatedAt: new Date().toISOString() }
      : n
  );

  cache.notes = updated;
  provider.saveNotes(updated).catch(console.error);

  return updated;
};

export const deleteNote = (id: string) => {
  const notes = getNotes();
  const filtered = notes.filter(n => n.id !== id);

  cache.notes = filtered;
  provider.saveNotes(filtered).catch(console.error);

  return filtered;
};

// --- Routines ---
export const getRoutines = (): RoutineItem[] => {
  const today = new Date().toDateString();
  const lastOpen = localStorage.getItem(STORAGE_KEYS.LAST_OPEN_DATE);

  // If cache is empty, we might be in trouble if hydration hasn't finished.
  // But for now we proceed assuming initializeStorage was called.
  let routines = cache.routines || [];

  if (lastOpen !== today) {
    // IT'S A NEW DAY! 
    const resetRoutines = routines.map(r => ({
      ...r,
      completedAt: null,
      updatedAt: undefined
    }));

    cache.routines = resetRoutines;
    provider.saveRoutines(resetRoutines).catch(console.error);
    localStorage.setItem(STORAGE_KEYS.LAST_OPEN_DATE, today);
    return resetRoutines;
  }

  return routines;
};

export const saveRoutines = (routines: RoutineItem[]) => {
  cache.routines = routines;
  provider.saveRoutines(routines).catch(console.error);
};

// --- Activity Logs ---

/** @deprecated Use getLogsAsync */
export const getLogs = (): ActivityLog[] => {
  return cache.logs || [];
};

export const getLogsAsync = async (): Promise<ActivityLog[]> => {
  if (cache.logs && cache.logs.length > 0) return cache.logs;

  const logs = await provider.getLogs();
  cache.logs = logs;
  return logs;
};

export const saveLog = async (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
  const now = new Date().toISOString();

  const newLog: ActivityLog = {
    ...log,
    id: Date.now().toString(),
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

// --- Helpers ---

export const toggleRoutineCompletion = (id: string, routines: RoutineItem[]) => {
  const updated = toggleRoutineHelper(id, routines);
  saveRoutines(updated);
  updateDailySnapshot(); // Auto-update snapshot
  return updated;
};

export const updateDailySnapshot = async () => {
  const reflections = await getReflectionsAsync();
  const todayDate = new Date();
  const todayStr = todayDate.toDateString();
  const todayIndex = reflections.findIndex(r => new Date(r.date).toDateString() === todayStr);

  const currentRoutines = getRoutines();
  const currentPriorities = getPriorities();

  if (todayIndex !== -1) {
    // Update existing reflection
    const updatedReflection = {
      ...reflections[todayIndex],
      todayRoutines: currentRoutines,
      todayPriorities: currentPriorities,
    };

    // Optimistic
    cache.reflections![todayIndex] = updatedReflection;
    await provider.saveReflection(updatedReflection);
  } else {
    // Create a new "Passive" reflection entry if at least one thing is checked
    const hasProgress = currentRoutines.some(r => r.completedAt) || currentPriorities.some(p => p.completed);

    if (hasProgress) {
      const newReflection: Reflection = {
        id: Date.now().toString(),
        date: todayDate.toISOString(),
        winOfDay: "",
        hurdle: "",
        priorities: [],
        smallChange: "",
        todayRoutines: currentRoutines,
        todayPriorities: currentPriorities,
      };

      // Optimistic
      cache.reflections = [newReflection, ...reflections];
      await provider.saveReflection(newReflection);
    }
  }
};

// --- Cloud Sync ---

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
  // Force refresh from provider to be safe before sync, or trust cache?
  // Safer to trust cache if we are confident, but let's re-fetch to ensure consistency with provider state.
  // However, since we sync write to provider, cache calls should be fine.

  // For cloud sync, let's grab directly from provider to ensure we really get what's on "disk"
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

  // Hydrate images for upload (still IDB dependent as images are binary blobs)
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

    // Save to provider
    if (data.priorities) await provider.savePriorities(data.priorities);

    if (data.reflections) {
      for (const r of data.reflections) {
        await provider.saveReflection(r);
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

// --- Backup/Restore ---

export const restoreData = async (data: any) => {
  if (data.priorities) await provider.savePriorities(data.priorities);

  if (data.reflections) {
    for (const r of data.reflections) {
      await provider.saveReflection(r);
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

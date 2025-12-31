import { PriorityTask, Reflection, Note, RoutineItem, ActivityLog } from './types';
import { toggleRoutineCompletion as toggleRoutineHelper } from './routine-helpers';
import { getImage, getAllItems, putItem, deleteItem, IDB_STORES } from './idb';
import { STORAGE_KEYS } from './constants';

// Re-export types and utils for backward compatibility
export * from './types';
export * from './time-utils';
export * from './routine-helpers';

// In-memory cache to avoid excessive JSON.parse calls or IDB reads
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

export const initializeStorage = async () => {
  // 1. Check for Reflections migration
  const oldReflections = localStorage.getItem(STORAGE_KEYS.REFLECTIONS);
  if (oldReflections) {
    try {
      const reflections: Reflection[] = JSON.parse(oldReflections);
      for (const r of reflections) {
        await putItem(IDB_STORES.REFLECTIONS, r);
      }
      localStorage.removeItem(STORAGE_KEYS.REFLECTIONS);
      console.log('Migrated reflections to IDB');
    } catch (e) {
      console.error('Failed to migrate reflections', e);
    }
  }

  // 2. Check for Logs migration
  const oldLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
  if (oldLogs) {
    try {
      const logs: ActivityLog[] = JSON.parse(oldLogs);
      for (const l of logs) {
        await putItem(IDB_STORES.LOGS, l);
      }
      localStorage.removeItem(STORAGE_KEYS.LOGS);
      console.log('Migrated logs to IDB');
    } catch (e) {
      console.error('Failed to migrate logs', e);
    }
  }

  // Warm up cache
  await getReflectionsAsync();
  await getLogsAsync();
};

// --- Priorities ---
export const getPriorities = (): PriorityTask[] => {
  if (cache.priorities) return cache.priorities;

  const data = localStorage.getItem(STORAGE_KEYS.PRIORITIES);
  if (!data) return [];
  const priorities: PriorityTask[] = JSON.parse(data);

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
  localStorage.setItem(STORAGE_KEYS.PRIORITIES, JSON.stringify(priorities));
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

  const reflections = await getAllItems<Reflection>(IDB_STORES.REFLECTIONS);
  // Sort by date descending
  reflections.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  cache.reflections = reflections;
  return reflections;
};

export const saveReflection = async (reflection: Omit<Reflection, 'id'>) => {
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
  } else {
    // Create new for today
    savedItem = {
      ...reflection,
      id: Date.now().toString(),
    };
  }

  await putItem(IDB_STORES.REFLECTIONS, savedItem);

  // Refresh cache
  cache.reflections = null;
  await getReflectionsAsync();

  // Update tomorrow's priorities based on reflection
  const newPriorities: PriorityTask[] = reflection.priorities
    .filter(p => p.trim())
    .map((text, index) => ({
      id: `priority-${Date.now()}-${index}`,
      text,
      completed: false,
      updatedAt: new Date().toISOString(),
    }));
  savePriorities(newPriorities);

  return savedItem;
};

// --- Notes ---
export const getNotes = (): Note[] => {
  if (cache.notes) return cache.notes;

  const data = localStorage.getItem(STORAGE_KEYS.NOTES);
  if (!data) return [];
  const notes = JSON.parse(data);
  cache.notes = notes;
  return notes;
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
  notes.unshift(newNote);
  cache.notes = notes;
  localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
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
  localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updated));
  return updated;
};

export const deleteNote = (id: string) => {
  const notes = getNotes();
  const filtered = notes.filter(n => n.id !== id);
  cache.notes = filtered;
  localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(filtered));
  return filtered;
};

// --- Routines ---
export const getRoutines = (): RoutineItem[] => {
  const today = new Date().toDateString();
  const lastOpen = localStorage.getItem(STORAGE_KEYS.LAST_OPEN_DATE);

  if (cache.routines && lastOpen === today) {
    return cache.routines;
  }

  const data = localStorage.getItem(STORAGE_KEYS.ROUTINES);
  let routines: RoutineItem[] = [];

  if (!data) {
    routines = [];
    cache.routines = routines;
    localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
  } else {
    routines = JSON.parse(data);
  }

  if (lastOpen !== today) {
    // IT'S A NEW DAY! 
    const resetRoutines = routines.map(r => ({
      ...r,
      completedAt: null,
      updatedAt: undefined
    }));
    cache.routines = resetRoutines;
    localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(resetRoutines));
    localStorage.setItem(STORAGE_KEYS.LAST_OPEN_DATE, today);
    return resetRoutines;
  }

  cache.routines = routines;
  return routines;
};

export const saveRoutines = (routines: RoutineItem[]) => {
  cache.routines = routines;
  localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
};

// --- Activity Logs ---

/** @deprecated Use getLogsAsync */
export const getLogs = (): ActivityLog[] => {
  return cache.logs || [];
};

export const getLogsAsync = async (): Promise<ActivityLog[]> => {
  if (cache.logs) return cache.logs;

  const logs = await getAllItems<ActivityLog>(IDB_STORES.LOGS);
  // Sort by timestamp descending
  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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

  await putItem(IDB_STORES.LOGS, newLog);

  // Update cache locally for responsiveness
  if (cache.logs) {
    cache.logs = [newLog, ...cache.logs];
  } else {
    await getLogsAsync();
  }

  return newLog;
};

export const deleteLog = async (id: string) => {
  await deleteItem(IDB_STORES.LOGS, id);
  if (cache.logs) {
    cache.logs = cache.logs.filter(l => l.id !== id);
  }
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
    await putItem(IDB_STORES.REFLECTIONS, updatedReflection);
    cache.reflections = null; // Invalidate cache
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
      await putItem(IDB_STORES.REFLECTIONS, newReflection);
      cache.reflections = null;
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
  return {
    priorities: getPriorities(),
    reflections: await getReflectionsAsync(),
    notes: getNotes(),
    routines: getRoutines(),
    logs: await getLogsAsync(),
  };
};

export const pushToCloud = async (overrideSheetUrl?: string, overrideFolderUrl?: string) => {
  const { sheetUrl, folderUrl } = getCloudConfig();
  const finalSheetUrl = overrideSheetUrl || sheetUrl;
  const finalFolderUrl = overrideFolderUrl || folderUrl;

  if (!finalSheetUrl) throw new Error("Google Sheet URL not configured");

  const appData = await getAllAppDataAsync();
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
    if (data.priorities) savePriorities(data.priorities);

    if (data.reflections) {
      for (const r of data.reflections) {
        await putItem(IDB_STORES.REFLECTIONS, r);
      }
      cache.reflections = null;
    }

    if (data.notes) {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(data.notes));
      cache.notes = null;
    }

    if (data.routines) saveRoutines(data.routines);

    if (data.logs) {
      for (const l of data.logs) {
        await putItem(IDB_STORES.LOGS, l);
      }
      cache.logs = null;
    }
    return true;
  }

  throw new Error(result.message || "Failed to pull data");
};

import { PriorityTask, Reflection, Note, RoutineItem } from './types';
import { toggleRoutineCompletion as toggleRoutineHelper } from './routine-helpers';
import { STORAGE_KEYS } from './constants';

// Re-export types and utils for backward compatibility
export * from './types';
export * from './time-utils';
export * from './routine-helpers';

// --- Priorities ---
export const getPriorities = (): PriorityTask[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PRIORITIES);
  if (!data) return [];
  const priorities: PriorityTask[] = JSON.parse(data);

  // Check if these priorities are from a previous day
  // If they are, we keep the text but reset completion status for the new day
  // unless they are replaced by Maghrib Check-in.
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
export const getReflections = (): Reflection[] => {
  const data = localStorage.getItem(STORAGE_KEYS.REFLECTIONS);
  if (!data) return [];
  return JSON.parse(data);
};

export const saveReflection = (reflection: Omit<Reflection, 'id'>) => {
  const reflections = getReflections();
  const today = new Date().toDateString();
  const todayIndex = reflections.findIndex(r => new Date(r.date).toDateString() === today);

  let updatedReflections: Reflection[];
  let savedItem: Reflection;

  if (todayIndex !== -1) {
    // Update existing reflection for today
    savedItem = {
      ...reflections[todayIndex],
      ...reflection,
      // If todayRoutines/Priorities aren't provided in the call, keep existing ones
      todayRoutines: reflection.todayRoutines || reflections[todayIndex].todayRoutines,
      todayPriorities: reflection.todayPriorities || reflections[todayIndex].todayPriorities,
    };
    updatedReflections = [...reflections];
    updatedReflections[todayIndex] = savedItem;
  } else {
    // Create new for today
    savedItem = {
      ...reflection,
      id: Date.now().toString(),
    };
    updatedReflections = [savedItem, ...reflections];
  }

  localStorage.setItem(STORAGE_KEYS.REFLECTIONS, JSON.stringify(updatedReflections));

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
  const data = localStorage.getItem(STORAGE_KEYS.NOTES);
  if (!data) return [];
  return JSON.parse(data);
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
  localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updated));
  return updated;
};

export const deleteNote = (id: string) => {
  const notes = getNotes();
  const filtered = notes.filter(n => n.id !== id);
  localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(filtered));
  return filtered;
};

// --- Routines ---
export const getRoutines = (): RoutineItem[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ROUTINES);
  let routines: RoutineItem[] = [];

  if (!data) {
    const defaults: RoutineItem[] = [
      { id: '1', startTime: '06:00', endTime: '06:15', activity: 'Morning Meditation', category: 'Mindfulness' },
      { id: '2', startTime: '06:30', endTime: '07:00', activity: 'Light Exercise', category: 'Fitness' },
      { id: '3', startTime: '07:30', endTime: '07:50', activity: 'Healthy Breakfast', category: 'Nutrition' },
      { id: '4', startTime: '12:00', endTime: '14:00', activity: 'Focused Work Block', category: 'Productivity' },
      { id: '5', startTime: '18:30', endTime: '18:40', activity: 'Maghrib Prayer', category: 'Spiritual' },
      { id: '6', startTime: '21:00', endTime: '21:30', activity: 'Reading Time', category: 'Learning' },
    ];
    localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(defaults));
    return defaults;
  } else {
    routines = JSON.parse(data);
  }

  // Check last open date logic
  const today = new Date().toDateString();
  const lastOpen = localStorage.getItem(STORAGE_KEYS.LAST_OPEN_DATE);

  if (lastOpen !== today) {
    // IT'S A NEW DAY! 
    // Reset ALL completion statuses in the master routine list
    const resetRoutines = routines.map(r => ({
      ...r,
      completedAt: null,
      updatedAt: undefined
    }));
    localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(resetRoutines));
    localStorage.setItem(STORAGE_KEYS.LAST_OPEN_DATE, today);
    return resetRoutines;
  }

  return routines;
};

export const saveRoutines = (routines: RoutineItem[]) => {
  localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
};

// Wrapper for toggleRoutineCompletion to include side-effect (save)
// The original implementation had this side-effect.
export const toggleRoutineCompletion = (id: string, routines: RoutineItem[]) => {
  const updated = toggleRoutineHelper(id, routines);
  saveRoutines(updated);
  updateDailySnapshot(); // Auto-update snapshot
  return updated;
};

// Helper to update reflection snapshot for TODAY
export const updateDailySnapshot = () => {
  const reflections = getReflections();
  const todayDate = new Date();
  const todayStr = todayDate.toDateString();
  const todayIndex = reflections.findIndex(r => new Date(r.date).toDateString() === todayStr);

  const currentRoutines = getRoutines();
  const currentPriorities = getPriorities();

  if (todayIndex !== -1) {
    // Update existing reflection
    const updatedReflections = [...reflections];
    updatedReflections[todayIndex] = {
      ...updatedReflections[todayIndex],
      todayRoutines: currentRoutines,
      todayPriorities: currentPriorities,
    };
    localStorage.setItem(STORAGE_KEYS.REFLECTIONS, JSON.stringify(updatedReflections));
  } else {
    // Create a new "Passive" reflection entry if at least one thing is checked
    // This ensures history is recorded even if the user forgets to do Maghrib Check-in
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
      const updatedReflections = [newReflection, ...reflections];
      localStorage.setItem(STORAGE_KEYS.REFLECTIONS, JSON.stringify(updatedReflections));
    }
  }
};

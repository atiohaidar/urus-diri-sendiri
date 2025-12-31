// LocalStorage utilities for persistence

export interface PriorityTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Reflection {
  id: string;
  date: string;
  winOfDay: string;
  hurdle: string;
  priorities: string[];
  smallChange: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineItem {
  id: string;
  startTime: string; // "HH:mm" 24h format
  endTime: string;   // "HH:mm" 24h format
  activity: string;
  category: string;
}

const KEYS = {
  PRIORITIES: 'urus-diri-priorities',
  REFLECTIONS: 'urus-diri-reflections',
  NOTES: 'urus-diri-notes',
  ROUTINES: 'urus-diri-routines',
};

// Priorities
export const getPriorities = (): PriorityTask[] => {
  const data = localStorage.getItem(KEYS.PRIORITIES);
  if (!data) return [];
  return JSON.parse(data);
};

export const savePriorities = (priorities: PriorityTask[]) => {
  localStorage.setItem(KEYS.PRIORITIES, JSON.stringify(priorities));
};

export const updatePriorityCompletion = (id: string, completed: boolean) => {
  const priorities = getPriorities();
  const updated = priorities.map(p =>
    p.id === id ? { ...p, completed } : p
  );
  savePriorities(updated);
  return updated;
};

// Reflections
export const getReflections = (): Reflection[] => {
  const data = localStorage.getItem(KEYS.REFLECTIONS);
  if (!data) return [];
  return JSON.parse(data);
};

export const saveReflection = (reflection: Omit<Reflection, 'id'>) => {
  const reflections = getReflections();
  const newReflection: Reflection = {
    ...reflection,
    id: Date.now().toString(),
  };
  reflections.unshift(newReflection);
  localStorage.setItem(KEYS.REFLECTIONS, JSON.stringify(reflections));

  // Update tomorrow's priorities
  const newPriorities: PriorityTask[] = reflection.priorities
    .filter(p => p.trim())
    .map((text, index) => ({
      id: `priority-${Date.now()}-${index}`,
      text,
      completed: false,
    }));
  savePriorities(newPriorities);

  return newReflection;
};

// Notes
export const getNotes = (): Note[] => {
  const data = localStorage.getItem(KEYS.NOTES);
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
  localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
  return newNote;
};

export const updateNote = (id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => {
  const notes = getNotes();
  const updated = notes.map(n =>
    n.id === id
      ? { ...n, ...updates, updatedAt: new Date().toISOString() }
      : n
  );
  localStorage.setItem(KEYS.NOTES, JSON.stringify(updated));
  return updated;
};

export const deleteNote = (id: string) => {
  const notes = getNotes();
  const filtered = notes.filter(n => n.id !== id);
  localStorage.setItem(KEYS.NOTES, JSON.stringify(filtered));
  return filtered;
};

// Routines (default data)
export const getRoutines = (): RoutineItem[] => {
  const data = localStorage.getItem(KEYS.ROUTINES);
  if (!data) {
    // Return default routines
    const defaults: RoutineItem[] = [
      { id: '1', startTime: '06:00', endTime: '06:15', activity: 'Morning Meditation', category: 'Mindfulness' },
      { id: '2', startTime: '06:30', endTime: '07:00', activity: 'Light Exercise', category: 'Fitness' },
      { id: '3', startTime: '07:30', endTime: '07:50', activity: 'Healthy Breakfast', category: 'Nutrition' },
      { id: '4', startTime: '12:00', endTime: '14:00', activity: 'Focused Work Block', category: 'Productivity' },
      { id: '5', startTime: '18:30', endTime: '18:40', activity: 'Maghrib Prayer', category: 'Spiritual' },
      { id: '6', startTime: '21:00', endTime: '21:30', activity: 'Reading Time', category: 'Learning' },
    ];
    localStorage.setItem(KEYS.ROUTINES, JSON.stringify(defaults));
    return defaults;
  }

  // Migration check: if old data exists (has 'time' prop), clear it effectively or migrate?
  // For simplicity in this session, if we detect old format, we might want to reset or migrate.
  // Let's just return parsed data, but components might break if mixed.
  // Ideally we should migrate on the fly.
  const parsed = JSON.parse(data);
  if (parsed.length > 0 && typeof parsed[0].startTime === 'undefined') {
    // Detected old data, force defaults for safety
    localStorage.removeItem(KEYS.ROUTINES);
    return getRoutines(); // recursive call to get defaults
  }
  return parsed;
};

export const saveRoutines = (routines: RoutineItem[]) => {
  localStorage.setItem(KEYS.ROUTINES, JSON.stringify(routines));
};

// Parse "HH:mm" to minutes
export const parseTimeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Calculate duration string between two times
export const calculateDuration = (start: string, end: string): string => {
  const startMins = parseTimeToMinutes(start);
  let endMins = parseTimeToMinutes(end);
  if (endMins < startMins) endMins += 24 * 60; // Handle overnight

  const diff = endMins - startMins;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;

  if (hours > 0 && mins > 0) return `${hours} hr ${mins} min`;
  if (hours > 0) return `${hours} hr`;
  return `${mins} min`;
};

// Parse duration string to minutes
export const parseDurationToMinutes = (durationStr: string): number => {
  const match = durationStr.match(/(\d+)\s*(mins|min|hours|hr|hour)/i);
  if (!match) return 0;
  const val = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  if (unit.startsWith('h')) {
    return val * 60;
  }
  return val;
};

// Check if two routine items overlap
export const checkOverlap = (item1: RoutineItem, item2: RoutineItem): boolean => {
  if (item1.id === item2.id) return false;

  const start1 = parseTimeToMinutes(item1.startTime);
  const end1 = parseTimeToMinutes(item1.endTime);

  const start2 = parseTimeToMinutes(item2.startTime);
  const end2 = parseTimeToMinutes(item2.endTime);

  // Handle overnight check if end < start? Assuming simplified day schedule for now
  // For standard overlap: Start1 < End2 && Start2 < End1
  return start1 < end2 && start2 < end1;
};

// Get current time in minutes since midnight
export const getCurrentTimeInMinutes = (): number => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

// Find the current or next routine item index
export const findCurrentRoutineIndex = (routines: RoutineItem[]): number => {
  const currentMinutes = getCurrentTimeInMinutes();

  for (let i = 0; i < routines.length; i++) {
    const start = parseTimeToMinutes(routines[i].startTime);
    const end = parseTimeToMinutes(routines[i].endTime);

    // Check if current time is WITHIN this routine
    if (currentMinutes >= start && currentMinutes < end) {
      return i;
    }

    // Check if current time is BEFORE this routine (next upcoming)
    if (currentMinutes < start) {
      // If i is 0, then this is the first one coming up.
      // If i > 0, we already passed previous ones (since we didn't return), so this is the next one.
      // Wait, let's refine:
      // We want to highlight the Active one OR the Next one.
      // If we are between routines, maybe highlight the next one?
      return i;
    }
  }

  // If we're past all routines, maybe show the last one properly or none?
  // Let's return the last one if past end of day, or 0 for next day loop
  if (routines.length > 0) {
    return 0; // Wrap around
  }

  return 0;
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export const isToday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

export const isYesterday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.toDateString() === yesterday.toDateString();
};

export const getRelativeDate = (date: Date | string): string => {
  if (isToday(date)) return formatTime(date);
  if (isYesterday(date)) return 'Yesterday';
  return formatDate(date);
};

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
  time: string;
  activity: string;
  duration: string;
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
      { id: '1', time: '06:00 AM', activity: 'Morning Meditation', duration: '15 mins', category: 'Mindfulness' },
      { id: '2', time: '06:30 AM', activity: 'Light Exercise', duration: '30 mins', category: 'Fitness' },
      { id: '3', time: '07:30 AM', activity: 'Healthy Breakfast', duration: '20 mins', category: 'Nutrition' },
      { id: '4', time: '12:00 PM', activity: 'Focused Work Block', duration: '2 hours', category: 'Productivity' },
      { id: '5', time: '06:30 PM', activity: 'Maghrib Prayer', duration: '10 mins', category: 'Spiritual' },
      { id: '6', time: '09:00 PM', activity: 'Reading Time', duration: '30 mins', category: 'Learning' },
    ];
    localStorage.setItem(KEYS.ROUTINES, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(data);
};

export const saveRoutines = (routines: RoutineItem[]) => {
  localStorage.setItem(KEYS.ROUTINES, JSON.stringify(routines));
};

// Parse time string to minutes since midnight
export const parseTimeToMinutes = (timeStr: string): number => {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 0;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

// Get current time in minutes since midnight
export const getCurrentTimeInMinutes = (): number => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

// Find the current or next routine item index
export const findCurrentRoutineIndex = (routines: RoutineItem[]): number => {
  const currentMinutes = getCurrentTimeInMinutes();
  
  // Find the first routine that's at or after current time
  for (let i = 0; i < routines.length; i++) {
    const routineMinutes = parseTimeToMinutes(routines[i].time);
    if (routineMinutes >= currentMinutes) {
      return i;
    }
  }
  
  // If all routines have passed, check if we're within the last routine's timeframe
  if (routines.length > 0) {
    const lastRoutineMinutes = parseTimeToMinutes(routines[routines.length - 1].time);
    if (currentMinutes >= lastRoutineMinutes) {
      return routines.length - 1;
    }
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

// Time manipulation utilities

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

// Get current time in minutes since midnight
export const getCurrentTimeInMinutes = (): number => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
};

export const formatDate = (date: Date | string, locale: string = 'en'): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const loc = locale === 'id' ? 'id-ID' : 'en-US';
    return d.toLocaleDateString(loc, { month: 'short', day: 'numeric' });
};

export const formatTime = (date: Date | string, locale: string = 'en'): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const loc = locale === 'id' ? 'id-ID' : 'en-US';
    return d.toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit' });
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

export const getRelativeDate = (date: Date | string, locale: string = 'en'): string => {
    if (isToday(date)) return formatTime(date, locale);
    if (isYesterday(date)) return locale === 'id' ? 'Kemarin' : 'Yesterday';
    return formatDate(date, locale);
};

// Helper to normalize to HH:mm 24h
export const normalizeTime = (t: string) => {
    t = t.toLowerCase().replace('.', ':');
    let [timePart, period] = t.split(/(?=[ap]m)/);
    if (period) period = period.trim(); // clean

    if (!timePart.includes(':') && timePart.trim()) timePart += ":00";

    // safe split
    if (!timePart) return "00:00";

    let [h, m] = timePart.split(':').map(Number);
    if (isNaN(h)) h = 0;
    if (isNaN(m)) m = 0;

    if (period === 'pm' && h !== 12) h += 12;
    if (period === 'am' && h === 12) h = 0;

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const getTodayDateString = (): string => {
    const d = new Date();
    // Adjust for timezone offset to get "Local ISO"
    const offset = d.getTimezoneOffset() * 60000;
    const localISODate = new Date(d.getTime() - offset).toISOString().split('T')[0];
    return localISODate;
};

export const getTomorrowDateString = (): string => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const offset = d.getTimezoneOffset() * 60000;
    const localISODate = new Date(d.getTime() - offset).toISOString().split('T')[0];
    return localISODate;
};

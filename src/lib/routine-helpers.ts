import { RoutineItem } from './types';
import { parseTimeToMinutes, getCurrentTimeInMinutes, normalizeTime } from './time-utils';

// Check if routine is completed TODAY
export const isRoutineCompletedToday = (item: RoutineItem): boolean => {
    if (!item.completedAt) return false;
    const completedDate = new Date(item.completedAt).toDateString();
    const today = new Date().toDateString();
    return completedDate === today;
};

// Check if two routine items overlap
export const checkOverlap = (item1: RoutineItem, item2: RoutineItem): boolean => {
    if (item1.id === item2.id) return false;

    const start1 = parseTimeToMinutes(item1.startTime);
    const end1 = parseTimeToMinutes(item1.endTime);

    const start2 = parseTimeToMinutes(item2.startTime);
    const end2 = parseTimeToMinutes(item2.endTime);

    return start1 < end2 && start2 < end1;
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
            return i;
        }
    }

    if (routines.length > 0) {
        return 0; // Wrap around
    }

    return 0;
};

export const parseScheduleText = (text: string): RoutineItem[] => {
    const lines = text.split('\n').filter(l => l.trim());
    const parsed: RoutineItem[] = [];

    lines.forEach((line, i) => {
        // Regex to find "HH:mm - HH:mm Activity"
        const timeRangeMatch = line.match(/(\d{1,2}(?::\d{2})?(?:\s*[ap]m)?)\s*[-–to]\s*(\d{1,2}(?::\d{2})?(?:\s*[ap]m)?)/i);

        if (timeRangeMatch) {
            const startStrRaw = timeRangeMatch[1];
            const endStrRaw = timeRangeMatch[2];

            let content = line.substring(timeRangeMatch.index! + timeRangeMatch[0].length).trim();

            const startTime = normalizeTime(startStrRaw);
            const endTime = normalizeTime(endStrRaw);

            // Clean activity
            let activity = content.replace(/^[-–: ]+/, '').trim();

            parsed.push({
                id: `preview-${i}`,
                startTime,
                endTime,
                activity: activity || "New Item",
                category: 'Productivity' // Default
            });
        }
    });

    return parsed;
};

// Toggle completion
export const toggleRoutineCompletion = (id: string, routines: RoutineItem[]) => {
    const updated = routines.map(r => {
        if (r.id === id) {
            const isCompleted = isRoutineCompletedToday(r);
            return {
                ...r,
                completedAt: isCompleted ? null : new Date().toISOString()
            };
        }
        return r;
    });
    return updated;
};

// Get stats
export const getCompletionStats = (routines: RoutineItem[]) => {
    const total = routines.length;
    if (total === 0) return { total: 0, completed: 0, percent: 0 };
    const completed = routines.filter(isRoutineCompletedToday).length;
    return {
        total,
        completed,
        percent: Math.round((completed / total) * 100)
    };
};

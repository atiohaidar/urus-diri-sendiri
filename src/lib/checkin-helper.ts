import { getReflections } from './storage';

export const isCheckinCompletedToday = () => {
    const reflections = getReflections();
    const today = new Date().toDateString();

    // Check if there's a reflection for today AND it has "meaningful" content
    // meaningful content = just auto-saved routines/priorities snapshot
    return reflections.some((r: any) => {
        const isToday = new Date(r.date).toDateString() === today;
        // It's completed if it has winOfDay, hurdle, OR smallChange
        const hasContent = (r.winOfDay && r.winOfDay.trim().length > 0) ||
            (r.hurdle && r.hurdle.trim().length > 0) ||
            (r.smallChange && r.smallChange.trim().length > 0);
        return isToday && hasContent;
    });
};

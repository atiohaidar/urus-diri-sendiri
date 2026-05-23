import { getReflections, getIsCloudActive } from './storage';
import { pageDataApi } from './api/cloudflare-api';

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

/** Async version: uses backend when cloud is active */
export const isCheckinCompletedTodayAsync = async (): Promise<boolean> => {
    if (getIsCloudActive()) {
        try {
            const data = await pageDataApi.fetch('home');
            return data.checkinCompleted ?? false;
        } catch (err) {
            console.warn("Backend checkin status failed, falling back to local:", err);
        }
    }
    return isCheckinCompletedToday();
};

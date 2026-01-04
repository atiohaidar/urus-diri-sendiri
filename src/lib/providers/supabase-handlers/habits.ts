import { supabase } from '../../supabase';
import { Habit } from '../../types';

export const fetchHabits = async (userId: string, since?: string) => {
    let query = supabase.from('habits').select('*').eq('user_id', userId);
    if (since) {
        query = query.gt('updated_at', since);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        icon: r.icon,
        color: r.color,
        frequency: r.frequency,
        interval: r.interval,
        specificDays: r.specific_days,
        allowedDayOff: r.allowed_day_off,
        isArchived: r.is_archived,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        deletedAt: r.deleted_at
    })) as Habit[];
};

export const syncHabits = async (userId: string, habits: Habit[]) => {
    const rows = habits.map(h => ({
        id: h.id,
        name: h.name,
        description: h.description || null,
        icon: h.icon || null,
        color: h.color || null,
        frequency: h.frequency,
        interval: h.interval || null,
        specific_days: h.specificDays || null,
        allowed_day_off: h.allowedDayOff ?? 1,
        is_archived: h.isArchived || false,
        created_at: h.createdAt,
        updated_at: h.updatedAt,
        deleted_at: h.deletedAt || null,
        user_id: userId
    }));

    if (rows.length > 0) {
        const { error } = await supabase.from('habits').upsert(rows);
        if (error) throw error;
    }
};

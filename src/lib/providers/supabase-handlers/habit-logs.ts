import { supabase } from '../../supabase';
import { HabitLog } from '../../types';

export const fetchHabitLogs = async (userId: string, since?: string) => {
    let query = supabase.from('habit_logs').select('*').eq('user_id', userId).order('date', { ascending: false });
    if (since) {
        query = query.gt('updated_at', since);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((r: any) => ({
        id: r.id,
        habitId: r.habit_id,
        date: r.date,
        completed: r.completed,
        completedAt: r.completed_at,
        note: r.note,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        deletedAt: r.deleted_at
    })) as HabitLog[];
};

export const syncHabitLogs = async (userId: string, habitLogs: HabitLog[]) => {
    const rows = habitLogs.map(l => ({
        id: l.id,
        habit_id: l.habitId,
        date: l.date,
        completed: l.completed,
        completed_at: l.completedAt || null,
        note: l.note || null,
        created_at: l.createdAt,
        updated_at: l.updatedAt,
        deleted_at: l.deletedAt || null,
        user_id: userId
    }));

    if (rows.length > 0) {
        const { error } = await supabase.from('habit_logs').upsert(rows);
        if (error) throw error;
    }
};

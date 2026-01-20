import { supabase } from '../../supabase';
import { RoutineItem } from '../../types';

export const fetchRoutines = async (userId: string, since?: string) => {
    let query = supabase.from('routines').select('*').eq('user_id', userId);

    if (since) {
        query = query.gt('updated_at', since);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((r: any) => ({
        id: r.id,
        startTime: r.start_time,
        endTime: r.end_time,
        activity: r.activity,
        category: r.category,
        completedAt: r.completed_at,
        updatedAt: r.updated_at,
        description: r.description,
        completionNote: r.completion_note,
        deletedAt: r.deleted_at
    })) as RoutineItem[];
};

export const syncRoutines = async (userId: string, routines: RoutineItem | RoutineItem[]) => {
    const items = Array.isArray(routines) ? routines : [routines];
    if (items.length === 0) return;

    const rows = items.map(r => ({
        id: r.id,
        start_time: r.startTime,
        end_time: r.endTime,
        activity: r.activity,
        category: r.category,
        completed_at: r.completedAt,
        updated_at: r.updatedAt,
        description: r.description,
        completion_note: r.completionNote || null,
        deleted_at: r.deletedAt || null,
        user_id: userId
    }));

    const { error } = await supabase.from('routines').upsert(rows);
    if (error) throw error;
};

export const deleteRemoteRoutine = async (userId: string, id: string) => {
    const { error } = await supabase
        .from('routines')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId);

    if (error) throw error;
};

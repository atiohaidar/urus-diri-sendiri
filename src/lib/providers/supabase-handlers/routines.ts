import { supabase } from '../../supabase';
import { RoutineItem } from '../../types';

export const fetchRoutines = async (userId: string, since?: string) => {
    let query = supabase.from('routines').select('*');

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

export const syncRoutines = async (userId: string, routines: RoutineItem[]) => {
    const activeIds = routines.map(r => r.id);

    const rows = routines.map(r => ({
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

    if (rows.length > 0) {
        const { error } = await supabase.from('routines').upsert(rows);
        if (error) throw error;
    }

    // Soft Delete Missing Items
    if (activeIds.length > 0) {
        const { error: delError } = await supabase
            .from('routines')
            .update({ deleted_at: new Date().toISOString() })
            .not('id', 'in', `(${activeIds.join(',')})`)
            .is('deleted_at', null);
        if (delError) console.error("Error soft-syncing routines:", delError);
    } else {
        const { error: delError } = await supabase
            .from('routines')
            .update({ deleted_at: new Date().toISOString() })
            .is('deleted_at', null);
        if (delError) console.error("Error soft-clearing routines:", delError);
    }
};

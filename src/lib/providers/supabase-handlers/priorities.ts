import { supabase } from '../../supabase';
import { PriorityTask } from '../../types';

export const fetchPriorities = async (userId: string, since?: string) => {
    let query = supabase
        .from('priorities')
        .select('*')
        .eq('user_id', userId); // Defense-in-depth filter

    if (since) {
        query = query.gt('updated_at', since);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row: any) => ({
        id: row.id,
        text: row.text,
        completed: row.completed,
        completionNote: row.completion_note,
        updatedAt: row.updated_at,
        scheduledFor: row.scheduled_for,
        deletedAt: row.deleted_at
    })) as PriorityTask[];
};

export const syncPriorities = async (userId: string, priorities: PriorityTask[]) => {
    const activeIds = priorities.map(p => p.id);

    // 1. Upsert Active Items
    const rows = priorities.map(p => ({
        id: p.id,
        text: p.text,
        completed: p.completed,
        completion_note: p.completionNote || null,
        updated_at: p.updatedAt,
        scheduled_for: p.scheduledFor || null,
        deleted_at: p.deletedAt || null,
        user_id: userId
    }));

    if (rows.length > 0) {
        const { error } = await supabase.from('priorities').upsert(rows);
        if (error) throw error;
    }

    // 2. Soft Delete Missing Items
    if (activeIds.length > 0) {
        const { error: delError } = await supabase
            .from('priorities')
            .update({ deleted_at: new Date().toISOString() })
            .not('id', 'in', `(${activeIds.join(',')})`)
            .is('deleted_at', null); // Only mark if not already deleted

        if (delError) console.error("Error soft-syncing priorities:", delError);
    } else {
        // If local list empty, soft delete ALL
        const { error: delError } = await supabase
            .from('priorities')
            .update({ deleted_at: new Date().toISOString() })
            .is('deleted_at', null);

        if (delError) console.error("Error soft-clearing priorities:", delError);
    }
};

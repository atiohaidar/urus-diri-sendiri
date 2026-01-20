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

export const syncPriorities = async (userId: string, priorities: PriorityTask | PriorityTask[]) => {
    const items = Array.isArray(priorities) ? priorities : [priorities];

    if (items.length === 0) return;

    const rows = items.map(p => ({
        id: p.id,
        text: p.text,
        completed: p.completed,
        completion_note: p.completionNote || null,
        updated_at: p.updatedAt,
        scheduled_for: p.scheduledFor || null,
        deleted_at: p.deletedAt || null,
        user_id: userId
    }));

    const { error } = await supabase.from('priorities').upsert(rows);
    if (error) throw error;
};

export const deleteRemotePriority = async (userId: string, id: string) => {
    const { error } = await supabase
        .from('priorities')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId);

    if (error) throw error;
};

import { supabase } from '../../supabase';
import { Note } from '../../types';

export const fetchNotes = async (userId: string, since?: string) => {
    let query = supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });

    if (since) {
        query = query.gt('updated_at', since);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map((r: any) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        deletedAt: r.deleted_at
    })) as Note[];
};

export const syncNotes = async (userId: string, notes: Note[]) => {
    const activeIds = notes.map(n => n.id);

    const rows = notes.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        created_at: n.createdAt,
        updated_at: n.updatedAt,
        deleted_at: n.deletedAt || null,
        user_id: userId
    }));

    if (rows.length > 0) {
        const { error } = await supabase.from('notes').upsert(rows);
        if (error) throw error;
    }

    // Soft Delete Missing Items
    if (activeIds.length > 0) {
        const { error: delError } = await supabase
            .from('notes')
            .update({ deleted_at: new Date().toISOString() })
            .not('id', 'in', `(${activeIds.join(',')})`)
            .is('deleted_at', null);

        if (delError) console.error("Error soft-syncing notes:", delError);
    } else {
        const { error: delError } = await supabase
            .from('notes')
            .update({ deleted_at: new Date().toISOString() })
            .is('deleted_at', null);
        if (delError) console.error("Error soft-clearing notes:", delError);
    }
};

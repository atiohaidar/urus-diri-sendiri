import { supabase } from '../../supabase';
import { Note } from '../../types';

export const fetchNotes = async (userId: string, since?: string) => {
    let query = supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
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
        category: r.category ?? null,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        deletedAt: r.deleted_at,
        // Encryption fields
        isEncrypted: r.is_encrypted ?? false,
        encryptionSalt: r.encryption_salt ?? undefined,
        encryptionIv: r.encryption_iv ?? undefined,
        passwordHash: r.password_hash ?? undefined,
    })) as Note[];
};

export const syncNotes = async (userId: string, notes: Note[] | Note) => {
    const items = Array.isArray(notes) ? notes : [notes];

    const rows = items.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        category: n.category ?? null,
        created_at: n.createdAt,
        updated_at: n.updatedAt,
        deleted_at: n.deletedAt || null,
        user_id: userId,
        // Encryption fields
        is_encrypted: n.isEncrypted ?? false,
        encryption_salt: n.encryptionSalt ?? null,
        encryption_iv: n.encryptionIv ?? null,
        password_hash: n.passwordHash ?? null,
    }));

    if (rows.length > 0) {
        const { error } = await supabase.from('notes').upsert(rows);
        if (error) throw error;
    }
};

export const deleteRemoteNote = async (userId: string, id: string) => {
    const { error } = await supabase
        .from('notes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId);

    if (error) throw error;
};

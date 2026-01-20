import { supabase } from '../../supabase';
import { NoteHistory } from '../../types';

export async function fetchNoteHistories(userId: string, since?: string): Promise<NoteHistory[]> {
    let query = supabase
        .from('note_histories')
        .select('*')
        .eq('user_id', userId)
        .order('saved_at', { ascending: false });

    if (since) {
        query = query.gt('updated_at', since);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching note histories:', error);
        throw error;
    }

    return (data || []).map((row: any) => ({
        id: row.id,
        noteId: row.note_id,
        title: row.title,
        content: row.content,
        savedAt: row.saved_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at,
    }));
}

export async function syncNoteHistory(userId: string, history: NoteHistory): Promise<void> {
    const { error } = await supabase
        .from('note_histories')
        .upsert({
            id: history.id,
            user_id: userId,
            note_id: history.noteId,
            title: history.title,
            content: history.content,
            saved_at: history.savedAt,
            created_at: history.createdAt,
            updated_at: history.updatedAt || new Date().toISOString(),
            deleted_at: history.deletedAt,
        });

    if (error) {
        console.error('Error syncing note history:', error);
        throw error;
    }
}

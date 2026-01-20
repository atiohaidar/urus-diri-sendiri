import { NoteHistory } from '../types';
import { cache, provider, generateId, handleSaveError } from './core';

export const getNoteHistories = (noteId?: string): NoteHistory[] => {
    const histories = cache.noteHistories || [];
    if (noteId) {
        return histories.filter(h => h.noteId === noteId && !h.deletedAt);
    }
    return histories.filter(h => !h.deletedAt);
};

export const saveNoteHistory = (noteId: string, title: string, content: string) => {
    const histories = cache.noteHistories || [];
    const now = new Date().toISOString();

    const newHistory: NoteHistory = {
        id: generateId('note_history'),
        noteId,
        title,
        content,
        savedAt: now,
        createdAt: now,
        updatedAt: now,
    };

    const updated = [newHistory, ...histories];
    cache.noteHistories = updated;

    provider.saveNoteHistory(newHistory).catch((error) => {
        handleSaveError(error, 'Menyimpan riwayat catatan');
    });

    return newHistory;
};

export const deleteNoteHistory = (id: string) => {
    const histories = cache.noteHistories || [];
    const now = new Date().toISOString();

    const updated = histories.map(h =>
        h.id === id ? { ...h, deletedAt: now, updatedAt: now } : h
    );

    cache.noteHistories = updated;

    const deletedHistory = updated.find(h => h.id === id);
    if (deletedHistory) {
        provider.saveNoteHistory(deletedHistory).catch((error) => {
            handleSaveError(error, 'Menghapus riwayat catatan');
        });
    }

    return updated;
};

// Delete all histories for a specific note (when note is deleted)
export const deleteNoteHistoriesByNoteId = (noteId: string) => {
    const histories = cache.noteHistories || [];
    const now = new Date().toISOString();

    const updated = histories.map(h =>
        h.noteId === noteId ? { ...h, deletedAt: now, updatedAt: now } : h
    );

    cache.noteHistories = updated;

    // Sync all deleted histories
    const deletedHistories = updated.filter(h => h.noteId === noteId && h.deletedAt);
    deletedHistories.forEach(history => {
        provider.saveNoteHistory(history).catch((error) => {
            handleSaveError(error, 'Menghapus riwayat catatan');
        });
    });

    return updated;
};

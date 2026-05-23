import { Note } from '../types';
import { cache, provider, generateId, handleSaveError } from './core';

export const getNotes = (): Note[] => {
    return cache.notes || [];
};

export const saveNote = async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const notes = getNotes();
    const now = new Date().toISOString();
    const newNote: Note = {
        ...note,
        id: generateId('note'),
        createdAt: now,
        updatedAt: now,
    };
    const updated = [newNote, ...notes];
    cache.notes = updated;
    try {
        await provider.saveNote(newNote);
    } catch (error) {
        handleSaveError(error, 'Menyimpan catatan');
    }
    return newNote;
};

export const updateNote = async (id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'category' | 'isEncrypted' | 'encryptionSalt' | 'encryptionIv' | 'passwordHash'>>) => {
    const notes = getNotes();
    const updated = notes.map(n =>
        n.id === id
            ? { ...n, ...updates, updatedAt: new Date().toISOString() }
            : n
    );
    cache.notes = updated;
    const updatedNote = updated.find(n => n.id === id);
    if (updatedNote) {
        try {
            await provider.saveNote(updatedNote);
        } catch (error) {
            handleSaveError(error, 'Memperbarui catatan');
        }
    }
    return updated;
};

export const deleteNote = async (id: string) => {
    const notes = getNotes();
    const filtered = notes.filter(n => n.id !== id);
    cache.notes = filtered;
    try {
        await provider.deleteNote(id);
    } catch (error) {
        handleSaveError(error, 'Menghapus catatan');
    }
    return filtered;
};


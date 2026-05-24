import { Note } from '../types';
import { cache, provider, generateId, notifyListeners, handleSaveError } from './core';

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
    notifyListeners();
    try {
        await provider.saveNote(newNote);
    } catch (error) {
        cache.notes = notes;
        notifyListeners();
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
    notifyListeners();
    const updatedNote = updated.find(n => n.id === id);
    if (updatedNote) {
        try {
            await provider.saveNote(updatedNote);
        } catch (error) {
            cache.notes = notes;
            notifyListeners();
            handleSaveError(error, 'Memperbarui catatan');
        }
    }
    return cache.notes || [];
};

export const deleteNote = async (id: string) => {
    const notes = getNotes();
    const filtered = notes.filter(n => n.id !== id);
    cache.notes = filtered;
    notifyListeners();
    try {
        await provider.deleteNote(id);
    } catch (error) {
        cache.notes = notes;
        notifyListeners();
        handleSaveError(error, 'Menghapus catatan');
    }
    return cache.notes || [];
};

import { useState, useEffect } from 'react';
import { getNotes, saveNote as saveNoteStorage, updateNote as updateNoteStorage, deleteNote as deleteNoteStorage, type Note } from '@/lib/storage';

export const useNotes = () => {
    const [notes, setNotes] = useState<Note[]>([]);

    useEffect(() => {
        setNotes(getNotes());
    }, []);

    const saveNote = (title: string, content: string) => {
        saveNoteStorage({ title, content });
        setNotes(getNotes());
    };

    const updateNote = (id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => {
        const updated = updateNoteStorage(id, updates);
        setNotes(updated);
    };

    const deleteNote = (id: string) => {
        const updated = deleteNoteStorage(id);
        setNotes(updated);
    };

    return {
        notes,
        saveNote,
        updateNote,
        deleteNote
    };
};

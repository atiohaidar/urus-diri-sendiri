import { useState, useEffect, useCallback } from 'react';
import { getNotes, saveNote as saveNoteStorage, updateNote as updateNoteStorage, deleteNote as deleteNoteStorage, initializeStorage, type Note, registerListener } from '@/lib/storage';

export const useNotes = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshNotes = useCallback(() => {
        // getNotes reads from cache which is updated synchronously
        setNotes(getNotes());
    }, []);

    useEffect(() => {
        initializeStorage().then(() => {
            refreshNotes();
            setIsLoading(false);
        });

        const unsubscribe = registerListener(() => {
            refreshNotes();
        });

        return () => { unsubscribe(); };
    }, [refreshNotes]);

    const saveNote = useCallback((title: string, content: string) => {
        // saveNoteStorage updates cache synchronously before async save
        const newNote = saveNoteStorage({ title, content });
        // Refresh from cache to get updated list
        refreshNotes();
        return newNote;
    }, [refreshNotes]);

    const updateNote = useCallback((id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => {
        // updateNoteStorage returns the updated list and already updates cache
        const updated = updateNoteStorage(id, updates);
        setNotes(updated);
        return updated;
    }, []);

    const deleteNote = useCallback((id: string) => {
        // deleteNoteStorage returns the filtered list and already updates cache
        const updated = deleteNoteStorage(id);
        setNotes(updated);
        return updated;
    }, []);

    return {
        notes,
        isLoading,
        saveNote,
        updateNote,
        deleteNote,
        refreshNotes
    };
};

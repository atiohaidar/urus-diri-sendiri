import { useState, useEffect, useCallback } from 'react';
import { getNoteHistories, deleteNoteHistoriesByNoteId, registerListener, type NoteHistory } from '@/lib/storage';

export const useNoteHistories = (noteId?: string) => {
    const [histories, setHistories] = useState<NoteHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadHistories = useCallback(async () => {
        setIsLoading(true);
        try {
            const allHistories = getNoteHistories(noteId);
            setHistories(allHistories);
        } catch (error) {
            console.error('Error loading note histories:', error);
            setHistories([]);
        } finally {
            setIsLoading(false);
        }
    }, [noteId]);

    const clearHistories = useCallback(() => {
        if (noteId) {
            deleteNoteHistoriesByNoteId(noteId);
            loadHistories();
        }
    }, [noteId, loadHistories]);

    useEffect(() => {
        loadHistories();
        const unsubscribe = registerListener(loadHistories);
        return () => {
            unsubscribe();
        };
    }, [loadHistories]);

    return {
        histories,
        isLoading,
        refresh: loadHistories,
        clearHistories
    };
};

import { useState, useCallback, useEffect } from 'react';
import { PersonalNoteEntry } from '@/lib/types';
import {
    isPersonalNotesSetup,
    setupPersonalNotes,
    unlockPersonalNotes,
    updatePersonalNotes,
    changePersonalNotesPassword,
    deletePersonalNotes,
    createPersonalNoteEntry,
} from '@/lib/storage-modules/personal-notes';

export const usePersonalNotes = (autoFetch = false) => {
    const [isSetup, setIsSetup] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [entries, setEntries] = useState<PersonalNoteEntry[]>([]);
    const [isLoading, setIsLoading] = useState(autoFetch);
    const [currentPassword, setCurrentPassword] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        try {
            const setup = await isPersonalNotesSetup();
            setIsSetup(setup);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Check setup status on mount if autoFetch is enabled
    useEffect(() => {
        if (autoFetch) {
            refresh();
        }
    }, [autoFetch, refresh]);

    /**
     * Setup personal notes for the first time
     */
    const setupPassword = useCallback(async (password: string, initialEntries: PersonalNoteEntry[] = []) => {
        try {
            await setupPersonalNotes(password, initialEntries);
            setIsSetup(true);
            setIsUnlocked(true);
            setEntries(initialEntries);
            setCurrentPassword(password);
        } catch (error) {
            console.error('Setup error:', error);
            throw error;
        }
    }, []);

    /**
     * Unlock with password
     */
    const unlock = useCallback(async (password: string) => {
        try {
            const decryptedEntries = await unlockPersonalNotes(password);
            setIsUnlocked(true);
            setEntries(decryptedEntries);
            setCurrentPassword(password);
        } catch (error) {
            console.error('Unlock error:', error);
            throw error;
        }
    }, []);

    /**
     * Lock and clear decrypted data from memory
     */
    const lock = useCallback(() => {
        setIsUnlocked(false);
        setEntries([]);
        setCurrentPassword(null);
    }, []);

    /**
     * Add a new entry
     */
    const addEntry = useCallback(async (label: string, value: string) => {
        if (!currentPassword) {
            throw new Error('Not unlocked');
        }

        try {
            const newEntry = createPersonalNoteEntry(label, value);
            const updatedEntries = [...entries, newEntry];

            await updatePersonalNotes(currentPassword, updatedEntries);
            setEntries(updatedEntries);

            return newEntry;
        } catch (error) {
            console.error('Add entry error:', error);
            throw error;
        }
    }, [currentPassword, entries]);

    /**
     * Update an existing entry
     */
    const updateEntry = useCallback(async (id: string, label: string, value: string) => {
        if (!currentPassword) {
            throw new Error('Not unlocked');
        }

        try {
            const updatedEntries = entries.map(entry =>
                entry.id === id
                    ? { ...entry, label, value, updatedAt: new Date().toISOString() }
                    : entry
            );

            await updatePersonalNotes(currentPassword, updatedEntries);
            setEntries(updatedEntries);
        } catch (error) {
            console.error('Update entry error:', error);
            throw error;
        }
    }, [currentPassword, entries]);

    /**
     * Delete an entry
     */
    const deleteEntry = useCallback(async (id: string) => {
        if (!currentPassword) {
            throw new Error('Not unlocked');
        }

        try {
            const updatedEntries = entries.filter(entry => entry.id !== id);

            await updatePersonalNotes(currentPassword, updatedEntries);
            setEntries(updatedEntries);
        } catch (error) {
            console.error('Delete entry error:', error);
            throw error;
        }
    }, [currentPassword, entries]);

    /**
     * Change password
     */
    const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
        try {
            await changePersonalNotesPassword(oldPassword, newPassword);
            setCurrentPassword(newPassword);
        } catch (error) {
            console.error('Change password error:', error);
            throw error;
        }
    }, []);

    /**
     * Delete all data (reset)
     */
    const resetAll = useCallback(async () => {
        await deletePersonalNotes();
        setIsSetup(false);
        setIsUnlocked(false);
        setEntries([]);
        setCurrentPassword(null);
    }, []);

    return {
        // State
        isSetup,
        isUnlocked,
        entries,
        isLoading,

        // Actions
        refresh,
        setupPassword,
        unlock,
        lock,
        addEntry,
        updateEntry,
        deleteEntry,
        changePassword,
        resetAll,
    };
};

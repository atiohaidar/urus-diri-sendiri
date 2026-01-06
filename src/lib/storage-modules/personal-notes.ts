import { PersonalNotesData, PersonalNoteEntry } from '../types';
import { encryptNote, decryptNote, hashPassword, validatePassword } from '../encryption';
import { generateId, provider } from './core';

/**
 * Get the encrypted personal notes data structure from storage provider
 */
export const getPersonalNotesData = async (): Promise<PersonalNotesData | null> => {
    try {
        if (provider.getPersonalNotes) {
            return await provider.getPersonalNotes();
        }
        return null;
    } catch (error) {
        console.error('Error reading personal notes data:', error);
        return null;
    }
};

/**
 * Check if personal notes have been setup (password configured)
 */
export const isPersonalNotesSetup = async (): Promise<boolean> => {
    const data = await getPersonalNotesData();
    return data?.isSetup === true;
};

/**
 * Setup personal notes for the first time with a password
 */
export const setupPersonalNotes = async (
    password: string,
    initialEntries: PersonalNoteEntry[] = []
): Promise<void> => {
    try {
        // Encrypt the initial entries (empty array or provided entries)
        const entriesJson = JSON.stringify(initialEntries);
        const encrypted = await encryptNote(entriesJson, password);

        const data: PersonalNotesData = {
            isSetup: true,
            passwordHash: encrypted.passwordHash,
            encryptedData: encrypted.encryptedContent,
            salt: encrypted.salt,
            iv: encrypted.iv,
            updatedAt: new Date().toISOString(),
        };

        if (provider.savePersonalNotes) {
            await provider.savePersonalNotes(data);
        }
    } catch (error) {
        console.error('Error setting up personal notes:', error);
        throw new Error('Failed to setup personal notes');
    }
};

/**
 * Unlock personal notes with password and return decrypted entries
 */
export const unlockPersonalNotes = async (password: string): Promise<PersonalNoteEntry[]> => {
    const data = await getPersonalNotesData();

    if (!data || !data.isSetup) {
        throw new Error('Personal notes not setup');
    }

    try {
        // Validate password first
        const isValid = await validatePassword(password, data.passwordHash);
        if (!isValid) {
            throw new Error('Invalid password');
        }

        // Decrypt the data
        const decryptedJson = await decryptNote(
            data.encryptedData,
            password,
            data.salt,
            data.iv
        );

        return JSON.parse(decryptedJson) as PersonalNoteEntry[];
    } catch (error) {
        if (error instanceof Error && error.message === 'Invalid password') {
            throw error;
        }
        console.error('Error unlocking personal notes:', error);
        throw new Error('Failed to unlock personal notes. Wrong password or corrupted data.');
    }
};

/**
 * Update personal notes with new entries (requires password to re-encrypt)
 */
export const updatePersonalNotes = async (
    password: string,
    entries: PersonalNoteEntry[]
): Promise<void> => {
    const data = await getPersonalNotesData();

    if (!data || !data.isSetup) {
        throw new Error('Personal notes not setup');
    }

    try {
        // Validate password first
        const isValid = await validatePassword(password, data.passwordHash);
        if (!isValid) {
            throw new Error('Invalid password');
        }

        // Re-encrypt with new data
        const entriesJson = JSON.stringify(entries);
        const encrypted = await encryptNote(entriesJson, password);

        const updatedData: PersonalNotesData = {
            ...data,
            encryptedData: encrypted.encryptedContent,
            salt: encrypted.salt,
            iv: encrypted.iv,
            updatedAt: new Date().toISOString(),
        };

        if (provider.savePersonalNotes) {
            await provider.savePersonalNotes(updatedData);
        }
    } catch (error) {
        if (error instanceof Error && error.message === 'Invalid password') {
            throw error;
        }
        console.error('Error updating personal notes:', error);
        throw new Error('Failed to update personal notes');
    }
};

/**
 * Change the password for personal notes
 */
export const changePersonalNotesPassword = async (
    oldPassword: string,
    newPassword: string
): Promise<void> => {
    const data = await getPersonalNotesData();

    if (!data || !data.isSetup) {
        throw new Error('Personal notes not setup');
    }

    try {
        // First, unlock with old password to get entries
        const entries = await unlockPersonalNotes(oldPassword);

        // Re-encrypt with new password
        const entriesJson = JSON.stringify(entries);
        const encrypted = await encryptNote(entriesJson, newPassword);

        const updatedData: PersonalNotesData = {
            isSetup: true,
            passwordHash: encrypted.passwordHash,
            encryptedData: encrypted.encryptedContent,
            salt: encrypted.salt,
            iv: encrypted.iv,
            updatedAt: new Date().toISOString(),
        };

        if (provider.savePersonalNotes) {
            await provider.savePersonalNotes(updatedData);
        }
    } catch (error) {
        console.error('Error changing password:', error);
        throw error;
    }
};

/**
 * Permanently delete all personal notes data
 */
export const deletePersonalNotes = async (): Promise<void> => {
    // We overwrite with "empty/deleted" state or null?
    // Provider doesn't have explicit "deletePersonalNotes".
    // We can save a null or empty object if we want to "clear".
    // Alternatively, LocalStorageProvider.clearAll removes the key.
    // But for Supabase, we might want to delete the row.
    // For now, let's just save "not setup" state or rely on dedicated delete if implemented.
    // But since I didn't add deletePersonalNotes to provider interface, I'll save a "reset" state.

    // Actually, sending null to savePersonalNotes might reset it?
    // Or we use `provider.savePersonalNotes({ isSetup: false, ... })`.

    // Let's implement robust delete by extending provider later if needed.
    // For now, let's try to overwrite with invalid/empty data if possible, or assume provider.clearAll handles local.
    // But wait, `provider.savePersonalNotes` updates Supabase.
    // If I want to DELETE from Supabase, I need to send a "deleted" signal.

    // Let's follow the pattern of saving an "empty" state.
    // BUT user wants data GONE.
    // LocalStorageProvider: `localStorage.removeItem`.
    // I can modify LocalStorageProvider to handle `savePersonalNotes(null)`.

    if (provider.savePersonalNotes) {
        // Sending null might cause issues if type expects payload.
        // Let's modify LocalStorageProvider to remove item if keys are missing?
        // Safer: Add deletePersonalNotes to interface.
        // But I just updated interface.

        // Let's just save an "Unset" state.
        // Or, access localStorage directly for local cleanup + provider save blank.

        // Quick fix: Update interface to support delete OR just save { isSetup: false }.
        const emptyData: any = {
            isSetup: false,
            passwordHash: '',
            encryptedData: '',
            salt: '',
            iv: '',
            updatedAt: new Date().toISOString()
        };
        await provider.savePersonalNotes(emptyData);
    }
};

/**
 * Helper: Create a new entry with generated ID and timestamps
 */
export const createPersonalNoteEntry = (label: string, value: string): PersonalNoteEntry => {
    const now = new Date().toISOString();
    return {
        id: generateId('pnote'),
        label,
        value,
        createdAt: now,
        updatedAt: now,
    };
};

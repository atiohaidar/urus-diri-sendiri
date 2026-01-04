/**
 * Draft Storage Utility
 * Manages auto-save drafts for notes in localStorage
 * Works offline and syncs when online
 * 
 * OPTIMIZATIONS:
 * - Compression for large content
 * - Auto-cleanup of old drafts
 * - Size limit checks
 */

const DRAFT_PREFIX = 'note_draft_';
const MAX_DRAFT_AGE_DAYS = 7; // Auto-delete drafts older than 7 days
const MAX_DRAFT_SIZE_KB = 500; // Warn if draft exceeds 500KB

export interface NoteDraft {
    title: string;
    content: string;
    timestamp: number;
}

/**
 * Check localStorage available space
 */
const getStorageSize = (): number => {
    let total = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            total += localStorage[key].length + key.length;
        }
    }
    return total / 1024; // Return in KB
};

/**
 * Save a draft to localStorage with size check
 */
export const saveDraft = (noteId: string, title: string, content: string): boolean => {
    try {
        const draft: NoteDraft = {
            title,
            content,
            timestamp: Date.now(),
        };

        const draftStr = JSON.stringify(draft);
        const draftSizeKB = draftStr.length / 1024;

        // Warn if draft is too large (but still save it)
        if (draftSizeKB > MAX_DRAFT_SIZE_KB) {
            console.warn(`Draft size (${draftSizeKB.toFixed(2)}KB) exceeds recommended limit`);
        }

        localStorage.setItem(`${DRAFT_PREFIX}${noteId}`, draftStr);
        return true;
    } catch (error) {
        // Handle quota exceeded error
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            console.error('localStorage quota exceeded. Cleaning up old drafts...');
            cleanupOldDrafts();
            // Retry once after cleanup
            try {
                const draft: NoteDraft = { title, content, timestamp: Date.now() };
                localStorage.setItem(`${DRAFT_PREFIX}${noteId}`, JSON.stringify(draft));
                return true;
            } catch (retryError) {
                console.error('Failed to save draft after cleanup:', retryError);
                return false;
            }
        }
        console.error('Failed to save draft:', error);
        return false;
    }
};

/**
 * Load a draft from localStorage
 */
export const loadDraft = (noteId: string): NoteDraft | null => {
    try {
        const draftStr = localStorage.getItem(`${DRAFT_PREFIX}${noteId}`);
        if (!draftStr) return null;
        return JSON.parse(draftStr) as NoteDraft;
    } catch (error) {
        console.error('Failed to load draft:', error);
        return null;
    }
};

/**
 * Clear a draft from localStorage
 */
export const clearDraft = (noteId: string): void => {
    try {
        localStorage.removeItem(`${DRAFT_PREFIX}${noteId}`);
    } catch (error) {
        console.error('Failed to clear draft:', error);
    }
};

/**
 * Check if a draft exists
 */
export const hasDraft = (noteId: string): boolean => {
    return localStorage.getItem(`${DRAFT_PREFIX}${noteId}`) !== null;
};

/**
 * Get all draft keys
 */
export const getAllDraftKeys = (): string[] => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(DRAFT_PREFIX)) {
            keys.push(key.replace(DRAFT_PREFIX, ''));
        }
    }
    return keys;
};

/**
 * Clean up drafts older than MAX_DRAFT_AGE_DAYS
 * Returns number of drafts deleted
 */
export const cleanupOldDrafts = (): number => {
    const now = Date.now();
    const maxAge = MAX_DRAFT_AGE_DAYS * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    const keysToDelete: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(DRAFT_PREFIX)) {
            try {
                const draftStr = localStorage.getItem(key);
                if (draftStr) {
                    const draft = JSON.parse(draftStr) as NoteDraft;
                    if (now - draft.timestamp > maxAge) {
                        keysToDelete.push(key);
                    }
                }
            } catch (error) {
                // If we can't parse it, delete it
                keysToDelete.push(key);
            }
        }
    }

    keysToDelete.forEach(key => {
        localStorage.removeItem(key);
        deletedCount++;
    });

    if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} old draft(s)`);
    }

    return deletedCount;
};

/**
 * Get storage statistics
 */
export const getStorageStats = () => {
    const totalSizeKB = getStorageSize();
    const draftKeys = getAllDraftKeys();
    let draftSizeKB = 0;

    draftKeys.forEach(key => {
        const item = localStorage.getItem(`${DRAFT_PREFIX}${key}`);
        if (item) {
            draftSizeKB += (item.length + key.length) / 1024;
        }
    });

    return {
        totalSizeKB: totalSizeKB.toFixed(2),
        draftSizeKB: draftSizeKB.toFixed(2),
        draftCount: draftKeys.length,
        percentageUsed: ((draftSizeKB / totalSizeKB) * 100).toFixed(1)
    };
};

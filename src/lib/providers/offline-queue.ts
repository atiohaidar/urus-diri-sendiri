import { STORAGE_KEYS } from '../constants';
import { IDB_STORES, getAllItems, putItem, openDB } from '../idb';

/**
 * Queue item types for offline sync
 */
export type QueueItemType = 'priorities' | 'delete_priority' | 'reflection' | 'notes' | 'delete_note' | 'note_history' | 'routines' | 'delete_routine' | 'log' | 'delete_log' | 'habits' | 'habitLogs' | 'personal_notes';

export type QueueItem =
    | { type: 'priorities'; data: any[] }
    | { type: 'delete_priority'; data: string }
    | { type: 'reflection'; data: any }
    | { type: 'notes'; data: any[] | any }
    | { type: 'delete_note'; data: string }
    | { type: 'note_history'; data: any }
    | { type: 'routines'; data: any[] }
    | { type: 'delete_routine'; data: string }
    | { type: 'log'; data: any }
    | { type: 'delete_log'; data: string }
    | { type: 'habits'; data: any[] }
    | { type: 'habitLogs'; data: any[] }
    | { type: 'personal_notes'; data: any };

export type QueueProcessor = (item: QueueItem) => Promise<void>;

/**
 * Manages offline queue for syncing data when back online
 * Uses IndexedDB for unlimited capacity and better resilience
 */
export class OfflineQueue {
    private processor: QueueProcessor | null = null;
    private isProcessing = false;

    constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                console.log("Network back online. Processing sync queue...");
                this.process();
            });
        }
    }

    setProcessor(processor: QueueProcessor) {
        this.processor = processor;
    }

    async getAllWithKeys(): Promise<{ key: number, item: QueueItem }[]> {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(IDB_STORES.OFFLINE_QUEUE, 'readonly');
            const store = transaction.objectStore(IDB_STORES.OFFLINE_QUEUE);
            const request = store.openCursor();
            const results: { key: number, item: QueueItem }[] = [];

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
                if (cursor) {
                    results.push({ key: cursor.key as number, item: cursor.value as QueueItem });
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    async add(item: QueueItem) {
        // DEDUPLICATION: If we are saving the same entity again, we can technically replace it
        // but for simplicity and sequence preservation, we just append to IDB.
        // IDB handles high volume much better than localStorage.
        try {
            const db = await openDB();
            const transaction = db.transaction(IDB_STORES.OFFLINE_QUEUE, 'readwrite');
            const store = transaction.objectStore(IDB_STORES.OFFLINE_QUEUE);
            store.add(item);
            console.log(`🔌 Offline: Action queued (${item.type}) in IndexedDB.`);
        } catch (e) {
            console.error("Failed to add to offline queue:", e);
        }
    }

    async delete(key: number) {
        const db = await openDB();
        const transaction = db.transaction(IDB_STORES.OFFLINE_QUEUE, 'readwrite');
        transaction.objectStore(IDB_STORES.OFFLINE_QUEUE).delete(key);
    }

    isOnline(): boolean {
        return typeof navigator !== 'undefined' ? navigator.onLine : true;
    }

    async executeOrQueue(item: QueueItem, fn: () => Promise<void>) {
        if (!this.isOnline()) {
            await this.add(item);
            return;
        }

        try {
            await fn();
        } catch (err: any) {
            console.error(`Operation failed (will queue):`, err);
            await this.add(item);
        }
    }

    async process() {
        if (!this.isOnline() || !this.processor || this.isProcessing) return;

        this.isProcessing = true;
        const queueWithKeys = await this.getAllWithKeys();

        if (queueWithKeys.length === 0) {
            this.isProcessing = false;
            return;
        }

        console.log(`🔄 Syncing ${queueWithKeys.length} offline actions from IndexedDB...`);

        for (const entry of queueWithKeys) {
            try {
                await this.processor(entry.item);
                await this.delete(entry.key);
                // Moderate throttle
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (err) {
                console.error(`Failed to process queue item (${entry.item.type}) during sync:`, err);
                // Stop processing on error to preserve sequence
                break;
            }
        }

        this.isProcessing = false;
    }
}

export const offlineQueue = new OfflineQueue();

import { STORAGE_KEYS } from '../constants';

/**
 * Queue item types for offline sync
 */
export type QueueItemType = 'priorities' | 'reflection' | 'notes' | 'delete_note' | 'routines' | 'log' | 'delete_log' | 'habits' | 'habitLogs' | 'personal_notes';

export type QueueItem =
    | { type: 'priorities'; data: any[] }
    | { type: 'reflection'; data: any }
    | { type: 'notes'; data: any[] | any }
    | { type: 'delete_note'; data: string }
    | { type: 'routines'; data: any[] }
    | { type: 'log'; data: any }
    | { type: 'delete_log'; data: string }
    | { type: 'habits'; data: any[] }
    | { type: 'habitLogs'; data: any[] }
    | { type: 'personal_notes'; data: any };

export type QueueProcessor = (item: QueueItem) => Promise<void>;

/**
 * Manages offline queue for syncing data when back online
 */
export class OfflineQueue {
    private queueKey = STORAGE_KEYS.OFFLINE_QUEUE;
    private processor: QueueProcessor | null = null;
    private isProcessing = false;

    constructor() {
        // Auto-process queue when coming back online
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                console.log("Network back online. Processing sync queue...");
                this.process();
            });
        }
    }

    /**
     * Set the processor function that handles each queue item
     */
    setProcessor(processor: QueueProcessor) {
        this.processor = processor;
    }

    /**
     * Get all items in the queue
     */
    getAll(): QueueItem[] {
        const raw = localStorage.getItem(this.queueKey);
        return raw ? JSON.parse(raw) : [];
    }

    /**
     * Save the queue to localStorage
     */
    private save(queue: QueueItem[]) {
        localStorage.setItem(this.queueKey, JSON.stringify(queue));
    }

    /**
     * Add an item to the offline queue
     */
    add(item: QueueItem) {
        const queue = this.getAll();
        queue.push(item);
        this.save(queue);
        console.log(`🔌 Offline: Action queued (${item.type}). Will sync when online.`);
    }

    /**
     * Clear the entire queue
     */
    clear() {
        localStorage.removeItem(this.queueKey);
    }

    /**
     * Check if online
     */
    isOnline(): boolean {
        return typeof navigator !== 'undefined' ? navigator.onLine : true;
    }

    /**
     * Execute a function or add to queue if offline
     */
    async executeOrQueue(item: QueueItem, fn: () => Promise<void>) {
        if (!this.isOnline()) {
            this.add(item);
            return;
        }

        try {
            await fn();
        } catch (err: any) {
            console.error(`Operation failed (will queue):`, err);
            this.add(item);
        }
    }

    /**
     * Process all items in the queue
     */
    async process() {
        if (!this.isOnline() || !this.processor || this.isProcessing) return;

        this.isProcessing = true;
        const queue = this.getAll();
        if (queue.length === 0) {
            this.isProcessing = false;
            return;
        }

        console.log(`🔄 Syncing ${queue.length} offline actions...`);

        const remainingQueue: QueueItem[] = [];

        for (const item of queue) {
            try {
                await this.processor(item);
                // Throttle requests to prevent rate limiting / freezing UI
                await new Promise(resolve => setTimeout(resolve, 150));
            } catch (err) {
                console.error(`Failed to process queue item (${item.type}) during sync:`, err);
                remainingQueue.push(item);
            }
        }

        this.save(remainingQueue);
        this.isProcessing = false;

        if (remainingQueue.length === 0) {
            console.log("✅ Offline queue synced successfully!");
        } else {
            console.warn(`⚠️ ${remainingQueue.length} items failed to sync.`);
        }
    }

    /**
     * Get the number of pending items
     */
    get pendingCount(): number {
        return this.getAll().length;
    }
}

// Singleton instance
export const offlineQueue = new OfflineQueue();

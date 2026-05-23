/**
 * IndexedDB wrapper for application storage
 * Optimized with Singleton connection pattern
 */

const DB_NAME = 'urus-diri-db';
const STORES = {
    IMAGES: 'images',
    REFLECTIONS: 'reflections',
    LOGS: 'logs',
    PRIORITIES: 'priorities',
    NOTES: 'notes',
    NOTE_HISTORIES: 'note_histories',
    ROUTINES: 'routines',
    HABITS: 'habits',
    HABIT_LOGS: 'habit_logs',
    PERSONAL_NOTES: 'personal_notes',
    OFFLINE_QUEUE: 'offline_queue'
};
const DB_VERSION = 5;

// Singleton instance
let dbInstance: IDBDatabase | null = null;
let connectionPromise: Promise<IDBDatabase> | null = null;

export const openDB = (): Promise<IDBDatabase> => {
    // Return existing instance if active
    if (dbInstance) return Promise.resolve(dbInstance);

    // Return existing promise if connection is in progress
    if (connectionPromise) return connectionPromise;

    connectionPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            connectionPromise = null;
            reject(request.error);
        };

        request.onsuccess = () => {
            const db = request.result;
            dbInstance = db;

            // Handle unexpected closure
            db.onclose = () => {
                console.warn('Database connection closed unexpectedly. Resetting instance.');
                dbInstance = null;
                connectionPromise = null;
            };

            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains(STORES.IMAGES)) {
                db.createObjectStore(STORES.IMAGES);
            }
            if (!db.objectStoreNames.contains(STORES.REFLECTIONS)) {
                db.createObjectStore(STORES.REFLECTIONS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.LOGS)) {
                db.createObjectStore(STORES.LOGS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.PRIORITIES)) {
                db.createObjectStore(STORES.PRIORITIES, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.NOTES)) {
                db.createObjectStore(STORES.NOTES, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.NOTE_HISTORIES)) {
                db.createObjectStore(STORES.NOTE_HISTORIES, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.ROUTINES)) {
                db.createObjectStore(STORES.ROUTINES, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.HABITS)) {
                db.createObjectStore(STORES.HABITS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.HABIT_LOGS)) {
                db.createObjectStore(STORES.HABIT_LOGS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.PERSONAL_NOTES)) {
                db.createObjectStore(STORES.PERSONAL_NOTES, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
                db.createObjectStore(STORES.OFFLINE_QUEUE, { autoIncrement: true });
            }
        };
    });

    return connectionPromise;
};

// --- Generic Helpers ---

export const putItem = async <T>(storeName: string, item: T): Promise<T> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        try {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(item);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(item);
        } catch (err) {
            // Retry once if transaction fails (e.g. connection stale)
            dbInstance = null;
            reject(err);
        }
    });
};

export const putItems = async <T>(storeName: string, items: T[]): Promise<void> => {
    if (items.length === 0) return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        try {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);

            items.forEach(item => store.put(item));

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        } catch (err) {
            dbInstance = null;
            reject(err);
        }
    });
};

export const getAllItems = async <T>(storeName: string): Promise<T[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result as T[]);
    });
};

export const deleteItem = async (storeName: string, id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
};

// --- Specific API ---

export const saveImage = async (base64: string): Promise<string> => {
    const db = await openDB();
    const id = `img-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.IMAGES, 'readwrite');
        const store = transaction.objectStore(STORES.IMAGES);
        const request = store.put(base64, id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(id);
    });
};

export const getImage = async (id: string): Promise<string | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.IMAGES, 'readonly');
        const store = transaction.objectStore(STORES.IMAGES);
        const request = store.get(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
    });
};

export const deleteImage = async (id: string): Promise<void> => {
    return deleteItem(STORES.IMAGES, id);
};

export const IDB_STORES = STORES;

export const cleanupImages = async (keepIds: string[]): Promise<void> => {
    const db = await openDB();
    const keepSet = new Set(keepIds);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.IMAGES, 'readwrite');
        const store = transaction.objectStore(STORES.IMAGES);
        const request = store.getAllKeys();

        request.onsuccess = () => {
            const allKeys = request.result as string[];
            let deletedCount = 0;

            allKeys.forEach((key) => {
                if (!keepSet.has(key)) {
                    store.delete(key);
                    deletedCount++;
                }
            });

            console.log(`🧹 IDB Cleanup: Removed ${deletedCount} orphaned images.`);
        };

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const clearStore = async (storeName: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
};

export const clearAllData = async (): Promise<void> => {
    const stores = Object.values(STORES);
    for (const store of stores) {
        // Skip images if we want to preserve them, but for privacy on user switch, usually we should clear them too 
        // OR implement a smarter GC. For now, wiping strict user data is priority.
        // We will skip IMAGES for now to avoid re-downloading huge assets if sharing device family,
        // but strictly all text data must go.
        if (store === STORES.IMAGES) continue;
        if (store === STORES.OFFLINE_QUEUE) continue; // Keep queue? No, if user switches, queue is invalid (wrong auth). Clear it.
    }

    // Actually, clearing offline queue is handled in core.ts, but let's be thorough here.
    // If we clear everything:
    await Promise.all(stores.map(store => {
        if (store === STORES.IMAGES) return Promise.resolve(); // Skip images to save bandwidth
        return clearStore(store);
    }));

    console.log("Storage: All user data wiped from IndexedDB.");
};

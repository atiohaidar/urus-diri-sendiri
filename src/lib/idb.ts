/**
 * IndexedDB wrapper for application storage
 * Optimized with Singleton connection pattern
 */

const DB_NAME = 'urus-diri-db';
const STORES = {
    IMAGES: 'images',
    REFLECTIONS: 'reflections',
    LOGS: 'logs'
};
const DB_VERSION = 2;

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

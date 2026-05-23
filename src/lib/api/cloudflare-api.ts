// Cloudflare D1 API Client
// Used by CloudflareD1Provider to communicate with Hono backend
// Import RPC client
import { client } from '../rpc-client';

// Token helpers (kept for backward compatibility with components using them directly)
const TOKEN_KEY = 'cloudflare_auth_token';
const USER_KEY = 'cloudflare_user';

export const getStoredToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
};

export const clearStoredToken = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};

export const getStoredUser = (): { id: string; email: string } | null => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
};

export const setStoredUser = (user: { id: string; email: string }): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
};


// Auth API
export const authApi = {
    async register(email: string, password: string) {
        const res = await client.api.auth.register.$post({
            json: { email, password }
        });
        const data = await res.json() as any;

        if (res.ok && data.success && data.data) {
            setStoredToken(data.data.token);
            setStoredUser(data.data.user);
        }

        return data;
    },

    async login(email: string, password: string) {
        const res = await client.api.auth.login.$post({
            json: { email, password }
        });
        const data = await res.json() as any;

        if (res.ok && data.success && data.data) {
            setStoredToken(data.data.token);
            setStoredUser(data.data.user);
        }

        return data;
    },

    async logout() {
        try {
            await client.api.auth.logout.$post();
        } finally {
            clearStoredToken();
        }
    },

    async getCurrentUser() {
        const res = await client.api.auth.me.$get();
        const data = await res.json() as any;

        if (res.ok && data.success && data.data) {
            setStoredUser(data.data.user);
        }

        return data;
    },

    isAuthenticated() {
        return !!getStoredToken();
    },
};


// Generic Data API - Factory pattern eliminates repetitive CRUD boilerplate
// ============================================================
interface CrudApi<T = any> {
    get: (since?: string) => Promise<T[]>;
    save: (data: T | T[]) => Promise<void>;
    delete: (id: string) => Promise<void>;
}

function createCrudApi<T = any>(
    endpoint: any,
    options?: { hasDelete?: boolean }
): CrudApi<T> {
    const { hasDelete = true } = options || {};

    return {
        get: async (since?: string) => {
            const res = await endpoint.$get({ query: { since } });
            const json = await res.json() as any;
            if (!json.success) throw new Error(json.error || 'Failed');
            return json.data || [];
        },
        save: async (data: T | T[]) => {
            const res = await endpoint.$put({ json: data });
            const json = await res.json() as any;
            if (!json.success) throw new Error(json.error || 'Failed');
        },
        delete: hasDelete
            ? async (id: string) => {
                const res = await endpoint[':id'].$delete({ param: { id } });
                const json = await res.json() as any;
                if (!json.success) throw new Error(json.error || 'Failed');
            }
            : async () => { throw new Error('Delete not supported'); },
    };
}

// Entity APIs — created via factory
export const prioritiesApi = createCrudApi(client.api.priorities);
export const routinesApi = createCrudApi(client.api.routines);
export const logsApi = createCrudApi(client.api.logs);
export const habitsApi = createCrudApi(client.api.habits, { hasDelete: false });
export const habitLogsApi = createCrudApi(client.api['habit-logs'], { hasDelete: false });
export const reflectionsApi = createCrudApi(client.api.reflections, { hasDelete: false });
export const noteHistoriesApi = createCrudApi(client.api['note-histories'], { hasDelete: false });

// Notes — has extra `saveSingle` + `delete`
export const notesApi = {
    ...createCrudApi(client.api.notes),
    saveSingle: async (data: any) => {
        const res = await client.api.notes.single.$put({ json: data });
        const json = await res.json() as any;
        if (!json.success) throw new Error(json.error || 'Failed');
    },
};

// Personal Notes — no `since`, no delete, different shape
export const personalNotesApi = {
    get: async () => {
        const res = await client.api['personal-notes'].$get();
        const json = await res.json() as any;
        if (!json.success) throw new Error(json.error);
        return json.data;
    },
    save: async (data: any) => {
        const res = await client.api['personal-notes'].$put({ json: data });
        const json = await res.json() as any;
        if (!json.success) throw new Error(json.error);
    },
};

export const syncApi = {
    getAll: async (since?: string) => {
        const res = await client.api.sync.all.$get({ query: { since } });

        // Jika 304 (Not Modified), langsung return null
        if (res.status === 304) {
            console.log("♻️ Sync: Server says Not Modified (304)");
            return null;
        }

        const json = await res.json() as any;

        if (!json.success) {
            throw new Error(json.error || 'Sync failed');
        }

        return json.data;
    }
};

// --- Unified Page Data API (1 request per page) ---
// Instead of hitting multiple endpoints, each page calls ONE endpoint
// that returns all the data it needs.

type PageName = 'home' | 'habits' | 'habit-detail' | 'history' | 'checkin';

export const pageDataApi = {
    /**
     * Fetch all data needed for a specific page in a single request.
     * 
     * Pages and their returned data:
     * - 'home': { routines, routineStats, activeIndex, priorities, todayHabits, checkinCompleted }
     * - 'habits': { habits, todayHabits }
     * - 'habit-detail': { habit, logs, stats }
     * - 'history': { reflections } or { logs }
     * - 'checkin': { todayReflection, routines, priorities }
     */
    fetch: async (page: PageName, params?: { habitId?: string; historyTab?: 'reflections' | 'logs' }) => {
        const res = await client.api['page-data'].$post({
            json: { page, ...params },
        });
        const json = await res.json() as any;
        if (!json.success) throw new Error(json.error || 'Failed to fetch page data');
        return json.data;
    },

    /** Toggle habit completion */
    toggleHabit: async (habitId: string, date?: string, note?: string) => {
        const res = await client.api['page-data']['toggle-habit'].$post({
            json: { habitId, date, note },
        });
        const json = await res.json() as any;
        if (!json.success) throw new Error(json.error);
        return json.data;
    },

    /** Toggle routine completion */
    toggleRoutine: async (routineId: string, note?: string) => {
        const res = await client.api['page-data']['toggle-routine'].$post({
            json: { routineId, note },
        });
        const json = await res.json() as any;
        if (!json.success) throw new Error(json.error);
        return json.data;
    },

    /** Reset old completed priorities */
    resetPriorities: async () => {
        const res = await client.api['page-data']['reset-priorities'].$post();
        const json = await res.json() as any;
        if (!json.success) throw new Error(json.error);
        return json.data;
    },

    /** Auto-snapshot today's progress */
    snapshot: async (todayRoutines?: any[], todayPriorities?: any[]) => {
        const res = await client.api['page-data'].snapshot.$post({
            json: { todayRoutines, todayPriorities },
        });
        const json = await res.json() as any;
        if (!json.success) throw new Error(json.error);
        return json.data;
    },
};


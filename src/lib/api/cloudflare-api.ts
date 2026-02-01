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


// Generic Data API - REPLACED with Typed wrappers
// We keep the structure but implement using specific RPC calls where we can.
// Generic Data API - REPLACED with Typed wrappers
// dataApi has been removed in favor of specific typed APIs

// Specific API endpoints
// Specific API endpoints
export const prioritiesApi = {
    get: async (since?: string) => {
        const res = await client.api.priorities.$get({ query: { since } });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        return json.data || [];
    },
    save: async (data: any[]) => {
        const res = await client.api.priorities.$put({ json: data });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
    },
    delete: async (id: string) => {
        const res = await client.api.priorities[':id'].$delete({ param: { id } });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
    },
};

export const routinesApi = {
    get: async (since?: string) => {
        const res = await client.api.routines.$get({ query: { since } });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed");
        return json.data || [];
    },
    save: async (data: any[]) => {
        const res = await client.api.routines.$put({ json: data });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed");
    },
    delete: async (id: string) => {
        const res = await client.api.routines[':id'].$delete({ param: { id } });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed");
    },
};

export const notesApi = {
    get: async (since?: string) => {
        const res = await client.api.notes.$get({ query: { since } });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        return json.data || [];
    },
    save: async (data: any | any[]) => {
        // Handle array vs single object if backend supports it, backend expects generic save usually handles both or typed
        // Based on routes usually accepts array or object depending on implementation.
        // Assuming /api/notes PUT accepts data
        const res = await client.api.notes.$put({ json: data });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
    },
    saveSingle: async (data: any) => {
        const res = await client.api.notes.single.$put({ json: data });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
    },
    delete: async (id: string) => {
        const res = await client.api.notes[':id'].$delete({ param: { id } });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
    },
};

export const noteHistoriesApi = {
    get: async (since?: string) => {
        const res = await client.api['note-histories'].$get({ query: { since } });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        return json.data || [];
    },
    save: async (data: any) => {
        const res = await client.api['note-histories'].$put({ json: data });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
    },
};

export const reflectionsApi = {
    get: async (since?: string) => {
        const res = await client.api.reflections.$get({ query: { since } });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        return json.data || [];
    },
    save: async (data: any) => {
        const res = await client.api.reflections.$put({ json: data });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
    },
};

export const logsApi = {
    get: async (since?: string) => {
        const res = await client.api.logs.$get({ query: { since } });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        return json.data || [];
    },
    save: async (data: any) => {
        const res = await client.api.logs.$put({ json: data });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
    },
    delete: async (id: string) => {
        const res = await client.api.logs[':id'].$delete({ param: { id } });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
    },
};

export const habitsApi = {
    get: async (since?: string) => {
        const res = await client.api.habits.$get({ query: { since } });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        return json.data || [];
    },
    save: async (data: any[]) => {
        const res = await client.api.habits.$put({ json: data });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
    },
};

export const habitLogsApi = {
    get: async (since?: string) => {
        const res = await client.api['habit-logs'].$get({ query: { since } });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        return json.data || [];
    },
    save: async (data: any[]) => {
        const res = await client.api['habit-logs'].$put({ json: data });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
    },
};

export const personalNotesApi = {
    get: async () => {
        const res = await client.api['personal-notes'].$get();
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        return json.data;
    },
    save: async (data: any) => {
        const res = await client.api['personal-notes'].$put({ json: data });
        const json = await res.json();
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


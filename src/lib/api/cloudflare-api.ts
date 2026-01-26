// Cloudflare D1 API Client
// Used by CloudflareD1Provider to communicate with Hono backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

// Token storage
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

// API Request helper
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getStoredToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `API Error: ${response.status}`);
    }

    return data;
}

// Auth API
export const authApi = {
    async register(email: string, password: string) {
        const response = await apiRequest<{
            success: boolean;
            data: { user: { id: string; email: string }; token: string };
        }>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (response.success && response.data) {
            setStoredToken(response.data.token);
            setStoredUser(response.data.user);
        }

        return response;
    },

    async login(email: string, password: string) {
        const response = await apiRequest<{
            success: boolean;
            data: { user: { id: string; email: string }; token: string };
        }>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (response.success && response.data) {
            setStoredToken(response.data.token);
            setStoredUser(response.data.user);
        }

        return response;
    },

    async logout() {
        try {
            await apiRequest('/api/auth/logout', { method: 'POST' });
        } finally {
            clearStoredToken();
        }
    },

    async getCurrentUser() {
        const response = await apiRequest<{
            success: boolean;
            data: { user: { id: string; email: string } };
        }>('/api/auth/me');

        if (response.success && response.data) {
            setStoredUser(response.data.user);
        }

        return response;
    },

    isAuthenticated() {
        return !!getStoredToken();
    },
};

// Generic Data API
export const dataApi = {
    async get<T>(endpoint: string, since?: string): Promise<T[]> {
        const url = since ? `${endpoint}?since=${encodeURIComponent(since)}` : endpoint;
        const response = await apiRequest<{ success: boolean; data: T[] }>(url);
        return response.data || [];
    },

    async put<T>(endpoint: string, data: T | T[]): Promise<void> {
        await apiRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async delete(endpoint: string, id: string): Promise<void> {
        await apiRequest(`${endpoint}/${id}`, { method: 'DELETE' });
    },
};

// Specific API endpoints
export const prioritiesApi = {
    get: (since?: string) => dataApi.get('/api/priorities', since),
    save: (data: any[]) => dataApi.put('/api/priorities', data),
    delete: (id: string) => dataApi.delete('/api/priorities', id),
};

export const routinesApi = {
    get: (since?: string) => dataApi.get('/api/routines', since),
    save: (data: any[]) => dataApi.put('/api/routines', data),
    delete: (id: string) => dataApi.delete('/api/routines', id),
};

export const notesApi = {
    get: (since?: string) => dataApi.get('/api/notes', since),
    save: (data: any | any[]) => dataApi.put('/api/notes', data),
    saveSingle: (data: any) => dataApi.put('/api/notes/single', data),
    delete: (id: string) => dataApi.delete('/api/notes', id),
};

export const noteHistoriesApi = {
    get: (since?: string) => dataApi.get('/api/note-histories', since),
    save: (data: any) => dataApi.put('/api/note-histories', data),
};

export const reflectionsApi = {
    get: (since?: string) => dataApi.get('/api/reflections', since),
    save: (data: any) => dataApi.put('/api/reflections', data),
};

export const logsApi = {
    get: (since?: string) => dataApi.get('/api/logs', since),
    save: (data: any) => dataApi.put('/api/logs', data),
    delete: (id: string) => dataApi.delete('/api/logs', id),
};

export const habitsApi = {
    get: (since?: string) => dataApi.get('/api/habits', since),
    save: (data: any[]) => dataApi.put('/api/habits', data),
};

export const habitLogsApi = {
    get: (since?: string) => dataApi.get('/api/habit-logs', since),
    save: (data: any[]) => dataApi.put('/api/habit-logs', data),
};

export const personalNotesApi = {
    get: async () => {
        const response = await apiRequest<{ success: boolean; data: any }>('/api/personal-notes');
        return response.data;
    },
    save: (data: any) => dataApi.put('/api/personal-notes', data),
};

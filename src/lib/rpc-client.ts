import { hc } from 'hono/client';
// Relative import to the backend-api source to get the Type info.
// This assumes the file system structure allows reading outside src if configured, 
// or that backend-api is co-located.
import type { AppType } from '../../backend-api/src/index';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

// Create the typed client
// We can use this client throughout the application to make type-safe API calls
// Create the typed client with Auth header injection
export const client = hc<AppType>(API_BASE_URL, {
    fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const token = localStorage.getItem('cloudflare_auth_token');
        const headers = new Headers(init?.headers);

        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        return fetch(input, {
            ...init,
            headers,
        });
    }
});

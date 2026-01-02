import { config, saveConfig } from './config.js';
import { showAuth } from './ui.js';

const syncStatus = document.getElementById('sync-status');
let isRefreshing = false;

export async function supabaseAuthRequest(endpoint, method = 'POST', body = null) {
    const baseUrl = config.url.replace(/\/$/, '');
    const url = `${baseUrl}/auth/v1/${endpoint}`;
    const headers = { 'apikey': config.key, 'Content-Type': 'application/json' };
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(url, options);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error_description || error.message || 'Auth request gagal');
    }
    return await response.json();
}

async function refreshSession() {
    if (isRefreshing) return;
    if (!config.session || !config.session.refresh_token) {
        throw new Error('No refresh token available');
    }

    isRefreshing = true;
    try {
        const data = await supabaseAuthRequest('token?grant_type=refresh_token', 'POST', {
            refresh_token: config.session.refresh_token
        });

        config.session = {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            user: data.user
        };
        await saveConfig();
        console.log('Session refreshed successfully');
        return config.session;
    } catch (err) {
        console.error('Failed to refresh session:', err);
        config.session = null;
        await saveConfig();
        showAuth(true);
        throw err;
    } finally {
        isRefreshing = false;
    }
}

export async function supabaseRequest(table, method = 'GET', body = null, queryParams = '') {
    if (!config.url || !config.key) throw new Error('Konfigurasi .env diperlukan');
    const baseUrl = config.url.replace(/\/$/, '');

    let url = `${baseUrl}/rest/v1/${table}`;
    if (queryParams) {
        url += `?${queryParams}`;
    } else if (method === 'GET') {
        url += '?select=*';
    }

    const headers = {
        'apikey': config.key,
        'Authorization': `Bearer ${config.session?.access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };

    const options = { method, headers };
    if (body && (method === 'POST' || method === 'PATCH')) {
        options.body = JSON.stringify(body);
    }

    if (syncStatus) syncStatus.textContent = 'Menyinkronkan...';

    try {
        let response = await fetch(url, options);

        // Handle 401 Unauthorized (Token expired)
        if (response.status === 401 && config.session?.refresh_token) {
            console.log('Token expired, attempting refresh...');
            try {
                const newSession = await refreshSession();
                if (newSession) {
                    // Retry with new token
                    options.headers['Authorization'] = `Bearer ${newSession.access_token}`;
                    response = await fetch(url, options);
                }
            } catch (refreshErr) {
                // Refresh failed, show login
                showAuth(true);
                throw new Error('Sesi habis, silakan login kembali');
            }
        }

        if (response.status === 401) {
            config.session = null;
            await saveConfig();
            showAuth(true);
            throw new Error('Sesi tidak valid, silakan login kembali');
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Request gagal');
        }

        if (syncStatus) syncStatus.textContent = 'Tersinkronisasi';
        return await response.json();
    } catch (err) {
        // Only show "Mode Offline" if it's a network error, not an auth error
        if (err.message.includes('login kembali') || err.message.includes('auth')) {
            if (syncStatus) syncStatus.textContent = 'Sesi Berakhir';
        } else {
            if (syncStatus) syncStatus.textContent = 'Mode Offline';
        }
        throw err;
    }
}

export async function syncOfflineQueue() {
    if (config.queue.length === 0 || !navigator.onLine) return;

    const remainingQueue = [];
    for (const item of config.queue) {
        try {
            if (item.action === 'upsert') {
                await supabaseRequest(item.table, 'POST', item.data);
            } else if (item.action === 'update') {
                await supabaseRequest(item.table, 'PATCH', item.data, item.query);
            }
        } catch (err) {
            remainingQueue.push(item);
        }
    }
    config.queue = remainingQueue;
    await saveConfig();
}

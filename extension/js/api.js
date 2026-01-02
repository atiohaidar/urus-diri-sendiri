import { config, saveConfig } from './config.js';
import { showAuth } from './ui.js';

const syncStatus = document.getElementById('sync-status');

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
        'Authorization': `Bearer ${config.session.access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };

    const options = { method, headers };
    if (body && (method === 'POST' || method === 'PATCH')) {
        options.body = JSON.stringify(body);
    }

    if (syncStatus) syncStatus.textContent = 'Menyinkronkan...';
    try {
        const response = await fetch(url, options);
        if (response.status === 401) {
            config.session = null;
            await saveConfig();
            showAuth(true);
            throw new Error('Sesi habis, silakan login kembali');
        }
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Request gagal');
        }
        if (syncStatus) syncStatus.textContent = 'Tersinkronisasi';
        return await response.json();
    } catch (err) {
        if (syncStatus) syncStatus.textContent = 'Mode Offline';
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

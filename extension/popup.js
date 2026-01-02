// State management
let config = {
    url: '',
    key: '',
    session: null,
    cache: { priorities: [], routines: [] },
    queue: []
};

let loginEmail = '';

// DOM Elements
const tabs = document.querySelectorAll('.tab-btn');
const panes = document.querySelectorAll('.tab-pane');
const saveNoteBtn = document.getElementById('save-note-btn');
const syncStatus = document.getElementById('sync-status');
const authSection = document.getElementById('auth-section');
const tabContent = document.getElementById('tab-content');
const emailStep = document.getElementById('email-step');
const otpStep = document.getElementById('otp-step');
const authDesc = document.getElementById('auth-desc');
const sendOtpBtn = document.getElementById('send-otp-btn');
const verifyOtpBtn = document.getElementById('verify-otp-btn');
const backToEmail = document.getElementById('back-to-email');
const logoutBtn = document.getElementById('logout-btn');

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load from local storage first
    await loadConfig();

    // 2. Try to load from .env file (for automatic connection)
    await loadEnvConfig();

    setupEventListeners();

    if (!config.url || !config.key) {
        syncStatus.textContent = 'Konfigurasi .env diperlukan';
        return;
    }

    if (!config.session) {
        showAuth(true);
        syncStatus.textContent = 'Silakan login';
    } else {
        showAuth(false);
        showTab('routines');
        renderPriorities(config.cache.priorities);
        renderRoutines(config.cache.routines);
        fetchPriorities();
        fetchRoutines();
        syncOfflineQueue();
    }
});

async function loadEnvConfig() {
    try {
        const response = await fetch('.env');
        if (!response.ok) return;

        const text = await response.text();
        const lines = text.split('\n');
        let found = false;

        lines.forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (!key || valueParts.length === 0) return;

            const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');

            if (key.trim() === 'VITE_SUPABASE_URL') {
                config.url = value;
                found = true;
            }
            if (key.trim() === 'VITE_SUPABASE_ANON_KEY') {
                config.key = value;
                found = true;
            }
        });

        if (found) {
            console.log('Konfigurasi dimuat dari .env');
            await saveConfig();
        }
    } catch (err) {
        console.warn('Tidak dapat membaca .env (mungkin belum dibuat?)');
    }
}

function setupEventListeners() {
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            showTab(target);
            if (target === 'priorities') fetchPriorities();
            if (target === 'routines') fetchRoutines();
        });
    });

    sendOtpBtn.addEventListener('click', async () => {
        loginEmail = document.getElementById('login-email').value.trim();
        if (!loginEmail) {
            alert('Email harus diisi');
            return;
        }
        sendOtpBtn.disabled = true;
        sendOtpBtn.textContent = 'Mengirim...';
        try {
            await supabaseAuthRequest('otp', 'POST', {
                email: loginEmail,
                create_user: true
            });
            emailStep.classList.add('hidden');
            otpStep.classList.remove('hidden');
            authDesc.textContent = `Kode telah dikirim ke ${loginEmail}`;
        } catch (err) {
            console.error(err);
            alert('Gagal mengirim kode: ' + err.message);
        } finally {
            sendOtpBtn.disabled = false;
            sendOtpBtn.textContent = 'Kirim Kode';
        }
    });

    verifyOtpBtn.addEventListener('click', async () => {
        const otp = document.getElementById('login-otp').value.trim();
        if (!otp) {
            alert('Masukkan kode OTP');
            return;
        }
        verifyOtpBtn.disabled = true;
        verifyOtpBtn.textContent = 'Memverifikasi...';
        try {
            const data = await supabaseAuthRequest('verify', 'POST', {
                email: loginEmail,
                token: otp,
                type: 'magiclink'
            });
            config.session = {
                access_token: data.access_token,
                user: data.user
            };
            await saveConfig();
            showAuth(false);
            showTab('routines');
            fetchPriorities();
            fetchRoutines();
        } catch (err) {
            console.error(err);
            alert('Verifikasi gagal: ' + err.message);
        } finally {
            verifyOtpBtn.disabled = false;
            verifyOtpBtn.textContent = 'Verifikasi';
        }
    });

    backToEmail.addEventListener('click', () => {
        otpStep.classList.add('hidden');
        emailStep.classList.remove('hidden');
        authDesc.textContent = 'Masuk untuk sinkronisasi data Anda.';
    });

    logoutBtn.addEventListener('click', async () => {
        config.session = null;
        config.cache = { priorities: [], routines: [] };
        config.queue = [];
        await saveConfig();
        showAuth(true);
    });

    saveNoteBtn.addEventListener('click', async () => {
        const title = document.getElementById('note-title').value.trim();
        const content = document.getElementById('note-content').value.trim();
        if (!content) {
            alert('Konten catatan tidak boleh kosong');
            return;
        }

        const newNote = {
            id: crypto.randomUUID(),
            title: title || 'Catatan Extension',
            content: content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: config.session.user.id
        };

        saveNoteBtn.disabled = true;
        saveNoteBtn.textContent = 'Menyimpan...';

        try {
            await supabaseRequest('notes', 'POST', newNote);
            alert('Catatan disimpan!');
            document.getElementById('note-title').value = '';
            document.getElementById('note-content').value = '';
        } catch (err) {
            console.warn('Gagal sync, simpan ke antrean offline:', err.message);
            config.queue.push(newNote);
            await saveConfig();
            alert('Koneksi bermasalah. Catatan disimpan secara offline.');
            document.getElementById('note-title').value = '';
            document.getElementById('note-content').value = '';
        } finally {
            saveNoteBtn.disabled = false;
            saveNoteBtn.textContent = 'Simpan Catatan';
        }
    });
}

function showTab(tabId) {
    panes.forEach(p => p.classList.remove('active'));
    tabs.forEach(t => t.classList.remove('active'));
    authSection.classList.add('hidden');
    tabContent.classList.remove('hidden');
    const targetPane = document.getElementById(tabId);
    if (targetPane) targetPane.classList.add('active');
    const targetTab = Array.from(tabs).find(t => t.dataset.tab === tabId);
    if (targetTab) targetTab.classList.add('active');
}

function showAuth(visible) {
    if (visible) {
        authSection.classList.remove('hidden');
        tabContent.classList.add('hidden');
        logoutBtn.classList.add('hidden');
        emailStep.classList.remove('hidden');
        otpStep.classList.add('hidden');
    } else {
        authSection.classList.add('hidden');
        tabContent.classList.remove('hidden');
        if (config.session) logoutBtn.classList.remove('hidden');
    }
}

async function loadConfig() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['sb_url', 'sb_key', 'sb_session', 'sb_cache', 'sb_queue'], (result) => {
            config.url = result.sb_url || '';
            config.key = result.sb_key || '';
            config.session = result.sb_session || null;
            config.cache = result.sb_cache || { priorities: [], routines: [] };
            config.queue = result.sb_queue || [];
            resolve();
        });
    });
}

async function saveConfig() {
    return new Promise((resolve) => {
        chrome.storage.local.set({
            'sb_url': config.url,
            'sb_key': config.key,
            'sb_session': config.session,
            'sb_cache': config.cache,
            'sb_queue': config.queue
        }, resolve);
    });
}

async function supabaseAuthRequest(endpoint, method = 'POST', body = null) {
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

async function supabaseRequest(table, method = 'GET', body = null) {
    if (!config.url || !config.key) throw new Error('Konfigurasi .env diperlukan');
    const baseUrl = config.url.replace(/\/$/, '');
    const url = `${baseUrl}/rest/v1/${table}`;
    const headers = {
        'apikey': config.key,
        'Authorization': `Bearer ${config.session.access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    syncStatus.textContent = 'Menyinkronkan...';
    try {
        const response = await fetch(url + (method === 'GET' ? '?select=*' : ''), options);
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
        syncStatus.textContent = 'Tersinkronisasi';
        return await response.json();
    } catch (err) {
        syncStatus.textContent = 'Mode Offline';
        throw err;
    }
}

async function fetchPriorities() {
    if (!config.session) return;
    try {
        const data = await supabaseRequest('priorities');
        config.cache.priorities = data;
        await saveConfig();
        renderPriorities(data);
    } catch (err) {
        renderPriorities(config.cache.priorities);
    }
}

async function fetchRoutines() {
    if (!config.session) return;
    try {
        const data = await supabaseRequest('routines');
        config.cache.routines = data;
        await saveConfig();
        renderRoutines(data);
    } catch (err) {
        renderRoutines(config.cache.routines);
    }
}

function renderPriorities(data) {
    const list = document.getElementById('priorities-list');
    list.innerHTML = '';
    if (!data || data.length === 0) {
        list.innerHTML = '<p class="loading">Tidak ada prioritas.</p>';
        return;
    }
    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <input type="checkbox" ${item.completed ? 'checked' : ''} disabled>
            <div class="item-text">${item.text}</div>
        `;
        list.appendChild(card);
    });
}

function renderRoutines(data) {
    const list = document.getElementById('routines-list');
    list.innerHTML = '';
    if (!data || data.length === 0) {
        list.innerHTML = '<p class="loading">Tidak ada rutin.</p>';
        return;
    }
    const sorted = [...data].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    let activeIndex = -1;

    sorted.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'item-card';
        const isCurrent = item.start_time <= currentTime && (item.end_time ? currentTime < item.end_time : true);
        const isNext = activeIndex === -1 && item.start_time > currentTime;
        if (isCurrent) {
            card.classList.add('active-routine');
            activeIndex = index;
        } else if (isNext && activeIndex === -1) {
            card.id = 'next-routine';
            activeIndex = index;
        }
        card.innerHTML = `
            <div class="item-text">
                <strong>${item.start_time || '--:--'}</strong> ${item.activity}
                <span class="item-meta">${item.category || ''}</span>
            </div>
            ${item.completed_at ? '✅' : ''}
        `;
        list.appendChild(card);
    });

    setTimeout(() => {
        const activeElem = list.querySelector('.active-routine') || list.querySelector('#next-routine');
        if (activeElem) activeElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

async function syncOfflineQueue() {
    if (config.queue.length === 0 || !navigator.onLine) return;
    const remainingQueue = [];
    for (const note of config.queue) {
        try {
            await supabaseRequest('notes', 'POST', note);
        } catch (err) {
            remainingQueue.push(note);
        }
    }
    config.queue = remainingQueue;
    await saveConfig();
}

window.addEventListener('online', syncOfflineQueue);

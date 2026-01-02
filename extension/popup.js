import { config, loadConfig, saveConfig, loadEnvConfig } from './js/config.js';
import { supabaseAuthRequest, supabaseRequest, syncOfflineQueue } from './js/api.js';
import { showTab, showAuth, renderPriorities, renderRoutines } from './js/ui.js';

let loginEmail = '';

// DOM Elements
const tabs = document.querySelectorAll('.tab-btn');
const saveNoteBtn = document.getElementById('save-note-btn');
const syncStatus = document.getElementById('sync-status');
const emailStep = document.getElementById('email-step');
const otpStep = document.getElementById('otp-step');
const authDesc = document.getElementById('auth-desc');
const sendOtpBtn = document.getElementById('send-otp-btn');
const verifyOtpBtn = document.getElementById('verify-otp-btn');
const backToEmail = document.getElementById('back-to-email');
const logoutBtn = document.getElementById('logout-btn');

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    await loadEnvConfig();

    setupEventListeners();

    if (!config.url || !config.key) {
        if (syncStatus) syncStatus.textContent = 'Konfigurasi .env diperlukan';
        return;
    }

    if (!config.session) {
        showAuth(true);
        if (syncStatus) syncStatus.textContent = 'Silakan login';
    } else {
        showAuth(false);
        showTab('routines');
        // Render dari cache dulu (Instan!)
        renderPriorities(config.cache.priorities, handleTogglePriority);
        renderRoutines(config.cache.routines, handleToggleRoutine);

        // Fetch data terbaru HANYA SEKALI saat popup dibuka
        // Agar tidak boros API request setiap pindah tab
        fetchPriorities();
        fetchRoutines();

        syncOfflineQueue();
    }
});

function setupEventListeners() {
    // Tab switching (Hanya ganti view, tidak fetch API lagi agar hemat)
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            showTab(tab.dataset.tab);
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
            config.queue.push({ action: 'upsert', table: 'notes', data: newNote });
            await saveConfig();
            alert('Mode offline: Catatan disimpan lokal.');
            document.getElementById('note-title').value = '';
            document.getElementById('note-content').value = '';
        } finally {
            saveNoteBtn.disabled = false;
            saveNoteBtn.textContent = 'Simpan Catatan';
        }
    });
}

async function fetchPriorities() {
    if (!config.session) return;
    try {
        const today = new Date().toISOString().split('T')[0];
        const query = `scheduled_for=eq.${today}&select=*`;
        const data = await supabaseRequest('priorities', 'GET', null, query);
        config.cache.priorities = data;
        await saveConfig();
        renderPriorities(data, handleTogglePriority);
    } catch (err) {
        renderPriorities(config.cache.priorities, handleTogglePriority);
    }
}

async function fetchRoutines() {
    if (!config.session) return;
    try {
        const data = await supabaseRequest('routines');
        config.cache.routines = data;
        await saveConfig();
        renderRoutines(data, handleToggleRoutine);
    } catch (err) {
        renderRoutines(config.cache.routines, handleToggleRoutine);
    }
}

async function handleTogglePriority(id, completed) {
    const updateData = { completed, updated_at: new Date().toISOString() };
    const query = `id=eq.${id}`;

    // Update cache immediately for smooth UI
    const item = config.cache.priorities.find(p => p.id === id);
    if (item) item.completed = completed;
    renderPriorities(config.cache.priorities, handleTogglePriority);

    try {
        await supabaseRequest('priorities', 'PATCH', updateData, query);
        await saveConfig();
    } catch (err) {
        console.warn('Gagal sync checklist, masuk antrean offline.');
        config.queue.push({ action: 'update', table: 'priorities', data: updateData, query });
        await saveConfig();
    }
}

async function handleToggleRoutine(id, completed) {
    const now = new Date().toISOString();
    const completedAt = completed ? now : null;
    const updateData = { completed_at: completedAt, updated_at: now };
    const query = `id=eq.${id}`;

    // Update cache immediately
    const item = config.cache.routines.find(r => r.id === id);
    if (item) item.completed_at = completedAt;
    renderRoutines(config.cache.routines, handleToggleRoutine);

    try {
        await supabaseRequest('routines', 'PATCH', updateData, query);
        await saveConfig();
    } catch (err) {
        console.warn('Gagal sync rutin, masuk antrean offline.');
        config.queue.push({ action: 'update', table: 'routines', data: updateData, query });
        await saveConfig();
    }
}

window.addEventListener('online', syncOfflineQueue);

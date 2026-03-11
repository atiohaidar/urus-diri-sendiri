import { config, loadConfig, saveConfig } from './js/config.js';
import { showTab, renderPriorities, renderRoutines } from './js/ui.js';

// Initialization - offline mode only
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();

    setupEventListeners();

    // Render from local cache
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            showTab(tab.dataset.tab);
        });
    });

    showTab('routines');
    renderPriorities(config.cache.priorities || [], handleTogglePriority);
    renderRoutines(config.cache.routines || [], handleToggleRoutine);
});

function setupEventListeners() {
    const saveNoteBtn = document.getElementById('save-note-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (saveNoteBtn) {
        saveNoteBtn.addEventListener('click', async () => {
            const titleEl = document.getElementById('note-title');
            const contentEl = document.getElementById('note-content');
            const title = titleEl ? titleEl.value.trim() : '';
            const content = contentEl ? contentEl.value.trim() : '';
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
            };

            if (!config.cache.notes) config.cache.notes = [];
            config.cache.notes.push(newNote);
            await saveConfig();
            alert('Catatan disimpan!');
            if (titleEl) titleEl.value = '';
            if (contentEl) contentEl.value = '';
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            config.cache = { priorities: [], routines: [], notes: [] };
            await saveConfig();
            renderPriorities([], handleTogglePriority);
            renderRoutines([], handleToggleRoutine);
        });
    }
}

function handleTogglePriority(id, completed) {
    const item = (config.cache.priorities || []).find(p => p.id === id);
    if (item) item.completed = completed;
    renderPriorities(config.cache.priorities || [], handleTogglePriority);
    saveConfig();
}

function handleToggleRoutine(id, completed) {
    const now = new Date().toISOString();
    const item = (config.cache.routines || []).find(r => r.id === id);
    if (item) item.completed_at = completed ? now : null;
    renderRoutines(config.cache.routines || [], handleToggleRoutine);
    saveConfig();
}


import { config } from './config.js';

const tabs = document.querySelectorAll('.tab-btn');
const panes = document.querySelectorAll('.tab-pane');
const authSection = document.getElementById('auth-section');
const tabContent = document.getElementById('tab-content');
const logoutBtn = document.getElementById('logout-btn');
const emailStep = document.getElementById('email-step');
const otpStep = document.getElementById('otp-step');

export function showTab(tabId) {
    panes.forEach(p => p.classList.remove('active'));
    tabs.forEach(t => t.classList.remove('active'));
    authSection.classList.add('hidden');
    tabContent.classList.remove('hidden');
    const targetPane = document.getElementById(tabId);
    if (targetPane) targetPane.classList.add('active');
    const targetTab = Array.from(tabs).find(t => t.dataset.tab === tabId);
    if (targetTab) targetTab.classList.add('active');
}

export function showAuth(visible) {
    if (visible) {
        authSection.classList.remove('hidden');
        tabContent.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (emailStep) emailStep.classList.remove('hidden');
        if (otpStep) otpStep.classList.add('hidden');
    } else {
        authSection.classList.add('hidden');
        tabContent.classList.remove('hidden');
        if (config.session && logoutBtn) logoutBtn.classList.remove('hidden');
    }
}

export function renderPriorities(data, onToggle) {
    const list = document.getElementById('priorities-list');
    if (!list) return;
    list.innerHTML = '';
    if (!data || data.length === 0) {
        list.innerHTML = '<p class="loading">Tidak ada prioritas untuk hari ini.</p>';
        return;
    }
    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <input type="checkbox" class="toggle-priority" data-id="${item.id}" ${item.completed ? 'checked' : ''}>
            <div class="item-text ${item.completed ? 'completed-text' : ''}">${item.text}</div>
        `;
        list.appendChild(card);

        const checkbox = card.querySelector('.toggle-priority');
        checkbox.addEventListener('change', (e) => {
            if (onToggle) onToggle(item.id, e.target.checked);
        });
    });
}

export function renderRoutines(data, onToggle) {
    const list = document.getElementById('routines-list');
    if (!list) return;
    list.innerHTML = '';
    if (!data || data.length === 0) {
        list.innerHTML = '<p class="loading">Tidak ada rutin.</p>';
        return;
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const sorted = [...data].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    let activeIndex = -1;

    sorted.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'item-card';

        const isCompletedToday = item.completed_at && item.completed_at.startsWith(today);
        const isCurrent = item.start_time <= currentTime && (item.end_time ? currentTime < item.end_time : true);
        const isNext = activeIndex === -1 && item.start_time > currentTime;

        if (isCurrent) {
            card.classList.add('active-routine');
            activeIndex = index;
        } else if (isNext && activeIndex === -1) {
            card.id = 'next-routine';
            activeIndex = index;
        }

        const timeInfo = item.end_time
            ? `${item.start_time} - ${item.end_time}`
            : `${item.start_time}`;

        card.innerHTML = `
            <input type="checkbox" class="toggle-routine" data-id="${item.id}" ${isCompletedToday ? 'checked' : ''}>
            <div class="item-text ${isCompletedToday ? 'completed-text' : ''}">
                <span class="routine-time">${timeInfo}</span>
                <strong>${item.activity}</strong>
                <span class="item-meta">${item.category || ''}</span>
            </div>
        `;
        list.appendChild(card);

        const checkbox = card.querySelector('.toggle-routine');
        checkbox.addEventListener('change', (e) => {
            if (onToggle) onToggle(item.id, e.target.checked);
        });
    });

    setTimeout(() => {
        const activeElem = list.querySelector('.active-routine') || list.querySelector('#next-routine');
        if (activeElem) activeElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

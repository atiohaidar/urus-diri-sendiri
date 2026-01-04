export let config = {
    url: '',
    key: '',
    session: null,
    cache: { priorities: [], routines: [] },
    queue: []
};

export async function loadConfig() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['sb_url', 'sb_key', 'sb_session', 'sb_cache', 'sb_queue'], (result) => {
            config.url = result.sb_url || '';
            config.key = result.sb_key || '';
            config.session = result.sb_session || null;
            config.cache = result.sb_cache || { priorities: [], routines: [] };
            config.queue = result.sb_queue || [];
            resolve(config);
        });
    });
}

export async function saveConfig() {
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

export async function loadEnvConfig() {
    try {
        const response = await fetch('../.env');
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
            await saveConfig();
        }
    } catch (err) {
        console.warn('Tidak dapat membaca .env');
    }
}

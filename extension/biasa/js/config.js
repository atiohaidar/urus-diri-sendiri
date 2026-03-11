export let config = {
    cache: { priorities: [], routines: [], notes: [] },
};

export async function loadConfig() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['ext_cache'], (result) => {
            config.cache = result.ext_cache || { priorities: [], routines: [], notes: [] };
            resolve(config);
        });
    });
}

export async function saveConfig() {
    return new Promise((resolve) => {
        chrome.storage.local.set({
            'ext_cache': config.cache,
        }, resolve);
    });
}

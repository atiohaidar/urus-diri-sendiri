// Background Script for Notifications and Alarms (Manifest V3)

// Listen for alarm triggers
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name.startsWith('routine_')) {
        const routineName = alarm.name.split('routine_')[1];
        showNotification(routineName);
    }
});

function showNotification(routineName) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Waktunya Mulai!',
        message: `Sekarang waktunya: ${routineName}`,
        priority: 2
    });
}

// Function to reschedule all alarms based on stored routines
async function scheduleRoutineAlarms() {
    // Clear all existing alarms
    await chrome.alarms.clearAll();

    chrome.storage.local.get(['sb_cache'], (result) => {
        const cache = result.sb_cache;
        if (!cache || !cache.routines) return;

        const now = new Date();
        const today = now.toISOString().split('T')[0];

        cache.routines.forEach(routine => {
            if (!routine.start_time) return;

            // Create a date object for the next occurrence of this time
            const [hours, minutes] = routine.start_time.split(':');
            const scheduledTime = new Date();
            scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            // If time has already passed today, schedule for tomorrow
            if (scheduledTime <= now) {
                scheduledTime.setDate(scheduledTime.getDate() + 1);
            }

            chrome.alarms.create(`routine_${routine.activity}`, {
                when: scheduledTime.getTime()
            });

            console.log(`Alarm set for ${routine.activity} at ${scheduledTime.toLocaleString()}`);
        });
    });
}

// Reschedule when routines are updated
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.sb_cache) {
        scheduleRoutineAlarms();
    }
});

// Reschedule when browser starts/installs
chrome.runtime.onInstalled.addListener(scheduleRoutineAlarms);
chrome.runtime.onStartup.addListener(scheduleRoutineAlarms);

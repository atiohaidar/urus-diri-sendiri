import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

/**
 * Register notification action types with inline reply support
 * This enables users to reply directly from notification (including GT5 smartwatch!)
 */
export async function registerNotificationActions() {
    if (!Capacitor.isNativePlatform()) return;

    await LocalNotifications.registerActionTypes({
        types: [
            {
                id: 'TIMER_FINISHED',
                actions: [
                    {
                        id: 'reply',
                        title: 'Isi Realita',
                        input: true, // This enables RemoteInput for Android (GT5 support!)
                        inputButtonTitle: 'Kirim',
                        inputPlaceholder: 'Apa yang sebenarnya terjadi?'
                    },
                    {
                        id: 'open',
                        title: 'Buka App',
                        input: false
                    }
                ]
            },
            {
                id: 'TIMER_RUNNING',
                actions: [
                    {
                        id: 'stop_timer',
                        title: 'Selesai Sekarang',
                        foreground: true
                    }
                ]
            }
        ]
    });
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
        // For web, use browser notification API
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    }

    // For native platforms
    const permStatus = await LocalNotifications.checkPermissions();
    if (permStatus.display === 'granted') {
        return true;
    }

    const request = await LocalNotifications.requestPermissions();
    return request.display === 'granted';
}

/**
 * Show notification when timer finishes
 */
export async function showTimerFinishedNotification(intention: string, notificationId: number) {
    const hasPermission = await requestNotificationPermission();

    if (!hasPermission) {
        console.warn('Notification permission not granted');
        return;
    }

    if (!Capacitor.isNativePlatform()) {
        // Web notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('⏰ Timer Selesai!', {
                body: `Waktunya habis! Niat: ${intention}`,
                icon: '/icon.png',
                badge: '/icon.png',
                tag: 'timer-finished',
                requireInteraction: true, // Notification stays until user interacts
            });
        }
    } else {
        // Native notification with action support (GT5 Reply!)
        await LocalNotifications.schedule({
            notifications: [
                {
                    title: '⏰ Timer Selesai!',
                    body: `Waktunya habis! Niat: ${intention}`,
                    id: notificationId,
                    schedule: { at: new Date(Date.now() + 100) }, // Schedule immediately
                    sound: 'default', // Use system default sound
                    smallIcon: 'ic_stat_icon_config_sample',
                    iconColor: '#FF6B6B',
                    actionTypeId: 'TIMER_FINISHED', // Links to registered action type
                    // Store intention data so it can be accessed when notification is tapped
                    extra: {
                        type: 'timer_finished',
                        intention: intention,
                        timestamp: notificationId,
                        action: 'open_reality_input'
                    }
                },
            ],
        });
    }
}

/**
 * Play alarm sound
 */
export function playAlarmSound() {
    // Using Web Audio API to generate a beep tone
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Function to play a beep
    const playBeep = (frequency: number, duration: number, delay: number = 0) => {
        setTimeout(() => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        }, delay);
    };

    // Play an alarm pattern (3 beeps)
    playBeep(800, 0.2, 0);     // First beep
    playBeep(800, 0.2, 300);   // Second beep
    playBeep(800, 0.4, 600);   // Third beep (longer)
}

/**
 * Combined function: notification + sound + vibration
 */
export async function triggerTimerFinished(intention: string) {
    const notificationId = Date.now();

    // Show notification with inline reply support
    await showTimerFinishedNotification(intention, notificationId);

    // Play alarm sound
    playAlarmSound();

    // Trigger vibration (for devices that support it)
    if ('vibrate' in navigator) {
        // Strong vibration pattern
        navigator.vibrate([200, 100, 200, 100, 200, 100, 400]);
    }
}

let webTimerId: ReturnType<typeof setTimeout> | null = null;

/**
 * Schedule a notification for a future time
 * This ensures notification fires even if app is in background/screen off
 */
export async function scheduleTimerNotification(intention: string, targetDate: Date) {
    const notificationId = 12345; // Fixed ID for timer notification so we can cancel it easily

    if (webTimerId) {
        clearTimeout(webTimerId);
        webTimerId = null;
    }

    if (!Capacitor.isNativePlatform()) {
        // Ensure permission is granted for Web (must be called from user gesture)
        if ('Notification' in window && Notification.permission !== 'granted') {
            await Notification.requestPermission();
        }

        // Web doesn't really support "background" scheduling reliably without Service Worker
        // But we can set a timeout if the concept is just tab inactive
        const delay = targetDate.getTime() - Date.now();
        if (delay > 0) {
            webTimerId = setTimeout(() => {
                if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
                playAlarmSound(); // Play sound on Web!
                new Notification('⏰ Timer Selesai!', {
                    body: `Waktunya habis! Niat: ${intention}`,
                    tag: 'timer-finished',
                    icon: '/icon.png',
                    requireInteraction: true
                });
                webTimerId = null;
            }, delay);
        }
    } else {
        // Native Schedule
        await LocalNotifications.schedule({
            notifications: [
                {
                    title: '⏰ Timer Selesai!',
                    body: `Waktunya habis! Niat: ${intention}`,
                    id: notificationId,
                    schedule: { at: targetDate, allowWhileIdle: true }, // allowWhileIdle helps on Android Doze mode
                    sound: 'default',
                    smallIcon: 'ic_stat_icon_config_sample',
                    actionTypeId: 'TIMER_FINISHED',
                    extra: {
                        type: 'timer_finished',
                        intention: intention,
                        action: 'open_reality_input'
                    }
                },
            ],
        });
    }
}

/**
 * Cancel the pending timer notification
 * Used when user stops timer manually
 */
export async function cancelTimerNotification() {
    const notificationId = 12345;

    if (webTimerId) {
        clearTimeout(webTimerId);
        webTimerId = null;
    }

    if (Capacitor.isNativePlatform()) {
        await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
    }
}

const ONGOING_NOTIF_ID = 99999;
let webOngoingNotification: Notification | null = null;

/**
 * Show ongoing notification (sticky)
 */
export async function showOngoingNotification(intention: string, targetDate: Date) {
    const finishTime = targetDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    if (!Capacitor.isNativePlatform()) {
        if ('Notification' in window && Notification.permission === 'granted') {
            // Close existing if any
            if (webOngoingNotification) {
                webOngoingNotification.close();
            }
            webOngoingNotification = new Notification(`⏳ Sedang Fokus: ${intention}`, {
                body: `Target selesai: ${finishTime}`,
                icon: '/icon.png',
                tag: 'timer-running',
                silent: true
            });
        }
        return;
    }

    await LocalNotifications.schedule({
        notifications: [{
            id: ONGOING_NOTIF_ID,
            title: `⏳ Sedang Fokus: ${intention}`,
            body: `Target selesai: ${finishTime}`,
            ongoing: true, // Pinned notification
            autoCancel: false, // Don't disappear on click
            schedule: { at: new Date(Date.now() + 100) },
            smallIcon: 'ic_stat_icon_config_sample',
            actionTypeId: 'TIMER_RUNNING',
            extra: {
                type: 'timer_running',
                intention: intention
            }
        }]
    });
}

/**
 * Cancel ongoing notification
 */
export async function cancelOngoingNotification() {
    if (!Capacitor.isNativePlatform()) {
        if (webOngoingNotification) {
            webOngoingNotification.close();
            webOngoingNotification = null;
        }
        return;
    }

    try {
        await LocalNotifications.cancel({ notifications: [{ id: ONGOING_NOTIF_ID }] });
    } catch (e) {
        // Ignore if not found
    }
}


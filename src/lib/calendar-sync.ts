/**
 * Calendar Sync Utility
 * Sinkronisasi rutinitas dan prioritas hari ini ke native calendar
 * Dengan smart sync: update jika berubah, hapus jika di-delete
 */

import { Capacitor } from '@capacitor/core';
import { CapacitorCalendar, CalendarChooserDisplayStyle, CalendarPermissionScope } from '@ebarooni/capacitor-calendar';
import { getRoutines, getPriorities, saveRoutines, savePriorities } from './storage';
import { getTodayDateString } from './time-utils';
import type { RoutineItem, PriorityTask } from './types';

// Check if running on native platform
export const isNativePlatform = () => {
    return Capacitor.isNativePlatform();
};

// Request calendar permissions
export const requestCalendarPermission = async (): Promise<boolean> => {
    if (!isNativePlatform()) {
        console.warn('Calendar sync only available on native platforms');
        return false;
    }

    try {
        console.log('Requesting full calendar access...');
        const result = await CapacitorCalendar.requestFullCalendarAccess();
        console.log('Permission request result:', JSON.stringify(result));
        return result.result === 'granted';
    } catch (error) {
        console.error('Failed to request calendar permission:', error);
        return false;
    }
};

// Check calendar permissions
export const checkCalendarPermission = async (): Promise<boolean> => {
    if (!isNativePlatform()) {
        return false;
    }

    try {
        const result = await CapacitorCalendar.checkAllPermissions();
        console.log('Current permissions:', JSON.stringify(result));

        // Some versions might use different keys, but usually it's keyed by the scope
        const writeStatus = result.result[CalendarPermissionScope.WRITE_CALENDAR];
        const readStatus = result.result[CalendarPermissionScope.READ_CALENDAR];

        console.log(`Write permission: ${writeStatus}, Read permission: ${readStatus}`);

        return writeStatus === 'granted';
    } catch (error) {
        console.error('Failed to check calendar permission:', error);
        return false;
    }
};

// Helper: Convert time string "HH:mm" to Date object for today
const timeToDateToday = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
};

// Helper: Get end of day
const getEndOfDay = (): Date => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
};

// Helper: Get start of day
const getStartOfDay = (): Date => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
};

// Helper: Generate a hash to detect changes
const generateRoutineHash = (routine: RoutineItem): string => {
    return `${routine.activity}|${routine.startTime}|${routine.endTime}|${routine.category}|${routine.description || ''}`;
};

const generatePriorityHash = (priority: PriorityTask): string => {
    return `${priority.text}|${priority.completed}|${priority.scheduledFor || 'recurring'}`;
};

interface SyncResult {
    success: boolean;
    created: number;
    updated: number;
    deleted: number;
    errors: string[];
}

// Store last sync hashes to detect changes
const SYNC_HASH_KEY = 'calendar_sync_hashes';

interface SyncHashStore {
    routines: Record<string, string>; // id -> hash
    priorities: Record<string, string>;
    lastSyncDate: string;
    selectedCalendarId?: string;
    selectedCalendarName?: string;
}

const getSyncHashes = (): SyncHashStore => {
    try {
        const stored = localStorage.getItem(SYNC_HASH_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.error('Failed to load sync hashes:', e);
    }
    return { routines: {}, priorities: {}, lastSyncDate: '' };
};

const saveSyncHashes = (store: SyncHashStore) => {
    try {
        localStorage.setItem(SYNC_HASH_KEY, JSON.stringify(store));
    } catch (e) {
        console.error('Failed to save sync hashes:', e);
    }
};

/**
 * Get the currently selected calendar name
 */
export const getSelectedCalendar = (): { id?: string; name?: string } => {
    const store = getSyncHashes();
    return {
        id: store.selectedCalendarId,
        name: store.selectedCalendarName
    };
};

/**
 * Manually trigger calendar selection prompt
 */
export const selectCalendarManually = async (): Promise<boolean> => {
    if (!isNativePlatform()) return false;

    let hasPermission = await checkCalendarPermission();
    if (!hasPermission) {
        hasPermission = await requestCalendarPermission();
        if (!hasPermission) return false;
    }

    try {
        const calendars = await CapacitorCalendar.selectCalendarsWithPrompt({
            displayStyle: CalendarChooserDisplayStyle.ALL_CALENDARS
        });

        if (calendars.result && calendars.result.length > 0) {
            const store = getSyncHashes();
            store.selectedCalendarId = calendars.result[0].id;
            store.selectedCalendarName = calendars.result[0].title;
            saveSyncHashes(store);
            return true;
        }
    } catch (e) {
        console.error('Manual calendar selection failed:', e);
    }
    return false;
};

/**
 * Smart Sync - Creates, updates, or deletes calendar events
 * based on changes in the app
 */
export const smartSyncTodayToCalendar = async (): Promise<SyncResult> => {
    const result: SyncResult = {
        success: false,
        created: 0,
        updated: 0,
        deleted: 0,
        errors: []
    };

    if (!isNativePlatform()) {
        result.errors.push('Fitur ini hanya tersedia di aplikasi mobile');
        return result;
    }

    let hasPermission = await checkCalendarPermission();
    if (!hasPermission) {
        hasPermission = await requestCalendarPermission();
        if (!hasPermission) {
            result.errors.push('Izin akses calendar ditolak');
            return result;
        }
    }

    // Get stored sync data
    const syncStore = getSyncHashes();

    try {
        let selectedCalendarId = syncStore.selectedCalendarId;

        if (!selectedCalendarId) {
            console.log('No stored calendar ID, searching for calendars...');
            try {
                const calendarsList = await CapacitorCalendar.listCalendars();
                console.log('Available calendars:', JSON.stringify(calendarsList));

                if (calendarsList.result && calendarsList.result.length > 0) {
                    // Try to find a good default:
                    // 1. Not a birthday or holiday calendar
                    // 2. Contains "Calendar" or has an email-like title
                    const bestCalendar = calendarsList.result.find(c =>
                        !c.title.toLowerCase().includes('birthday') &&
                        !c.title.toLowerCase().includes('holiday') &&
                        (c.title.toLowerCase().includes('calendar') || c.title.includes('@'))
                    ) || calendarsList.result[0];

                    selectedCalendarId = bestCalendar.id;
                    syncStore.selectedCalendarName = bestCalendar.title;
                    console.log('Auto-selected calendar:', bestCalendar.title, selectedCalendarId);
                }
            } catch (listErr) {
                console.warn('Failed to list calendars silently:', listErr);
            }
        }

        // If still no calendar, or if we want to confirm, use prompt
        if (!selectedCalendarId) {
            console.log('Starting calendar selection prompt...');
            const calendars = await CapacitorCalendar.selectCalendarsWithPrompt({
                displayStyle: CalendarChooserDisplayStyle.ALL_CALENDARS
            });

            console.log('Calendar selection result:', JSON.stringify(calendars));

            if (!calendars.result || calendars.result.length === 0) {
                result.errors.push('Tidak ada calendar yang dipilih atau dibatalkan');
                return result;
            }

            selectedCalendarId = calendars.result[0].id;
            syncStore.selectedCalendarName = calendars.result[0].title;
        }

        // Save selected calendar for future use
        syncStore.selectedCalendarId = selectedCalendarId;
        console.log('Syncing with calendar ID:', selectedCalendarId);

        // Get data
        const routines = getRoutines();
        const allPriorities = getPriorities();
        const todayStr = getTodayDateString();

        // Filter priorities for today
        const priorities = allPriorities.filter(p => {
            if (!p.scheduledFor) return true;
            return p.scheduledFor === todayStr;
        });

        const isNewDay = syncStore.lastSyncDate !== todayStr;

        // If new day, clear old calendar event IDs (they're from yesterday)
        if (isNewDay) {
            syncStore.routines = {};
            syncStore.priorities = {};
        }

        // ======== SYNC ROUTINES ========
        const currentRoutineIds = new Set(routines.map(r => r.id));
        const updatedRoutines = [...routines];

        for (let i = 0; i < routines.length; i++) {
            const routine = routines[i];
            const currentHash = generateRoutineHash(routine);
            const storedHash = syncStore.routines[routine.id];

            try {
                const startDate = timeToDateToday(routine.startTime);
                const endDate = timeToDateToday(routine.endTime);
                if (endDate <= startDate) endDate.setDate(endDate.getDate() + 1);

                // Case 1: Already synced, check for changes
                if (routine.calendarEventId && storedHash) {
                    if (currentHash !== storedHash) {
                        // Changed - update event
                        await CapacitorCalendar.modifyEvent({
                            id: routine.calendarEventId,
                            title: `📋 ${routine.activity}`,
                            startDate: startDate.getTime(),
                            endDate: endDate.getTime(),
                            description: routine.description || `Kategori: ${routine.category}`,
                            isAllDay: false
                        });
                        syncStore.routines[routine.id] = currentHash;
                        result.updated++;
                    }
                    // No change - skip
                } else {
                    // Case 2: New - create event
                    const eventResult = await CapacitorCalendar.createEvent({
                        title: `📋 ${routine.activity}`,
                        calendarId: selectedCalendarId,
                        startDate: startDate.getTime(),
                        endDate: endDate.getTime(),
                        description: routine.description || `Kategori: ${routine.category}`,
                        isAllDay: false
                    });

                    // Store the calendar event ID
                    if (eventResult.id) {
                        updatedRoutines[i] = {
                            ...routine,
                            calendarEventId: eventResult.id
                        };
                        syncStore.routines[routine.id] = currentHash;
                        result.created++;
                    }
                }
            } catch (err) {
                console.error('Failed to sync routine:', routine.activity, err);
                result.errors.push(`Gagal: ${routine.activity}`);
            }
        }

        // Delete routines that were removed from app
        for (const [routineId, hash] of Object.entries(syncStore.routines)) {
            if (!currentRoutineIds.has(routineId)) {
                // Find the calendar event ID from previous sync
                const oldRoutine = routines.find(r => r.id === routineId);
                if (oldRoutine?.calendarEventId) {
                    try {
                        await CapacitorCalendar.deleteEvent({
                            id: oldRoutine.calendarEventId
                        });
                        result.deleted++;
                    } catch (err) {
                        console.error('Failed to delete routine event:', err);
                    }
                }
                delete syncStore.routines[routineId];
            }
        }

        // ======== SYNC PRIORITIES ========
        const currentPriorityIds = new Set(priorities.map(p => p.id));
        const updatedPriorities = [...allPriorities];

        for (let i = 0; i < allPriorities.length; i++) {
            const priority = allPriorities[i];

            // Skip if not in today's list
            if (!priorities.find(p => p.id === priority.id)) continue;

            const currentHash = generatePriorityHash(priority);
            const storedHash = syncStore.priorities[priority.id];

            try {
                const startOfDay = getStartOfDay();
                const endOfDay = getEndOfDay();
                const statusEmoji = priority.completed ? '✅' : '⭐';

                if (priority.calendarEventId && storedHash) {
                    if (currentHash !== storedHash) {
                        // Changed - update
                        await CapacitorCalendar.modifyEvent({
                            id: priority.calendarEventId,
                            title: `${statusEmoji} ${priority.text}`,
                            startDate: startOfDay.getTime(),
                            endDate: endOfDay.getTime(),
                            description: priority.completionNote || 'Prioritas hari ini',
                            isAllDay: true
                        });
                        syncStore.priorities[priority.id] = currentHash;
                        result.updated++;
                    }
                } else {
                    // New - create
                    const eventResult = await CapacitorCalendar.createEvent({
                        title: `${statusEmoji} ${priority.text}`,
                        calendarId: selectedCalendarId,
                        startDate: startOfDay.getTime(),
                        endDate: endOfDay.getTime(),
                        description: priority.completionNote || 'Prioritas hari ini',
                        isAllDay: true
                    });

                    if (eventResult.id) {
                        updatedPriorities[i] = {
                            ...priority,
                            calendarEventId: eventResult.id
                        };
                        syncStore.priorities[priority.id] = currentHash;
                        result.created++;
                    }
                }
            } catch (err) {
                console.error('Failed to sync priority:', priority.text, err);
                result.errors.push(`Gagal: ${priority.text}`);
            }
        }

        // Delete priorities that were removed
        for (const priorityId of Object.keys(syncStore.priorities)) {
            if (!currentPriorityIds.has(priorityId)) {
                const oldPriority = allPriorities.find(p => p.id === priorityId);
                if (oldPriority?.calendarEventId) {
                    try {
                        await CapacitorCalendar.deleteEvent({
                            id: oldPriority.calendarEventId
                        });
                        result.deleted++;
                    } catch (err) {
                        console.error('Failed to delete priority event:', err);
                    }
                }
                delete syncStore.priorities[priorityId];
            }
        }

        // Save updated data with calendar event IDs
        saveRoutines(updatedRoutines);
        savePriorities(updatedPriorities);

        // Save sync state
        syncStore.lastSyncDate = todayStr;
        saveSyncHashes(syncStore);

        result.success = result.errors.length === 0;
        console.log('Sync completed. Success:', result.success, 'Created:', result.created, 'Errors:', result.errors.length);
        return result;

    } catch (error) {
        console.error('Smart sync failed with exception:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push(`Sinkronisasi gagal: ${errorMessage}`);
        return result;
    }
};

/**
 * Quick sync - creates events directly without smart checking
 * Use this for first-time sync or force refresh
 */
export const quickSyncTodayToCalendar = async (): Promise<SyncResult> => {
    // Just call smart sync - it handles both cases
    return smartSyncTodayToCalendar();
};

/**
 * Delete all synced events for today
 */
export const clearTodayCalendarEvents = async (): Promise<{ success: boolean; deleted: number }> => {
    const result = { success: false, deleted: 0 };

    if (!isNativePlatform()) return result;

    const hasPermission = await checkCalendarPermission();
    if (!hasPermission) return result;

    try {
        const routines = getRoutines();
        const priorities = getPriorities();
        const syncStore = getSyncHashes();

        // Delete routine events
        for (const routine of routines) {
            if (routine.calendarEventId) {
                try {
                    await CapacitorCalendar.deleteEvent({ id: routine.calendarEventId });
                    result.deleted++;
                } catch (e) {
                    console.error('Failed to delete routine event:', e);
                }
            }
        }

        // Delete priority events
        for (const priority of priorities) {
            if (priority.calendarEventId) {
                try {
                    await CapacitorCalendar.deleteEvent({ id: priority.calendarEventId });
                    result.deleted++;
                } catch (e) {
                    console.error('Failed to delete priority event:', e);
                }
            }
        }

        // Clear sync store
        syncStore.routines = {};
        syncStore.priorities = {};
        saveSyncHashes(syncStore);

        // Clear calendar event IDs from items
        const updatedRoutines = routines.map(r => ({ ...r, calendarEventId: undefined }));
        const updatedPriorities = priorities.map(p => ({ ...p, calendarEventId: undefined }));
        saveRoutines(updatedRoutines);
        savePriorities(updatedPriorities);

        result.success = true;
        return result;
    } catch (error) {
        console.error('Failed to clear calendar events:', error);
        return result;
    }
};

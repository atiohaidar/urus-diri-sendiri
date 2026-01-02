import { IStorageProvider } from '../storage-interface';
import { PriorityTask, Reflection, Note, RoutineItem, ActivityLog } from '../types';
import { supabase } from '../supabase';
import { getImage, deleteImage } from '../idb';
import { STORAGE_KEYS } from '../constants';
import { LocalStorageProvider } from './local-storage-provider';

type QueueItem =
    | { type: 'priorities'; data: PriorityTask[] }
    | { type: 'reflection'; data: Reflection }
    | { type: 'notes'; data: Note[] }
    | { type: 'routines'; data: RoutineItem[] }
    | { type: 'log'; data: ActivityLog }
    | { type: 'delete_log'; data: string };

export class SupabaseProvider implements IStorageProvider {

    private userIdPromise: Promise<string> | null = null;
    private queueKey = STORAGE_KEYS.OFFLINE_QUEUE;
    private localProvider = new LocalStorageProvider();

    constructor() {
        // Auto-process queue when coming back online
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                console.log("Network back online. Processing sync queue...");
                this.processSyncQueue();
            });

            // Try processing on init too, in case we just reloaded and are online
            this.processSyncQueue();
        }
    }

    // --- Offline Queue Logic ---

    private getQueue(): QueueItem[] {
        const raw = localStorage.getItem(this.queueKey);
        return raw ? JSON.parse(raw) : [];
    }

    private saveQueue(queue: QueueItem[]) {
        localStorage.setItem(this.queueKey, JSON.stringify(queue));
    }

    private addToQueue(item: QueueItem) {
        const queue = this.getQueue();
        queue.push(item);
        this.saveQueue(queue);
        console.log(`🔌 Offline: Action queued (${item.type}). Will sync when online.`);
    }

    private async processSyncQueue() {
        if (!navigator.onLine) return;

        const queue = this.getQueue();
        if (queue.length === 0) return;

        console.log(`🔄 Syncing ${queue.length} offline actions...`);

        const remainingQueue: QueueItem[] = [];

        for (const item of queue) {
            try {
                switch (item.type) {
                    case 'priorities': await this._savePriorities(item.data); break;
                    case 'reflection': await this._saveReflection(item.data); break;
                    case 'notes': await this._saveNotes(item.data); break;
                    case 'routines': await this._saveRoutines(item.data); break;
                    case 'log': await this._saveLog(item.data); break;
                    case 'delete_log': await this._deleteLog(item.data); break;
                }
            } catch (err) {
                console.error(`Failed to process queue item (${item.type}) during sync:`, err);
                // Keep in queue if it seems like a retryable error?
                // For simplicity, we keep it in queue to retry later.
                // Assuming generic error could be transient.
                remainingQueue.push(item);
            }
        }

        this.saveQueue(remainingQueue);
        if (remainingQueue.length === 0) {
            console.log("✅ Offline queue synced successfully!");
        } else {
            console.warn(`⚠️ ${remainingQueue.length} items failed to sync. check console.`);
        }
    }

    private isOnline() {
        return typeof navigator !== 'undefined' ? navigator.onLine : true;
    }

    private async executeOrQueue(item: QueueItem, fn: () => Promise<void>) {
        if (!this.isOnline()) {
            this.addToQueue(item);
            return;
        }

        try {
            await fn();
        } catch (err: any) {
            console.error(`Operation failed (will queue):`, err);
            // If error is network related, queue it.
            // Detecting exact network error is hard, but usually safe to queue.
            this.addToQueue(item);
        }
    }

    // --- Helper for User ID ---
    private async getUserId(): Promise<string> {
        if (this.userIdPromise) return this.userIdPromise;

        this.userIdPromise = (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) return session.user.id;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.warn("No authenticated user found for Supabase storage operation.");
                return 'guest';
            }
            return user.id;
        })();

        return this.userIdPromise;
    }

    // --- Priorities ---
    async getPriorities(since?: string): Promise<PriorityTask[]> {
        if (!this.isOnline()) return this.localProvider.getPriorities(since);
        // We still need userId for inserts, but for selects RLS handles it.
        // However, we still fetch userId to ensure we are authenticated before firing request?
        // Actually getUserId() checks auth status.
        await this.getUserId();

        let query = supabase
            .from('priorities')
            .select('*');

        if (since) {
            query = query.gt('updated_at', since);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching priorities:', error);
            return this.localProvider.getPriorities(since);
        }

        const priorities = (data || []).map((row: any) => ({
            id: row.id,
            text: row.text,
            completed: row.completed,
            completionNote: row.completion_note,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at
        }));

        // Update local cache with fetched results
        // For incremental sync, we should ideally merge.
        // However, SupabaseProvider.getPriorities(undefined) returns full set.
        if (!since) {
            await this.localProvider.savePriorities(priorities);
        } else if (priorities.length > 0) {
            // For incremental, we fetch current local, merge, and save.
            const current = await this.localProvider.getPriorities();
            const mergedMap = new Map(current.map(p => [p.id, p]));
            priorities.forEach(p => mergedMap.set(p.id, p));
            await this.localProvider.savePriorities(Array.from(mergedMap.values()));
        }

        return priorities;
    }

    async savePriorities(priorities: PriorityTask[]): Promise<void> {
        await this.localProvider.savePriorities(priorities);
        await this.executeOrQueue(
            { type: 'priorities', data: priorities },
            () => this._savePriorities(priorities)
        );
    }

    private async _savePriorities(priorities: PriorityTask[]) {
        const userId = await this.getUserId();
        const activeIds = priorities.map(p => p.id);

        // 1. Upsert Active Items
        const rows = priorities.map(p => ({
            id: p.id,
            text: p.text,
            completed: p.completed,
            completion_note: p.completionNote || null,
            updated_at: p.updatedAt,
            deleted_at: p.deletedAt || null, // Ensure explicit null to un-delete if needed
            user_id: userId
        }));

        if (rows.length > 0) {
            const { error } = await supabase.from('priorities').upsert(rows);
            if (error) throw error;
        }

        // 2. Soft Delete Missing Items (Items in DB but not in our active list)
        // We only mark as deleted if they are not already deleted
        if (activeIds.length > 0) {
            const { error: delError } = await supabase
                .from('priorities')
                .update({ deleted_at: new Date().toISOString() })
                .not('id', 'in', `(${activeIds.join(',')})`)
                .is('deleted_at', null);
            if (delError) console.error("Error soft-syncing priorities:", delError);
        } else {
            // If local list is empty, soft delete ALL currently active items
            const { error: delError } = await supabase
                .from('priorities')
                .update({ deleted_at: new Date().toISOString() })
                .is('deleted_at', null);
            if (delError) console.error("Error soft-clearing priorities:", delError);
        }
    }

    // --- Reflections ---
    async getReflections(since?: string): Promise<Reflection[]> {
        if (!this.isOnline()) return this.localProvider.getReflections(since);
        await this.getUserId();

        let query = supabase
            .from('reflections')
            .select('*')
            .order('date', { ascending: false });

        if (since) {
            query = query.gt('updated_at', since);
        }

        const { data, error } = await query;
        // ...
        if (error) {
            console.error('Error fetching reflections:', error);
            return this.localProvider.getReflections(since);
        }

        const reflections = (data || []).map((row: any) => ({
            id: row.id,
            date: row.date,
            winOfDay: row.win_of_day,
            hurdle: row.hurdle,
            priorities: row.priorities || [],
            smallChange: row.small_change,
            todayRoutines: row.today_routines,
            todayPriorities: row.today_priorities,
            images: row.images || [],
            imageIds: [],
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at
        }));

        // Update local cache
        if (!since) {
            // Full refresh: ideally we should clear local reflections and put these,
            // but for safety with images, we just upsert.
            for (const r of reflections) {
                await this.localProvider.saveReflection(r);
            }
        } else if (reflections.length > 0) {
            for (const r of reflections) {
                await this.localProvider.saveReflection(r);
            }
        }

        return reflections;
    }

    async saveReflection(reflection: Reflection): Promise<void> {
        await this.localProvider.saveReflection(reflection);
        await this.executeOrQueue(
            { type: 'reflection', data: reflection },
            () => this._saveReflection(reflection)
        );
    }

    private async _saveReflection(reflection: Reflection) {
        const userId = await this.getUserId();
        let finalImageUrls = reflection.images || [];

        // Upload images if they exist in IDB
        if (reflection.imageIds && reflection.imageIds.length > 0) {
            for (const id of reflection.imageIds) {
                const blobBase64 = await getImage(id);
                if (blobBase64) {
                    const res = await fetch(blobBase64);
                    const blob = await res.blob();
                    const fileName = `${userId}/${Date.now()}-${id}.jpg`;

                    const { data, error } = await supabase.storage
                        .from('images')
                        .upload(fileName, blob);

                    if (!error && data) {
                        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
                        finalImageUrls.push(publicUrl);
                        await deleteImage(id);
                    } else if (error) {
                        throw error;
                    }
                }
            }
        }

        const row = {
            id: reflection.id,
            date: reflection.date,
            win_of_day: reflection.winOfDay,
            hurdle: reflection.hurdle,
            priorities: reflection.priorities,
            small_change: reflection.smallChange,
            today_routines: reflection.todayRoutines,
            today_priorities: reflection.todayPriorities,
            images: finalImageUrls,
            updated_at: reflection.updatedAt || new Date().toISOString(),
            deleted_at: reflection.deletedAt || null,
            user_id: userId
        };

        const { error } = await supabase.from('reflections').upsert(row);
        if (error) throw error;
    }

    // --- Notes ---
    async getNotes(since?: string): Promise<Note[]> {
        if (!this.isOnline()) return this.localProvider.getNotes(since);
        await this.getUserId();

        let query = supabase
            .from('notes')
            .select('*')
            .order('updated_at', { ascending: false });

        if (since) {
            query = query.gt('updated_at', since);
        }

        const { data, error } = await query;
        if (error) return this.localProvider.getNotes(since);

        const notes = data.map((r: any) => ({
            id: r.id,
            title: r.title,
            content: r.content,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            deletedAt: r.deleted_at
        }));

        if (!since) {
            await this.localProvider.saveNotes(notes);
        } else if (notes.length > 0) {
            const current = await this.localProvider.getNotes();
            const mergedMap = new Map(current.map(n => [n.id, n]));
            notes.forEach(n => mergedMap.set(n.id, n));
            await this.localProvider.saveNotes(Array.from(mergedMap.values()));
        }

        return notes;
    }

    async saveNotes(notes: Note[]): Promise<void> {
        await this.localProvider.saveNotes(notes);
        await this.executeOrQueue(
            { type: 'notes', data: notes },
            () => this._saveNotes(notes)
        );
    }

    private async _saveNotes(notes: Note[]) {
        const userId = await this.getUserId();
        const activeIds = notes.map(n => n.id);

        const rows = notes.map(n => ({
            id: n.id,
            title: n.title,
            content: n.content,
            created_at: n.createdAt,
            updated_at: n.updatedAt,
            deleted_at: n.deletedAt || null,
            user_id: userId
        }));

        if (rows.length > 0) {
            const { error } = await supabase.from('notes').upsert(rows);
            if (error) throw error;
        }

        // Soft Delete Missing Items
        if (activeIds.length > 0) {
            const { error: delError } = await supabase
                .from('notes')
                .update({ deleted_at: new Date().toISOString() })
                .not('id', 'in', `(${activeIds.join(',')})`)
                .is('deleted_at', null);

            if (delError) console.error("Error soft-syncing notes:", delError);
        } else {
            const { error: delError } = await supabase
                .from('notes')
                .update({ deleted_at: new Date().toISOString() })
                .is('deleted_at', null);
            if (delError) console.error("Error soft-clearing notes:", delError);
        }
    }

    // --- Routines ---
    async getRoutines(since?: string): Promise<RoutineItem[]> {
        if (!this.isOnline()) return this.localProvider.getRoutines(since);
        await this.getUserId();

        let query = supabase.from('routines').select('*');

        if (since) {
            query = query.gt('updated_at', since);
        }

        const { data } = await query;

        const routines = (data || []).map((r: any) => ({
            id: r.id,
            startTime: r.start_time,
            endTime: r.end_time,
            activity: r.activity,
            category: r.category,
            completedAt: r.completed_at,
            updatedAt: r.updated_at,
            description: r.description,
            completionNote: r.completion_note,
            deletedAt: r.deleted_at
        }));

        if (!since) {
            await this.localProvider.saveRoutines(routines);
        } else if (routines.length > 0) {
            const current = await this.localProvider.getRoutines();
            const mergedMap = new Map(current.map(r => [r.id, r]));
            routines.forEach(r => mergedMap.set(r.id, r));
            await this.localProvider.saveRoutines(Array.from(mergedMap.values()));
        }

        return routines;
    }

    async saveRoutines(routines: RoutineItem[]): Promise<void> {
        await this.localProvider.saveRoutines(routines);
        await this.executeOrQueue(
            { type: 'routines', data: routines },
            () => this._saveRoutines(routines)
        );
    }

    private async _saveRoutines(routines: RoutineItem[]) {
        const userId = await this.getUserId();
        const activeIds = routines.map(r => r.id);

        const rows = routines.map(r => ({
            id: r.id,
            start_time: r.startTime,
            end_time: r.endTime,
            activity: r.activity,
            category: r.category,
            completed_at: r.completedAt,
            updated_at: r.updatedAt,
            description: r.description,
            completion_note: r.completionNote || null,
            deleted_at: r.deletedAt || null,
            user_id: userId
        }));

        if (rows.length > 0) {
            const { error } = await supabase.from('routines').upsert(rows);
            if (error) throw error;
        }

        // Soft Delete Missing Items
        if (activeIds.length > 0) {
            const { error: delError } = await supabase
                .from('routines')
                .update({ deleted_at: new Date().toISOString() })
                .not('id', 'in', `(${activeIds.join(',')})`)
                .is('deleted_at', null);
            if (delError) console.error("Error soft-syncing routines:", delError);
        } else {
            const { error: delError } = await supabase
                .from('routines')
                .update({ deleted_at: new Date().toISOString() })
                .is('deleted_at', null);
            if (delError) console.error("Error soft-clearing routines:", delError);
        }
    }

    // --- Logs ---
    async getLogs(since?: string): Promise<ActivityLog[]> {
        if (!this.isOnline()) return this.localProvider.getLogs(since);
        await this.getUserId();

        let query = supabase
            .from('logs')
            .select('*')
            .order('timestamp', { ascending: false });

        if (since) {
            query = query.gt('updated_at', since);
        }

        const { data } = await query;

        const logs = (data || []).map((r: any) => ({
            id: r.id,
            timestamp: r.timestamp,
            type: r.type,
            content: r.content,
            mediaId: r.media_url,
            category: r.category,
            updatedAt: r.updated_at,
            deletedAt: r.deleted_at
        }));

        if (!since) {
            // Similar to reflections, we upsert to avoid wiping IDB logs we might want to keep?
            // But usually full set is the truth.
            for (const l of logs) {
                await this.localProvider.saveLog(l);
            }
        } else if (logs.length > 0) {
            for (const l of logs) {
                await this.localProvider.saveLog(l);
            }
        }

        return logs;
    }

    async saveLog(log: ActivityLog): Promise<void> {
        await this.localProvider.saveLog(log);
        await this.executeOrQueue(
            { type: 'log', data: log },
            () => this._saveLog(log)
        );
    }

    private async _saveLog(log: ActivityLog) {
        const userId = await this.getUserId();
        let contentOrUrl = log.mediaId;

        // Image handling for logs
        if (log.type === 'photo' && log.mediaId && !log.mediaId.startsWith('http')) {
            const blobBase64 = await getImage(log.mediaId);
            if (blobBase64) {
                const res = await fetch(blobBase64);
                const blob = await res.blob();
                const fileName = `${userId}/logs-${Date.now()}.jpg`;
                const { data, error } = await supabase.storage.from('images').upload(fileName, blob);
                if (error) throw error;

                if (data) {
                    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
                    contentOrUrl = publicUrl;
                    await deleteImage(log.mediaId);
                }
            }
        }

        const row = {
            id: log.id,
            timestamp: log.timestamp,
            type: log.type,
            content: log.content,
            media_url: contentOrUrl,
            category: log.category,
            updated_at: log.updatedAt || new Date().toISOString(),
            deleted_at: log.deletedAt || null,
            user_id: userId
        };

        const { error } = await supabase.from('logs').upsert(row);
        if (error) throw error;
    }

    async deleteLog(id: string): Promise<void> {
        await this.localProvider.deleteLog(id);
        await this.executeOrQueue(
            { type: 'delete_log', data: id },
            () => this._deleteLog(id)
        );
    }

    private async _deleteLog(id: string) {
        // Soft delete: just update deleted_at
        // RLS will handle user_id check
        const { error } = await supabase
            .from('logs')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
    }

    // --- Config / Utils ---
    async clearAll(): Promise<void> {
        // Safe implementation or empty
    }
}


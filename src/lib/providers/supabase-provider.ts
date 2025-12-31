import { IStorageProvider } from '../storage-interface';
import { PriorityTask, Reflection, Note, RoutineItem, ActivityLog } from '../types';
import { supabase } from '../supabase';
import { getImage, deleteImage } from '../idb';
import { STORAGE_KEYS } from '../constants';

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
    async getPriorities(): Promise<PriorityTask[]> {
        if (!this.isOnline()) return []; // Can't fetch if offline
        const userId = await this.getUserId();
        const { data, error } = await supabase
            .from('priorities')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching priorities:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id,
            text: row.text,
            completed: row.completed,
            updatedAt: row.updated_at
        }));
    }

    async savePriorities(priorities: PriorityTask[]): Promise<void> {
        await this.executeOrQueue(
            { type: 'priorities', data: priorities },
            () => this._savePriorities(priorities)
        );
    }

    private async _savePriorities(priorities: PriorityTask[]) {
        const userId = await this.getUserId();
        const rows = priorities.map(p => ({
            id: p.id,
            text: p.text,
            completed: p.completed,
            updated_at: p.updatedAt,
            user_id: userId
        }));

        const { error } = await supabase.from('priorities').upsert(rows);
        if (error) throw error;

        // Cleanup deleted items logic (this one is tricky in queue due to race conditions,
        // but generally acceptable for personal app)
        const newIds = priorities.map(p => p.id);
        if (newIds.length > 0) {
            await supabase.from('priorities').delete().eq('user_id', userId).not('id', 'in', `(${newIds.join(',')})`);
        } else {
            await supabase.from('priorities').delete().eq('user_id', userId);
        }
    }

    // --- Reflections ---
    async getReflections(): Promise<Reflection[]> {
        if (!this.isOnline()) return [];
        const userId = await this.getUserId();
        const { data, error } = await supabase
            .from('reflections')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching reflections:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id,
            date: row.date,
            winOfDay: row.win_of_day,
            hurdle: row.hurdle,
            priorities: row.priorities || [],
            smallChange: row.small_change,
            todayRoutines: row.today_routines,
            todayPriorities: row.today_priorities,
            images: row.images || [],
            imageIds: []
        }));
    }

    async saveReflection(reflection: Reflection): Promise<void> {
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
                        await deleteImage(id); // Only delete from local IDB after successful upload
                    } else if (error) {
                        throw error; // Propagate error so we retry later
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
            user_id: userId
        };

        const { error } = await supabase.from('reflections').upsert(row);
        if (error) throw error;
    }

    // --- Notes ---
    async getNotes(): Promise<Note[]> {
        if (!this.isOnline()) return [];
        const userId = await this.getUserId();
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) return [];

        return data.map((r: any) => ({
            id: r.id,
            title: r.title,
            content: r.content,
            createdAt: r.created_at,
            updatedAt: r.updated_at
        }));
    }

    async saveNotes(notes: Note[]): Promise<void> {
        await this.executeOrQueue(
            { type: 'notes', data: notes },
            () => this._saveNotes(notes)
        );
    }

    private async _saveNotes(notes: Note[]) {
        const userId = await this.getUserId();
        const rows = notes.map(n => ({
            id: n.id,
            title: n.title,
            content: n.content,
            created_at: n.createdAt,
            updated_at: n.updatedAt,
            user_id: userId
        }));

        const { error } = await supabase.from('notes').upsert(rows);
        if (error) throw error;

        const ids = notes.map(n => n.id);
        if (ids.length > 0) {
            await supabase.from('notes').delete().eq('user_id', userId).not('id', 'in', `(${ids.join(',')})`);
        } else {
            await supabase.from('notes').delete().eq('user_id', userId);
        }
    }

    // --- Routines ---
    async getRoutines(): Promise<RoutineItem[]> {
        if (!this.isOnline()) return [];
        const userId = await this.getUserId();
        const { data } = await supabase.from('routines').select('*').eq('user_id', userId);
        return (data || []).map((r: any) => ({
            id: r.id,
            startTime: r.start_time,
            endTime: r.end_time,
            activity: r.activity,
            category: r.category,
            completedAt: r.completed_at,
            updatedAt: r.updated_at,
            description: r.description
        }));
    }

    async saveRoutines(routines: RoutineItem[]): Promise<void> {
        await this.executeOrQueue(
            { type: 'routines', data: routines },
            () => this._saveRoutines(routines)
        );
    }

    private async _saveRoutines(routines: RoutineItem[]) {
        const userId = await this.getUserId();
        const rows = routines.map(r => ({
            id: r.id,
            start_time: r.startTime,
            end_time: r.endTime,
            activity: r.activity,
            category: r.category,
            completed_at: r.completedAt,
            updated_at: r.updatedAt,
            description: r.description,
            user_id: userId
        }));

        const { error } = await supabase.from('routines').upsert(rows);
        if (error) throw error;

        const ids = routines.map(r => r.id);
        if (ids.length > 0) {
            await supabase.from('routines').delete().eq('user_id', userId).not('id', 'in', `(${ids.join(',')})`);
        } else {
            await supabase.from('routines').delete().eq('user_id', userId);
        }
    }

    // --- Logs ---
    async getLogs(): Promise<ActivityLog[]> {
        if (!this.isOnline()) return [];
        const userId = await this.getUserId();
        const { data } = await supabase.from('logs').select('*').eq('user_id', userId).order('timestamp', { ascending: false });
        return (data || []).map((r: any) => ({
            id: r.id,
            timestamp: r.timestamp,
            type: r.type,
            content: r.content,
            mediaId: r.media_url,
            category: r.category
        }));
    }

    async saveLog(log: ActivityLog): Promise<void> {
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
            user_id: userId
        };

        const { error } = await supabase.from('logs').upsert(row);
        if (error) throw error;
    }

    async deleteLog(id: string): Promise<void> {
        await this.executeOrQueue(
            { type: 'delete_log', data: id },
            () => this._deleteLog(id)
        );
    }

    private async _deleteLog(id: string) {
        const { error } = await supabase.from('logs').delete().eq('id', id);
        if (error) throw error;
    }

    // --- Config / Utils ---
    async clearAll(): Promise<void> {
        // Safe implementation or empty
    }
}

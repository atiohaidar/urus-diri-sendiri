import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';

const sync = new Hono<{ Bindings: Env }>();

// Unified Sync Endpoint
// Mengambil semua data yang berubah sejak 'since' timestamp
// Mengurangi drastis jumlah request saat startup (1 request vs 8 requests)
sync.get('/all', authMiddleware, async (c) => {
    try {
        const userId = c.get('userId');
        if (!userId) {
            return c.json({ success: false, error: 'Unauthorized' }, 401);
        }
        const since = c.req.query('since'); // ISO string timestamp

        // Prepare queries
        // Jika 'since' valid, ambil data yg updatedAt > since.
        // Jika tidak, ambil semua.

        // Kita juga harus mengambil data yang dihapus (deleted_at IS NOT NULL)
        // untuk sinkronisasi soft-delete ke client.

        let timeCondition = '';
        const params: any[] = [userId];

        if (since) {
            timeCondition = 'AND updated_at > ?';
            params.push(since);
        }

        // Jalankan semua query secara paralel menggunakan D1 batching jika memungkinkan,
        // atau Promise.all untuk concurrent executions.
        // D1 batching direkomendasikan untuk write, tapi untuk read concurrent execution sudah cukup cepat.

        const [
            priorities,
            routines,
            notes,
            reflections,
            habits,
            habitLogs,
            logs
        ] = await Promise.all([
            // Priorities
            c.env.DB.prepare(
                `SELECT * FROM priorities WHERE user_id = ? ${timeCondition}`
            ).bind(...params).all(),

            // Routines (dan completions-nya jika ada di tabel terpisah, tapi disini kita asumsikan simple)
            c.env.DB.prepare(
                `SELECT * FROM routines WHERE user_id = ? ${timeCondition}`
            ).bind(...params).all(),

            // Notes
            c.env.DB.prepare(
                `SELECT * FROM notes WHERE user_id = ? ${timeCondition}`
            ).bind(...params).all(),

            // Reflections
            c.env.DB.prepare(
                `SELECT * FROM reflections WHERE user_id = ? ${timeCondition}`
            ).bind(...params).all(),

            // Habits
            c.env.DB.prepare(
                `SELECT * FROM habits WHERE user_id = ? ${timeCondition}`
            ).bind(...params).all(),

            // Habit Logs
            c.env.DB.prepare(
                `SELECT * FROM habit_logs WHERE user_id = ? ${timeCondition}`
            ).bind(...params).all(),

            // Logs (Activity Logs)
            c.env.DB.prepare(
                `SELECT * FROM logs WHERE user_id = ? ${timeCondition}`
            ).bind(...params).all(),
        ]);

        // Catatan: note_histories biasanya besar dan jarang diloading full di awal.
        // Sebaiknya tetap diload terpisah atau on-demand.
        // Personal Notes juga sensitif, bisa diload terpisah.

        // Helper to map keys from snake_case to camelCase
        const mapKeys = (item: any) => {
            if (!item) return item;
            const newItem: any = {};
            for (const key in item) {
                // simple conversion: created_at -> createdAt
                // encryption_salt -> encryptionSalt
                const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
                newItem[camelKey] = item[key];
            }
            return newItem;
        };

        // We need to map specific fields if standard camelCase conversion isn't enough,
        // but for most fields (created_at -> createdAt), it works.
        // Let's verify Note fields:
        // is_encrypted -> isEncrypted (Works)
        // encryption_salt -> encryptionSalt (Works)
        // password_hash -> passwordHash (Works)

        return c.json({
            success: true,
            data: {
                priorities: (priorities.results || []).map(mapKeys),
                routines: (routines.results || []).map(mapKeys),
                notes: (notes.results || []).map(mapKeys),
                reflections: (reflections.results || []).map(mapKeys),
                habits: (habits.results || []).map(mapKeys),
                habitLogs: (habitLogs.results || []).map(mapKeys),
                logs: (logs.results || []).map(mapKeys),
                serverTime: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Unified Sync Error:', error);
        return c.json({ success: false, error: 'Sync failed' }, 500);
    }
});

export default sync;

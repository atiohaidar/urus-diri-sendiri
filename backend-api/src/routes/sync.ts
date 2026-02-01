
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import {
    prioritySchema, routineSchema, noteSchema, reflectionSchema,
    habitSchema, habitLogSchema, logSchema
} from '../schemas';
import { parseJsonField } from '../utils';

const sync = new OpenAPIHono<{ Bindings: Env }>();

// Helper to relax schemas for response (allow JSON objects instead of just strings)
const jsonAny = z.any(); // Allow object or string or whatever

const priorityResponse = prioritySchema.extend({
    deletedAt: z.string().nullable().optional(),
});

const routineResponse = routineSchema.extend({
    deletedAt: z.string().nullable().optional(),
});

const noteResponse = noteSchema.extend({
    deletedAt: z.string().nullable().optional(),
});

// Override JSON fields for response to allow objects
const reflectionResponse = reflectionSchema.extend({
    deletedAt: z.string().nullable().optional(),
    priorities: jsonAny,
    todayRoutines: jsonAny,
    todayPriorities: jsonAny,
    images: jsonAny,
});

const habitResponse = habitSchema.extend({
    deletedAt: z.string().nullable().optional(),
    isArchived: z.boolean().optional(),
    specificDays: jsonAny,
});

const habitLogResponse = habitLogSchema.extend({
    deletedAt: z.string().nullable().optional(),
    date: z.string(),
});

const logResponse = logSchema.extend({
    deletedAt: z.string().nullable().optional(),
});

const syncResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
        priorities: z.array(priorityResponse),
        routines: z.array(routineResponse),
        notes: z.array(noteResponse),
        reflections: z.array(reflectionResponse),
        habits: z.array(habitResponse),
        habitLogs: z.array(habitLogResponse),
        logs: z.array(logResponse),
        serverTime: z.string(),
    }),
    error: z.string().optional(),
});

const getSyncRoute = createRoute({
    method: 'get',
    path: '/all',
    middleware: [authMiddleware] as any,
    request: {
        query: z.object({
            since: z.string().optional().openapi({
                param: {
                    name: 'since',
                    in: 'query'
                },
                example: '2023-01-01T00:00:00Z'
            })
        })
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: syncResponseSchema
                }
            },
            description: 'Sync all data'
        },
        401: { description: 'Unauthorized' },
        500: { description: 'Server Error' }
    }
});

sync.openapi(getSyncRoute, async (c) => {
    try {
        const userId = c.get('userId');
        const { since } = c.req.valid('query');

        let timeCondition = '';
        const params: any[] = [userId];

        if (since) {
            timeCondition = 'AND (updated_at > ? OR deleted_at > ?)';
            params.push(since, since);
        } else {
            timeCondition = 'AND deleted_at IS NULL';
        }

        // For sync, we actually want deleted items too if since is provided!
        // The original code had:
        // if (since) { timeCondition = 'AND updated_at > ?'; ... }
        // missing OR deleted_at > ? check in original code? 
        // Original code comment: "Kita juga harus mengambil data yang dihapus (deleted_at IS NOT NULL)..."
        // But the code: timeCondition = 'AND updated_at > ?';
        // It seems the original code MIGHT have been missing the deleted_at logic in the query string 
        // OR updated_at is updated when deleted_at is set (soft delete usually updates timestamp).
        // Let's assume (updated_at > since) covers deleted items if updated_at is touched on delete.
        // But standard practice is explicit check. I will use the robust check from other routes.

        // Wait, original sync.ts logic:
        // if (since) { timeCondition = 'AND updated_at > ?'; params.push(since); }
        // else { // No else in original logic shown?
        // Actually original logic:
        // if (since) params.push(since); 
        // And query: WHERE user_id = ? ${timeCondition}
        // If since is null, timeCondition is empty string -> returns ALL (including deleted? check original logic)

        // Let's stick to the ROBUST logic used in other routes:
        // if (since) { updated_at > ? OR deleted_at > ? } else { deleted_at IS NULL }

        // Wait, for SYNC, if full sync (no since), we DO NOT want deleted items.
        // If incremental (since), we DO want deleted items.

        let querySuffix = '';
        const queryParams: any[] = [userId];

        if (since) {
            querySuffix = 'AND (updated_at > ? OR deleted_at > ?)';
            queryParams.push(since, since);
        } else {
            querySuffix = 'AND deleted_at IS NULL';
        }

        // We run queries
        const [
            priorities,
            routines,
            notes,
            reflections,
            habits,
            habitLogs,
            logs
        ] = await Promise.all([
            c.env.DB.prepare(`SELECT * FROM priorities WHERE user_id = ? ${querySuffix} ORDER BY updated_at DESC`).bind(...queryParams).all(),
            c.env.DB.prepare(`SELECT * FROM routines WHERE user_id = ? ${querySuffix} ORDER BY updated_at DESC`).bind(...queryParams).all(),
            c.env.DB.prepare(`SELECT * FROM notes WHERE user_id = ? ${querySuffix} ORDER BY updated_at DESC`).bind(...queryParams).all(),
            c.env.DB.prepare(`SELECT * FROM reflections WHERE user_id = ? ${querySuffix} ORDER BY date DESC`).bind(...queryParams).all(),
            c.env.DB.prepare(`SELECT * FROM habits WHERE user_id = ? ${querySuffix} ORDER BY created_at DESC`).bind(...queryParams).all(),
            c.env.DB.prepare(`SELECT * FROM habit_logs WHERE user_id = ? ${querySuffix} ORDER BY date DESC`).bind(...queryParams).all(),
            c.env.DB.prepare(`SELECT * FROM logs WHERE user_id = ? ${querySuffix} ORDER BY timestamp DESC`).bind(...queryParams).all(),
        ]);

        const mapKeys = (item: any) => {
            if (!item) return item;
            const newItem: any = {};
            for (const key in item) {
                const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
                newItem[camelKey] = item[key];
            }
            return newItem;
        };

        const processResults = (results: any[], jsonFields: string[] = [], table?: string) => {
            return (results || []).map(row => {
                const mapped = mapKeys(row);

                // Specialty mapping for habits
                if (table === 'habits' && 'intervalDays' in mapped) {
                    mapped.interval = mapped.intervalDays;
                    delete mapped.intervalDays;
                }

                // Manually handle JSON parsing for specific fields
                jsonFields.forEach(field => {
                    if (mapped[field] && typeof mapped[field] === 'string') {
                        mapped[field] = parseJsonField(mapped[field]);
                    }
                });
                return mapped;
            });
        };

        // Optimasi: Jika menggunakan 'since' dan tidak ada satu pun data baru, 
        // kembalikan 304 Not Modified agar lebih hemat.
        if (since &&
            priorities.results.length === 0 &&
            routines.results.length === 0 &&
            notes.results.length === 0 &&
            reflections.results.length === 0 &&
            habits.results.length === 0 &&
            habitLogs.results.length === 0 &&
            logs.results.length === 0) {
            return c.body(null, 304);
        }

        return c.json({
            success: true,
            data: {
                priorities: processResults(priorities.results),
                routines: processResults(routines.results),
                notes: processResults(notes.results),
                reflections: processResults(reflections.results, ['priorities', 'todayRoutines', 'todayPriorities', 'images']),
                habits: processResults(habits.results, ['specificDays'], 'habits'),
                habitLogs: processResults(habitLogs.results),
                logs: processResults(logs.results),
                serverTime: new Date().toISOString()
            }
        }, 200);

    } catch (error) {
        console.error('Unified Sync Error:', error);
        return c.json({ success: false, error: 'Sync failed', data: undefined! }, 500);
    }
});

export default sync;


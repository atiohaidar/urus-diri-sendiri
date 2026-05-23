import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { batchHabitLogSchema, habitLogSchema } from '../schemas';

const habitLogs = new OpenAPIHono<{ Bindings: Env }>();

habitLogs.use('*', authMiddleware);

const successResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(habitLogSchema.extend({
    deletedAt: z.string().nullable().optional(),
    date: z.string(),
  })).optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

// Get all habit logs
const getHabitLogsRoute = createRoute({
  method: 'get',
  path: '/',
  request: {
    query: z.object({
      since: z.string().optional().openapi({
        param: {
          name: 'since',
          in: 'query',
        },
        example: '2023-01-01T00:00:00Z',
      }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: successResponseSchema,
        },
      },
      description: 'Retrieve habit logs',
    },
    500: {
      description: 'Server Error',
    },
  },
});

habitLogs.openapi(getHabitLogsRoute, async (c) => {
  try {
    const userId = c.get('userId');
    const { since } = c.req.valid('query');

    let query = 'SELECT * FROM habit_logs WHERE user_id = ?';
    const params: any[] = [userId];

    if (since) {
      query += ' AND (updated_at > ? OR deleted_at > ?)';
      params.push(since, since);
    } else {
      query += ' AND deleted_at IS NULL';
    }

    query += ' ORDER BY date DESC';

    const result = await c.env.DB.prepare(query).bind(...params).all();

    const habitLogsData = (result.results || []).map((row: any) => ({
      id: row.id,
      habitId: row.habit_id,
      date: row.date,
      completed: row.completed === 1,
      completedAt: row.completed_at,
      count: row.count,
      note: row.note,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    }));

    return c.json({ success: true, data: habitLogsData }, 200);
  } catch (error) {
    console.error('Get habit logs error:', error);
    return c.json({ success: false, error: 'Failed to fetch habit logs' }, 500);
  }
});

// Upsert habit logs (batch)
const upsertHabitLogsRoute = createRoute({
  method: 'put',
  path: '/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: batchHabitLogSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: successResponseSchema,
        },
      },
      description: 'Habit logs saved',
    },
    500: {
      description: 'Server Error',
    },
  },
});

habitLogs.openapi(upsertHabitLogsRoute, async (c) => {
  try {
    const userId = c.get('userId');
    const items = c.req.valid('json');

    // items is now typed and validated
    const itemsArray = Array.isArray(items) ? items : [items];

    if (itemsArray.length === 0) {
      return c.json({ success: true, message: 'No habit logs to save' }, 200);
    }

    const now = new Date().toISOString();

    const statements = itemsArray.map((item) =>
      c.env.DB.prepare(`
        INSERT INTO habit_logs (id, habit_id, date, completed, completed_at, count, note, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          habit_id = excluded.habit_id,
          date = excluded.date,
          completed = excluded.completed,
          completed_at = excluded.completed_at,
          count = excluded.count,
          note = excluded.note,
          updated_at = excluded.updated_at
      `).bind(
        item.id,
        item.habitId,
        item.date,
        item.completed ? 1 : 0,
        item.completedAt || null,
        item.count ?? 1,
        item.note || null,
        item.createdAt || now,
        item.updatedAt || now,
        userId
      )
    );

    await c.env.DB.batch(statements);

    return c.json({ success: true, message: `Saved ${itemsArray.length} habit logs` }, 200);
  } catch (error) {
    console.error('Save habit logs error:', error);
    return c.json({ success: false, error: 'Failed to save habit logs' }, 500);
  }
});

export default habitLogs;


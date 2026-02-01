import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { batchReflectionSchema, reflectionSchema } from '../schemas';
import { parseJsonField, stringifyJsonField } from '../utils';

const reflections = new OpenAPIHono<{ Bindings: Env }>();

reflections.use('*', authMiddleware);


const successResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(reflectionSchema.extend({
    deletedAt: z.string().nullable().optional(),
    // Override JSON fields to allow 'any' (Objects) instead of enforcing string transform
    priorities: z.any(),
    todayRoutines: z.any(),
    todayPriorities: z.any(),
    images: z.any(),
  })).optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});


// Get all reflections
const getReflectionsRoute = createRoute({
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
      description: 'Retrieve reflections',
    },
    500: {
      description: 'Server Error',
    },
  },
});

reflections.openapi(getReflectionsRoute, async (c) => {
  try {
    const userId = c.get('userId');
    const { since } = c.req.valid('query');

    let query = 'SELECT * FROM reflections WHERE user_id = ?';
    const params: any[] = [userId];

    if (since) {
      query += ' AND (updated_at > ? OR deleted_at > ?)';
      params.push(since, since);
    } else {
      query += ' AND deleted_at IS NULL';
    }

    query += ' ORDER BY date DESC';

    const result = await c.env.DB.prepare(query).bind(...params).all();

    const reflectionsData = (result.results || []).map((row: any) => ({
      id: row.id,
      date: row.date,
      winOfDay: row.win_of_day,
      hurdle: row.hurdle,
      priorities: parseJsonField(row.priorities),
      smallChange: row.small_change,
      todayRoutines: parseJsonField(row.today_routines),
      todayPriorities: parseJsonField(row.today_priorities),
      images: parseJsonField(row.images),
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    }));

    return c.json({ success: true, data: reflectionsData }, 200);
  } catch (error) {
    console.error('Get reflections error:', error);
    return c.json({ success: false, error: 'Failed to fetch reflections' }, 500);
  }
});

// Upsert reflection (batch support)
const upsertReflectionsRoute = createRoute({
  method: 'put',
  path: '/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: batchReflectionSchema,
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
      description: 'Reflections saved',
    },
    500: {
      description: 'Server Error',
    },
  },
});

reflections.openapi(upsertReflectionsRoute, async (c) => {
  try {
    const userId = c.get('userId');
    const items = c.req.valid('json');
    const now = new Date().toISOString();

    // Support both single object and array
    const itemsArray = Array.isArray(items) ? items : [items];

    if (itemsArray.length === 0) {
      return c.json({ success: true, message: 'No reflections to save' }, 200);
    }

    const statements = itemsArray.map((item) =>
      c.env.DB.prepare(`
        INSERT INTO reflections (id, date, win_of_day, hurdle, priorities, small_change, today_routines, today_priorities, images, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          date = excluded.date,
          win_of_day = excluded.win_of_day,
          hurdle = excluded.hurdle,
          priorities = excluded.priorities,
          small_change = excluded.small_change,
          today_routines = excluded.today_routines,
          today_priorities = excluded.today_priorities,
          images = excluded.images,
          updated_at = excluded.updated_at
      `).bind(
        item.id,
        item.date || null,
        item.winOfDay || null,
        item.hurdle || null,
        stringifyJsonField(item.priorities),
        item.smallChange || null,
        stringifyJsonField(item.todayRoutines),
        stringifyJsonField(item.todayPriorities),
        stringifyJsonField(item.images),
        item.updatedAt || now,
        userId
      )
    );

    await c.env.DB.batch(statements);

    return c.json({ success: true, message: `Saved ${itemsArray.length} reflections` }, 200);
  } catch (error) {
    console.error('Save reflection error:', error);
    return c.json({ success: false, error: 'Failed to save reflection' }, 500);
  }
});

export default reflections;


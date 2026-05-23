import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { batchRoutineSchema, routineSchema } from '../schemas';

const routines = new OpenAPIHono<{ Bindings: Env }>();

routines.use('*', authMiddleware);

const paramsSchema = z.object({
  id: z.string().openapi({
    param: {
      name: 'id',
      in: 'path',
    },
    example: '123',
  }),
});

const successResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(routineSchema.extend({
    deletedAt: z.string().nullable().optional(),
  })).optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

// Get all routines
const getRoutinesRoute = createRoute({
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
      description: 'Retrieve routines',
    },
    500: {
      description: 'Server Error',
    },
  },
});

routines.openapi(getRoutinesRoute, async (c) => {
  try {
    const userId = c.get('userId');
    const { since } = c.req.valid('query');

    let query = 'SELECT * FROM routines WHERE user_id = ?';
    const params: any[] = [userId];

    if (since) {
      query += ' AND (updated_at > ? OR deleted_at > ?)';
      params.push(since, since);
    } else {
      query += ' AND deleted_at IS NULL';
    }

    query += ' ORDER BY start_time ASC';

    const result = await c.env.DB.prepare(query).bind(...params).all();

    const routinesData = (result.results || []).map((row: any) => ({
      id: row.id,
      startTime: row.start_time,
      endTime: row.end_time,
      activity: row.activity,
      category: row.category,
      completedAt: row.completed_at,
      completionNote: row.completion_note,
      updatedAt: row.updated_at,
      description: row.description,
      deletedAt: row.deleted_at,
      calendarEventId: row.calendar_event_id,
    }));

    return c.json({ success: true, data: routinesData }, 200);
  } catch (error) {
    console.error('Get routines error:', error);
    return c.json({ success: false, error: 'Failed to fetch routines' }, 500);
  }
});

// Upsert routines (batch)
const upsertRoutinesRoute = createRoute({
  method: 'put',
  path: '/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: batchRoutineSchema,
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
      description: 'Routines saved',
    },
    500: {
      description: 'Server Error',
    },
  },
});

routines.openapi(upsertRoutinesRoute, async (c) => {
  try {
    const userId = c.get('userId');
    const items = c.req.valid('json');

    // items is now typed and validated
    const itemsArray = Array.isArray(items) ? items : [items];

    if (itemsArray.length === 0) {
      return c.json({ success: true, message: 'No routines to save' }, 200);
    }

    const now = new Date().toISOString();

    const statements = itemsArray.map((item) =>
      c.env.DB.prepare(`
        INSERT INTO routines (id, start_time, end_time, activity, category, completed_at, completion_note, updated_at, description, calendar_event_id, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          start_time = excluded.start_time,
          end_time = excluded.end_time,
          activity = excluded.activity,
          category = excluded.category,
          completed_at = excluded.completed_at,
          completion_note = excluded.completion_note,
          updated_at = excluded.updated_at,
          description = excluded.description,
          calendar_event_id = excluded.calendar_event_id
      `).bind(
        item.id,
        item.startTime || null,
        item.endTime || null,
        item.activity || '',
        item.category || null,
        item.completedAt || null,
        item.completionNote || null,
        item.updatedAt || now,
        item.description || null,
        item.calendarEventId || null,
        userId
      )
    );

    await c.env.DB.batch(statements);

    return c.json({ success: true, message: `Saved ${itemsArray.length} routines` }, 200);
  } catch (error) {
    console.error('Save routines error:', error);
    return c.json({ success: false, error: 'Failed to save routines' }, 500);
  }
});

// Delete routine (soft delete)
const deleteRoutineRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  request: {
    params: paramsSchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: successResponseSchema,
        },
      },
      description: 'Routine deleted',
    },
    500: {
      description: 'Server Error',
    },
  },
});

routines.openapi(deleteRoutineRoute, async (c) => {
  try {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE routines 
      SET deleted_at = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).bind(now, now, id, userId).run();

    return c.json({ success: true, message: 'Routine deleted' }, 200);
  } catch (error) {
    console.error('Delete routine error:', error);
    return c.json({ success: false, error: 'Failed to delete routine' }, 500);
  }
});

export default routines;

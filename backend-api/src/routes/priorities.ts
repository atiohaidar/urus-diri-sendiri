import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { batchPrioritySchema, prioritySchema } from '../schemas';

const priorities = new OpenAPIHono<{ Bindings: Env }>();

// Apply auth middleware to all routes
priorities.use('*', authMiddleware);

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
  data: z.array(prioritySchema.extend({
    deletedAt: z.string().nullable().optional(),
  })).optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

// Get all priorities (with optional since filter for incremental sync)
const getPrioritiesRoute = createRoute({
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
      description: 'Retrieve priorities',
    },
    500: {
      description: 'Server Error',
    },
  },
});

priorities.openapi(getPrioritiesRoute, async (c) => {
  try {
    const userId = c.get('userId');
    const { since } = c.req.valid('query');

    let query = 'SELECT * FROM priorities WHERE user_id = ?';
    const params: any[] = [userId];

    if (since) {
      query += ' AND (updated_at > ? OR deleted_at > ?)';
      params.push(since, since);
    } else {
      query += ' AND deleted_at IS NULL';
    }

    query += ' ORDER BY updated_at DESC';

    const result = await c.env.DB.prepare(query).bind(...params).all();

    // Convert to camelCase for API response
    const prioritiesData = (result.results || []).map((row: any) => ({
      id: row.id,
      text: row.text,
      completed: row.completed === 1,
      completionNote: row.completion_note,
      updatedAt: row.updated_at,
      scheduledFor: row.scheduled_for,
      deletedAt: row.deleted_at,
      calendarEventId: row.calendar_event_id,
    }));

    return c.json({ success: true, data: prioritiesData }, 200);
  } catch (error) {
    console.error('Get priorities error:', error);
    return c.json({ success: false, error: 'Failed to fetch priorities' }, 500);
  }
});

// Upsert priorities (batch)
const upsertPrioritiesRoute = createRoute({
  method: 'put',
  path: '/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: batchPrioritySchema,
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
      description: 'Priorities saved',
    },
    500: {
      description: 'Server Error',
    },
  },
});

priorities.openapi(upsertPrioritiesRoute, async (c) => {
  try {
    const userId = c.get('userId');
    const items = c.req.valid('json');

    // items is now typed and validated
    const itemsArray = Array.isArray(items) ? items : [items];

    if (itemsArray.length === 0) {
      return c.json({ success: true, message: 'No priorities to save' }, 200);
    }

    const now = new Date().toISOString();

    const statements = itemsArray.map((item) =>
      c.env.DB.prepare(`
        INSERT INTO priorities (id, text, completed, completion_note, updated_at, scheduled_for, calendar_event_id, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          text = excluded.text,
          completed = excluded.completed,
          completion_note = excluded.completion_note,
          updated_at = excluded.updated_at,
          scheduled_for = excluded.scheduled_for,
          calendar_event_id = excluded.calendar_event_id
      `).bind(
        item.id,
        item.text || '',
        item.completed ? 1 : 0,
        item.completionNote || null,
        item.updatedAt || now,
        item.scheduledFor || null,
        item.calendarEventId || null,
        userId
      )
    );

    await c.env.DB.batch(statements);

    return c.json({ success: true, message: `Saved ${itemsArray.length} priorities` }, 200);
  } catch (error) {
    console.error('Save priorities error:', error);
    return c.json({ success: false, error: 'Failed to save priorities' }, 500);
  }
});

// Delete priority (soft delete)
const deletePriorityRoute = createRoute({
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
      description: 'Priority deleted',
    },
    500: {
      description: 'Server Error',
    },
  },
});

priorities.openapi(deletePriorityRoute, async (c) => {
  try {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE priorities 
      SET deleted_at = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).bind(now, now, id, userId).run();

    return c.json({ success: true, message: 'Priority deleted' }, 200);
  } catch (error) {
    console.error('Delete priority error:', error);
    return c.json({ success: false, error: 'Failed to delete priority' }, 500);
  }
});

export default priorities;

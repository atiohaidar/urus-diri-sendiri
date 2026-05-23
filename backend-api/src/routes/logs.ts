import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { batchLogSchema, logSchema } from '../schemas';

const logs = new OpenAPIHono<{ Bindings: Env }>();

logs.use('*', authMiddleware);

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
  data: z.array(logSchema.extend({
    deletedAt: z.string().nullable().optional(),
  })).optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

// Get all logs
const getLogsRoute = createRoute({
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
      description: 'Retrieve logs',
    },
    500: {
      description: 'Server Error',
    },
  },
});

logs.openapi(getLogsRoute, async (c) => {
  try {
    const userId = c.get('userId');
    const { since } = c.req.valid('query');

    let query = 'SELECT * FROM logs WHERE user_id = ?';
    const params: any[] = [userId];

    if (since) {
      query += ' AND (updated_at > ? OR deleted_at > ?)';
      params.push(since, since);
    } else {
      query += ' AND deleted_at IS NULL';
    }

    query += ' ORDER BY timestamp DESC';

    const result = await c.env.DB.prepare(query).bind(...params).all();

    const logsData = (result.results || []).map((row: any) => ({
      id: row.id,
      timestamp: row.timestamp,
      type: row.type,
      content: row.content,
      mediaUrl: row.media_url,
      mediaId: row.media_id,
      category: row.category,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    }));

    return c.json({ success: true, data: logsData }, 200);
  } catch (error) {
    console.error('Get logs error:', error);
    return c.json({ success: false, error: 'Failed to fetch logs' }, 500);
  }
});

// Upsert log (batch support)
const upsertLogsRoute = createRoute({
  method: 'put',
  path: '/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: batchLogSchema,
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
      description: 'Logs saved',
    },
    500: {
      description: 'Server Error',
    },
  },
});

logs.openapi(upsertLogsRoute, async (c) => {
  try {
    const userId = c.get('userId');
    const items = c.req.valid('json');
    const now = new Date().toISOString();

    // Support both single object and array
    const itemsArray = Array.isArray(items) ? items : [items];

    if (itemsArray.length === 0) {
      return c.json({ success: true, message: 'No logs to save' }, 200);
    }

    const statements = itemsArray.map((item) =>
      c.env.DB.prepare(`
        INSERT INTO logs (id, timestamp, type, content, media_url, media_id, category, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          timestamp = excluded.timestamp,
          type = excluded.type,
          content = excluded.content,
          media_url = excluded.media_url,
          media_id = excluded.media_id,
          category = excluded.category,
          updated_at = excluded.updated_at
      `).bind(
        item.id,
        item.timestamp || now,
        item.type || null,
        item.content || null,
        item.mediaUrl || null,
        item.mediaId || null,
        item.category || null,
        item.updatedAt || now,
        userId
      )
    );

    await c.env.DB.batch(statements);

    return c.json({ success: true, message: `Saved ${itemsArray.length} logs` }, 200);
  } catch (error) {
    console.error('Save log error:', error);
    return c.json({ success: false, error: 'Failed to save log' }, 500);
  }
});

// Delete log (soft delete)
const deleteLogRoute = createRoute({
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
      description: 'Log deleted',
    },
    500: {
      description: 'Server Error',
    },
  },
});

logs.openapi(deleteLogRoute, async (c) => {
  try {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE logs 
      SET deleted_at = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).bind(now, now, id, userId).run();

    return c.json({ success: true, message: 'Log deleted' }, 200);
  } catch (error) {
    console.error('Delete log error:', error);
    return c.json({ success: false, error: 'Failed to delete log' }, 500);
  }
});

export default logs;


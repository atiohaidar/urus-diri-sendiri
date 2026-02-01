import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { batchNoteHistorySchema, noteHistorySchema } from '../schemas';

const noteHistories = new OpenAPIHono<{ Bindings: Env }>();

noteHistories.use('*', authMiddleware);

const successResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(noteHistorySchema.extend({
    deletedAt: z.string().nullable().optional(),
  })).optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

// Get all note histories
const getNoteHistoriesRoute = createRoute({
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
      description: 'Retrieve note histories',
    },
    500: {
      description: 'Server Error',
    },
  },
});

noteHistories.openapi(getNoteHistoriesRoute, async (c) => {
  try {
    const userId = c.get('userId');
    const { since } = c.req.valid('query');

    let query = 'SELECT * FROM note_histories WHERE user_id = ?';
    const params: any[] = [userId];

    if (since) {
      query += ' AND (updated_at > ? OR deleted_at > ?)';
      params.push(since, since);
    } else {
      query += ' AND deleted_at IS NULL';
    }

    query += ' ORDER BY saved_at DESC';

    const result = await c.env.DB.prepare(query).bind(...params).all();

    const histories = (result.results || []).map((row: any) => ({
      id: row.id,
      noteId: row.note_id,
      title: row.title,
      content: row.content,
      savedAt: row.saved_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    }));

    return c.json({ success: true, data: histories }, 200);
  } catch (error) {
    console.error('Get note histories error:', error);
    return c.json({ success: false, error: 'Failed to fetch note histories' }, 500);
  }
});

// Upsert note history (batch support)
const upsertNoteHistoriesRoute = createRoute({
  method: 'put',
  path: '/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: batchNoteHistorySchema,
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
      description: 'Note histories saved',
    },
    500: {
      description: 'Server Error',
    },
  },
});

noteHistories.openapi(upsertNoteHistoriesRoute, async (c) => {
  try {
    const userId = c.get('userId');
    const items = c.req.valid('json');
    const now = new Date().toISOString();

    // Support both single object and array
    const itemsArray = Array.isArray(items) ? items : [items];

    if (itemsArray.length === 0) {
      return c.json({ success: true, message: 'No note histories to save' }, 200);
    }

    const statements = itemsArray.map((item) =>
      c.env.DB.prepare(`
        INSERT INTO note_histories (id, note_id, title, content, saved_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          content = excluded.content,
          saved_at = excluded.saved_at,
          updated_at = excluded.updated_at
      `).bind(
        item.id,
        item.noteId,
        item.title || '',
        item.content || '',
        item.savedAt || now,
        item.updatedAt || now,
        userId
      )
    );

    await c.env.DB.batch(statements);

    return c.json({ success: true, message: `Saved ${itemsArray.length} note histories` }, 200);
  } catch (error) {
    console.error('Save note history error:', error);
    return c.json({ success: false, error: 'Failed to save note history' }, 500);
  }
});

export default noteHistories;


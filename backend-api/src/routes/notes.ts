import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { Env } from '../types';
import { noteSchema, batchNoteSchema } from '../schemas';
import { authMiddleware } from '../middleware/auth';

const notes = new OpenAPIHono<{ Bindings: Env }>();

notes.use('*', authMiddleware);

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
  data: z.array(noteSchema.extend({
    deletedAt: z.string().nullable().optional(),
  })).optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

// Get all notes
const getNotesRoute = createRoute({
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
      description: 'Retrieve notes',
    },
    500: {
      description: 'Server Error',
    },
  },
});

notes.openapi(getNotesRoute, async (c) => {
  try {
    const userId = c.get('userId');
    const { since } = c.req.valid('query');

    let query = 'SELECT * FROM notes WHERE user_id = ?';
    const params: any[] = [userId];

    if (since) {
      query += ' AND (updated_at > ? OR deleted_at > ?)';
      params.push(since, since);
    } else {
      query += ' AND deleted_at IS NULL';
    }

    query += ' ORDER BY updated_at DESC';

    const result = await c.env.DB.prepare(query).bind(...params).all();

    const notesData = (result.results || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      category: row.category,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      isEncrypted: row.is_encrypted === 1,
      encryptionSalt: row.encryption_salt,
      encryptionIv: row.encryption_iv,
      passwordHash: row.password_hash,
    }));

    return c.json({ success: true, data: notesData }, 200);
  } catch (error) {
    console.error('Get notes error:', error);
    return c.json({ success: false, error: 'Failed to fetch notes' }, 500);
  }
});

// Upsert single note
const upsertSingleNoteRoute = createRoute({
  method: 'put',
  path: '/single',
  request: {
    body: {
      content: {
        'application/json': {
          schema: noteSchema,
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
      description: 'Note saved',
    },
    500: {
      description: 'Server Error',
    },
  },
});

notes.openapi(upsertSingleNoteRoute, async (c) => {
  try {
    const userId = c.get('userId');
    const item = c.req.valid('json');
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO notes (id, title, content, category, created_at, updated_at, is_encrypted, encryption_salt, encryption_iv, password_hash, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        content = excluded.content,
        category = excluded.category,
        updated_at = excluded.updated_at,
        is_encrypted = excluded.is_encrypted,
        encryption_salt = excluded.encryption_salt,
        encryption_iv = excluded.encryption_iv,
        password_hash = excluded.password_hash
    `).bind(
      item.id,
      item.title || '',
      item.content || '',
      item.category || null,
      item.createdAt || now,
      item.updatedAt || now,
      item.isEncrypted ? 1 : 0,
      item.encryptionSalt || null,
      item.encryptionIv || null,
      item.passwordHash || null,
      userId
    ).run();

    return c.json({ success: true, message: 'Note saved' }, 200);
  } catch (error) {
    console.error('Save note error:', error);
    return c.json({ success: false, error: 'Failed to save note' }, 500);
  }
});

// Upsert notes (batch)
const upsertNotesRoute = createRoute({
  method: 'put',
  path: '/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: batchNoteSchema,
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
      description: 'Notes saved',
    },
    500: {
      description: 'Server Error',
    },
  },
});

notes.openapi(upsertNotesRoute, async (c) => {
  try {
    const userId = c.get('userId');
    const items = c.req.valid('json');

    // Ensure items is an array - schema handles single object too but valid returns normalized type?
    // Batch schema is z.array().or(z.object())
    const itemsArray = Array.isArray(items) ? items : [items];

    if (itemsArray.length === 0) {
      return c.json({ success: true, message: 'No notes to save' }, 200);
    }

    const now = new Date().toISOString();

    // Create batch statements
    const statements = itemsArray.map((item) =>
      c.env.DB.prepare(`
        INSERT INTO notes (id, title, content, category, created_at, updated_at, is_encrypted, encryption_salt, encryption_iv, password_hash, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          content = excluded.content,
          category = excluded.category,
          updated_at = excluded.updated_at,
          is_encrypted = excluded.is_encrypted,
          encryption_salt = excluded.encryption_salt,
          encryption_iv = excluded.encryption_iv,
          password_hash = excluded.password_hash
      `).bind(
        item.id,
        item.title || '',
        item.content || '',
        item.category || null,
        item.createdAt || now,
        item.updatedAt || now,
        item.isEncrypted ? 1 : 0,
        item.encryptionSalt || null,
        item.encryptionIv || null,
        item.passwordHash || null,
        userId
      )
    );

    // Execute batch
    await c.env.DB.batch(statements);

    return c.json({ success: true, message: `Saved ${itemsArray.length} notes` }, 200);
  } catch (error) {
    console.error('Save notes error:', error);
    return c.json({ success: false, error: 'Failed to save notes' }, 500);
  }
});

// Delete note (soft delete)
const deleteNoteRoute = createRoute({
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
      description: 'Note deleted',
    },
    500: {
      description: 'Server Error',
    },
  },
});

notes.openapi(deleteNoteRoute, async (c) => {
  try {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE notes 
      SET deleted_at = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).bind(now, now, id, userId).run();

    return c.json({ success: true, message: 'Note deleted' }, 200);
  } catch (error) {
    console.error('Delete note error:', error);
    return c.json({ success: false, error: 'Failed to delete note' }, 500);
  }
});

export default notes;


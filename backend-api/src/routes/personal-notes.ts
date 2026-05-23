import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';

const personalNotes = new OpenAPIHono<{ Bindings: Env }>();

personalNotes.use('*', authMiddleware);

const personalNotesSchema = z.object({
  isSetup: z.boolean(),
  encryptedData: z.string().nullable().optional(),
  iv: z.string().nullable().optional(),
  salt: z.string().nullable().optional(),
  passwordHash: z.string().nullable().optional(),
  updatedAt: z.string(),
});

const successResponseSchema = z.object({
  success: z.boolean(),
  data: personalNotesSchema.optional().nullable(),
  message: z.string().optional(),
  error: z.string().optional(),
});

// Get personal notes
const getPersonalNotesRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: successResponseSchema,
        },
      },
      description: 'Retrieve personal notes settings',
    },
    500: {
      description: 'Server Error',
    },
  },
});

personalNotes.openapi(getPersonalNotesRoute, async (c) => {
  try {
    const userId = c.get('userId');

    const result = await c.env.DB.prepare(
      'SELECT * FROM personal_notes WHERE user_id = ?'
    ).bind(userId).first();

    if (!result) {
      return c.json({ success: true, data: null }, 200);
    }

    const data = {
      isSetup: result.is_setup === 1,
      encryptedData: result.encrypted_data,
      iv: result.iv,
      salt: result.salt,
      passwordHash: result.password_hash,
      updatedAt: result.updated_at,
    };

    return c.json({ success: true, data }, 200);
  } catch (error) {
    console.error('Get personal notes error:', error);
    return c.json({ success: false, error: 'Failed to fetch personal notes' }, 500);
  }
});

// Upsert personal notes
const upsertPersonalNotesRoute = createRoute({
  method: 'put',
  path: '/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: personalNotesSchema,
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
      description: 'Personal notes saved',
    },
    500: {
      description: 'Server Error',
    },
  },
});

personalNotes.openapi(upsertPersonalNotesRoute, async (c) => {
  try {
    const userId = c.get('userId');
    const item = c.req.valid('json');
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO personal_notes (user_id, is_setup, encrypted_data, iv, salt, password_hash, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        is_setup = excluded.is_setup,
        encrypted_data = excluded.encrypted_data,
        iv = excluded.iv,
        salt = excluded.salt,
        password_hash = excluded.password_hash,
        updated_at = excluded.updated_at
    `).bind(
      userId,
      item.isSetup ? 1 : 0,
      item.encryptedData,
      item.iv,
      item.salt,
      item.passwordHash,
      now
    ).run();

    return c.json({ success: true, message: 'Personal notes saved' }, 200);
  } catch (error) {
    console.error('Save personal notes error:', error);
    return c.json({ success: false, error: 'Failed to save personal notes' }, 500);
  }
});

export default personalNotes;


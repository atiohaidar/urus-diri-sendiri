import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';

const personalNotes = new Hono<{ Bindings: Env }>();

personalNotes.use('*', authMiddleware);

// Get personal notes
personalNotes.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    
    const result = await c.env.DB.prepare(
      'SELECT * FROM personal_notes WHERE user_id = ?'
    ).bind(userId).first();
    
    if (!result) {
      return c.json({ success: true, data: null });
    }
    
    const data = {
      isSetup: result.is_setup === 1,
      encryptedData: result.encrypted_data,
      iv: result.iv,
      salt: result.salt,
      passwordHash: result.password_hash,
      updatedAt: result.updated_at,
    };
    
    return c.json({ success: true, data });
  } catch (error) {
    console.error('Get personal notes error:', error);
    return c.json({ success: false, error: 'Failed to fetch personal notes' }, 500);
  }
});

// Upsert personal notes
personalNotes.put('/', async (c) => {
  try {
    const userId = c.get('userId');
    const item = await c.req.json();
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
    
    return c.json({ success: true, message: 'Personal notes saved' });
  } catch (error) {
    console.error('Save personal notes error:', error);
    return c.json({ success: false, error: 'Failed to save personal notes' }, 500);
  }
});

export default personalNotes;

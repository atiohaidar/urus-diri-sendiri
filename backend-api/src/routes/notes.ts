import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';

const notes = new Hono<{ Bindings: Env }>();

notes.use('*', authMiddleware);

// Get all notes
notes.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const since = c.req.query('since');

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

    const notes = (result.results || []).map((row: any) => ({
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

    return c.json({ success: true, data: notes });
  } catch (error) {
    console.error('Get notes error:', error);
    return c.json({ success: false, error: 'Failed to fetch notes' }, 500);
  }
});

// Upsert single note
notes.put('/single', async (c) => {
  try {
    const userId = c.get('userId');
    const item = await c.req.json();
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

    return c.json({ success: true, message: 'Note saved' });
  } catch (error) {
    console.error('Save note error:', error);
    return c.json({ success: false, error: 'Failed to save note' }, 500);
  }
});

// Upsert notes (batch)
notes.put('/', async (c) => {
  try {
    const userId = c.get('userId');
    const items = await c.req.json();

    // Ensure items is an array
    const itemsArray = Array.isArray(items) ? items : [items];

    if (itemsArray.length === 0) {
      return c.json({ success: true, message: 'No notes to save' });
    }

    const now = new Date().toISOString();

    // Create batch statements
    const statements = itemsArray.map((item: any) =>
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

    return c.json({ success: true, message: `Saved ${itemsArray.length} notes` });
  } catch (error) {
    console.error('Save notes error:', error);
    return c.json({ success: false, error: 'Failed to save notes' }, 500);
  }
});

// Delete note (soft delete)
notes.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE notes 
      SET deleted_at = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).bind(now, now, id, userId).run();

    return c.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    console.error('Delete note error:', error);
    return c.json({ success: false, error: 'Failed to delete note' }, 500);
  }
});

export default notes;

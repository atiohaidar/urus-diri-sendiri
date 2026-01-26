import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';

const noteHistories = new Hono<{ Bindings: Env }>();

noteHistories.use('*', authMiddleware);

// Get all note histories
noteHistories.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const since = c.req.query('since');
    
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
    
    return c.json({ success: true, data: histories });
  } catch (error) {
    console.error('Get note histories error:', error);
    return c.json({ success: false, error: 'Failed to fetch note histories' }, 500);
  }
});

// Upsert note history
noteHistories.put('/', async (c) => {
  try {
    const userId = c.get('userId');
    const item = await c.req.json();
    const now = new Date().toISOString();
    
    await c.env.DB.prepare(`
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
    ).run();
    
    return c.json({ success: true, message: 'Note history saved' });
  } catch (error) {
    console.error('Save note history error:', error);
    return c.json({ success: false, error: 'Failed to save note history' }, 500);
  }
});

export default noteHistories;

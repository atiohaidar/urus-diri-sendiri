import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';

const logs = new Hono<{ Bindings: Env }>();

logs.use('*', authMiddleware);

// Get all logs
logs.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const since = c.req.query('since');

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

    const logs = (result.results || []).map((row: any) => ({
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

    return c.json({ success: true, data: logs });
  } catch (error) {
    console.error('Get logs error:', error);
    return c.json({ success: false, error: 'Failed to fetch logs' }, 500);
  }
});

import { zValidator } from '@hono/zod-validator';
import { batchLogSchema } from '../schemas';

// Upsert log (batch support)
logs.put('/', zValidator('json', batchLogSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const items = c.req.valid('json');
    const now = new Date().toISOString();

    // Support both single object and array
    const itemsArray = Array.isArray(items) ? items : [items];

    if (itemsArray.length === 0) {
      return c.json({ success: true, message: 'No logs to save' });
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

    return c.json({ success: true, message: `Saved ${itemsArray.length} logs` });
  } catch (error) {
    console.error('Save log error:', error);
    return c.json({ success: false, error: 'Failed to save log' }, 500);
  }
});

// Delete log (soft delete)
logs.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE logs 
      SET deleted_at = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).bind(now, now, id, userId).run();

    return c.json({ success: true, message: 'Log deleted' });
  } catch (error) {
    console.error('Delete log error:', error);
    return c.json({ success: false, error: 'Failed to delete log' }, 500);
  }
});

export default logs;

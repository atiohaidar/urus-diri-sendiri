import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';

const priorities = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all routes
priorities.use('*', authMiddleware);

// Get all priorities (with optional since filter for incremental sync)
priorities.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const since = c.req.query('since');

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
    const priorities = (result.results || []).map((row: any) => ({
      id: row.id,
      text: row.text,
      completed: row.completed === 1,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    }));

    return c.json({ success: true, data: priorities });
  } catch (error) {
    console.error('Get priorities error:', error);
    return c.json({ success: false, error: 'Failed to fetch priorities' }, 500);
  }
});

import { zValidator } from '@hono/zod-validator';
import { batchPrioritySchema } from '../schemas';

// Upsert priorities (batch)
priorities.put('/', zValidator('json', batchPrioritySchema), async (c) => {
  try {
    const userId = c.get('userId');
    const items = c.req.valid('json');

    // items is now typed and validated
    const itemsArray = Array.isArray(items) ? items : [items];

    if (itemsArray.length === 0) {
      return c.json({ success: true, message: 'No priorities to save' });
    }

    const now = new Date().toISOString();

    const statements = itemsArray.map((item) =>
      c.env.DB.prepare(`
        INSERT INTO priorities (id, text, completed, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          text = excluded.text,
          completed = excluded.completed,
          updated_at = excluded.updated_at
      `).bind(
        item.id,
        item.text || '',
        item.completed ? 1 : 0,
        item.updatedAt || now,
        userId
      )
    );

    await c.env.DB.batch(statements);

    return c.json({ success: true, message: `Saved ${itemsArray.length} priorities` });
  } catch (error) {
    console.error('Save priorities error:', error);
    return c.json({ success: false, error: 'Failed to save priorities' }, 500);
  }
});

// Delete priority (soft delete)
priorities.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE priorities 
      SET deleted_at = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).bind(now, now, id, userId).run();

    return c.json({ success: true, message: 'Priority deleted' });
  } catch (error) {
    console.error('Delete priority error:', error);
    return c.json({ success: false, error: 'Failed to delete priority' }, 500);
  }
});

export default priorities;

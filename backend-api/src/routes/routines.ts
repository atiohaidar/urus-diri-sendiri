import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';

const routines = new Hono<{ Bindings: Env }>();

routines.use('*', authMiddleware);

// Get all routines
routines.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const since = c.req.query('since');
    
    let query = 'SELECT * FROM routines WHERE user_id = ?';
    const params: any[] = [userId];
    
    if (since) {
      query += ' AND (updated_at > ? OR deleted_at > ?)';
      params.push(since, since);
    } else {
      query += ' AND deleted_at IS NULL';
    }
    
    query += ' ORDER BY start_time ASC';
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    
    const routines = (result.results || []).map((row: any) => ({
      id: row.id,
      startTime: row.start_time,
      endTime: row.end_time,
      activity: row.activity,
      category: row.category,
      completedAt: row.completed_at,
      updatedAt: row.updated_at,
      description: row.description,
      deletedAt: row.deleted_at,
    }));
    
    return c.json({ success: true, data: routines });
  } catch (error) {
    console.error('Get routines error:', error);
    return c.json({ success: false, error: 'Failed to fetch routines' }, 500);
  }
});

// Upsert routines (batch)
routines.put('/', async (c) => {
  try {
    const userId = c.get('userId');
    const items = await c.req.json();
    
    if (!Array.isArray(items)) {
      return c.json({ success: false, error: 'Expected array of routines' }, 400);
    }
    
    const now = new Date().toISOString();
    
    for (const item of items) {
      await c.env.DB.prepare(`
        INSERT INTO routines (id, start_time, end_time, activity, category, completed_at, updated_at, description, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          start_time = excluded.start_time,
          end_time = excluded.end_time,
          activity = excluded.activity,
          category = excluded.category,
          completed_at = excluded.completed_at,
          updated_at = excluded.updated_at,
          description = excluded.description
      `).bind(
        item.id,
        item.startTime || null,
        item.endTime || null,
        item.activity || '',
        item.category || null,
        item.completedAt || null,
        item.updatedAt || now,
        item.description || null,
        userId
      ).run();
    }
    
    return c.json({ success: true, message: 'Routines saved' });
  } catch (error) {
    console.error('Save routines error:', error);
    return c.json({ success: false, error: 'Failed to save routines' }, 500);
  }
});

// Delete routine (soft delete)
routines.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const now = new Date().toISOString();
    
    await c.env.DB.prepare(`
      UPDATE routines 
      SET deleted_at = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).bind(now, now, id, userId).run();
    
    return c.json({ success: true, message: 'Routine deleted' });
  } catch (error) {
    console.error('Delete routine error:', error);
    return c.json({ success: false, error: 'Failed to delete routine' }, 500);
  }
});

export default routines;

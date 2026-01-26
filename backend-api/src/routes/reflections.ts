import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { parseJsonField, stringifyJsonField } from '../utils';

const reflections = new Hono<{ Bindings: Env }>();

reflections.use('*', authMiddleware);

// Get all reflections
reflections.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const since = c.req.query('since');
    
    let query = 'SELECT * FROM reflections WHERE user_id = ?';
    const params: any[] = [userId];
    
    if (since) {
      query += ' AND (updated_at > ? OR deleted_at > ?)';
      params.push(since, since);
    } else {
      query += ' AND deleted_at IS NULL';
    }
    
    query += ' ORDER BY date DESC';
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    
    const reflections = (result.results || []).map((row: any) => ({
      id: row.id,
      date: row.date,
      winOfDay: row.win_of_day,
      hurdle: row.hurdle,
      priorities: parseJsonField(row.priorities),
      smallChange: row.small_change,
      todayRoutines: parseJsonField(row.today_routines),
      todayPriorities: parseJsonField(row.today_priorities),
      images: parseJsonField(row.images),
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    }));
    
    return c.json({ success: true, data: reflections });
  } catch (error) {
    console.error('Get reflections error:', error);
    return c.json({ success: false, error: 'Failed to fetch reflections' }, 500);
  }
});

// Upsert reflection
reflections.put('/', async (c) => {
  try {
    const userId = c.get('userId');
    const item = await c.req.json();
    const now = new Date().toISOString();
    
    await c.env.DB.prepare(`
      INSERT INTO reflections (id, date, win_of_day, hurdle, priorities, small_change, today_routines, today_priorities, images, updated_at, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        date = excluded.date,
        win_of_day = excluded.win_of_day,
        hurdle = excluded.hurdle,
        priorities = excluded.priorities,
        small_change = excluded.small_change,
        today_routines = excluded.today_routines,
        today_priorities = excluded.today_priorities,
        images = excluded.images,
        updated_at = excluded.updated_at
    `).bind(
      item.id,
      item.date || null,
      item.winOfDay || null,
      item.hurdle || null,
      stringifyJsonField(item.priorities),
      item.smallChange || null,
      stringifyJsonField(item.todayRoutines),
      stringifyJsonField(item.todayPriorities),
      stringifyJsonField(item.images),
      item.updatedAt || now,
      userId
    ).run();
    
    return c.json({ success: true, message: 'Reflection saved' });
  } catch (error) {
    console.error('Save reflection error:', error);
    return c.json({ success: false, error: 'Failed to save reflection' }, 500);
  }
});

export default reflections;

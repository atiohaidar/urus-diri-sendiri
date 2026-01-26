import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';

const habitLogs = new Hono<{ Bindings: Env }>();

habitLogs.use('*', authMiddleware);

// Get all habit logs
habitLogs.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const since = c.req.query('since');
    
    let query = 'SELECT * FROM habit_logs WHERE user_id = ?';
    const params: any[] = [userId];
    
    if (since) {
      query += ' AND (updated_at > ? OR deleted_at > ?)';
      params.push(since, since);
    } else {
      query += ' AND deleted_at IS NULL';
    }
    
    query += ' ORDER BY date DESC';
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    
    const habitLogs = (result.results || []).map((row: any) => ({
      id: row.id,
      habitId: row.habit_id,
      date: row.date,
      completed: row.completed === 1,
      completedAt: row.completed_at,
      count: row.count,
      note: row.note,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    }));
    
    return c.json({ success: true, data: habitLogs });
  } catch (error) {
    console.error('Get habit logs error:', error);
    return c.json({ success: false, error: 'Failed to fetch habit logs' }, 500);
  }
});

// Upsert habit logs (batch)
habitLogs.put('/', async (c) => {
  try {
    const userId = c.get('userId');
    const items = await c.req.json();
    
    if (!Array.isArray(items)) {
      return c.json({ success: false, error: 'Expected array of habit logs' }, 400);
    }
    
    const now = new Date().toISOString();
    
    for (const item of items) {
      await c.env.DB.prepare(`
        INSERT INTO habit_logs (id, habit_id, date, completed, completed_at, count, note, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          habit_id = excluded.habit_id,
          date = excluded.date,
          completed = excluded.completed,
          completed_at = excluded.completed_at,
          count = excluded.count,
          note = excluded.note,
          updated_at = excluded.updated_at
      `).bind(
        item.id,
        item.habitId,
        item.date,
        item.completed ? 1 : 0,
        item.completedAt || null,
        item.count ?? 1,
        item.note || null,
        item.createdAt || now,
        item.updatedAt || now,
        userId
      ).run();
    }
    
    return c.json({ success: true, message: 'Habit logs saved' });
  } catch (error) {
    console.error('Save habit logs error:', error);
    return c.json({ success: false, error: 'Failed to save habit logs' }, 500);
  }
});

export default habitLogs;

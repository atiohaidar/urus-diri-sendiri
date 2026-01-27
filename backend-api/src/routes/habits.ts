import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { parseJsonField, stringifyJsonField } from '../utils';

const habits = new Hono<{ Bindings: Env }>();

habits.use('*', authMiddleware);

// Get all habits
habits.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const since = c.req.query('since');

    let query = 'SELECT * FROM habits WHERE user_id = ?';
    const params: any[] = [userId];

    if (since) {
      query += ' AND (updated_at > ? OR deleted_at > ?)';
      params.push(since, since);
    } else {
      query += ' AND deleted_at IS NULL';
    }

    query += ' ORDER BY created_at DESC';

    const result = await c.env.DB.prepare(query).bind(...params).all();

    const habits = (result.results || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      color: row.color,
      frequency: row.frequency,
      interval: row.interval_days,
      specificDays: parseJsonField(row.specific_days),
      allowedDayOff: row.allowed_day_off,
      targetCount: row.target_count,
      isArchived: row.is_archived === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    }));

    return c.json({ success: true, data: habits });
  } catch (error) {
    console.error('Get habits error:', error);
    return c.json({ success: false, error: 'Failed to fetch habits' }, 500);
  }
});

// Upsert habits (batch)
habits.put('/', async (c) => {
  try {
    const userId = c.get('userId');
    const items = await c.req.json();

    if (!Array.isArray(items)) {
      return c.json({ success: false, error: 'Expected array of habits' }, 400);
    }

    if (items.length === 0) {
      return c.json({ success: true, message: 'No habits to save' });
    }

    const now = new Date().toISOString();

    const statements = items.map((item: any) =>
      c.env.DB.prepare(`
        INSERT INTO habits (id, name, description, icon, color, frequency, interval_days, specific_days, allowed_day_off, target_count, is_archived, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          description = excluded.description,
          icon = excluded.icon,
          color = excluded.color,
          frequency = excluded.frequency,
          interval_days = excluded.interval_days,
          specific_days = excluded.specific_days,
          allowed_day_off = excluded.allowed_day_off,
          target_count = excluded.target_count,
          is_archived = excluded.is_archived,
          updated_at = excluded.updated_at
      `).bind(
        item.id,
        item.name,
        item.description || null,
        item.icon || null,
        item.color || null,
        item.frequency,
        item.interval || null,
        stringifyJsonField(item.specificDays),
        item.allowedDayOff ?? 1,
        item.targetCount ?? 1,
        item.isArchived ? 1 : 0,
        item.createdAt || now,
        item.updatedAt || now,
        userId
      )
    );

    await c.env.DB.batch(statements);

    return c.json({ success: true, message: `Saved ${items.length} habits` });
  } catch (error) {
    console.error('Save habits error:', error);
    return c.json({ success: false, error: 'Failed to save habits' }, 500);
  }
});

export default habits;

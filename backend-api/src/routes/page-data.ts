import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { generateId } from '../utils';
import { parseJsonField, stringifyJsonField } from '../utils';

const pageData = new OpenAPIHono<{ Bindings: Env }>();

pageData.use('*', authMiddleware);

// ========== HELPER FUNCTIONS ==========

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// --- Row Mappers ---

function mapPriorityRow(row: any) {
  return {
    id: row.id,
    text: row.text,
    completed: row.completed === 1,
    completionNote: row.completion_note,
    updatedAt: row.updated_at,
    scheduledFor: row.scheduled_for,
    deletedAt: row.deleted_at,
    calendarEventId: row.calendar_event_id,
  };
}

function mapRoutineRow(row: any) {
  return {
    id: row.id,
    startTime: row.start_time,
    endTime: row.end_time,
    activity: row.activity,
    category: row.category,
    completedAt: row.completed_at,
    completionNote: row.completion_note,
    updatedAt: row.updated_at,
    description: row.description,
    deletedAt: row.deleted_at,
    calendarEventId: row.calendar_event_id,
  };
}

function mapHabitRow(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    color: row.color,
    frequency: row.frequency,
    interval: row.interval_days,
    specificDays: parseJsonField(row.specific_days) ?? null,
    allowedDayOff: row.allowed_day_off ?? 1,
    targetCount: row.target_count,
    isArchived: row.is_archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapHabitLogRow(row: any) {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: row.date,
    completed: row.completed === 1,
    completedAt: row.completed_at,
    count: row.count,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReflectionRow(row: any) {
  return {
    id: row.id,
    date: row.date,
    winOfDay: row.win_of_day || '',
    hurdle: row.hurdle || '',
    priorities: parseJsonField(row.priorities) || [],
    smallChange: row.small_change || '',
    todayRoutines: parseJsonField(row.today_routines) || [],
    todayPriorities: parseJsonField(row.today_priorities) || [],
    images: parseJsonField(row.images) || [],
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapLogRow(row: any) {
  return {
    id: row.id,
    timestamp: row.timestamp,
    type: row.type,
    content: row.content,
    mediaUrl: row.media_url,
    mediaId: row.media_id,
    category: row.category,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

// --- Computed Logic ---

function parseTimeToMinutes(timeStr: string | null): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function isRoutineCompletedToday(item: any): boolean {
  if (!item.completedAt) return false;
  return new Date(item.completedAt).toDateString() === new Date().toDateString();
}

function findCurrentRoutineIndex(routines: any[]): number {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (let i = 0; i < routines.length; i++) {
    const start = parseTimeToMinutes(routines[i].startTime);
    const end = parseTimeToMinutes(routines[i].endTime);
    if (currentMinutes >= start && currentMinutes < end) return i;
    if (currentMinutes < start) return i;
  }
  return 0;
}

function isHabitScheduledFor(habit: any, date: Date): boolean {
  const dayOfWeek = date.getDay();
  switch (habit.frequency) {
    case 'daily': return true;
    case 'weekly': {
      const created = new Date(habit.createdAt);
      const diff = Math.floor((date.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      return diff % 7 === 0;
    }
    case 'every_n_days': {
      const interval = habit.interval || 1;
      const created = new Date(habit.createdAt);
      const diff = Math.floor((date.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      return diff % interval === 0;
    }
    case 'specific_days':
      return (habit.specificDays || []).includes(dayOfWeek);
    default: return false;
  }
}

function calculateStreak(habit: any, logs: any[]): number {
  const allowedDayOff = habit.allowedDayOff ?? 1;
  const habitLogs = logs.filter((l: any) => l.habitId === habit.id);
  let streak = 0;
  let missed = 0;
  const cur = new Date();
  cur.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const check = new Date(cur);
    check.setDate(check.getDate() - i);
    const dateStr = formatDateString(check);
    const scheduled = isHabitScheduledFor(habit, check);
    const log = habitLogs.find((l: any) => l.date === dateStr && l.completed);

    if (scheduled) {
      if (log) { streak++; missed = 0; }
      else { missed++; if (missed > allowedDayOff) break; }
    }
  }
  return streak;
}

function calculateLongestStreak(habit: any, logs: any[]): number {
  const allowedDayOff = habit.allowedDayOff ?? 1;
  const habitLogs = logs.filter((l: any) => l.habitId === habit.id);
  const sorted = [...habitLogs].sort((a: any, b: any) => a.date.localeCompare(b.date));
  if (sorted.length === 0) return 0;

  let longest = 0, current = 0, missed = 0;
  const start = new Date(sorted[0].date);
  const end = new Date();
  const check = new Date(start);

  while (check <= end) {
    const dateStr = formatDateString(check);
    const scheduled = isHabitScheduledFor(habit, check);
    const log = habitLogs.find((l: any) => l.date === dateStr && l.completed);

    if (scheduled) {
      if (log) { current++; missed = 0; longest = Math.max(longest, current); }
      else { missed++; if (missed > allowedDayOff) { current = 0; missed = 0; } }
    }
    check.setDate(check.getDate() + 1);
  }
  return longest;
}

function calculateCompletionRate(habit: any, logs: any[], startDate: Date, endDate: Date) {
  const habitLogs = logs.filter((l: any) => l.habitId === habit.id);
  let completed = 0, total = 0;
  const cur = new Date(startDate);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (cur <= end) {
    if (isHabitScheduledFor(habit, cur)) {
      total++;
      const dateStr = formatDateString(cur);
      if (habitLogs.find((l: any) => l.date === dateStr && l.completed)) completed++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, rate };
}

function getFrequencyText(habit: any): string {
  switch (habit.frequency) {
    case 'daily': return 'Daily';
    case 'weekly': return 'Weekly';
    case 'every_n_days': return `Every ${habit.interval || 1} days`;
    case 'specific_days': {
      const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return (habit.specificDays || []).map((d: number) => names[d]).join(', ') || 'No days';
    }
    default: return 'Unknown';
  }
}

// --- Filtering logic ---

function filterTodayPriorities(allPriorities: any[]) {
  const todayISO = getTodayString();

  const filtered = allPriorities.filter(p => {
    if (p.scheduledFor && p.scheduledFor > todayISO) return false;
    if (p.completed) {
      const isScheduledToday = p.scheduledFor === todayISO;
      const isUpdatedToday = p.updatedAt?.startsWith(todayISO);
      const isUnscheduled = !p.scheduledFor;
      return isScheduledToday || isUpdatedToday || isUnscheduled;
    }
    return true;
  });

  filtered.sort((a: any, b: any) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const dateA = a.scheduledFor || todayISO;
    const dateB = b.scheduledFor || todayISO;
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return (b.updatedAt || '').localeCompare(a.updatedAt || '');
  });

  return filtered;
}

// ========== DATA FETCHERS (reusable DB query blocks) ==========

async function fetchPriorities(db: D1Database, userId: string) {
  const result = await db.prepare(
    'SELECT * FROM priorities WHERE user_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC'
  ).bind(userId).all();
  return (result.results || []).map(mapPriorityRow);
}

async function fetchRoutines(db: D1Database, userId: string) {
  const result = await db.prepare(
    'SELECT * FROM routines WHERE user_id = ? AND deleted_at IS NULL ORDER BY start_time ASC'
  ).bind(userId).all();
  return (result.results || []).map(mapRoutineRow);
}

async function fetchHabits(db: D1Database, userId: string) {
  const result = await db.prepare(
    'SELECT * FROM habits WHERE user_id = ? AND deleted_at IS NULL AND is_archived = 0 ORDER BY created_at DESC'
  ).bind(userId).all();
  return (result.results || []).map(mapHabitRow);
}

async function fetchHabitLogs(db: D1Database, userId: string) {
  const result = await db.prepare(
    'SELECT * FROM habit_logs WHERE user_id = ? AND deleted_at IS NULL ORDER BY date DESC'
  ).bind(userId).all();
  return (result.results || []).map(mapHabitLogRow);
}

async function fetchTodayReflection(db: D1Database, userId: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const result = await db.prepare(`
    SELECT * FROM reflections 
    WHERE user_id = ? AND deleted_at IS NULL AND date >= ? AND date < ?
    ORDER BY updated_at DESC LIMIT 1
  `).bind(userId, todayStart.toISOString(), tomorrowStart.toISOString()).first();

  return result ? mapReflectionRow(result) : null;
}

async function fetchAllReflections(db: D1Database, userId: string) {
  const result = await db.prepare(
    'SELECT * FROM reflections WHERE user_id = ? AND deleted_at IS NULL ORDER BY date DESC'
  ).bind(userId).all();
  return (result.results || []).map(mapReflectionRow);
}

async function fetchLogs(db: D1Database, userId: string) {
  const result = await db.prepare(
    'SELECT * FROM logs WHERE user_id = ? AND deleted_at IS NULL ORDER BY timestamp DESC'
  ).bind(userId).all();
  return (result.results || []).map(mapLogRow);
}

// ========== COMPUTED ASSEMBLERS ==========

function assembleRoutinesToday(routines: any[]) {
  const today = new Date().toDateString();

  // Daily reset: clear completions from previous days
  const resetIds: string[] = [];
  routines = routines.map(r => {
    if (r.completedAt && new Date(r.completedAt).toDateString() !== today) {
      resetIds.push(r.id);
      return { ...r, completedAt: null };
    }
    return r;
  });

  routines.sort((a: any, b: any) =>
    parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)
  );

  const total = routines.length;
  const completed = routines.filter(isRoutineCompletedToday).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    routines,
    stats: { total, completed, percent },
    activeIndex: findCurrentRoutineIndex(routines),
    resetIds,
  };
}

function assembleHabitsToday(habits: any[], logs: any[]) {
  const today = new Date();
  const todayStr = getTodayString();

  return habits
    .filter(h => isHabitScheduledFor(h, today))
    .map(h => {
      const log = logs.find((l: any) => l.habitId === h.id && l.date === todayStr);
      return {
        ...h,
        isScheduledToday: true,
        isCompletedToday: !!log?.completed,
        currentStreak: calculateStreak(h, logs),
        frequencyText: getFrequencyText(h),
      };
    });
}

function assembleHabitsWithStatus(habits: any[], logs: any[]) {
  const today = new Date();
  const todayStr = getTodayString();

  return habits.map(h => {
    const log = logs.find((l: any) => l.habitId === h.id && l.date === todayStr);
    return {
      ...h,
      isScheduledToday: isHabitScheduledFor(h, today),
      isCompletedToday: !!log?.completed,
      currentStreak: calculateStreak(h, logs),
      frequencyText: getFrequencyText(h),
    };
  });
}

function isCheckinCompleted(reflections: any[]) {
  const today = new Date().toDateString();
  return reflections.some(r => {
    const isToday = r.date && new Date(r.date).toDateString() === today;
    const hasContent =
      (r.winOfDay && r.winOfDay.trim().length > 0) ||
      (r.hurdle && r.hurdle.trim().length > 0) ||
      (r.smallChange && r.smallChange.trim().length > 0);
    return isToday && hasContent;
  });
}

function deduplicateReflections(reflections: any[]) {
  const uniqueMap = new Map<string, any>();
  for (const r of reflections) {
    const dateKey = r.date ? new Date(r.date).toDateString() : r.id;
    const existing = uniqueMap.get(dateKey);
    if (!existing) { uniqueMap.set(dateKey, r); continue; }
    const currTime = r.updatedAt ? new Date(r.updatedAt).getTime() : 0;
    const existTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
    if (currTime > existTime) uniqueMap.set(dateKey, r);
  }
  return Array.from(uniqueMap.values()).sort((a, b) =>
    new Date(b.date || '').getTime() - new Date(a.date || '').getTime()
  );
}

// ========== ROUTES ==========

// POST /api/page-data - Universal page data endpoint
const getPageDataRoute = createRoute({
  method: 'post',
  path: '/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            page: z.enum([
              'home',           // Dashboard: routines, priorities, today habits, checkin status
              'habits',         // Habits list: all habits with status
              'habit-detail',   // Single habit: stats, logs, calendar
              'history',        // History: reflections (deduplicated) OR logs
              'checkin',        // Maghrib checkin: today's reflection + routines + priorities
            ]),
            // Optional params for specific pages
            habitId: z.string().optional(),          // for habit-detail
            historyTab: z.enum(['reflections', 'logs']).optional(), // for history
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.any(),
          }),
        },
      },
      description: 'Get all data needed for a specific page in one request',
    },
    400: { description: 'Bad Request' },
    500: { description: 'Server Error' },
  },
});

pageData.openapi(getPageDataRoute, async (c) => {
  try {
    const userId = c.get('userId');
    const { page, habitId, historyTab } = c.req.valid('json');
    const db = c.env.DB;

    switch (page) {
      // ===== HOME (Dashboard) =====
      // Frontend needs: routines(today), priorities(today), todayHabits, checkinStatus
      case 'home': {
        const [allPriorities, rawRoutines, habits, habitLogs, todayReflection] = await Promise.all([
          fetchPriorities(db, userId),
          fetchRoutines(db, userId),
          fetchHabits(db, userId),
          fetchHabitLogs(db, userId),
          fetchTodayReflection(db, userId),
        ]);

        const priorities = filterTodayPriorities(allPriorities);
        const routineData = assembleRoutinesToday(rawRoutines);
        const todayHabits = assembleHabitsToday(habits, habitLogs);
        const checkinCompleted = todayReflection
          ? !!(todayReflection.winOfDay?.trim() || todayReflection.hurdle?.trim() || todayReflection.smallChange?.trim())
          : false;

        // Side effect: persist routine resets if any happened
        if (routineData.resetIds.length > 0) {
          const now = new Date().toISOString();
          const stmts = routineData.resetIds.map(id =>
            db.prepare('UPDATE routines SET completed_at = NULL, updated_at = ? WHERE id = ? AND user_id = ?')
              .bind(now, id, userId)
          );
          // Fire and forget - don't block response
          c.executionCtx.waitUntil(db.batch(stmts));
        }

        return c.json({
          success: true,
          data: {
            routines: routineData.routines,
            routineStats: routineData.stats,
            activeIndex: routineData.activeIndex,
            priorities,
            todayHabits,
            checkinCompleted,
          },
        }, 200);
      }

      // ===== HABITS LIST =====
      // Frontend needs: all habits with today status + streak
      case 'habits': {
        const [habits, habitLogs] = await Promise.all([
          fetchHabits(db, userId),
          fetchHabitLogs(db, userId),
        ]);

        return c.json({
          success: true,
          data: {
            habits: assembleHabitsWithStatus(habits, habitLogs),
            todayHabits: assembleHabitsToday(habits, habitLogs),
          },
        }, 200);
      }

      // ===== HABIT DETAIL =====
      // Frontend needs: habit data, logs, stats (streak, longest, completion rates)
      case 'habit-detail': {
        if (!habitId) {
          return c.json({ success: false, error: 'habitId is required' }, 400);
        }

        const [habitResult, logsResult] = await Promise.all([
          db.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ? AND deleted_at IS NULL')
            .bind(habitId, userId).first(),
          db.prepare('SELECT * FROM habit_logs WHERE habit_id = ? AND user_id = ? AND deleted_at IS NULL ORDER BY date DESC')
            .bind(habitId, userId).all(),
        ]);

        if (!habitResult) {
          return c.json({ success: false, error: 'Habit not found' }, 404);
        }

        const habit = mapHabitRow(habitResult);
        const logs = (logsResult.results || []).map(mapHabitLogRow);
        const completedLogs = logs.filter(l => l.completed);

        const now = new Date();
        const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
        const monthStart = new Date(now); monthStart.setDate(now.getDate() - 29);

        return c.json({
          success: true,
          data: {
            habit,
            logs: completedLogs,
            stats: {
              currentStreak: calculateStreak(habit, logs),
              longestStreak: calculateLongestStreak(habit, logs),
              weekStats: calculateCompletionRate(habit, logs, weekStart, now),
              monthStats: calculateCompletionRate(habit, logs, monthStart, now),
              totalCompleted: completedLogs.length,
              frequencyText: getFrequencyText(habit),
            },
          },
        }, 200);
      }

      // ===== HISTORY =====
      // Frontend needs: reflections (deduplicated) OR logs depending on tab
      case 'history': {
        const tab = historyTab || 'reflections';

        if (tab === 'reflections') {
          const reflections = await fetchAllReflections(db, userId);
          return c.json({
            success: true,
            data: { reflections: deduplicateReflections(reflections) },
          }, 200);
        } else {
          const logs = await fetchLogs(db, userId);
          return c.json({
            success: true,
            data: { logs },
          }, 200);
        }
      }

      // ===== MAGHRIB CHECKIN =====
      // Frontend needs: today's reflection, routines, priorities (for snapshot)
      case 'checkin': {
        const [todayReflection, allPriorities, rawRoutines] = await Promise.all([
          fetchTodayReflection(db, userId),
          fetchPriorities(db, userId),
          fetchRoutines(db, userId),
        ]);

        const priorities = filterTodayPriorities(allPriorities);

        return c.json({
          success: true,
          data: {
            todayReflection,
            routines: rawRoutines,
            priorities,
          },
        }, 200);
      }

      default:
        return c.json({ success: false, error: `Unknown page: ${page}` }, 400);
    }
  } catch (error) {
    console.error('Page data error:', error);
    return c.json({ success: false, error: 'Failed to fetch page data' }, 500);
  }
});

// ========== ACTION ENDPOINTS ==========
// These handle mutations that were previously done in frontend logic

// POST /toggle-habit - Toggle habit completion
const toggleHabitRoute = createRoute({
  method: 'post',
  path: '/toggle-habit',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            habitId: z.string(),
            date: z.string().optional(),
            note: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ completed: z.boolean(), log: z.any() }).optional(),
          }),
        },
      },
      description: 'Toggle habit completion',
    },
    404: { description: 'Habit not found' },
    500: { description: 'Server Error' },
  },
});

pageData.openapi(toggleHabitRoute, async (c) => {
  try {
    const userId = c.get('userId');
    const { habitId, date, note } = c.req.valid('json');
    const targetDate = date || getTodayString();
    const now = new Date().toISOString();
    const db = c.env.DB;

    // Check habit exists
    const habitRow = await db.prepare(
      'SELECT id FROM habits WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
    ).bind(habitId, userId).first();

    if (!habitRow) {
      return c.json({ success: false, error: 'Habit not found' }, 404);
    }

    // Check existing log
    const existingLog = await db.prepare(
      'SELECT * FROM habit_logs WHERE habit_id = ? AND date = ? AND user_id = ? AND deleted_at IS NULL'
    ).bind(habitId, targetDate, userId).first() as any;

    let completed: boolean;
    let logData: any;

    if (existingLog && existingLog.completed === 1) {
      completed = false;
      await db.prepare(
        'UPDATE habit_logs SET completed = 0, deleted_at = ?, updated_at = ? WHERE id = ?'
      ).bind(now, now, existingLog.id).run();
      logData = { id: existingLog.id, completed: false, deletedAt: now };
    } else if (existingLog) {
      completed = true;
      await db.prepare(
        'UPDATE habit_logs SET completed = 1, completed_at = ?, note = ?, updated_at = ?, deleted_at = NULL WHERE id = ?'
      ).bind(now, note || null, now, existingLog.id).run();
      logData = { id: existingLog.id, completed: true, completedAt: now, note };
    } else {
      completed = true;
      const logId = generateId('hlog');
      await db.prepare(
        'INSERT INTO habit_logs (id, habit_id, date, completed, completed_at, note, count, created_at, updated_at, user_id) VALUES (?, ?, ?, 1, ?, ?, 1, ?, ?, ?)'
      ).bind(logId, habitId, targetDate, now, note || null, now, now, userId).run();
      logData = { id: logId, habitId, date: targetDate, completed: true, completedAt: now, note };
    }

    return c.json({ success: true, data: { completed, log: logData } }, 200);
  } catch (error) {
    console.error('Toggle habit error:', error);
    return c.json({ success: false, error: 'Failed to toggle habit' }, 500);
  }
});

// POST /toggle-routine - Toggle routine completion
const toggleRoutineRoute = createRoute({
  method: 'post',
  path: '/toggle-routine',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            routineId: z.string(),
            note: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ completed: z.boolean(), routine: z.any() }).optional(),
          }),
        },
      },
      description: 'Toggle routine completion',
    },
    404: { description: 'Routine not found' },
    500: { description: 'Server Error' },
  },
});

pageData.openapi(toggleRoutineRoute, async (c) => {
  try {
    const userId = c.get('userId');
    const { routineId, note } = c.req.valid('json');
    const now = new Date().toISOString();
    const db = c.env.DB;

    const routineRow = await db.prepare(
      'SELECT * FROM routines WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
    ).bind(routineId, userId).first() as any;

    if (!routineRow) {
      return c.json({ success: false, error: 'Routine not found' }, 404);
    }

    const routine = mapRoutineRow(routineRow);
    const isCompleted = isRoutineCompletedToday(routine);

    if (isCompleted) {
      await db.prepare(
        'UPDATE routines SET completed_at = NULL, completion_note = ?, updated_at = ? WHERE id = ? AND user_id = ?'
      ).bind(note !== undefined ? note : routine.completionNote, now, routineId, userId).run();

      return c.json({
        success: true,
        data: { completed: false, routine: { ...routine, completedAt: null, updatedAt: now } },
      }, 200);
    } else {
      await db.prepare(
        'UPDATE routines SET completed_at = ?, completion_note = ?, updated_at = ? WHERE id = ? AND user_id = ?'
      ).bind(now, note || routine.completionNote || null, now, routineId, userId).run();

      return c.json({
        success: true,
        data: { completed: true, routine: { ...routine, completedAt: now, completionNote: note || routine.completionNote, updatedAt: now } },
      }, 200);
    }
  } catch (error) {
    console.error('Toggle routine error:', error);
    return c.json({ success: false, error: 'Failed to toggle routine' }, 500);
  }
});

// POST /reset-priorities - Reset old completed priorities
const resetPrioritiesRoute = createRoute({
  method: 'post',
  path: '/reset-priorities',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ resetCount: z.number() }).optional(),
          }),
        },
      },
      description: 'Reset old completed priorities',
    },
    500: { description: 'Server Error' },
  },
});

pageData.openapi(resetPrioritiesRoute, async (c) => {
  try {
    const userId = c.get('userId');
    const todayISO = getTodayString();
    const now = new Date().toISOString();
    const db = c.env.DB;

    const result = await db.prepare(`
      SELECT id FROM priorities
      WHERE user_id = ? AND deleted_at IS NULL AND completed = 1
        AND scheduled_for IS NULL AND updated_at < ?
    `).bind(userId, todayISO + 'T00:00:00.000Z').all();

    const toReset = result.results || [];
    if (toReset.length === 0) {
      return c.json({ success: true, data: { resetCount: 0 } }, 200);
    }

    const stmts = toReset.map((row: any) =>
      db.prepare('UPDATE priorities SET completed = 0, updated_at = ? WHERE id = ? AND user_id = ?')
        .bind(now, row.id, userId)
    );
    await db.batch(stmts);

    return c.json({ success: true, data: { resetCount: toReset.length } }, 200);
  } catch (error) {
    console.error('Reset priorities error:', error);
    return c.json({ success: false, error: 'Failed to reset priorities' }, 500);
  }
});

// POST /snapshot - Auto-snapshot today's progress into reflection
const snapshotRoute = createRoute({
  method: 'post',
  path: '/snapshot',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            todayRoutines: z.array(z.any()).optional(),
            todayPriorities: z.array(z.any()).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.any().nullable(),
          }),
        },
      },
      description: 'Snapshot today\'s progress',
    },
    500: { description: 'Server Error' },
  },
});

pageData.openapi(snapshotRoute, async (c) => {
  try {
    const userId = c.get('userId');
    const body = c.req.valid('json');
    const now = new Date().toISOString();
    const db = c.env.DB;

    // Fetch from DB if not provided
    let routinesData = body.todayRoutines;
    let prioritiesData = body.todayPriorities;

    if (!routinesData || !prioritiesData) {
      const [rawRoutines, allPriorities] = await Promise.all([
        !routinesData ? fetchRoutines(db, userId) : Promise.resolve(null),
        !prioritiesData ? fetchPriorities(db, userId) : Promise.resolve(null),
      ]);
      if (rawRoutines) routinesData = rawRoutines;
      if (allPriorities) prioritiesData = filterTodayPriorities(allPriorities);
    }

    const hasProgress =
      (routinesData || []).some((r: any) => r.completedAt) ||
      (prioritiesData || []).some((p: any) => p.completed);

    if (!hasProgress) {
      return c.json({ success: true, data: null }, 200);
    }

    const existing = await fetchTodayReflection(db, userId);

    if (existing) {
      await db.prepare(`
        UPDATE reflections SET today_routines = ?, today_priorities = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
      `).bind(
        stringifyJsonField(routinesData), stringifyJsonField(prioritiesData),
        now, existing.id, userId
      ).run();

      return c.json({
        success: true,
        data: { ...existing, todayRoutines: routinesData, todayPriorities: prioritiesData, updatedAt: now },
      }, 200);
    } else {
      const id = generateId('ref');
      await db.prepare(`
        INSERT INTO reflections (id, date, win_of_day, hurdle, priorities, small_change, today_routines, today_priorities, images, updated_at, user_id)
        VALUES (?, ?, '', '', '[]', '', ?, ?, '[]', ?, ?)
      `).bind(id, now, stringifyJsonField(routinesData), stringifyJsonField(prioritiesData), now, userId).run();

      return c.json({
        success: true,
        data: { id, date: now, winOfDay: '', hurdle: '', priorities: [], smallChange: '', todayRoutines: routinesData, todayPriorities: prioritiesData, images: [], updatedAt: now },
      }, 200);
    }
  } catch (error) {
    console.error('Snapshot error:', error);
    return c.json({ success: false, error: 'Failed to save snapshot' }, 500);
  }
});

export default pageData;

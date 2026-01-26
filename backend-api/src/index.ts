import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';

// Import routes
import auth from './routes/auth';
import priorities from './routes/priorities';
import routines from './routes/routines';
import notes from './routes/notes';
import noteHistories from './routes/note-histories';
import reflections from './routes/reflections';
import logs from './routes/logs';
import habits from './routes/habits';
import habitLogs from './routes/habit-logs';
import personalNotes from './routes/personal-notes';

const app = new Hono<{ Bindings: Env }>();

// CORS middleware - allow requests from the frontend
app.use('*', cors({
  origin: '*', // In production, set to specific domains
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Urus Diri Sendiri API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (c) => {
  return c.json({ success: true, status: 'healthy' });
});

// Mount routes
app.route('/api/auth', auth);
app.route('/api/priorities', priorities);
app.route('/api/routines', routines);
app.route('/api/notes', notes);
app.route('/api/note-histories', noteHistories);
app.route('/api/reflections', reflections);
app.route('/api/logs', logs);
app.route('/api/habits', habits);
app.route('/api/habit-logs', habitLogs);
app.route('/api/personal-notes', personalNotes);

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ success: false, error: 'Internal server error' }, 500);
});

export default app;

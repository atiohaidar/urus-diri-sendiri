import { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
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

const app = new OpenAPIHono<{ Bindings: Env }>();

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

// OpenAPI Documentation
app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
});

app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Urus Diri Sendiri API',
  },
});

app.get(
  '/reference',
  apiReference({
    spec: {
      url: '/doc',
    },
  } as any)
);

// Mount routes
import sync from './routes/sync';

const routes = app
  .route('/api/auth', auth)
  .route('/api/priorities', priorities)
  .route('/api/routines', routines)
  .route('/api/notes', notes)
  .route('/api/note-histories', noteHistories)
  .route('/api/reflections', reflections)
  .route('/api/logs', logs)
  .route('/api/habits', habits)
  .route('/api/habit-logs', habitLogs)
  .route('/api/personal-notes', personalNotes)
  .route('/api/sync', sync);

export type AppType = typeof routes;

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

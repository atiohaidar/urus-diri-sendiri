import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { Env } from '../types';
import { generateId, createToken, hashPassword, verifyPassword } from '../utils';

const auth = new OpenAPIHono<{ Bindings: Env }>();

// Helper to get JWT secret with validation
function getJwtSecret(c: { env: Env }): string {
  const secret = c.env.JWT_SECRET;
  if (!secret) {
    if (c.env.ENVIRONMENT === 'development') {
      console.warn('JWT_SECRET not set - using development fallback. DO NOT use in production!');
      return 'dev-secret-change-in-production';
    }
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  return secret;
}

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
});

const authResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    user: userSchema,
    token: z.string(),
  }).optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

const meResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    user: userSchema
  }).optional(),
  error: z.string().optional(),
});

// Register new user
const registerRoute = createRoute({
  method: 'post',
  path: '/register',
  request: {
    body: {
      content: {
        'application/json': {
          schema: authSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: authResponseSchema,
        },
      },
      description: 'User registered',
    },
    400: { description: 'Bad request' },
    409: { description: 'User already exists' },
    500: { description: 'Server error' },
  },
});

auth.openapi(registerRoute, async (c) => {
  try {
    const { email, password } = c.req.valid('json');

    // Check if user already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existingUser) {
      return c.json({ success: false, error: 'User with this email already exists' }, 409);
    }

    // Create user
    const userId = generateId('user');
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    await c.env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(userId, email, passwordHash, now, now).run();

    // Create token
    let jwtSecret: string;
    try {
      jwtSecret = getJwtSecret(c);
    } catch (error) {
      console.error('JWT configuration error:', error);
      return c.json({ success: false, error: 'Server configuration error' }, 500);
    }

    const token = await createToken({
      userId,
      email,
      exp: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    }, jwtSecret);

    // Store session
    const sessionId = generateId('session');
    const expiresAt = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString();

    await c.env.DB.prepare(
      'INSERT INTO sessions (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(sessionId, userId, token, expiresAt, now).run();

    return c.json({
      success: true,
      data: {
        user: { id: userId, email },
        token
      }
    }, 200);
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ success: false, error: 'Registration failed' }, 500);
  }
});

// Login
const loginRoute = createRoute({
  method: 'post',
  path: '/login',
  request: {
    body: {
      content: {
        'application/json': {
          schema: authSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: authResponseSchema,
        },
      },
      description: 'Login successful',
    },
    400: { description: 'Bad request' },
    401: { description: 'Invalid credentials' },
    500: { description: 'Server error' },
  },
});

auth.openapi(loginRoute, async (c) => {
  try {
    const { email, password } = c.req.valid('json');

    // Find user
    const user = await c.env.DB.prepare(
      'SELECT id, email, password_hash FROM users WHERE email = ?'
    ).bind(email).first<{ id: string; email: string; password_hash: string }>();

    if (!user) {
      return c.json({ success: false, error: 'Invalid email or password' }, 401);
    }

    // Verify password
    const validPassword = await verifyPassword(password, user.password_hash);
    if (!validPassword) {
      return c.json({ success: false, error: 'Invalid email or password' }, 401);
    }

    // Create token
    let jwtSecret: string;
    try {
      jwtSecret = getJwtSecret(c);
    } catch (error) {
      console.error('JWT configuration error:', error);
      return c.json({ success: false, error: 'Server configuration error' }, 500);
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      exp: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    }, jwtSecret);

    // Store session
    const sessionId = generateId('session');
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString();

    await c.env.DB.prepare(
      'INSERT INTO sessions (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(sessionId, user.id, token, expiresAt, now).run();

    return c.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email },
        token
      }
    }, 200);
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ success: false, error: 'Login failed' }, 500);
  }
});

// Logout
const logoutRoute = createRoute({
  method: 'post',
  path: '/logout',
  responses: {
    200: {
      content: { 'application/json': { schema: authResponseSchema } },
      description: 'Logout successful'
    },
    500: { description: 'Server error' }
  }
});

auth.openapi(logoutRoute, async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);

      // Delete session
      await c.env.DB.prepare(
        'DELETE FROM sessions WHERE token = ?'
      ).bind(token).run();
    }

    return c.json({ success: true, message: 'Logged out successfully' }, 200);
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ success: false, error: 'Logout failed' }, 500);
  }
});

// Get current user
const meRoute = createRoute({
  method: 'get',
  path: '/me',
  responses: {
    200: {
      content: { 'application/json': { schema: meResponseSchema } },
      description: 'Current user'
    },
    401: { description: 'Unauthorized' },
    500: { description: 'Server error' }
  }
});

auth.openapi(meRoute, async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const token = authHeader.slice(7);

    // Find session and user
    const session = await c.env.DB.prepare(
      `SELECT s.user_id, u.email, s.expires_at 
       FROM sessions s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.token = ?`
    ).bind(token).first<{ user_id: string; email: string; expires_at: string }>();

    if (!session) {
      return c.json({ success: false, error: 'Invalid session' }, 401);
    }

    // Check if session expired
    if (new Date(session.expires_at) < new Date()) {
      await c.env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
      return c.json({ success: false, error: 'Session expired' }, 401);
    }

    return c.json({
      success: true,
      data: {
        user: {
          id: session.user_id,
          email: session.email
        }
      }
    }, 200);
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ success: false, error: 'Failed to get user' }, 500);
  }
});

export default auth;

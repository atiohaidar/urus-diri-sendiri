import { Context, Next } from 'hono';
import { verifyToken } from '../utils';
import type { Env, AuthPayload } from '../types';

// Extend Hono context to include user
declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
    userEmail: string;
  }
}

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized: No token provided' }, 401);
  }
  
  const token = authHeader.slice(7);
  const jwtSecret = c.env.JWT_SECRET || 'dev-secret-change-in-production';
  
  const payload = await verifyToken(token, jwtSecret);
  
  if (!payload) {
    return c.json({ success: false, error: 'Unauthorized: Invalid or expired token' }, 401);
  }
  
  // Set user info in context
  c.set('userId', payload.userId);
  c.set('userEmail', payload.email);
  
  await next();
}

// Optional auth middleware - sets user if token present but doesn't require it
export async function optionalAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const jwtSecret = c.env.JWT_SECRET || 'dev-secret-change-in-production';
    
    const payload = await verifyToken(token, jwtSecret);
    
    if (payload) {
      c.set('userId', payload.userId);
      c.set('userEmail', payload.email);
    }
  }
  
  await next();
}

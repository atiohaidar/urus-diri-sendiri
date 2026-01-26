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

// Helper to get JWT secret with validation
function getJwtSecret(c: Context<{ Bindings: Env }>): string {
  const secret = c.env.JWT_SECRET;
  if (!secret) {
    // In development, use a dev secret with warning
    if (c.env.ENVIRONMENT === 'development') {
      console.warn('JWT_SECRET not set - using development fallback. DO NOT use in production!');
      return 'dev-secret-change-in-production';
    }
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  return secret;
}

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized: No token provided' }, 401);
  }
  
  const token = authHeader.slice(7);
  
  let jwtSecret: string;
  try {
    jwtSecret = getJwtSecret(c);
  } catch (error) {
    console.error('JWT configuration error:', error);
    return c.json({ success: false, error: 'Server configuration error' }, 500);
  }
  
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
    
    let jwtSecret: string;
    try {
      jwtSecret = getJwtSecret(c);
    } catch (error) {
      // In optional auth, just skip if secret is not configured
      console.warn('JWT_SECRET not configured for optional auth');
      await next();
      return;
    }
    
    const payload = await verifyToken(token, jwtSecret);
    
    if (payload) {
      c.set('userId', payload.userId);
      c.set('userEmail', payload.email);
    }
  }
  
  await next();
}

import type { MiddlewareHandler } from 'hono';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Lightweight, in-memory rate limiting middleware for Hono on Cloudflare Workers.
 * Tracks client requests by IP address (CF-Connecting-IP or X-Forwarded-For).
 */
export function rateLimiter(options: { windowMs: number; max: number }): MiddlewareHandler {
  const { windowMs, max } = options;

  return async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    
    // Bypass rate limiting untuk local development/testing
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'unknown') {
      await next();
      return;
    }

    const now = Date.now();

    let record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      rateLimitMap.set(ip, record);
    } else {
      record.count += 1;
    }

    if (record.count > max) {
      return c.json({
        success: false,
        error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.'
      }, 429);
    }

    // Set standard RateLimit headers
    c.header('X-RateLimit-Limit', max.toString());
    c.header('X-RateLimit-Remaining', Math.max(0, max - record.count).toString());
    c.header('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());

    await next();
  };
}

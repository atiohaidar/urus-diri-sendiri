import type { AuthPayload } from './types';

// Generate a unique ID using crypto for better security
export function generateId(prefix: string = 'id'): string {
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);
  const randomPart = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${prefix}-${Date.now()}-${randomPart}`;
}

// Simple JWT-like token encoding (for Cloudflare Workers)
// Note: In production, use a proper JWT library or Cloudflare's built-in auth
export async function createToken(payload: AuthPayload, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadStr = btoa(JSON.stringify(payload));
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${header}.${payloadStr}`)
  );
  
  const signatureStr = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${header}.${payloadStr}.${signatureStr}`;
}

export async function verifyToken(token: string, secret: string): Promise<AuthPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [header, payloadStr, signatureStr] = parts;
    const encoder = new TextEncoder();
    
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signature = Uint8Array.from(atob(signatureStr), c => c.charCodeAt(0));
    
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      encoder.encode(`${header}.${payloadStr}`)
    );
    
    if (!valid) return null;
    
    const payload: AuthPayload = JSON.parse(atob(payloadStr));
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now()) {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}

// Hash password using PBKDF2 via Web Crypto API (much more secure than plain SHA-256)
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  // Derive key using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH * 8
  );
  
  // Encode as: iterations$salt$hash (all base64)
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(derivedBits)));
  
  return `pbkdf2$${PBKDF2_ITERATIONS}$${saltB64}$${hashB64}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Support legacy SHA-256 hashes (no $ separator) for backward compatibility
  if (!storedHash.startsWith('pbkdf2$')) {
    const legacyHash = await legacyHashPassword(password);
    return legacyHash === storedHash;
  }
  
  const encoder = new TextEncoder();
  const parts = storedHash.split('$');
  if (parts.length !== 4) return false;
  
  const [, iterationsStr, saltB64, expectedHashB64] = parts;
  const iterations = parseInt(iterationsStr, 10);
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  // Derive key using same parameters
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH * 8
  );
  
  const actualHashB64 = btoa(String.fromCharCode(...new Uint8Array(derivedBits)));
  return actualHashB64 === expectedHashB64;
}

// Legacy SHA-256 hash for backward compatibility with existing passwords
async function legacyHashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
}

// Convert snake_case DB fields to camelCase for API response
export function toCamelCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

// Convert camelCase to snake_case for DB operations
export function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
}

// Parse JSON fields safely
export function parseJsonField<T>(value: string | null | undefined): T | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

// Stringify for JSON fields
export function stringifyJsonField(value: any): string | null {
  if (value === undefined || value === null) return null;
  return JSON.stringify(value);
}

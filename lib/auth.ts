import { cookies } from 'next/headers';
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';
import { sql } from './db';
import { redirect } from 'next/navigation';

const SESSION_COOKIE = 'fixclub_session';
const ADMIN_COOKIE = 'fixclub_admin';
const SESSION_DAYS = 60;

export type SessionUser = {
  userId: string;
  name: string;
  email: string;
};

export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  const rows = (await sql`
    INSERT INTO sessions (user_id, expires_at)
    VALUES (${userId}, ${expiresAt.toISOString()})
    RETURNING id
  `) as { id: string }[];

  const sessionId = rows[0].id;
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/'
  });
  return sessionId;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const rows = (await sql`
    SELECT s.user_id, u.name, u.email, s.expires_at
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ${sessionId} AND s.expires_at > NOW()
    LIMIT 1
  `) as { user_id: string; name: string; email: string }[];

  if (rows.length === 0) return null;
  return {
    userId: rows[0].user_id,
    name: rows[0].name,
    email: rows[0].email
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (user) return user;
  // Admin without a regular user session can still browse — acts as a
  // pseudo-user. Writes that depend on a real user_id should check isAdmin()
  // explicitly to avoid foreign-key failures.
  if (await isAdmin()) {
    return {
      userId: '00000000-0000-0000-0000-000000000000',
      name: 'Admin',
      email: 'admin@fixclub'
    };
  }
  redirect('/');
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
  }
  cookieStore.delete(SESSION_COOKIE);
}

// Admin uses a separate cookie + password compare
export async function setAdminCookie() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, 'ok', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/'
  });
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === 'ok';
}

export async function destroyAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

// User password hashing (scrypt). Stored format: "salt:hashHex"
export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(plain, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [salt, hashHex] = stored.split(':');
  if (!salt || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(plain, salt, 64);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  if (password.length !== expected.length) return false;
  // constant-time-ish compare
  let diff = 0;
  for (let i = 0; i < password.length; i++) {
    diff |= password.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

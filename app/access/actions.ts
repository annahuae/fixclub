'use server';

import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { createSession, hashPassword, verifyPassword } from '@/lib/auth';

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function submitInvite(formData: FormData) {
  const code = String(formData.get('code') || '')
    .trim()
    .toUpperCase();
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') || '');

  if (!code || !name || !email || password.length < 6 || !isEmail(email)) {
    redirect(
      '/access?mode=invite&error=Заполни+все+поля+(пароль+минимум+6+символов,+email+валидный)'
    );
  }

  const codeRows = (await sql`
    SELECT code, used_by FROM invite_codes WHERE code = ${code} LIMIT 1
  `) as { code: string; used_by: string | null }[];

  if (codeRows.length === 0) {
    redirect('/access?mode=invite&error=Код+не+найден');
  }
  if (codeRows[0].used_by) {
    redirect('/access?mode=invite&error=Этот+код+уже+использован');
  }

  const passwordHash = hashPassword(password);

  const userRows = (await sql`
    INSERT INTO users (name, email, password_hash)
    VALUES (${name}, ${email}, ${passwordHash})
    RETURNING id
  `) as { id: string }[];
  const userId = userRows[0].id;

  await sql`
    UPDATE invite_codes
    SET used_by = ${userId}, used_at = NOW()
    WHERE code = ${code}
  `;

  await createSession(userId);
  redirect('/masters');
}

export async function submitLogin(formData: FormData) {
  const email = String(formData.get('email') || '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    redirect('/access?mode=login&error=Заполни+оба+поля');
  }

  const rows = (await sql`
    SELECT id, password_hash FROM users
    WHERE LOWER(email) = ${email}
    ORDER BY created_at DESC
    LIMIT 1
  `) as { id: string; password_hash: string | null }[];

  if (rows.length === 0 || !rows[0].password_hash) {
    redirect('/access?mode=login&error=Неверный+email+или+пароль');
  }

  if (!verifyPassword(password, rows[0].password_hash)) {
    redirect('/access?mode=login&error=Неверный+email+или+пароль');
  }

  await createSession(rows[0].id);
  redirect('/masters');
}

export async function submitRequest(formData: FormData) {
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '')
    .trim()
    .toLowerCase();
  const reason = String(formData.get('reason') || '').trim() || null;

  if (!name || !email || !isEmail(email)) {
    redirect('/access?mode=request&error=Заполни+имя+и+валидный+email');
  }

  await sql`
    INSERT INTO access_requests (name, email, reason)
    VALUES (${name}, ${email}, ${reason})
  `;

  redirect('/pending');
}

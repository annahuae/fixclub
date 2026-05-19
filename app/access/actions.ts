'use server';

import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { createSession, hashPassword, verifyPassword } from '@/lib/auth';

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function submitLogin(formData: FormData) {
  const email = String(formData.get('email') || '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    redirect('/access?error=Заполни+оба+поля');
  }

  const rows = (await sql`
    SELECT id, password_hash FROM users
    WHERE LOWER(email) = ${email}
    ORDER BY created_at DESC
    LIMIT 1
  `) as { id: string; password_hash: string | null }[];

  if (rows.length === 0 || !rows[0].password_hash) {
    redirect('/access?error=Неверный+email+или+пароль');
  }

  if (!verifyPassword(password, rows[0].password_hash)) {
    redirect('/access?error=Неверный+email+или+пароль');
  }

  await createSession(rows[0].id);
  redirect('/masters');
}

export async function submitSignup(formData: FormData) {
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') || '');
  const code = String(formData.get('code') || '')
    .trim()
    .toUpperCase();
  const reason = String(formData.get('reason') || '').trim() || null;

  if (!name || !email || !isEmail(email) || password.length < 6) {
    redirect(
      '/access?mode=signup&error=Заполни+имя,+email+и+пароль+(минимум+6+символов)'
    );
  }

  // Email already a registered user?
  const existsUser = (await sql`
    SELECT 1 FROM users WHERE LOWER(email) = ${email} LIMIT 1
  `) as { '?column?': number }[];
  if (existsUser.length > 0) {
    redirect('/access?mode=signup&error=Этот+email+уже+зарегистрирован.+Войди.');
  }

  const passwordHash = hashPassword(password);

  if (code) {
    // Invite path — instant access if code has remaining uses
    const codeRows = (await sql`
      SELECT code, usage_count, usage_limit, used_by
      FROM invite_codes WHERE code = ${code} LIMIT 1
    `) as {
      code: string;
      usage_count: number;
      usage_limit: number;
      used_by: string | null;
    }[];

    if (codeRows.length === 0) {
      redirect('/access?mode=signup&error=Инвайт-код+не+найден');
    }
    if (codeRows[0].usage_count >= codeRows[0].usage_limit) {
      redirect(
        '/access?mode=signup&error=Лимит+инвайта+исчерпан.+Попроси+новый.'
      );
    }

    const userRows = (await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email}, ${passwordHash})
      RETURNING id
    `) as { id: string }[];
    const userId = userRows[0].id;

    // First user gets recorded in used_by for legacy display
    if (codeRows[0].used_by === null) {
      await sql`
        UPDATE invite_codes
        SET used_by = ${userId}, used_at = NOW(), usage_count = usage_count + 1
        WHERE code = ${code}
      `;
    } else {
      await sql`
        UPDATE invite_codes
        SET usage_count = usage_count + 1
        WHERE code = ${code}
      `;
    }

    await createSession(userId);
    redirect('/masters');
  }

  // No invite — admin approval queue
  await sql`
    INSERT INTO access_requests (name, email, reason, password_hash)
    VALUES (${name}, ${email}, ${reason}, ${passwordHash})
  `;

  redirect('/pending');
}

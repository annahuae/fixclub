'use server';

import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { createSession, hashPassword, verifyPassword } from '@/lib/auth';

export async function submitInvite(formData: FormData) {
  const code = String(formData.get('code') || '')
    .trim()
    .toUpperCase();
  const name = String(formData.get('name') || '').trim();
  const contact = String(formData.get('contact') || '').trim();
  const password = String(formData.get('password') || '');

  if (!code || !name || !contact || password.length < 6) {
    redirect(
      '/access?mode=invite&error=Заполни+все+поля+(пароль+минимум+6+символов)'
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
    INSERT INTO users (name, contact, password_hash)
    VALUES (${name}, ${contact}, ${passwordHash})
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
  const contact = String(formData.get('contact') || '').trim();
  const password = String(formData.get('password') || '');

  if (!contact || !password) {
    redirect('/access?mode=login&error=Заполни+оба+поля');
  }

  const rows = (await sql`
    SELECT id, password_hash FROM users
    WHERE LOWER(contact) = LOWER(${contact})
    ORDER BY created_at DESC
    LIMIT 1
  `) as { id: string; password_hash: string | null }[];

  if (rows.length === 0 || !rows[0].password_hash) {
    redirect('/access?mode=login&error=Неверный+контакт+или+пароль');
  }

  if (!verifyPassword(password, rows[0].password_hash)) {
    redirect('/access?mode=login&error=Неверный+контакт+или+пароль');
  }

  await createSession(rows[0].id);
  redirect('/masters');
}

export async function submitRequest(formData: FormData) {
  const name = String(formData.get('name') || '').trim();
  const contact = String(formData.get('contact') || '').trim();
  const reason = String(formData.get('reason') || '').trim() || null;

  if (!name || !contact) {
    redirect('/access?mode=request&error=Заполни+имя+и+контакт');
  }

  await sql`
    INSERT INTO access_requests (name, contact, reason)
    VALUES (${name}, ${contact}, ${reason})
  `;

  redirect('/pending');
}

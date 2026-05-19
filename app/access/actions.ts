'use server';

import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function submitInvite(formData: FormData) {
  const code = String(formData.get('code') || '')
    .trim()
    .toUpperCase();
  const name = String(formData.get('name') || '').trim();
  const contact = String(formData.get('contact') || '').trim();

  if (!code || !name || !contact) {
    redirect('/access?mode=invite&error=Заполни+все+поля');
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

  const userRows = (await sql`
    INSERT INTO users (name, contact)
    VALUES (${name}, ${contact})
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

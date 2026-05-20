'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { createSession, hashPassword, verifyPassword } from '@/lib/auth';
import { verifyTelegramAuth, type TelegramAuthData } from '@/lib/telegram';

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function submitLogin(formData: FormData) {
  const email = String(formData.get('email') || '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    redirect('/access?error=Fill+in+both+fields');
  }

  const rows = (await sql`
    SELECT id, password_hash FROM users
    WHERE LOWER(email) = ${email}
    ORDER BY created_at DESC
    LIMIT 1
  `) as { id: string; password_hash: string | null }[];

  if (rows.length === 0 || !rows[0].password_hash) {
    redirect('/access?error=Invalid+email+or+password');
  }

  if (!verifyPassword(password, rows[0].password_hash)) {
    redirect('/access?error=Invalid+email+or+password');
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
      '/access?mode=signup&error=Enter+your+name,+email,+and+password+(minimum+6+characters)'
    );
  }

  // Email already a registered user?
  const existsUser = (await sql`
    SELECT 1 FROM users WHERE LOWER(email) = ${email} LIMIT 1
  `) as { '?column?': number }[];
  if (existsUser.length > 0) {
    redirect('/access?mode=signup&error=This+email+is+already+registered.+Sign+in.');
  }

  const passwordHash = hashPassword(password);

  // Invite codes are temporarily optional — anyone with the link can join.
  // Re-enable the gate later by restoring the `if (!code) -> access_requests`
  // path below and removing this open-signup block.
  void reason;

  if (code) {
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
      redirect('/access?mode=signup&error=Invite+code+not+found');
    }
    if (codeRows[0].usage_count >= codeRows[0].usage_limit) {
      redirect(
        '/access?mode=signup&error=Invite+limit+reached.+Ask+for+a+new+one.'
      );
    }
  }

  const userRows = (await sql`
    INSERT INTO users (name, email, password_hash)
    VALUES (${name}, ${email}, ${passwordHash})
    RETURNING id
  `) as { id: string }[];
  const userId = userRows[0].id;

  if (code) {
    await sql`
      UPDATE invite_codes
      SET usage_count = usage_count + 1,
          used_at = COALESCE(used_at, NOW()),
          used_by = COALESCE(used_by, ${userId})
      WHERE code = ${code}
    `;
  }

  await createSession(userId);
  redirect('/masters');
}

export async function submitTelegramSignup(formData: FormData) {
  const cookieStore = await cookies();
  const pending = cookieStore.get('fixclub_tg_pending')?.value;
  if (!pending) {
    redirect('/access?error=Telegram+session+expired.+Sign+in+again.');
  }

  let parsed: TelegramAuthData | null = null;
  try {
    const obj = JSON.parse(pending) as Record<string, unknown>;
    // Re-verify the HMAC; the cookie body is identical to the original
    // verified payload but we don't trust the cookie contents on its own.
    const params: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v != null) params[k] = String(v);
    }
    parsed = verifyTelegramAuth(params);
  } catch {
    parsed = null;
  }
  if (!parsed) {
    cookieStore.delete('fixclub_tg_pending');
    redirect('/access?error=Telegram+session+invalid.+Sign+in+again.');
  }

  const code = String(formData.get('code') || '')
    .trim()
    .toUpperCase();
  const email = String(formData.get('email') || '')
    .trim()
    .toLowerCase();
  const name =
    String(formData.get('name') || '').trim() ||
    [parsed.first_name, parsed.last_name].filter(Boolean).join(' ').trim() ||
    parsed.username ||
    'Member';

  if (email && !isEmail(email)) {
    redirect('/access?tg=1&error=Invalid+email');
  }

  // Invite codes are temporarily optional — see submitSignup for the toggle.
  if (code) {
    const codeRows = (await sql`
      SELECT code, usage_count, usage_limit
      FROM invite_codes WHERE code = ${code} LIMIT 1
    `) as { code: string; usage_count: number; usage_limit: number }[];

    if (codeRows.length === 0) {
      redirect('/access?tg=1&error=Invite+code+not+found');
    }
    if (codeRows[0].usage_count >= codeRows[0].usage_limit) {
      redirect('/access?tg=1&error=Invite+limit+reached');
    }
  }

  // Email collision protection (skip if no email provided)
  if (email) {
    const collide = (await sql`
      SELECT 1 FROM users WHERE LOWER(email) = ${email} LIMIT 1
    `) as { '?column?': number }[];
    if (collide.length > 0) {
      redirect('/access?tg=1&error=This+email+is+already+registered');
    }
  }

  const finalEmail = email || `tg-${parsed.id}@telegram`;
  const userRows = (await sql`
    INSERT INTO users (name, email, telegram_id, telegram_username, telegram_photo)
    VALUES (${name}, ${finalEmail}, ${parsed.id}, ${parsed.username || null}, ${parsed.photo_url || null})
    RETURNING id
  `) as { id: string }[];
  const userId = userRows[0].id;

  if (code) {
    await sql`
      UPDATE invite_codes
      SET usage_count = usage_count + 1,
          used_at = COALESCE(used_at, NOW()),
          used_by = COALESCE(used_by, ${userId})
      WHERE code = ${code}
    `;
  }

  cookieStore.delete('fixclub_tg_pending');
  await createSession(userId);
  redirect('/masters');
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { verifyTelegramAuth } from '@/lib/telegram';

// Telegram Login Widget redirects here with the auth payload as query params.
// We verify the HMAC, then either log in an existing user or stash the
// payload in a short-lived cookie and send them to a signup-completion page
// where they enter an invite code.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    params[k] = v;
  });

  const data = verifyTelegramAuth(params);
  if (!data) {
    return NextResponse.redirect(
      new URL('/access?error=Telegram+sign-in+failed', url.origin)
    );
  }

  // Already linked?
  const existing = (await sql`
    SELECT id FROM users WHERE telegram_id = ${data.id} LIMIT 1
  `) as { id: string }[];

  if (existing.length > 0) {
    // Update profile bits in case username/photo changed
    await sql`
      UPDATE users
      SET telegram_username = ${data.username || null},
          telegram_photo = ${data.photo_url || null}
      WHERE id = ${existing[0].id}
    `;
    await createSession(existing[0].id);
    return NextResponse.redirect(new URL('/masters', url.origin));
  }

  // Not linked yet — stash the verified payload in an HTTP-only cookie and
  // send the user to the invite-code step.
  const cookieStore = await cookies();
  cookieStore.set(
    'fixclub_tg_pending',
    JSON.stringify(data),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/'
    }
  );

  return NextResponse.redirect(new URL('/access?tg=1', url.origin));
}

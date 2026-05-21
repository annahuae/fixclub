import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { LOCALES, LOCALE_COOKIE, type Locale } from '@/lib/i18n';

export async function POST(request: Request) {
  const form = await request.formData();
  const locale = String(form.get('locale') || '');
  if (!(LOCALES as readonly string[]).includes(locale)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale as Locale, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365
  });
  const back = String(form.get('back') || '/');
  return NextResponse.redirect(new URL(back, request.url), 303);
}

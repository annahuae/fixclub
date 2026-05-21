import 'server-only';
import { cookies, headers } from 'next/headers';
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  tFor,
  type Locale
} from './i18n';

function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (LOCALES as readonly string[]).includes(v);
}

/** Read locale from cookie (explicit choice) → Accept-Language → default. */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const hdrs = await headers();
  const accept = hdrs.get('accept-language') || '';
  const langs = accept
    .split(',')
    .map((s) => s.trim().split(';')[0].toLowerCase());
  for (const tag of langs) {
    const base = tag.split('-')[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

export async function getT() {
  const locale = await getLocale();
  return { t: tFor(locale), locale };
}

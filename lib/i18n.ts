import { cookies, headers } from 'next/headers';

export const LOCALES = ['en', 'ru'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'fixclub_locale';

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
  // Match the first language tag we support, in order of preference
  const langs = accept
    .split(',')
    .map((s) => s.trim().split(';')[0].toLowerCase());
  for (const tag of langs) {
    const base = tag.split('-')[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

import { en } from './locales/en';
import { ru } from './locales/ru';

const DICTS: Record<Locale, typeof en> = { en, ru };

export type TKey = keyof typeof en;

/** Translate a key. Falls back to English then to the key itself. */
export function tFor(locale: Locale) {
  const dict = DICTS[locale] || DICTS[DEFAULT_LOCALE];
  return (key: TKey, vars?: Record<string, string | number>): string => {
    const raw = dict[key] ?? DICTS[DEFAULT_LOCALE][key] ?? String(key);
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, name) =>
      vars[name] != null ? String(vars[name]) : `{${name}}`
    );
  };
}

export async function getT() {
  const locale = await getLocale();
  return { t: tFor(locale), locale };
}

/** Russian plural rules: 1 / 2-4 / 5+ */
export function pluralRu(
  n: number,
  forms: [string, string, string]
): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
    return forms[1];
  return forms[2];
}

/** English plural: singular / plural */
export function pluralEn(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/** Pick the right dictionary key for a count, by locale. */
export function pluralKey(
  locale: Locale,
  n: number,
  keys: { one: TKey; few: TKey; many: TKey }
): TKey {
  if (locale === 'ru') {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return keys.one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
      return keys.few;
    return keys.many;
  }
  return n === 1 ? keys.one : keys.many;
}

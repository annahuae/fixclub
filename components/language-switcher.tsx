'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { LOCALES, type Locale } from '@/lib/i18n';

const LABELS: Record<Locale, string> = {
  en: 'EN',
  ru: 'RU'
};
const FULL: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский'
};

export function LanguageSwitcher({ value }: { value: Locale }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const back = pathname + (params.toString() ? `?${params.toString()}` : '');

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-sm text-ink-mid hover:text-ink hover:bg-surface-2"
        aria-haspopup="listbox"
        aria-expanded={open}
        title={FULL[value]}
      >
        🌐 <span className="font-semibold">{LABELS[value]}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 z-50 min-w-[140px] rounded-lg border border-border bg-surface shadow-lg overflow-hidden">
          {LOCALES.map((loc) => (
            <form
              key={loc}
              action="/api/locale"
              method="post"
              className="block"
            >
              <input type="hidden" name="locale" value={loc} />
              <input type="hidden" name="back" value={back} />
              <button
                type="submit"
                className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-2 ${
                  loc === value
                    ? 'text-accent font-semibold'
                    : 'text-ink'
                }`}
              >
                {FULL[loc]}
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}

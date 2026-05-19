'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { EMIRATES } from '@/lib/utils';

export function EmirateSelect({ value }: { value?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <div className="relative">
      <svg
        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-dim pointer-events-none"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 22s-8-7.5-8-13a8 8 0 0 1 16 0c0 5.5-8 13-8 13z" />
        <circle cx="12" cy="9" r="3" />
      </svg>
      <select
        value={value || ''}
        onChange={(e) => {
          const sp = new URLSearchParams(params.toString());
          if (e.target.value) sp.set('emirate', e.target.value);
          else sp.delete('emirate');
          const qs = sp.toString();
          router.push(qs ? `${pathname}?${qs}` : pathname);
        }}
        className="input pl-9 pr-8 text-sm appearance-none cursor-pointer min-w-[170px]"
      >
        <option value="">Все эмираты</option>
        {EMIRATES.map((e) => (
          <option key={e.value} value={e.value}>
            {e.label}
          </option>
        ))}
      </select>
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-dim pointer-events-none">
        ▾
      </span>
    </div>
  );
}

'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { EMIRATES } from '@/lib/utils';

export function EmirateSelect({ value }: { value?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <div className="relative">
      <select
        value={value || ''}
        onChange={(e) => {
          const sp = new URLSearchParams(params.toString());
          if (e.target.value) sp.set('emirate', e.target.value);
          else sp.delete('emirate');
          const qs = sp.toString();
          router.push(qs ? `${pathname}?${qs}` : pathname);
        }}
        className="input pr-8 text-sm appearance-none cursor-pointer min-w-[170px]"
      >
        <option value="">All emirates</option>
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

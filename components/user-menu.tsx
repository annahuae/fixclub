'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export function UserMenu({
  name,
  signOutAction
}: {
  name: string;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = (name?.trim()?.[0] || '?').toUpperCase();

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-sm font-semibold text-ink hover:border-accent hover:text-accent"
      >
        {initial}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
        >
          <div className="border-b border-border px-4 py-3">
            <div className="text-xs text-ink-dim">Signed in as</div>
            <div className="truncate text-sm font-medium text-ink">{name}</div>
          </div>
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-ink hover:bg-surface-2"
          >
            Profile
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              role="menuitem"
              className="block w-full px-4 py-2.5 text-left text-sm text-danger hover:bg-surface-2"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

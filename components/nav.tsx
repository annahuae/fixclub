import Link from 'next/link';
import { destroySession, getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { EmirateSelect } from './emirate-select';

async function signOut() {
  'use server';
  await destroySession();
  redirect('/');
}

export async function Nav({
  query,
  emirate,
  showSearch = true,
  searchAction = '/masters'
}: {
  query?: string;
  emirate?: string;
  showSearch?: boolean;
  searchAction?: string;
}) {
  const user = await getSessionUser();
  return (
    <header className="border-b border-border/80 bg-surface/88 sticky top-0 z-50 backdrop-blur-xl">
      <div className="shell py-3 flex items-center gap-4">
        <Link href="/masters" className="flex items-center gap-3 shrink-0">
          <span
            className="inline-flex items-center justify-center w-9 h-9 text-white font-bold"
            style={{ background: 'var(--ink)', borderRadius: 8 }}
          >
            F
          </span>
          <span className="font-bold text-xl tracking-tight text-ink hidden sm:inline">
            Fixclub <span className="text-ink-mid font-medium">UAE</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link
            href="/masters"
            className="px-3 py-2 rounded-lg text-ink-mid hover:text-ink hover:bg-surface-2"
          >
            Мастера
          </Link>
          <Link
            href="/shops"
            className="px-3 py-2 rounded-lg text-ink-mid hover:text-ink hover:bg-surface-2"
          >
            Магазины
          </Link>
        </nav>

        {showSearch && (
          <form action={searchAction} className="flex-1 max-w-md flex gap-2">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-dim pointer-events-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="search"
                name="q"
                defaultValue={query || ''}
                placeholder="Поиск"
                className="input pl-10 h-11"
              />
              {emirate && (
                <input type="hidden" name="emirate" value={emirate} />
              )}
            </div>
          </form>
        )}

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden md:block">
            <EmirateSelect value={emirate} />
          </div>
          <Link href="/masters/new" className="btn-outline">
            <span className="hidden sm:inline">Добавить</span>
            <span className="sm:hidden">+</span>
          </Link>
          {user && (
            <form action={signOut}>
              <button
                type="submit"
                className="text-xs text-ink-mid hover:text-danger"
                title={`${user.name} — выйти`}
              >
                Выйти
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}

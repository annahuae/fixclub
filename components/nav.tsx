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
    <header className="bg-ink text-white sticky top-0 z-50">
      <div className="shell h-16 flex items-center gap-5">
        <Link href="/masters" className="flex items-center gap-3 shrink-0">
          <span
            className="inline-flex items-center justify-center w-8 h-8 border border-white/20 text-white font-bold text-sm"
            style={{ borderRadius: 6 }}
          >
            F
          </span>
          <span className="font-bold text-lg tracking-tight hidden sm:inline">
            Fixclub <span className="text-white/48 font-medium">UAE</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link
            href="/masters"
            className="px-3 py-2 text-white/68 hover:text-white"
          >
            Мастера
          </Link>
          <Link
            href="/shops"
            className="px-3 py-2 text-white/68 hover:text-white"
          >
            Магазины
          </Link>
        </nav>

        {showSearch && (
          <form action={searchAction} className="flex-1 max-w-md flex gap-2">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/36 pointer-events-none"
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
                className="w-full h-10 rounded-md border border-white/12 bg-white/8 pl-10 pr-3 text-sm text-white placeholder:text-white/36 focus:outline-none focus:border-white/30"
              />
              {emirate && (
                <input type="hidden" name="emirate" value={emirate} />
              )}
            </div>
          </form>
        )}

        <div className="ml-auto flex items-center gap-3">
          {showSearch && (
          <div className="hidden md:block">
            <EmirateSelect value={emirate} />
          </div>
          )}
          <Link
            href="/masters/new"
            className="inline-flex items-center justify-center rounded-md bg-white px-3.5 py-2 text-sm font-semibold text-ink hover:bg-accent hover:text-white transition"
          >
            <span className="hidden sm:inline">Добавить</span>
            <span className="sm:hidden">+</span>
          </Link>
          {user && (
            <form action={signOut}>
              <button
                type="submit"
                className="text-xs text-white/52 hover:text-white"
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

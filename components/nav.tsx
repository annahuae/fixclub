import Link from 'next/link';
import { destroySession, getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

async function signOut() {
  'use server';
  await destroySession();
  redirect('/');
}

export async function Nav({
  query,
  showSearch = true
}: {
  query?: string;
  showSearch?: boolean;
}) {
  const user = await getSessionUser();
  return (
    <header className="border-b border-border bg-surface sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
        <Link href="/masters" className="flex items-center gap-2 shrink-0">
          <span
            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-white font-bold"
            style={{ background: 'var(--accent)' }}
          >
            F
          </span>
          <span className="font-bold text-lg text-ink hidden sm:inline">
            Fixclub <span className="text-ink-mid font-medium">UAE</span>
          </span>
        </Link>

        {showSearch && (
          <form action="/masters" className="flex-1 max-w-xl">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mid">
                🔍
              </span>
              <input
                type="search"
                name="q"
                defaultValue={query || ''}
                placeholder="Поиск мастера или компании..."
                className="input pl-9"
              />
            </div>
          </form>
        )}

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 text-sm text-ink-mid border border-border rounded-lg px-3 py-2 bg-surface">
            <span>📍</span>
            <span>Dubai, UAE</span>
          </div>
          <Link href="/masters/new" className="btn-outline">
            <span className="hidden sm:inline">Оставить отзыв</span>
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

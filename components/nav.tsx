import Link from 'next/link';
import { destroySession, getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

async function signOut() {
  'use server';
  await destroySession();
  redirect('/');
}

export async function Nav() {
  const user = await getSessionUser();
  return (
    <header className="border-b border-border bg-bg sticky top-0 z-50 backdrop-blur">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/masters" className="flex items-baseline gap-2">
          <span className="font-display text-2xl">
            Fix<span className="italic text-accent">club</span>
          </span>
          <span className="text-xs text-ink-dim uppercase tracking-widest hidden sm:inline">
            UAE
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/masters"
            className="text-sm text-ink-dim hover:text-ink"
          >
            Каталог
          </Link>
          <Link
            href="/masters/new"
            className="text-sm text-ink-dim hover:text-accent"
          >
            + Мастер
          </Link>
          {user && (
            <form action={signOut}>
              <button
                type="submit"
                className="text-xs text-ink-dim hover:text-danger uppercase tracking-widest"
                title={`${user.name} — выйти`}
              >
                Выйти
              </button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}

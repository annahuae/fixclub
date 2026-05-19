import Link from 'next/link';
import Image from 'next/image';
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
    <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-xl">
      <div className="shell h-20 flex items-center gap-5">
        <Link href="/masters" className="flex items-center gap-3 shrink-0">
          <Image
            src="/logo.png"
            alt="Fixclub UAE"
            width={40}
            height={40}
            priority
            className="w-10 h-10 object-contain"
          />
          <span className="font-bold text-xl tracking-tight text-ink hidden sm:inline">
            Fixclub <span className="text-accent font-bold">UAE</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link
            href="/masters"
            className="px-3 py-2 text-ink-mid hover:text-ink"
          >
            Specialists
          </Link>
          <Link
            href="/shops"
            className="px-3 py-2 text-ink-mid hover:text-ink"
          >
            Shops
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
                placeholder="Search for a specialist or company..."
                className="input h-11 pl-10"
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
            className="btn-outline h-11"
          >
            <span className="hidden sm:inline">Write a review</span>
            <span className="sm:hidden">+</span>
          </Link>
          {user && (
            <form action={signOut}>
              <button
                type="submit"
                className="text-xs text-ink-mid hover:text-danger"
                title={`${user.name} — sign out`}
              >
                Sign out
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}

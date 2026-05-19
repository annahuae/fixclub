import Link from 'next/link';
import Image from 'next/image';
import { destroySession, getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { EmirateSelect } from './emirate-select';
import { UserMenu } from './user-menu';

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
              <input
                type="search"
                name="q"
                defaultValue={query || ''}
                placeholder="Search for a specialist or company..."
                className="input h-11"
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
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
            <span className="hidden sm:inline">Write a review</span>
          </Link>
          {user && <UserMenu name={user.name} signOutAction={signOut} />}
        </div>
      </div>
    </header>
  );
}

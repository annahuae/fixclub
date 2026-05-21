import Link from 'next/link';
import Image from 'next/image';
import {
  destroyAdminCookie,
  destroySession,
  getSessionUser,
  isAdmin
} from '@/lib/auth';
import { redirect } from 'next/navigation';
import { EmirateSelect } from './emirate-select';
import { UserMenu } from './user-menu';
import { LanguageSwitcher } from './language-switcher';
import { getT } from '@/lib/i18n-server';
import { EMIRATES, emirateLabel } from '@/lib/utils';

async function signOut() {
  'use server';
  await Promise.all([destroySession(), destroyAdminCookie()]);
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
  const [user, admin, { t, locale }] = await Promise.all([
    getSessionUser(),
    isAdmin(),
    getT()
  ]);
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-xl">
      <div className="shell h-20 flex items-center gap-2 sm:gap-5">
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

        {showSearch && (
          <div className="flex flex-1 max-w-2xl items-center gap-2">
            <form action={searchAction} className="flex-1">
              <div className="relative">
                <input
                  type="search"
                  name="q"
                  defaultValue={query || ''}
                  placeholder={t('search_placeholder')}
                  className="input h-11"
                />
                {emirate && (
                  <input type="hidden" name="emirate" value={emirate} />
                )}
              </div>
            </form>
            <div className="hidden md:block">
              <EmirateSelect
                value={emirate}
                allLabel={t('all_emirates')}
                labels={Object.fromEntries(
                  EMIRATES.map((e) => [e.value, emirateLabel(e.value, locale)])
                )}
              />
            </div>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher value={locale} />
          {user ? (
            <UserMenu name={user.name} signOutAction={signOut} />
          ) : admin ? (
            <UserMenu name={t('nav_admin')} isAdmin signOutAction={signOut} />
          ) : null}
        </div>
      </div>
    </header>
  );
}

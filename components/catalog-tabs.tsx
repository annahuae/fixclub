import Link from 'next/link';
import { getT } from '@/lib/i18n-server';

export async function CatalogTabs({
  active
}: {
  active: 'masters' | 'shops';
}) {
  const { t } = await getT();
  const tabs = [
    {
      value: 'masters' as const,
      label: t('nav_specialists'),
      href: '/masters',
      icon: (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
          <path d="M4 22a8 8 0 0 1 16 0" />
        </svg>
      )
    },
    {
      value: 'shops' as const,
      label: t('nav_shops'),
      href: '/shops',
      icon: (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M3 9l1-5h16l1 5" />
          <path d="M5 9v11h14V9" />
          <path d="M9 22v-6h6v6" />
        </svg>
      )
    }
  ];

  return (
    <div className="mb-6 flex gap-6 border-b border-border">
      {tabs.map((tab) => {
        const isActive = active === tab.value;
        return (
          <Link
            key={tab.value}
            href={tab.href}
            className={
              isActive
                ? 'relative flex items-center gap-2 pb-3 text-base font-semibold text-accent after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[3px] after:rounded-t after:bg-accent'
                : 'flex items-center gap-2 pb-3 text-base font-medium text-ink-mid hover:text-ink'
            }
          >
            {tab.icon}
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

import Link from 'next/link';

export function CatalogTabs({ active }: { active: 'masters' | 'shops' }) {
  const tabs = [
    {
      value: 'masters',
      label: 'Specialists',
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
      value: 'shops',
      label: 'Shops',
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
  ] as const;

  return (
    <div className="mb-6 flex gap-6 border-b border-border">
      {tabs.map((t) => {
        const isActive = active === t.value;
        return (
          <Link
            key={t.value}
            href={t.href}
            className={
              isActive
                ? 'relative flex items-center gap-2 pb-3 text-base font-semibold text-accent after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[3px] after:rounded-t after:bg-accent'
                : 'flex items-center gap-2 pb-3 text-base font-medium text-ink-mid hover:text-ink'
            }
          >
            {t.icon}
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

import Link from 'next/link';

export function CatalogTabs({ active }: { active: 'masters' | 'shops' }) {
  const tabs = [
    { value: 'masters', label: 'Specialists', href: '/masters' },
    { value: 'shops', label: 'Shops', href: '/shops' }
  ] as const;

  return (
    <div className="mb-5 inline-flex overflow-hidden rounded-xl border border-border bg-surface">
      {tabs.map((t) => {
        const isActive = active === t.value;
        return (
          <Link
            key={t.value}
            href={t.href}
            className={
              isActive
                ? 'border-r border-accent/30 bg-accent-soft px-5 py-2.5 text-sm font-semibold text-accent last:border-r-0'
                : 'border-r border-border px-5 py-2.5 text-sm text-ink-mid last:border-r-0 hover:text-ink'
            }
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

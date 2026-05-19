'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export function InstantLink({
  href,
  active,
  className,
  activeClassName,
  children
}: {
  href: string;
  active?: boolean;
  className: string;
  activeClassName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const currentHref = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    setPendingHref(null);
  }, [currentHref]);

  const isPressed = pendingHref === href;
  const isActive = active || isPressed;

  return (
    <Link
      href={href}
      prefetch
      onClick={() => {
        if (href !== currentHref) setPendingHref(href);
      }}
      className={`${isActive ? activeClassName : className} ${
        isPressed ? 'opacity-75' : ''
      }`}
      aria-busy={isPressed}
    >
      {children}
    </Link>
  );
}

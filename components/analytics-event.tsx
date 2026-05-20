'use client';

import { useEffect } from 'react';

type GtagFn = (
  command: 'event',
  eventName: string,
  params?: Record<string, unknown>
) => void;
type YmFn = (
  id: number,
  command: string,
  ...rest: unknown[]
) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    ym?: YmFn;
  }
}

/**
 * Fires a goal/event in both Google Analytics 4 and Yandex Metrica once
 * after mount. Names are kept identical across both platforms so reports
 * line up.
 */
export function AnalyticsEvent({
  name,
  params
}: {
  name: string;
  params?: Record<string, unknown>;
}) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    }
    const ymIdRaw = process.env.NEXT_PUBLIC_YM_ID;
    const ymId = ymIdRaw ? parseInt(ymIdRaw, 10) : 0;
    if (ymId && typeof window.ym === 'function') {
      window.ym(ymId, 'reachGoal', name, params);
    }
  }, [name, params]);
  return null;
}

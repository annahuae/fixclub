'use client';

import { useState } from 'react';

/**
 * Custom "Continue with Telegram" button that uses Telegram's hosted OAuth
 * flow (oauth.telegram.org). Our button text is fully ours; only the
 * Telegram authorization screen itself is Telegram's (and its language
 * follows the user's Telegram account).
 *
 * On click we navigate the full window to Telegram. Telegram authorises
 * the user, then redirects back to /api/auth/telegram?id=...&hash=...
 * which is our existing handler.
 */
export function TelegramLogin({
  botId,
  authUrl = '/api/auth/telegram',
  label = 'Continue with Telegram'
}: {
  botId: number | string;
  authUrl?: string;
  label?: string;
}) {
  const [pending, setPending] = useState(false);

  const handleClick = () => {
    if (pending) return;
    setPending(true);
    const origin = window.location.origin;
    const returnTo = `${origin}${authUrl}`;
    const url =
      `https://oauth.telegram.org/auth?bot_id=${botId}` +
      `&origin=${encodeURIComponent(origin)}` +
      `&request_access=write` +
      `&return_to=${encodeURIComponent(returnTo)}`;
    window.location.href = url;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-4 text-sm font-semibold text-white transition hover:bg-[#1c89bd] disabled:opacity-60"
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.146.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.022c.243-.213-.054-.334-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.658-.643.135-.953l11.566-4.458c.538-.196 1.006.128.838.938z" />
      </svg>
      {pending ? 'Redirecting…' : label}
    </button>
  );
}

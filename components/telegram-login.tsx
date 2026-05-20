'use client';

import { useEffect, useRef, useState } from 'react';

type TgUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

declare global {
  interface Window {
    Telegram?: {
      Login?: {
        auth: (
          opts: {
            bot_id: number | string;
            request_access?: 'write';
            lang?: string;
            embed?: number;
          },
          callback: (user: TgUser | false) => void
        ) => void;
      };
    };
  }
}

/**
 * Custom-styled "Continue with Telegram" button that triggers Telegram's
 * official Login Widget popup under the hood (Telegram.Login.auth).
 * On success we POST the verified user payload to /api/auth/telegram.
 *
 * Why not the redirect-based oauth.telegram.org flow: it silently fails
 * to deliver the in-Telegram confirmation for some accounts. The popup
 * variant uses a different code path that delivers reliably.
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
  const [error, setError] = useState<string | null>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;
    const s = document.createElement('script');
    s.src = 'https://telegram.org/js/telegram-widget.js?22';
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const handleClick = () => {
    if (pending) return;
    setError(null);
    const tg = window.Telegram?.Login;
    if (!tg) {
      setError('Telegram widget is not ready yet. Try again in a moment.');
      return;
    }
    setPending(true);
    tg.auth(
      { bot_id: String(botId), request_access: 'write' },
      (user) => {
        if (!user) {
          setPending(false);
          setError('Telegram sign-in was cancelled.');
          return;
        }
        // Build redirect URL with the verified payload as query params —
        // mirrors the official widget's data-auth-url contract so our
        // existing /api/auth/telegram handler works unchanged.
        const params = new URLSearchParams();
        Object.entries(user).forEach(([k, v]) => {
          if (v != null) params.set(k, String(v));
        });
        window.location.href = `${authUrl}?${params.toString()}`;
      }
    );
  };

  return (
    <div className="space-y-2">
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
        {pending ? 'Authorising…' : label}
      </button>
      {error && (
        <div className="text-center text-xs text-danger">{error}</div>
      )}
    </div>
  );
}

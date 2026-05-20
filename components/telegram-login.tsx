'use client';

import { useEffect, useRef } from 'react';

export function TelegramLogin({
  botUsername,
  authUrl = '/api/auth/telegram'
}: {
  botUsername: string;
  authUrl?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    // Clear any prior widget (StrictMode double-effect)
    ref.current.innerHTML = '';
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '10');
    script.setAttribute('data-userpic', 'false');
    script.setAttribute('data-lang', 'en');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-auth-url', authUrl);
    ref.current.appendChild(script);
  }, [botUsername, authUrl]);

  return <div ref={ref} className="flex justify-center" />;
}

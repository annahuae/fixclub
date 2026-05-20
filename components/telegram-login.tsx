'use client';

/**
 * "Continue with Telegram" button that opens the bot chat with a
 * `/start login` deep-link. The bot then sends a message containing a
 * Telegram login_url button — tapping it logs the user in via our
 * /api/auth/telegram endpoint. This bypasses the oauth.telegram.org
 * confirmation flow that has unreliable delivery on some accounts.
 */
export function TelegramLogin({
  botUsername = 'fixclubuae_bot',
  label = 'Continue with Telegram'
}: {
  botUsername?: string;
  label?: string;
}) {
  const handleClick = () => {
    window.open(`https://t.me/${botUsername}?start=login`, '_blank');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-4 text-sm font-semibold text-white transition hover:bg-[#1c89bd]"
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.146.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.022c.243-.213-.054-.334-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.658-.643.135-.953l11.566-4.458c.538-.196 1.006.128.838.938z" />
      </svg>
      {label}
    </button>
  );
}

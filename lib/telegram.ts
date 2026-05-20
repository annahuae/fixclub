import { createHash, createHmac, timingSafeEqual } from 'crypto';

export type TelegramAuthData = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

/**
 * Verify the HMAC signature of a Telegram Login Widget callback.
 * See https://core.telegram.org/widgets/login#checking-authorization
 *
 * Returns the parsed payload on success, or null on failure / staleness.
 * Rejects auth_date older than 24h to prevent replay.
 */
export function verifyTelegramAuth(
  params: Record<string, string>
): TelegramAuthData | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;

  const { hash, ...rest } = params;
  if (!hash) return null;

  const dataCheckString = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join('\n');

  const secret = createHash('sha256').update(token).digest();
  const expected = createHmac('sha256', secret)
    .update(dataCheckString)
    .digest('hex');

  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const authDate = parseInt(rest.auth_date || '0', 10);
  if (!authDate || Date.now() / 1000 - authDate > 86400) return null;

  const id = parseInt(rest.id || '0', 10);
  if (!id) return null;

  return {
    id,
    first_name: rest.first_name || '',
    last_name: rest.last_name || undefined,
    username: rest.username || undefined,
    photo_url: rest.photo_url || undefined,
    auth_date: authDate,
    hash
  };
}

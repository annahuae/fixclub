// Thin wrapper over the Telegram Bot API used by the webhook handler.
// All calls go through the bot token in TELEGRAM_BOT_TOKEN.

const API = 'https://api.telegram.org';

function token(): string {
  const t = process.env.TELEGRAM_BOT_TOKEN;
  if (!t) throw new Error('TELEGRAM_BOT_TOKEN is not set');
  return t;
}

export type InlineButton = { text: string; callback_data: string };
export type ReplyMarkup = { inline_keyboard: InlineButton[][] } | undefined;

export async function tgSendMessage(
  chatId: number,
  text: string,
  opts: { reply_markup?: ReplyMarkup; parse_mode?: 'HTML' | 'MarkdownV2' } = {}
): Promise<void> {
  await fetch(`${API}/bot${token()}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
      ...opts
    })
  });
}

export async function tgAnswerCallback(
  callbackId: string,
  text?: string
): Promise<void> {
  await fetch(`${API}/bot${token()}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackId, text })
  });
}

export async function tgEditMessage(
  chatId: number,
  messageId: number,
  text: string,
  opts: { reply_markup?: ReplyMarkup } = {}
): Promise<void> {
  await fetch(`${API}/bot${token()}/editMessageText`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      disable_web_page_preview: true,
      ...opts
    })
  });
}

export async function tgSetWebhook(
  url: string,
  secretToken: string
): Promise<unknown> {
  const res = await fetch(`${API}/bot${token()}/setWebhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      url,
      secret_token: secretToken,
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: true
    })
  });
  return res.json();
}

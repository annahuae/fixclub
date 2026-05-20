import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import {
  tgAnswerCallback,
  tgSendMessage,
  type InlineButton
} from '@/lib/telegram-api';

// === Webhook plumbing ============================================

type TgUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type TgMessage = {
  message_id: number;
  chat: { id: number };
  from?: TgUser;
  text?: string;
};

type TgCallback = {
  id: string;
  from: TgUser;
  message?: TgMessage;
  data?: string;
};

type TgUpdate = {
  update_id: number;
  message?: TgMessage;
  callback_query?: TgCallback;
};

export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const got = req.headers.get('x-telegram-bot-api-secret-token');
    if (got !== secret) return new NextResponse('forbidden', { status: 403 });
  }

  const update = (await req.json()) as TgUpdate;

  try {
    if (update.message) await handleMessage(update.message);
    else if (update.callback_query) await handleCallback(update.callback_query);
  } catch (e) {
    console.error('tg webhook error', e);
  }
  return NextResponse.json({ ok: true });
}

// === State helpers ===============================================

type ChatState = {
  state: string;
  data: Record<string, unknown>;
};

async function getState(chatId: number): Promise<ChatState> {
  const rows = (await sql`
    SELECT state, data FROM telegram_chat_state WHERE chat_id = ${chatId}
  `) as { state: string; data: Record<string, unknown> }[];
  if (rows.length === 0) return { state: 'idle', data: {} };
  return { state: rows[0].state, data: rows[0].data || {} };
}

async function setState(
  chatId: number,
  state: string,
  data: Record<string, unknown> = {}
): Promise<void> {
  await sql`
    INSERT INTO telegram_chat_state (chat_id, state, data, updated_at)
    VALUES (${chatId}, ${state}, ${JSON.stringify(data)}::jsonb, NOW())
    ON CONFLICT (chat_id) DO UPDATE
      SET state = EXCLUDED.state,
          data = EXCLUDED.data,
          updated_at = NOW()
  `;
}

async function resetState(chatId: number): Promise<void> {
  await setState(chatId, 'idle', {});
}

// === User helpers ================================================

type LinkedUser = {
  id: string;
  name: string;
};

async function getLinkedUser(tgId: number): Promise<LinkedUser | null> {
  const rows = (await sql`
    SELECT id, name FROM users WHERE telegram_id = ${tgId} LIMIT 1
  `) as { id: string; name: string }[];
  return rows[0] || null;
}

// === Message handler =============================================

async function handleMessage(msg: TgMessage): Promise<void> {
  const chatId = msg.chat.id;
  const from = msg.from;
  if (!from) return;

  const text = (msg.text || '').trim();
  const linked = await getLinkedUser(from.id);

  // Commands always work, but interpretation depends on link status.
  if (text.startsWith('/start')) {
    const arg = text.slice('/start'.length).trim();
    // Web "Continue with Telegram" sends users here with `?start=login`.
    if (arg === 'login') {
      await sendLoginButton(chatId);
      return;
    }
    if (linked) {
      await resetState(chatId);
      await tgSendMessage(
        chatId,
        `Hi ${linked.name}! Send /review to post a review, or /help for the menu.`
      );
    } else {
      // Invites are temporarily off — auto-register the user.
      const created = await autoRegister(from);
      await resetState(chatId);
      await tgSendMessage(
        chatId,
        `Welcome, ${created.name}! You're in.\n\nSend /review to post a review, or /help for the menu.`
      );
    }
    return;
  }

  if (text === '/login') {
    await sendLoginButton(chatId);
    return;
  }

  if (text === '/help') {
    await tgSendMessage(
      chatId,
      linked
        ? '/review — post a review\n/cancel — reset current step\n/help — this menu'
        : 'Send your invite code to join, then /help will show all commands.'
    );
    return;
  }

  if (text === '/cancel') {
    await resetState(chatId);
    await tgSendMessage(chatId, 'Reset. Send /review or /help.');
    return;
  }

  if (text === '/review') {
    const actor = linked || (await autoRegister(from));
    await setState(chatId, 'review_pick_kind', { userId: actor.id });
    await tgSendMessage(chatId, 'What are you reviewing?', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '👤 A specialist', callback_data: 'rev:kind:specialist' },
            { text: '🏪 A shop', callback_data: 'rev:kind:shop' }
          ]
        ]
      }
    });
    return;
  }

  // Stateful messages
  const { state, data } = await getState(chatId);

  // Legacy awaiting_invite state still exists for users mid-flow — accept it
  // but invites are no longer required for new chats.
  if (state === 'awaiting_invite') {
    if (text) await tryConsumeInvite(chatId, from, text.toUpperCase());
    return;
  }

  if (linked && state === 'review_search' && text) {
    await searchAndOffer(chatId, String(data.kind), text);
    return;
  }

  if (linked && state === 'review_comment' && text) {
    await finishReview(chatId, data, text);
    return;
  }

  // Fallback — auto-register on any first message instead of nagging for code
  if (!linked) {
    const created = await autoRegister(from);
    await tgSendMessage(
      chatId,
      `You're in, ${created.name}. Use /review or /help.`
    );
    return;
  }
  await tgSendMessage(chatId, 'I didn’t catch that. Use /review or /help.');
}

async function sendLoginButton(chatId: number): Promise<void> {
  await tgSendMessage(
    chatId,
    'Tap below to log in to the Fixclub UAE website. You’ll be signed in instantly.',
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🔑 Log in to Fixclub',
              login_url: {
                url: 'https://fixclub.vercel.app/api/auth/telegram',
                request_write_access: true
              }
            }
          ]
        ]
      }
    }
  );
}

async function autoRegister(from: TgUser): Promise<LinkedUser> {
  const name =
    [from.first_name, from.last_name].filter(Boolean).join(' ').trim() ||
    from.username ||
    'Member';
  const email = `tg-${from.id}@telegram`;
  const rows = (await sql`
    INSERT INTO users (name, email, telegram_id, telegram_username)
    VALUES (${name}, ${email}, ${from.id}, ${from.username || null})
    ON CONFLICT (telegram_id) DO UPDATE
      SET telegram_username = EXCLUDED.telegram_username
    RETURNING id, name
  `) as { id: string; name: string }[];
  return rows[0];
}

// === Invite consumption ==========================================

async function tryConsumeInvite(
  chatId: number,
  from: TgUser,
  rawCode: string
): Promise<void> {
  const code = rawCode.replace(/\s+/g, '');
  if (!/^[A-Z0-9-]{4,}$/.test(code)) {
    await tgSendMessage(
      chatId,
      'That doesn’t look like an invite code. Try again, format e.g. ABCD-EFGH-JKLM.'
    );
    return;
  }

  const rows = (await sql`
    SELECT code, usage_count, usage_limit
    FROM invite_codes WHERE code = ${code} LIMIT 1
  `) as { code: string; usage_count: number; usage_limit: number }[];

  if (rows.length === 0) {
    await tgSendMessage(chatId, 'Invite code not found. Check it and try again.');
    return;
  }
  if (rows[0].usage_count >= rows[0].usage_limit) {
    await tgSendMessage(
      chatId,
      'This invite has been used up. Ask the admin for a new one.'
    );
    return;
  }

  const name =
    [from.first_name, from.last_name].filter(Boolean).join(' ').trim() ||
    from.username ||
    'Member';
  const email = `tg-${from.id}@telegram`;

  // Race-safe: ON CONFLICT (telegram_id) → just fetch the existing row.
  const userRows = (await sql`
    INSERT INTO users (name, email, telegram_id, telegram_username)
    VALUES (${name}, ${email}, ${from.id}, ${from.username || null})
    ON CONFLICT (telegram_id) DO UPDATE
      SET telegram_username = EXCLUDED.telegram_username
    RETURNING id
  `) as { id: string }[];

  await sql`
    UPDATE invite_codes
    SET usage_count = usage_count + 1,
        used_at = COALESCE(used_at, NOW()),
        used_by = COALESCE(used_by, ${userRows[0].id})
    WHERE code = ${code}
  `;

  await resetState(chatId);
  await tgSendMessage(
    chatId,
    `Welcome, ${name}! You're in.\n\nSend /review to post a review, or /help for the menu.`
  );
}

// === Review flow =================================================

async function searchAndOffer(
  chatId: number,
  kind: string,
  query: string
): Promise<void> {
  if (kind !== 'specialist' && kind !== 'shop') {
    await tgSendMessage(chatId, 'Lost the thread — start again with /review.');
    await resetState(chatId);
    return;
  }
  const likeQ = `%${query}%`;
  const rows =
    kind === 'specialist'
      ? ((await sql`
          SELECT id, name FROM masters
          WHERE name ILIKE ${likeQ}
          ORDER BY name LIMIT 6
        `) as { id: string; name: string }[])
      : ((await sql`
          SELECT id, name FROM shops
          WHERE name ILIKE ${likeQ}
          ORDER BY name LIMIT 6
        `) as { id: string; name: string }[]);

  if (rows.length === 0) {
    await tgSendMessage(
      chatId,
      `No ${kind === 'specialist' ? 'specialists' : 'shops'} matched "${query}". Add them on https://fixclub.vercel.app first, or send another search.`
    );
    return;
  }

  const keyboard: InlineButton[][] = rows.map((r) => [
    {
      text: r.name,
      callback_data: `rev:pick:${kind}:${r.id}`
    }
  ]);
  keyboard.push([{ text: '❌ Cancel', callback_data: 'rev:cancel' }]);

  await tgSendMessage(chatId, `Pick one:`, {
    reply_markup: { inline_keyboard: keyboard }
  });
}

async function finishReview(
  chatId: number,
  data: Record<string, unknown>,
  comment: string
): Promise<void> {
  const kind = String(data.kind || '');
  const targetId = String(data.targetId || '');
  const rating = Number(data.rating || 0);
  const userId = String(data.userId || '');
  if (!kind || !targetId || !rating || !userId) {
    await tgSendMessage(chatId, 'Something fell off — try /review again.');
    await resetState(chatId);
    return;
  }
  const cleanComment = comment.length > 2000 ? comment.slice(0, 2000) : comment;

  if (kind === 'specialist') {
    const existing = (await sql`
      SELECT id FROM reviews
      WHERE master_id = ${targetId} AND user_id = ${userId}
      LIMIT 1
    `) as { id: string }[];
    if (existing.length === 0) {
      await sql`
        INSERT INTO reviews (master_id, user_id, rating, comment)
        VALUES (${targetId}, ${userId}, ${rating}, ${cleanComment})
      `;
      await tgSendMessage(
        chatId,
        `Saved! View it: https://fixclub.vercel.app/masters/${targetId}`
      );
    } else {
      await tgSendMessage(
        chatId,
        'You already reviewed that specialist on the website. One review per member.'
      );
    }
  } else {
    const existing = (await sql`
      SELECT id FROM shop_reviews
      WHERE shop_id = ${targetId} AND user_id = ${userId}
      LIMIT 1
    `) as { id: string }[];
    if (existing.length === 0) {
      await sql`
        INSERT INTO shop_reviews (shop_id, user_id, rating, comment)
        VALUES (${targetId}, ${userId}, ${rating}, ${cleanComment})
      `;
      await tgSendMessage(
        chatId,
        `Saved! View it: https://fixclub.vercel.app/shops/${targetId}`
      );
    } else {
      await tgSendMessage(
        chatId,
        'You already reviewed that shop. One review per member.'
      );
    }
  }
  await resetState(chatId);
}

// === Callback handler ============================================

async function handleCallback(cb: TgCallback): Promise<void> {
  const chatId = cb.message?.chat.id;
  if (!chatId) return;
  const data = cb.data || '';
  await tgAnswerCallback(cb.id);

  const linked = (await getLinkedUser(cb.from.id)) || (await autoRegister(cb.from));

  if (data === 'rev:cancel') {
    await resetState(chatId);
    await tgSendMessage(chatId, 'Cancelled. /review when you’re ready.');
    return;
  }

  const parts = data.split(':');
  if (parts[0] !== 'rev') return;

  if (parts[1] === 'kind') {
    const kind = parts[2];
    if (kind !== 'specialist' && kind !== 'shop') return;
    await setState(chatId, 'review_search', { userId: linked.id, kind });
    await tgSendMessage(
      chatId,
      `Type the ${kind === 'specialist' ? 'specialist' : 'shop'} name. I'll show matches.`
    );
    return;
  }

  if (parts[1] === 'pick') {
    const kind = parts[2];
    const targetId = parts[3];
    if ((kind !== 'specialist' && kind !== 'shop') || !targetId) return;
    await setState(chatId, 'review_rating', {
      userId: linked.id,
      kind,
      targetId
    });
    await tgSendMessage(chatId, 'How many stars?', {
      reply_markup: {
        inline_keyboard: [
          [1, 2, 3, 4, 5].map((n) => ({
            text: '★'.repeat(n),
            callback_data: `rev:rate:${n}`
          }))
        ]
      }
    });
    return;
  }

  if (parts[1] === 'rate') {
    const rating = parseInt(parts[2] || '0', 10);
    if (rating < 1 || rating > 5) return;
    const cur = await getState(chatId);
    await setState(chatId, 'review_comment', { ...cur.data, rating });
    await tgSendMessage(
      chatId,
      `Got ${rating} ★. Now write a short comment — what was good or bad?`
    );
    return;
  }
}

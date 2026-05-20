import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import {
  tgAnswerCallback,
  tgSendMessage,
  type InlineButton
} from '@/lib/telegram-api';
import { SPECIALTIES, specialtyLabel } from '@/lib/utils';

// === Webhook plumbing ============================================

type TgUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type TgContact = {
  phone_number: string;
  first_name: string;
  last_name?: string;
  user_id?: number;
};

type TgMessage = {
  message_id: number;
  chat: { id: number };
  from?: TgUser;
  text?: string;
  contact?: TgContact;
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

  // Shared contact attachment → quick-review flow
  if (msg.contact) {
    const linked = await getLinkedUser(from.id);
    const actor = linked || (await autoRegister(from));
    await startQuickReview(chatId, actor.id, msg.contact);
    return;
  }

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
      [
        'Quick review — share a contact (📎 → Contact) and I’ll guide you through 2 taps.',
        'Tip: write a line first (e.g. "great electrician") and then share the contact — I’ll pre-fill the specialty and comment.',
        '',
        '/review — step-by-step flow for a specialist or shop already on the site',
        '/login — get a one-tap login link to the website',
        '/cancel — reset current step',
        '/help — this menu'
      ].join('\n')
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

  if (linked && state === 'quick_add_comment' && text) {
    if (text === '/skip') {
      await finishQuickReview(chatId, data, null);
    } else {
      await finishQuickReview(chatId, data, text);
    }
    return;
  }

  if (linked && state === 'quick_pick_location' && text) {
    const locText = text === '/skip' ? null : text;
    await finalizeQuickReviewWithLocation(chatId, data, locText);
    return;
  }

  // Fallback — auto-register and remember the text so a contact arriving
  // right after can use it as a hint for specialty + comment.
  const actor = linked || (await autoRegister(from));
  if (text) {
    await setState(chatId, 'idle_with_hint', {
      userId: actor.id,
      hint: text
    });
    await tgSendMessage(
      chatId,
      'Got it. Now share the contact (📎 → Contact) and I’ll save the review.'
    );
    return;
  }

  await tgSendMessage(chatId, 'I didn’t catch that. Use /review or /help.');
}

// === Quick-review flow ===========================================

function normalizePhone(p: string): string {
  const trimmed = p.trim();
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}

function inferSpecialty(text: string | undefined | null): string | null {
  if (!text) return null;
  const tokens = text
    .toLowerCase()
    .split(/[\s,!.?;:()\-]+/)
    .filter((t) => t.length >= 3);
  if (tokens.length === 0) return null;
  // Russian/casual aliases → canonical values
  const aliases: Record<string, string> = {
    электрик: 'electrician',
    сантехник: 'plumber',
    пламбер: 'plumber',
    кондиционер: 'ac',
    кондей: 'ac',
    хендимен: 'handyman',
    разнорабочий: 'handyman',
    плиточник: 'tiler',
    мрамор: 'tiler',
    маляр: 'painter',
    покрасить: 'painter',
    плотник: 'carpenter',
    столяр: 'carpenter',
    дверь: 'locksmith',
    замок: 'locksmith',
    окна: 'windows',
    стекло: 'windows',
    клининг: 'cleaner',
    уборщ: 'cleaner',
    садовник: 'gardener',
    тараканы: 'pest',
    дезинсекция: 'pest',
    грузчик: 'mover',
    переезд: 'mover',
    хранение: 'storage'
  };
  for (const t of tokens) {
    for (const [ru, val] of Object.entries(aliases)) {
      if (t.startsWith(ru)) return val;
    }
    const hit = SPECIALTIES.find(
      (s) =>
        s.value.toLowerCase().includes(t) ||
        s.label.toLowerCase().includes(t)
    );
    if (hit) return hit.value;
  }
  return null;
}

const QUICK_SPECIALTY_OPTIONS = [
  'plumber',
  'electrician',
  'ac',
  'handyman',
  'painter',
  'tiler',
  'carpenter',
  'cleaner'
];

async function startQuickReview(
  chatId: number,
  userId: string,
  contact: TgContact
): Promise<void> {
  const phone = normalizePhone(contact.phone_number);
  const name =
    [contact.first_name, contact.last_name].filter(Boolean).join(' ').trim() ||
    'Unknown';

  // Pick up a hint from the previous text message, if any.
  const prev = await getState(chatId);
  const hint =
    prev.state === 'idle_with_hint' && typeof prev.data.hint === 'string'
      ? (prev.data.hint as string)
      : null;
  const guessedSpecialty = inferSpecialty(hint);

  // If we already know this master (any phone column matches), we won't ask
  // for location later — they already have one.
  const existing = (await sql`
    SELECT id FROM masters
    WHERE phone = ${phone} OR whatsapp_phone = ${phone}
    LIMIT 1
  `) as { id: string }[];

  const data: Record<string, unknown> = {
    userId,
    phone,
    name,
    hint,
    specialty: guessedSpecialty,
    existingMasterId: existing[0]?.id || null
  };

  if (guessedSpecialty) {
    await setState(chatId, 'quick_pick_rating', data);
    await tgSendMessage(
      chatId,
      `Got it: ${name} · ${phone}\nLooks like ${specialtyLabel(guessedSpecialty)}. How many stars?`,
      ratingKeyboard()
    );
    return;
  }

  await setState(chatId, 'quick_pick_specialty', data);
  await tgSendMessage(chatId, `Got it: ${name} · ${phone}\nWhat do they do?`, {
    reply_markup: {
      inline_keyboard: chunk(
        QUICK_SPECIALTY_OPTIONS.map((v) => ({
          text: specialtyLabel(v),
          callback_data: `qrev:sp:${v}`
        })),
        2
      ).concat([[{ text: 'Other / skip', callback_data: 'qrev:sp:other' }]])
    }
  });
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Parses a freeform location string like "Marina", "Sharjah Industrial 5",
 * "Abu Dhabi" into { emirate, area }. If no emirate token is found, the
 * whole string is treated as area in Dubai (the default).
 */
function parseLocation(input: string): { emirate: string; area: string | null } {
  const text = input.trim();
  if (!text) return { emirate: 'dubai', area: null };
  const aliases: Record<string, string> = {
    dubai: 'dubai',
    дубай: 'dubai',
    sharjah: 'sharjah',
    шарджа: 'sharjah',
    'abu dhabi': 'abu_dhabi',
    abudhabi: 'abu_dhabi',
    'абу-даби': 'abu_dhabi',
    'абу даби': 'abu_dhabi',
    ajman: 'ajman',
    аджман: 'ajman',
    rak: 'rak',
    ras: 'rak',
    'ras al khaimah': 'rak',
    'рас-эль-хайма': 'rak',
    fujairah: 'fujairah',
    фуджейра: 'fujairah',
    uaq: 'uaq',
    'umm al quwain': 'uaq',
    'умм-аль-кувайн': 'uaq'
  };
  const lower = text.toLowerCase();
  // Match longest alias first
  const sorted = Object.entries(aliases).sort((a, b) => b[0].length - a[0].length);
  for (const [alias, value] of sorted) {
    if (lower.startsWith(alias)) {
      const rest = text.slice(alias.length).trim().replace(/^[,\-:·]\s*/, '');
      return { emirate: value, area: rest || null };
    }
  }
  return { emirate: 'dubai', area: text };
}

function ratingKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [1, 2, 3, 4, 5].map((n) => ({
          text: '★'.repeat(n),
          callback_data: `qrev:r:${n}`
        }))
      ]
    }
  };
}

async function finishQuickReview(
  chatId: number,
  data: Record<string, unknown>,
  comment: string | null
): Promise<void> {
  const userId = String(data.userId || '');
  const phone = String(data.phone || '');
  const rating = Number(data.rating || 0);
  if (!userId || !phone || rating < 1 || rating > 5) {
    await tgSendMessage(chatId, 'Something fell off — try again.');
    await resetState(chatId);
    return;
  }

  const existingMasterId =
    typeof data.existingMasterId === 'string' && data.existingMasterId
      ? (data.existingMasterId as string)
      : null;

  if (existingMasterId) {
    await saveQuickReview(chatId, userId, existingMasterId, rating, comment);
    return;
  }

  await setState(chatId, 'quick_pick_location', { ...data, comment });
  await tgSendMessage(
    chatId,
    'Where in UAE do they work? Send the area (e.g. "Marina" or "Sharjah Industrial 5") — or /skip for Dubai.'
  );
}

async function finalizeQuickReviewWithLocation(
  chatId: number,
  data: Record<string, unknown>,
  locationText: string | null
): Promise<void> {
  const userId = String(data.userId || '');
  const phone = String(data.phone || '');
  const name = String(data.name || 'Unknown');
  const specialty = String(data.specialty || 'other');
  const rating = Number(data.rating || 0);
  const comment =
    typeof data.comment === 'string' ? (data.comment as string) : null;
  if (!userId || !phone || rating < 1 || rating > 5) {
    await tgSendMessage(chatId, 'Something fell off — try again.');
    await resetState(chatId);
    return;
  }

  const { emirate, area } = locationText
    ? parseLocation(locationText)
    : { emirate: 'dubai', area: null };

  const inserted = (await sql`
    INSERT INTO masters (name, whatsapp_phone, specialty, specialties, kind, emirate, area, added_by)
    VALUES (
      ${name}, ${phone}, ${specialty}, ${[specialty]}::text[],
      'individual', ${emirate}, ${area}, ${userId}
    )
    RETURNING id
  `) as { id: string }[];

  await saveQuickReview(chatId, userId, inserted[0].id, rating, comment);
}

async function saveQuickReview(
  chatId: number,
  userId: string,
  masterId: string,
  rating: number,
  comment: string | null
): Promise<void> {
  const dup = (await sql`
    SELECT id FROM reviews
    WHERE master_id = ${masterId} AND user_id = ${userId} LIMIT 1
  `) as { id: string }[];
  if (dup.length === 0) {
    await sql`
      INSERT INTO reviews (master_id, user_id, rating, comment)
      VALUES (${masterId}, ${userId}, ${rating}, ${comment})
    `;
  }
  await resetState(chatId);
  await tgSendMessage(
    chatId,
    `Saved! View it: https://fixclub.vercel.app/masters/${masterId}`
  );
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

  // Quick-review (contact-driven) flow callbacks
  if (parts[0] === 'qrev') {
    const cur = await getState(chatId);
    if (parts[1] === 'sp') {
      const sp = parts[2] || 'other';
      await setState(chatId, 'quick_pick_rating', { ...cur.data, specialty: sp });
      await tgSendMessage(chatId, 'How many stars?', ratingKeyboard());
      return;
    }
    if (parts[1] === 'r') {
      const rating = parseInt(parts[2] || '0', 10);
      if (rating < 1 || rating > 5) return;
      const dataNext = { ...cur.data, rating };
      // If user already sent a hint text earlier, use it as the comment and
      // finish in one shot. Otherwise ask for an optional comment.
      const hint = typeof cur.data.hint === 'string' ? cur.data.hint : null;
      if (hint) {
        await finishQuickReview(chatId, dataNext, hint);
        return;
      }
      await setState(chatId, 'quick_add_comment', dataNext);
      await tgSendMessage(
        chatId,
        `Got ${rating} ★. Add a comment in one message, or send /skip.`
      );
      return;
    }
    return;
  }

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

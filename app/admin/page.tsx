import Link from 'next/link';
import { isAdmin } from '@/lib/auth';
import { sql } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { headers } from 'next/headers';
import { CopyButton } from '@/components/copy-button';
import {
  adminLogin,
  adminLogout,
  approveRequest,
  rejectRequest,
  generateInvite,
  deleteInvite,
  deleteUser,
  deleteMasterAsAdmin
} from './actions';

type RequestRow = {
  id: string;
  name: string;
  email: string;
  reason: string | null;
  status: string;
  created_at: string;
};

type InviteRow = {
  code: string;
  note: string | null;
  created_at: string;
  used_by: string | null;
  used_at: string | null;
  used_by_name: string | null;
  usage_count: number;
  usage_limit: number;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  created_at: string;
  master_count: string;
  review_count: string;
};

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string; error?: string }>;
}) {
  const params = await searchParams;
  const authed = await isAdmin();

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full">
          <Link
            href="/"
            className="text-xs uppercase tracking-widest text-ink-mid hover:text-accent"
          >
            ← На главную
          </Link>
          <h1 className="font-bold tracking-tight text-5xl mt-4 mb-2">
            Админ <span className="text-accent">вход</span>
          </h1>
          <p className="text-ink-mid text-sm mb-8">
            Только для того, кто крутит этим всем.
          </p>
          {params.error && (
            <div className="mb-4 p-3 border border-danger rounded-md text-danger text-sm">
              {params.error}
            </div>
          )}
          <form action={adminLogin} className="space-y-4">
            <div>
              <label className="label">Пароль</label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="input"
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Войти
            </button>
          </form>
        </div>
      </main>
    );
  }

  const tab = params.tab || 'requests';

  const hdrs = await headers();
  const host = hdrs.get('host') || 'fixclub.vercel.app';
  const proto = hdrs.get('x-forwarded-proto') || 'https';
  const inviteOrigin = `${proto}://${host}`;

  const [pendingRows, allRequestRows, inviteRows, userRows] = await Promise.all([
    sql`SELECT * FROM access_requests WHERE status = 'pending' ORDER BY created_at DESC` as unknown as Promise<
      RequestRow[]
    >,
    sql`SELECT * FROM access_requests WHERE status != 'pending' ORDER BY created_at DESC LIMIT 20` as unknown as Promise<
      RequestRow[]
    >,
    sql`
      SELECT
        i.code, i.note, i.created_at, i.used_by, i.used_at,
        i.usage_count, i.usage_limit,
        u.name AS used_by_name
      FROM invite_codes i
      LEFT JOIN users u ON u.id = i.used_by
      ORDER BY i.created_at DESC
    ` as unknown as Promise<InviteRow[]>,
    sql`
      SELECT
        u.id, u.name, u.email, u.created_at,
        COUNT(DISTINCT m.id) AS master_count,
        COUNT(DISTINCT r.id) AS review_count
      FROM users u
      LEFT JOIN masters m ON m.added_by = u.id
      LEFT JOIN reviews r ON r.user_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    ` as unknown as Promise<UserRow[]>
  ]);

  return (
    <>
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <Link href="/" className="font-bold tracking-tight text-2xl">
              Fix<span className="text-accent">club</span>
            </Link>
            <span className="chip-accent">Admin</span>
          </div>
          <form action={adminLogout}>
            <button
              type="submit"
              className="text-xs text-ink-mid hover:text-danger uppercase tracking-widest"
            >
              Выйти
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <nav className="flex gap-2 mb-8 border-b border-border">
          <TabLink current={tab} value="requests" label={`Запросы (${pendingRows.length})`} />
          <TabLink current={tab} value="invites" label="Инвайты" />
          <TabLink current={tab} value="users" label={`Юзеры (${userRows.length})`} />
        </nav>

        {tab === 'requests' && (
          <section>
            <h2 className="font-bold tracking-tight text-4xl mb-6">
              Запросы на <span className="text-accent">доступ</span>
            </h2>
            {pendingRows.length === 0 ? (
              <div className="card text-ink-mid text-sm">Нет ожидающих заявок.</div>
            ) : (
              <div className="space-y-3 mb-12">
                {pendingRows.map((r) => (
                  <div key={r.id} className="card">
                    <div className="flex items-baseline justify-between mb-2">
                      <div>
                        <span className="font-bold tracking-tight text-2xl">{r.name}</span>
                        <span className="ml-3 font-mono text-sm text-ink-mid">
                          {r.email}
                        </span>
                      </div>
                      <span className="text-xs text-ink-mid font-mono">
                        {formatDate(r.created_at)}
                      </span>
                    </div>
                    {r.reason && (
                      <p className="text-sm text-ink-mid mb-4 whitespace-pre-wrap">
                        {r.reason}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <form action={approveRequest}>
                        <input type="hidden" name="id" value={r.id} />
                        <button className="btn-primary text-sm">
                          Одобрить + создать инвайт
                        </button>
                      </form>
                      <form action={rejectRequest}>
                        <input type="hidden" name="id" value={r.id} />
                        <button className="btn-danger text-sm">Отклонить</button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {allRequestRows.length > 0 && (
              <div>
                <h3 className="label mb-3">Прошлые решения</h3>
                <div className="space-y-2">
                  {allRequestRows.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between text-sm py-2 px-3 border border-border rounded-md"
                    >
                      <span>
                        <span className="text-ink">{r.name}</span>
                        <span className="text-ink-mid ml-2">{r.email}</span>
                      </span>
                      <span
                        className={
                          r.status === 'approved'
                            ? 'text-success text-xs uppercase tracking-widest'
                            : 'text-danger text-xs uppercase tracking-widest'
                        }
                      >
                        {r.status === 'approved' ? 'одобрено' : 'отклонено'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {tab === 'invites' && (
          <section>
            <div className="flex items-baseline justify-between mb-6 gap-3 flex-wrap">
              <h2 className="font-bold tracking-tight text-4xl">
                Инвайт-<span className="text-accent">коды</span>
              </h2>
              <form action={generateInvite} className="flex gap-2 flex-wrap">
                <input
                  name="note"
                  placeholder="Кому (заметка)"
                  className="input md:w-48"
                />
                <input
                  name="limit"
                  type="number"
                  min={1}
                  max={10000}
                  defaultValue={100}
                  title="Лимит использований"
                  className="input md:w-24"
                />
                <button className="btn-primary">+ Сгенерировать</button>
              </form>
            </div>
            {inviteRows.length === 0 ? (
              <div className="card text-ink-mid text-sm">
                Пока нет кодов. Сгенерируй первый.
              </div>
            ) : (
              <div className="space-y-2">
                {inviteRows.map((i) => {
                  const origin =
                    (typeof inviteOrigin === 'string' && inviteOrigin) ||
                    'https://fixclub.vercel.app';
                  const url = `${origin}/access?mode=signup&invite=${i.code}`;
                  const remaining = i.usage_limit - i.usage_count;
                  const exhausted = remaining <= 0;
                  return (
                    <div key={i.code} className="card">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-lg tracking-wider">
                            {i.code}
                          </div>
                          <div className="text-xs text-ink-mid mt-1">
                            {i.note && <span>«{i.note}» · </span>}
                            {formatDate(i.created_at)}
                          </div>
                          <div className="text-xs mt-1.5">
                            <span
                              className={
                                exhausted ? 'text-danger' : 'text-success'
                              }
                            >
                              {i.usage_count}/{i.usage_limit} использований
                            </span>
                            {!exhausted && (
                              <span className="text-ink-dim ml-1">
                                · осталось {remaining}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <CopyButton text={url} />
                          {i.usage_count === 0 && (
                            <form action={deleteInvite}>
                              <input
                                type="hidden"
                                name="code"
                                value={i.code}
                              />
                              <button className="btn-danger text-xs">
                                Удалить
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {tab === 'users' && (
          <section>
            <h2 className="font-bold tracking-tight text-4xl mb-6">
              Участники <span className="text-accent">круга</span>
            </h2>
            {userRows.length === 0 ? (
              <div className="card text-ink-mid text-sm">Пока никого.</div>
            ) : (
              <div className="space-y-2">
                {userRows.map((u) => (
                  <div
                    key={u.id}
                    className="card flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold tracking-tight text-xl">{u.name}</div>
                      <div className="text-xs text-ink-mid font-mono">
                        {u.email}
                      </div>
                      <div className="text-xs text-ink-mid mt-1">
                        {u.master_count} мастеров · {u.review_count} отзывов ·{' '}
                        {formatDate(u.created_at)}
                      </div>
                    </div>
                    <form action={deleteUser}>
                      <input type="hidden" name="id" value={u.id} />
                      <button className="btn-danger text-xs">Удалить</button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}

function TabLink({
  current,
  value,
  label
}: {
  current: string;
  value: string;
  label: string;
}) {
  const active = current === value;
  return (
    <Link
      href={`/admin?tab=${value}`}
      className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${
        active
          ? 'border-accent text-accent'
          : 'border-transparent text-ink-mid hover:text-ink'
      }`}
    >
      {label}
    </Link>
  );
}

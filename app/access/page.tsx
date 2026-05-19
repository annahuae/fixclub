import Link from 'next/link';
import { submitInvite, submitLogin, submitRequest } from './actions';
import { PasswordField } from '@/components/password-field';

type Mode = 'invite' | 'login' | 'request';

export default async function AccessPage({
  searchParams
}: {
  searchParams: Promise<{ mode?: string; error?: string }>;
}) {
  const params = await searchParams;
  const mode: Mode =
    params.mode === 'login'
      ? 'login'
      : params.mode === 'request'
        ? 'request'
        : 'invite';
  const error = params.error;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <Link href="/" className="text-sm text-ink-mid hover:text-accent">
          ← Назад
        </Link>

        <div className="mt-4 mb-2">
          <div className="inline-flex gap-1 p-1 bg-surface-2 rounded-lg text-xs">
            <ModeTab mode={mode} value="invite" label="По инвайту" />
            <ModeTab mode={mode} value="login" label="Я уже свой" />
            <ModeTab mode={mode} value="request" label="Запросить" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mt-4 mb-1">
          {mode === 'invite' && (
            <>
              Вход по <span className="text-accent">инвайту</span>
            </>
          )}
          {mode === 'login' && (
            <>
              С возвращением, <span className="text-accent">свой</span>
            </>
          )}
          {mode === 'request' && (
            <>
              Запрос на <span className="text-accent">доступ</span>
            </>
          )}
        </h1>
        <p className="text-ink-mid text-sm mb-6">
          {mode === 'invite' &&
            'Есть код — введи, придумай пароль, и ты внутри.'}
          {mode === 'login' && 'Введи email и пароль.'}
          {mode === 'request' && 'Заявка попадёт админу.'}
        </p>

        {error && (
          <div className="mb-5 p-3 border border-danger rounded-lg text-danger text-sm bg-surface">
            {error}
          </div>
        )}

        {mode === 'invite' && (
          <form action={submitInvite} className="space-y-4">
            <div>
              <label className="label">Инвайт-код</label>
              <input
                name="code"
                required
                placeholder="ABCD-EFGH-JKLM"
                className="input font-mono uppercase tracking-wider"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="label">Имя</label>
              <input
                name="name"
                required
                placeholder="Как тебя называть"
                className="input"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="input"
                autoComplete="email"
              />
            </div>
            <PasswordField hint="Это для повторного входа. Сохрани в менеджере паролей." />
            <button type="submit" className="btn-primary w-full">
              Войти
            </button>
          </form>
        )}

        {mode === 'login' && (
          <form action={submitLogin} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                name="email"
                required
                placeholder="you@example.com"
                className="input"
                autoComplete="email"
                type="email"
              />
            </div>
            <div>
              <label className="label">Пароль</label>
              <input
                name="password"
                type="password"
                required
                className="input font-mono"
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Войти
            </button>
            <div className="text-center pt-1">
              <Link
                href="/access?mode=invite"
                className="text-xs text-ink-mid hover:text-accent"
              >
                Есть инвайт-код →
              </Link>
            </div>
          </form>
        )}

        {mode === 'request' && (
          <form action={submitRequest} className="space-y-4">
            <div>
              <label className="label">Имя</label>
              <input
                name="name"
                required
                placeholder="Как тебя называть"
                className="input"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="input"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Кто ты и зачем тебе доступ</label>
              <textarea
                name="reason"
                rows={4}
                placeholder="Кто из круга тебя знает, чем занимаешься в UAE"
                className="input resize-none"
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Отправить запрос
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

function ModeTab({
  mode,
  value,
  label
}: {
  mode: Mode;
  value: Mode;
  label: string;
}) {
  const active = mode === value;
  return (
    <Link
      href={`/access?mode=${value}`}
      className={`px-3 py-1.5 rounded-md font-medium transition ${
        active ? 'bg-surface text-ink shadow-sm' : 'text-ink-mid hover:text-ink'
      }`}
    >
      {label}
    </Link>
  );
}

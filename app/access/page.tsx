import Link from 'next/link';
import { submitInvite, submitRequest } from './actions';

export default async function AccessPage({
  searchParams
}: {
  searchParams: Promise<{ mode?: string; error?: string }>;
}) {
  const params = await searchParams;
  const mode = params.mode === 'request' ? 'request' : 'invite';
  const error = params.error;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <Link
          href="/"
          className="text-xs uppercase tracking-widest text-ink-mid hover:text-accent"
        >
          ← Назад
        </Link>

        <h1 className="font-bold tracking-tight text-5xl mt-6 mb-2">
          {mode === 'invite' ? (
            <>
              Вход по <span className="text-accent">инвайту</span>
            </>
          ) : (
            <>
              Запрос на <span className="text-accent">доступ</span>
            </>
          )}
        </h1>
        <p className="text-ink-mid text-sm mb-8">
          {mode === 'invite'
            ? 'Если у тебя есть код, добро пожаловать.'
            : 'Заявка попадёт админу. Решение придёт через того, кто тебя пригласил.'}
        </p>

        {error && (
          <div className="mb-6 p-3 border border-danger rounded-md text-danger text-sm">
            {error}
          </div>
        )}

        {mode === 'invite' ? (
          <form action={submitInvite} className="space-y-5">
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
              <label className="label">Контакт</label>
              <input
                name="contact"
                required
                placeholder="Telegram / WhatsApp / email"
                className="input"
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Войти
            </button>
            <div className="text-center pt-2">
              <Link
                href="/access?mode=request"
                className="text-xs text-ink-mid hover:text-accent uppercase tracking-widest"
              >
                Нет инвайта? Запросить доступ →
              </Link>
            </div>
          </form>
        ) : (
          <form action={submitRequest} className="space-y-5">
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
              <label className="label">Контакт</label>
              <input
                name="contact"
                required
                placeholder="Telegram / WhatsApp / email"
                className="input"
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
            <div className="text-center pt-2">
              <Link
                href="/access?mode=invite"
                className="text-xs text-ink-mid hover:text-accent uppercase tracking-widest"
              >
                ← Есть инвайт-код
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

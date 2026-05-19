import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) redirect('/masters');

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: 'var(--accent-soft)' }}
      />
      <div
        className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-40 blur-3xl pointer-events-none"
        style={{ background: '#fff3d6' }}
      />

      <div className="max-w-md w-full relative">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border text-xs text-ink-mid mb-6">
            <span>🇦🇪</span>
            <span>Inner circle · UAE</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-ink mb-3">
            Fix<span className="text-accent">club</span>
          </h1>
          <p className="text-ink-mid text-base leading-relaxed">
            Свой список проверенных мастеров,
            <br />
            магазинов и подрядчиков — от тех,
            <br />
            кто уже здесь живёт.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/access?mode=invite"
            className="block bg-surface border border-border rounded-2xl p-5 hover:border-accent hover:shadow-lg transition-all group"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform"
                style={{ background: 'var(--accent-soft)' }}
              >
                🔑
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">У меня инвайт</span>
                  <span className="text-ink-dim group-hover:text-accent group-hover:translate-x-0.5 transition-all">
                    →
                  </span>
                </div>
                <p className="text-sm text-ink-mid mt-0.5">
                  Введи код — и заходи
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/access?mode=login"
            className="block bg-surface border border-border rounded-2xl p-5 hover:border-accent hover:shadow-lg transition-all group"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform"
                style={{ background: '#e0f2fe' }}
              >
                👋
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">Я уже свой</span>
                  <span className="text-ink-dim group-hover:text-accent group-hover:translate-x-0.5 transition-all">
                    →
                  </span>
                </div>
                <p className="text-sm text-ink-mid mt-0.5">
                  Войти по email и паролю
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/access?mode=request"
            className="block bg-surface border border-border rounded-2xl p-5 hover:border-accent hover:shadow-lg transition-all group"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform"
                style={{ background: '#fff3d6' }}
              >
                ✋
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">
                    Запросить доступ
                  </span>
                  <span className="text-ink-dim group-hover:text-accent group-hover:translate-x-0.5 transition-all">
                    →
                  </span>
                </div>
                <p className="text-sm text-ink-mid mt-0.5">
                  Заявка уйдёт админу
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="text-center mt-8 flex items-center justify-center gap-1 text-xs text-ink-dim">
          <span>Только для своих ·</span>
          <Link href="/admin" className="hover:text-accent">
            админ
          </Link>
        </div>
      </div>
    </main>
  );
}

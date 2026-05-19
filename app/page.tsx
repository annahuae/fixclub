import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) redirect('/masters');

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <div className="text-center mb-12">
          <div className="text-xs uppercase tracking-[0.3em] text-ink-dim mb-4">
            Inner Circle · UAE
          </div>
          <h1 className="font-display text-7xl md:text-8xl leading-none text-ink">
            Fix<span className="italic text-accent">club</span>
          </h1>
          <p className="mt-6 text-ink-dim text-sm max-w-md mx-auto leading-relaxed">
            Закрытый каталог проверенных мастеров. Только по приглашениям —
            никаких случайных людей, никакой публичной индексации.
          </p>
        </div>

        <div className="card space-y-4">
          <Link
            href="/access?mode=invite"
            className="block p-5 border border-border rounded-lg hover:border-accent transition-colors group"
          >
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-display text-2xl">У меня инвайт</span>
              <span className="text-ink-dim group-hover:text-accent transition-colors">
                →
              </span>
            </div>
            <p className="text-sm text-ink-dim">
              Введи код, имя и контакт — и ты внутри.
            </p>
          </Link>

          <Link
            href="/access?mode=request"
            className="block p-5 border border-border rounded-lg hover:border-accent transition-colors group"
          >
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-display text-2xl">Запросить доступ</span>
              <span className="text-ink-dim group-hover:text-accent transition-colors">
                →
              </span>
            </div>
            <p className="text-sm text-ink-dim">
              Заявка уйдёт админу. Дождись подтверждения.
            </p>
          </Link>
        </div>

        <div className="text-center mt-8">
          <Link
            href="/admin"
            className="text-xs text-ink-dim hover:text-accent uppercase tracking-widest"
          >
            Админ
          </Link>
        </div>
      </div>
    </main>
  );
}

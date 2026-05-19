import Link from 'next/link';

export default function PendingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-ink-mid mb-6">
          Заявка принята
        </div>
        <h1 className="font-bold tracking-tight text-5xl mb-6">
          Жди <span className="text-accent">подтверждения</span>
        </h1>
        <p className="text-ink-mid text-sm leading-relaxed mb-8">
          Запрос ушёл админу. Если ты «свой», тебе пришлют инвайт-код через тот
          канал, по которому обычно общаешься. Спам-кнопки «обновить» не будет —
          ответ придёт человек, а не алгоритм.
        </p>
        <Link href="/" className="btn-ghost">
          ← На главную
        </Link>
      </div>
    </main>
  );
}

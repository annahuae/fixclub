import Link from 'next/link';

export default function PendingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">📨</div>
        <h1 className="text-3xl font-bold mb-3">Заявка отправлена</h1>
        <p className="text-ink-mid text-sm leading-relaxed mb-6">
          Когда админ одобрит — заходи по своему email и паролю на странице
          входа. Тыкать «обновить» бессмысленно — решает человек.
        </p>
        <Link href="/access" className="btn-ghost">
          ← К входу
        </Link>
      </div>
    </main>
  );
}

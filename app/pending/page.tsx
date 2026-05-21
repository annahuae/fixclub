import Link from 'next/link';
import { getT } from '@/lib/i18n-server';

export default async function PendingPage() {
  const { t } = await getT();
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">📨</div>
        <h1 className="text-3xl font-bold mb-3">{t('pending_title')}</h1>
        <p className="text-ink-mid text-sm leading-relaxed mb-6">
          {t('pending_body')}
        </p>
        <Link href="/access" className="btn-ghost">
          {t('pending_back')}
        </Link>
      </div>
    </main>
  );
}

import Link from 'next/link';

export default function PendingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">📨</div>
        <h1 className="text-3xl font-bold mb-3">Request sent</h1>
        <p className="text-ink-mid text-sm leading-relaxed mb-6">
          Once an admin approves it, sign in with your email and password.
          Refreshing will not speed it up.
        </p>
        <Link href="/access" className="btn-ghost">
          ← Back to sign in
        </Link>
      </div>
    </main>
  );
}

import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { submitLogin, submitSignup, submitTelegramSignup } from './actions';
import { PasswordField } from '@/components/password-field';
import { TelegramLogin } from '@/components/telegram-login';
import type { TelegramAuthData } from '@/lib/telegram';

type Mode = 'login' | 'signup' | 'telegram';

const TELEGRAM_BOT_ID = 8971737639;

export default async function AccessPage({
  searchParams
}: {
  searchParams: Promise<{
    mode?: string;
    error?: string;
    invite?: string;
    tg?: string;
  }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const invite = params.invite?.trim().toUpperCase() || '';

  let pendingTg: TelegramAuthData | null = null;
  if (params.tg === '1') {
    const cookieStore = await cookies();
    const raw = cookieStore.get('fixclub_tg_pending')?.value;
    if (raw) {
      try {
        pendingTg = JSON.parse(raw) as TelegramAuthData;
      } catch {
        pendingTg = null;
      }
    }
  }

  const mode: Mode = pendingTg
    ? 'telegram'
    : params.mode === 'signup' || params.invite
      ? 'signup'
      : 'login';

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
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <Image
            src="/logo.png"
            alt="Fixclub UAE"
            width={36}
            height={36}
            priority
            className="w-9 h-9 object-contain"
          />
          <span className="font-bold text-lg text-ink">
            Fixclub <span className="text-ink-mid font-medium">UAE</span>
          </span>
        </Link>

        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          {mode === 'telegram' && pendingTg ? (
            <TelegramSignupView tg={pendingTg} error={error} />
          ) : mode === 'login' ? (
            <LoginView error={error} />
          ) : (
            <SignupView error={error} prefilledInvite={invite} />
          )}
        </div>
      </div>
    </main>
  );
}

function ErrorBox({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="mb-4 p-3 border border-danger rounded-lg text-danger text-sm">
      {msg}
    </div>
  );
}

function LoginView({ error }: { error?: string }) {
  return (
    <>
      <h1 className="text-2xl font-bold mb-1">Sign in</h1>
      <p className="text-sm text-ink-mid mb-5">
        Use the email and password you set during registration.
      </p>
      <ErrorBox msg={error} />
      <form action={submitLogin} className="space-y-4">
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
          <label className="label">Password</label>
          <input
            name="password"
            type="password"
            required
            className="input font-mono"
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="btn-primary w-full">
          Sign in
        </button>
      </form>

      <Divider label="or" />
      <TelegramLogin botId={TELEGRAM_BOT_ID} />

      <div className="mt-5 pt-5 border-t border-border text-center">
        <p className="text-sm text-ink-mid">
          No account yet?{' '}
          <Link
            href="/access?mode=signup"
            className="text-accent font-medium hover:underline"
          >
            Register →
          </Link>
        </p>
      </div>
    </>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs uppercase tracking-wider text-ink-dim">
        {label}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function TelegramSignupView({
  tg,
  error
}: {
  tg: TelegramAuthData;
  error?: string;
}) {
  const fullName = [tg.first_name, tg.last_name].filter(Boolean).join(' ');
  return (
    <>
      <h1 className="text-2xl font-bold mb-1">Almost in</h1>
      <p className="text-sm text-ink-mid mb-5">
        Signed in via Telegram as{' '}
        <span className="font-medium text-ink">
          {fullName || tg.username || `id ${tg.id}`}
        </span>
        . One more step and you’re in.
      </p>
      <ErrorBox msg={error} />
      <form action={submitTelegramSignup} className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input
            name="name"
            defaultValue={fullName}
            className="input"
          />
        </div>
        <div>
          <label className="label">Email (optional)</label>
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            className="input"
            autoComplete="email"
          />
        </div>
        <button type="submit" className="btn-primary w-full">
          Finish sign-up
        </button>
      </form>

      <div className="mt-5 pt-5 border-t border-border text-center text-sm">
        <Link href="/access" className="text-ink-mid hover:text-accent">
          Cancel
        </Link>
      </div>
    </>
  );
}

function SignupView({
  error,
  prefilledInvite
}: {
  error?: string;
  prefilledInvite?: string;
}) {
  return (
    <>
      <h1 className="text-2xl font-bold mb-5">Register</h1>
      <ErrorBox msg={error} />
      <form action={submitSignup} className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input
            name="name"
            required
            placeholder="Anna"
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
        <PasswordField hint="Save it — this is your sign-in password." />
        {prefilledInvite && (
          <input type="hidden" name="code" value={prefilledInvite} />
        )}
        <button type="submit" className="btn-primary w-full">
          Register
        </button>
      </form>

      <Divider label="or" />
      <TelegramLogin botId={TELEGRAM_BOT_ID} />

      <div className="mt-5 pt-5 border-t border-border text-center text-sm">
        <p className="text-ink-mid">
          Already have an account?{' '}
          <Link href="/access" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
}

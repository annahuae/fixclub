import Link from 'next/link';
import { submitLogin, submitSignup } from './actions';
import { PasswordField } from '@/components/password-field';

type Mode = 'login' | 'signup';

export default async function AccessPage({
  searchParams
}: {
  searchParams: Promise<{ mode?: string; error?: string; invite?: string }>;
}) {
  const params = await searchParams;
  // If an invite is in the URL, default to signup mode
  const mode: Mode =
    params.mode === 'signup' || params.invite ? 'signup' : 'login';
  const error = params.error;
  const invite = params.invite?.trim().toUpperCase() || '';

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
          <span
            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-white font-bold"
            style={{ background: 'var(--accent)' }}
          >
            F
          </span>
          <span className="font-bold text-lg text-ink">
            Fixclub <span className="text-ink-mid font-medium">UAE</span>
          </span>
        </Link>

        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          {mode === 'login' ? (
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

function SignupView({
  error,
  prefilledInvite
}: {
  error?: string;
  prefilledInvite?: string;
}) {
  const hasInvite = !!prefilledInvite;
  return (
    <>
      <h1 className="text-2xl font-bold mb-5">
        {hasInvite ? 'Register with invite' : 'Register'}
      </h1>
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
        <div>
          <label className="label">Invite code</label>
          <input
            name="code"
            defaultValue={prefilledInvite}
            placeholder="ABCD-EFGH-JKLM"
            className="input font-mono uppercase tracking-wider"
            autoComplete="off"
          />
        </div>
        <button type="submit" className="btn-primary w-full">
          Register
        </button>
      </form>

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

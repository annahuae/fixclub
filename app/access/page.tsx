import Link from 'next/link';
import { submitInvite, submitLogin, submitRequest } from './actions';
import { PasswordField } from '@/components/password-field';

type Mode = 'login' | 'signup' | 'invite';

export default async function AccessPage({
  searchParams
}: {
  searchParams: Promise<{ mode?: string; error?: string }>;
}) {
  const params = await searchParams;
  const mode: Mode =
    params.mode === 'signup'
      ? 'signup'
      : params.mode === 'invite'
        ? 'invite'
        : 'login';
  const error = params.error;

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
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-6"
        >
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
          {mode === 'login' && <LoginView error={error} />}
          {mode === 'signup' && <SignupView error={error} />}
          {mode === 'invite' && <InviteView error={error} />}
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
      <h1 className="text-2xl font-bold mb-1">Вход</h1>
      <p className="text-sm text-ink-mid mb-5">
        Email и пароль, который задал при регистрации.
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
      </form>

      <div className="mt-5 pt-5 border-t border-border text-center">
        <p className="text-sm text-ink-mid">
          Нет аккаунта?{' '}
          <Link
            href="/access?mode=signup"
            className="text-accent font-medium hover:underline"
          >
            Зарегистрироваться →
          </Link>
        </p>
      </div>
    </>
  );
}

function SignupView({ error }: { error?: string }) {
  return (
    <>
      <h1 className="text-2xl font-bold mb-1">Регистрация</h1>
      <p className="text-sm text-ink-mid mb-5">
        Заявка уйдёт админу. После одобрения сможешь войти по email и паролю.
      </p>
      <ErrorBox msg={error} />
      <form action={submitRequest} className="space-y-4">
        <div>
          <label className="label">Имя (как обращаться)</label>
          <input
            name="name"
            required
            placeholder="Аня"
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
        <PasswordField hint="Сохрани — это твой пароль для входа после одобрения." />
        <div>
          <label className="label">Кто ты и зачем тебе доступ</label>
          <textarea
            name="reason"
            rows={3}
            placeholder="Кто из круга тебя знает, чем занимаешься в UAE"
            className="input resize-none"
          />
        </div>
        <button type="submit" className="btn-primary w-full">
          Отправить заявку
        </button>
      </form>

      <div className="mt-5 pt-5 border-t border-border space-y-2 text-center text-sm">
        <p className="text-ink-mid">
          <Link
            href="/access?mode=invite"
            className="text-accent font-medium hover:underline"
          >
            У меня есть инвайт-код →
          </Link>
        </p>
        <p className="text-ink-mid">
          Уже есть аккаунт?{' '}
          <Link href="/access" className="text-accent hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </>
  );
}

function InviteView({ error }: { error?: string }) {
  return (
    <>
      <h1 className="text-2xl font-bold mb-1">Вход по инвайту</h1>
      <p className="text-sm text-ink-mid mb-5">
        Введи код, который тебе дали, придумай пароль — и ты внутри.
      </p>
      <ErrorBox msg={error} />
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
        <PasswordField hint="Сохрани — это твой пароль для повторного входа." />
        <button type="submit" className="btn-primary w-full">
          Войти
        </button>
      </form>

      <div className="mt-5 pt-5 border-t border-border text-center text-sm">
        <p className="text-ink-mid">
          <Link href="/access?mode=signup" className="text-accent hover:underline">
            ← Назад к заявке
          </Link>
        </p>
      </div>
    </>
  );
}

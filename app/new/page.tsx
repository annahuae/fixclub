import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { Nav } from '@/components/nav';

export default async function NewReviewChooserPage() {
  await requireUser();
  return (
    <>
      <Nav showSearch={false} />
      <main className="shell py-10">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight">
            What are you reviewing?
          </h1>
          <p className="mt-2 text-ink-mid">
            Pick one — you can add another later.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/masters/new"
              className="panel group block p-6 text-left transition hover:border-accent hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                  <path d="M4 22a8 8 0 0 1 16 0" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-ink">A specialist</h2>
              <p className="mt-1 text-sm text-ink-mid">
                Plumber, electrician, AC tech, handyman, mover…
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
                Continue →
              </span>
            </Link>

            <Link
              href="/shops/new"
              className="panel group block p-6 text-left transition hover:border-accent hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M3 9l1-5h16l1 5" />
                  <path d="M5 9v11h14V9" />
                  <path d="M9 22v-6h6v6" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-ink">A shop</h2>
              <p className="mt-1 text-sm text-ink-mid">
                Hardware, tiles, tools, paint, lumber…
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
                Continue →
              </span>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

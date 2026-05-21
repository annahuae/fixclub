import { requireUser } from '@/lib/auth';
import { Nav } from '@/components/nav';
import { sql } from '@/lib/db';
import { EditableName } from './edit-name';

type Stats = { reviews: string; masters: string };

export default async function ProfilePage({
  searchParams
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  const stats = (await sql`
    SELECT
      (SELECT COUNT(*) FROM reviews WHERE user_id = ${user.userId}) AS reviews,
      (SELECT COUNT(*) FROM masters WHERE added_by = ${user.userId}) AS masters
  `) as unknown as Stats[];

  const reviewCount = parseInt(stats[0]?.reviews || '0');
  const masterCount = parseInt(stats[0]?.masters || '0');

  return (
    <>
      <Nav showSearch={false} />
      <main className="shell py-10">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
          {sp.saved === '1' && (
            <div className="mt-4 rounded-lg border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent-strong">
              Saved.
            </div>
          )}
          {sp.error && (
            <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {sp.error}
            </div>
          )}
          <div className="panel mt-6 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface-2 text-xl font-semibold text-ink">
                {(user.name?.[0] || '?').toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <EditableName name={user.name} />
                <div className="text-sm text-ink-mid">{user.email}</div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border p-4">
                <div className="text-xs uppercase tracking-wide text-ink-dim">
                  Reviews written
                </div>
                <div className="mt-1 text-2xl font-semibold">
                  {reviewCount}
                </div>
              </div>
              <div className="rounded-xl border border-border p-4">
                <div className="text-xs uppercase tracking-wide text-ink-dim">
                  Specialists added
                </div>
                <div className="mt-1 text-2xl font-semibold">
                  {masterCount}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

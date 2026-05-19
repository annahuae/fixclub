import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { specialtyLabel, emirateLabel, formatDate } from '@/lib/utils';
import { StarRating, StarInput } from '@/components/star-rating';
import { Avatar } from '@/components/avatar';
import { MapEmbed } from '@/components/map-embed';
import { Nav } from '@/components/nav';
import { addReview, deleteMaster } from '../actions';

type Master = {
  id: string;
  name: string;
  specialty: string;
  emirate: string | null;
  area: string | null;
  phone: string | null;
  maps_url: string | null;
  description: string | null;
  added_by: string | null;
  added_by_name: string | null;
  created_at: string;
};

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string | null;
  user_name: string | null;
};

export default async function MasterPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const masterRows = (await sql`
    SELECT m.*, u.name AS added_by_name
    FROM masters m
    LEFT JOIN users u ON u.id = m.added_by
    WHERE m.id = ${id}
    LIMIT 1
  `) as unknown as Master[];

  if (masterRows.length === 0) notFound();
  const master = masterRows[0];

  const reviewRows = (await sql`
    SELECT r.id, r.rating, r.comment, r.created_at, r.user_id, u.name AS user_name
    FROM reviews r
    LEFT JOIN users u ON u.id = r.user_id
    WHERE r.master_id = ${id}
    ORDER BY r.created_at DESC
  `) as unknown as Review[];

  const avg =
    reviewRows.length > 0
      ? reviewRows.reduce((s, r) => s + r.rating, 0) / reviewRows.length
      : 0;

  const userHasReviewed = reviewRows.some((r) => r.user_id === user.userId);
  const userAddedMaster = master.added_by === user.userId;

  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviewRows.filter((r) => r.rating === stars).length;
    return {
      stars,
      count,
      pct:
        reviewRows.length > 0
          ? Math.round((count / reviewRows.length) * 100)
          : 0
    };
  });

  return (
    <>
      <Nav />
      <main className="shell py-8">
        <Link href="/masters" className="text-sm text-ink-mid hover:text-accent">
          ← Back to catalog
        </Link>

        <div className="panel mt-4 p-6">
          <div className="flex items-start gap-5">
            <Avatar name={master.name} seed={master.id} size="lg" fallback="master" />
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-ink">{master.name}</h1>
              <div className="text-sm text-ink-mid mt-1">
                {specialtyLabel(master.specialty)}
                {master.emirate && (
                  <>
                    {' '}
                    · <span>{emirateLabel(master.emirate)}</span>
                  </>
                )}
                {master.area && (
                  <>
                    {' '}
                    · <span>{master.area}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {reviewRows.length > 0 ? (
                  <>
                    <StarRating rating={avg} size="lg" showNumber />
                    <span className="text-ink-mid text-sm">
                      ({reviewRows.length}{' '}
                      {labelCount(reviewRows.length, [
                        'review',
                        'reviews',
                        'reviews'
                      ])}
                      )
                    </span>
                  </>
                ) : (
                  <span className="text-ink-mid text-sm">No reviews yet</span>
                )}
                {master.phone && (
                  <a
                    href={`tel:${master.phone}`}
                    className="font-mono text-sm text-accent hover:underline ml-auto"
                  >
                    {master.phone}
                  </a>
                )}
              </div>

              {master.description && (
                <p className="mt-4 text-ink leading-relaxed whitespace-pre-wrap text-sm">
                  {master.description}
                </p>
              )}

              <div className="mt-4 text-xs text-ink-dim">
                Added by{' '}
                <span className="text-ink">
                  {master.added_by_name || 'member'}
                </span>{' '}
                · {formatDate(master.created_at)}
              </div>

              {userAddedMaster && (
                <form action={deleteMaster} className="mt-3">
                  <input type="hidden" name="id" value={master.id} />
                  <button type="submit" className="btn-danger text-xs">
                    Delete specialist
                  </button>
                </form>
              )}
            </div>
          </div>

          {master.maps_url && (
            <MapEmbed value={master.maps_url} className="mt-5" />
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section className="min-w-0">
            {!userHasReviewed ? (
              <div className="panel mb-6 p-6">
                <h2 className="text-xl font-bold mb-1">Write a review</h2>
                <p className="text-ink-mid text-sm mb-4">
                  One review per specialist. Keep it useful.
                </p>
                <form action={addReview} className="space-y-4">
                  <input type="hidden" name="master_id" value={master.id} />
                  <div>
                    <label className="label">Rating</label>
                    <StarInput />
                  </div>
                  <div>
                    <label className="label">Comment</label>
                    <textarea
                      name="comment"
                      rows={4}
                      placeholder="What they did, how it went, any important details"
                      className="input resize-none"
                    />
                  </div>
                  <button type="submit" className="btn-primary">
                    Publish
                  </button>
                </form>
              </div>
            ) : (
              <div className="mb-6 rounded-xl border border-transparent bg-accent-soft p-4 text-sm text-accent-strong">
                You have already reviewed this specialist.
              </div>
            )}

            {reviewRows.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">
                  Reviews ({reviewRows.length})
                </h2>
                <div className="space-y-3">
                  {reviewRows.map((r) => (
                    <div key={r.id} className="card">
                      <div className="flex items-start gap-3">
                        <Avatar
                          name={r.user_name || '?'}
                          size="sm"
                          seed={r.user_name || ''}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-semibold text-ink text-sm">
                              {r.user_name || '—'}
                            </span>
                            <span className="text-xs text-ink-dim">
                              {formatDate(r.created_at)}
                            </span>
                          </div>
                          <StarRating rating={r.rating} size="sm" />
                          {r.comment && (
                            <p className="text-sm text-ink-mid leading-relaxed whitespace-pre-wrap mt-2">
                              {r.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {reviewRows.length > 0 && (
            <aside className="card h-fit lg:sticky lg:top-28 lg:self-start">
              <div className="text-sm font-semibold text-ink mb-2">
                Breakdown
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold">{avg.toFixed(1)}</span>
                <StarRating rating={avg} />
              </div>
              <div className="space-y-1.5">
                {distribution.map((d) => (
                  <div
                    key={d.stars}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span className="w-3 text-ink-mid">{d.stars}</span>
                    <span style={{ color: 'var(--star)' }}>★</span>
                    <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${d.pct}%`,
                          background:
                            d.stars >= 4
                              ? 'var(--accent)'
                              : d.stars === 3
                                ? 'var(--star)'
                                : 'var(--danger)'
                        }}
                      />
                    </div>
                    <span className="w-9 text-right text-ink-mid">
                      {d.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </aside>
          )}
        </div>
      </main>
    </>
  );
}

function labelCount(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

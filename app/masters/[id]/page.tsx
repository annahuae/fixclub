import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import {
  specialtyLabel,
  emirateLabel,
  formatDate,
  languageLabel,
  priceTierLabel
} from '@/lib/utils';
import { StarRating, StarInput } from '@/components/star-rating';
import { Avatar } from '@/components/avatar';
import { MapEmbed } from '@/components/map-embed';
import { Nav } from '@/components/nav';
import { PhoneLink } from '@/components/phone-link';
import { AnalyticsEvent } from '@/components/analytics-event';
import { addReview, deleteMaster } from '../actions';

type Master = {
  id: string;
  name: string;
  specialty: string;
  specialties: string[];
  kind: string;
  emirate: string | null;
  area: string | null;
  phone: string | null;
  whatsapp_phone: string | null;
  languages: string[];
  pace: string | null;
  instagram: string | null;
  maps_url: string | null;
  description: string | null;
  added_by: string | null;
  added_by_name: string | null;
  created_at: string;
};

type Review = {
  id: string;
  rating: number;
  price_rating: number | null;
  speed_rating: number | null;
  comment: string | null;
  created_at: string;
  user_id: string | null;
  user_name: string | null;
};

export default async function MasterPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; reviewed?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const sp = await searchParams;

  const [masterRowsRaw, reviewRowsRaw] = await Promise.all([
    sql`
      SELECT m.*, u.name AS added_by_name
      FROM masters m
      LEFT JOIN users u ON u.id = m.added_by
      WHERE m.id = ${id}
      LIMIT 1
    `,
    sql`
      SELECT r.id, r.rating, r.price_rating, r.speed_rating, r.comment, r.created_at, r.user_id, u.name AS user_name
      FROM reviews r
      LEFT JOIN users u ON u.id = r.user_id
      WHERE r.master_id = ${id}
      ORDER BY r.created_at DESC
    `
  ]);

  const masterRows = masterRowsRaw as unknown as Master[];
  if (masterRows.length === 0) notFound();
  const master = masterRows[0];
  const reviewRows = reviewRowsRaw as unknown as Review[];

  function avgOf(get: (r: Review) => number | null | undefined) {
    const vals = reviewRows
      .map((r) => get(r))
      .filter((v): v is number => typeof v === 'number' && v > 0);
    return vals.length > 0
      ? vals.reduce((s, v) => s + v, 0) / vals.length
      : 0;
  }
  const avg = avgOf((r) => r.rating);
  const priceAvg = avgOf((r) => r.price_rating);
  const speedAvg = avgOf((r) => r.speed_rating);

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
      <AnalyticsEvent name="card_view_specialist" params={{ kind: master.kind }} />
      {sp.created === '1' && <AnalyticsEvent name="specialist_added" />}
      {sp.reviewed === '1' && (
        <AnalyticsEvent name="review_specialist_added" />
      )}
      <Nav />
      <main className="shell py-8">
        <Link href="/masters" className="text-sm text-ink-mid hover:text-accent">
          ← Back to catalog
        </Link>

        <div className="panel mt-4 p-6">
          <div className="flex items-start gap-5">
            <Avatar name={master.name} seed={master.id} size="lg" fallback="master" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-ink">{master.name}</h1>
                <span
                  className={
                    master.kind === 'company'
                      ? 'inline-flex items-center rounded-full bg-[#e8f0fe] px-2.5 py-0.5 text-xs font-medium text-[#1967d2]'
                      : 'inline-flex items-center rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-ink-mid'
                  }
                >
                  {master.kind === 'company' ? 'Company' : 'Individual'}
                </span>
              </div>
              <div className="text-sm text-ink-mid mt-1">
                {(master.specialties && master.specialties.length > 0
                  ? master.specialties
                  : [master.specialty]
                )
                  .map((s) => specialtyLabel(s))
                  .join(' · ')}
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
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {reviewRows.length > 0 ? (
                  <>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-xs font-medium uppercase tracking-wider text-ink-dim">
                        Quality
                      </span>
                      <StarRating rating={avg} size="lg" showNumber />
                    </span>
                    {priceAvg > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-xs font-medium uppercase tracking-wider text-ink-dim">
                          Price
                        </span>
                        <StarRating
                          rating={priceAvg}
                          glyph="dollar"
                          levels={3}
                        />
                        <span className="text-sm text-ink-mid">
                          {priceTierLabel(priceAvg)}
                        </span>
                      </span>
                    )}
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
              </div>

              {(master.whatsapp_phone || master.phone || master.instagram) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {master.whatsapp_phone && (
                    <PhoneLink phone={master.whatsapp_phone} kind="whatsapp" />
                  )}
                  {master.phone && (
                    <PhoneLink phone={master.phone} kind="call" />
                  )}
                  {master.instagram && (
                    <a
                      href={`https://instagram.com/${master.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink hover:border-accent hover:text-accent"
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <rect x="2" y="2" width="20" height="20" rx="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
                      </svg>
                      @{master.instagram}
                    </a>
                  )}
                </div>
              )}

              {master.languages?.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1 text-ink-mid">
                    <span className="text-ink-dim">Speaks:</span>{' '}
                    {master.languages.map((l) => languageLabel(l)).join(', ')}
                  </span>
                </div>
              )}

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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label">Quality</label>
                      <StarInput name="rating" />
                    </div>
                    <div>
                      <label className="label">Price</label>
                      <StarInput
                        name="price_rating"
                        glyph="dollar"
                        required={false}
                        defaultValue={2}
                        levels={3}
                      />
                    </div>
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
                          <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
                            <StarRating rating={r.rating} size="sm" />
                            {r.price_rating && r.price_rating > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs">
                                <StarRating
                                  rating={r.price_rating}
                                  glyph="dollar"
                                  levels={3}
                                  size="sm"
                                />
                                <span className="text-ink-mid">
                                  {priceTierLabel(r.price_rating)}
                                </span>
                              </span>
                            )}
                          </div>
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

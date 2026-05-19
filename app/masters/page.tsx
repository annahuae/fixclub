import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import {
  SPECIALTIES,
  specialtyLabel,
  emirateLabel,
  formatDate
} from '@/lib/utils';
import { StarRating } from '@/components/star-rating';
import { Avatar } from '@/components/avatar';
import { Nav } from '@/components/nav';
import { InstantLink } from '@/components/instant-link';

type MasterRow = {
  id: string;
  name: string;
  specialty: string;
  area: string | null;
  phone: string | null;
  avg_rating: string | null;
  review_count: string;
};

type ReviewPreview = {
  master_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_name: string | null;
};

const SORTS = [
  { value: 'reviewed', label: 'Most reviewed' },
  { value: 'rated', label: 'Highest rated' },
  { value: 'newest', label: 'Newest reviews' }
] as const;

export default async function MastersPage({
  searchParams
}: {
  searchParams: Promise<{
    specialty?: string;
    emirate?: string;
    q?: string;
    sort?: string;
  }>;
}) {
  await requireUser();
  const params = await searchParams;
  const specialty = params.specialty || null;
  const emirate = params.emirate || null;
  const q = params.q?.trim() || null;
  const sort = (params.sort as (typeof SORTS)[number]['value']) || 'reviewed';

  const rowsUnsorted = (await sql`
    SELECT
      m.id, m.name, m.specialty, m.area, m.phone,
      AVG(r.rating)::numeric(10,2) AS avg_rating,
      COUNT(r.id) AS review_count,
      MAX(r.created_at) AS last_review_at,
      m.created_at AS master_created_at
    FROM masters m
    LEFT JOIN reviews r ON r.master_id = m.id
    WHERE
      (${specialty}::text IS NULL OR m.specialty = ${specialty})
      AND (${emirate}::text IS NULL OR m.emirate = ${emirate})
      AND (${q}::text IS NULL OR m.name ILIKE ${'%' + (q || '') + '%'} OR m.area ILIKE ${'%' + (q || '') + '%'})
    GROUP BY m.id
  `) as unknown as (MasterRow & {
    last_review_at: string | null;
    master_created_at: string;
  })[];

  const rows = [...rowsUnsorted].sort((a, b) => {
    if (sort === 'rated') {
      const ar = a.avg_rating ? parseFloat(a.avg_rating) : -1;
      const br = b.avg_rating ? parseFloat(b.avg_rating) : -1;
      if (ar !== br) return br - ar;
      return parseInt(b.review_count) - parseInt(a.review_count);
    }
    if (sort === 'newest') {
      const ad = a.last_review_at
        ? new Date(a.last_review_at).getTime()
        : new Date(a.master_created_at).getTime();
      const bd = b.last_review_at
        ? new Date(b.last_review_at).getTime()
        : new Date(b.master_created_at).getTime();
      return bd - ad;
    }
    const ac = parseInt(a.review_count);
    const bc = parseInt(b.review_count);
    if (ac !== bc) return bc - ac;
    const ar = a.avg_rating ? parseFloat(a.avg_rating) : -1;
    const br = b.avg_rating ? parseFloat(b.avg_rating) : -1;
    return br - ar;
  });

  const masterIds = rows.map((m) => m.id);
  const previews = (masterIds.length === 0
    ? []
    : ((await sql`
        SELECT master_id, rating, comment, created_at, user_name
        FROM (
          SELECT
            r.master_id, r.rating, r.comment, r.created_at, u.name AS user_name,
            ROW_NUMBER() OVER (PARTITION BY r.master_id ORDER BY r.created_at DESC) AS rn
          FROM reviews r
          LEFT JOIN users u ON u.id = r.user_id
          WHERE r.master_id = ANY(${masterIds})
        ) t
        WHERE rn <= 2
      `) as unknown as ReviewPreview[])) as ReviewPreview[];

  const previewsByMaster = new Map<string, ReviewPreview[]>();
  for (const p of previews) {
    const list = previewsByMaster.get(p.master_id) || [];
    list.push(p);
    previewsByMaster.set(p.master_id, list);
  }

  const totalReviews = rows.reduce(
    (acc, m) => acc + parseInt(m.review_count),
    0
  );
  const weightedSum = rows.reduce(
    (acc, m) =>
      acc +
      (m.avg_rating ? parseFloat(m.avg_rating) * parseInt(m.review_count) : 0),
    0
  );
  const aggregateAvg = totalReviews > 0 ? weightedSum / totalReviews : 0;
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = rows.reduce((acc, m) => {
      const avg = m.avg_rating ? Math.round(parseFloat(m.avg_rating)) : 0;
      return acc + (avg === stars ? parseInt(m.review_count) : 0);
    }, 0);
    return {
      stars,
      pct: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
    };
  });

  function buildHref(over: Record<string, string | null>) {
    const sp = new URLSearchParams();
    const merged: Record<string, string | null> = {
      specialty,
      emirate,
      q,
      sort,
      ...over
    };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) sp.set(k, v);
    });
    const s = sp.toString();
    return s ? `/masters?${s}` : '/masters';
  }

  return (
    <>
      <Nav query={q || undefined} emirate={emirate || undefined} />
      <main className="shell py-8">
        <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)_260px]">
          <aside className="hidden lg:block">
            <div className="panel sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto p-5">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-semibold text-ink">Filters</h2>
                <Link href="/masters" className="text-sm text-accent">
                  Clear all
                </Link>
              </div>

              <FilterSection title="Specialty">
                <CheckLink
                  href={buildHref({ specialty: null })}
                  active={!specialty}
                  label="All specialties"
                />
                {SPECIALTIES.map((s) => (
                  <CheckLink
                    key={s.value}
                    href={buildHref({ specialty: s.value })}
                    active={specialty === s.value}
                    label={s.label}
                  />
                ))}
              </FilterSection>
            </div>
          </aside>

          <section className="min-w-0">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="font-semibold text-ink">
                {rows.length}{' '}
                {labelCount(rows.length, [
                  'specialist found',
                  'specialists found',
                  'specialists found'
                ])}{' '}
                <span className="text-accent">
                  {emirate ? `in ${emirateLabel(emirate)}` : 'in the UAE'}
                </span>
              </h1>
              <Link href="/masters/new" className="btn-outline lg:hidden">
                Write a review
              </Link>
            </div>

            <div className="mb-5 inline-flex max-w-full overflow-hidden rounded-lg border border-border bg-surface">
              {SORTS.map((s) => (
                <InstantLink
                  key={s.value}
                  href={buildHref({ sort: s.value })}
                  active={sort === s.value}
                  className="border-r border-border px-5 py-3 text-sm text-ink-mid last:border-r-0 hover:text-ink"
                  activeClassName="border-r border-accent/30 bg-accent-soft px-5 py-3 text-sm font-semibold text-accent last:border-r-0"
                >
                  {s.label}
                </InstantLink>
              ))}
            </div>

            {rows.length === 0 ? (
              <div className="card py-16 text-center">
                <h2 className="text-2xl font-semibold">Nothing found</h2>
                <p className="mt-2 text-ink-mid">
                  Try clearing some filters or add the first specialist.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {rows.map((m) => {
                  const avg = m.avg_rating ? parseFloat(m.avg_rating) : 0;
                  const count = parseInt(m.review_count);
                  const list = previewsByMaster.get(m.id) || [];
                  return (
                    <Link
                      key={m.id}
                      href={`/masters/${m.id}`}
                      className="card block transition hover:border-accent/50 hover:shadow-lg"
                    >
                      <div className="flex gap-5">
                        <Avatar name={m.name} seed={m.id} size="lg" />
                        <div className="min-w-0 flex-1">
                          <h2 className="text-xl font-semibold tracking-tight">
                            {m.name}
                          </h2>
                          <div className="mt-1 text-sm text-ink-mid">
                            {specialtyLabel(m.specialty)}
                            {m.area && <> · {m.area}</>}
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            {count > 0 ? (
                              <>
                                <StarRating rating={avg} showNumber />
                                <span className="text-sm text-accent">
                                  ({count}{' '}
                                  {labelCount(count, [
                                    'review',
                                    'reviews',
                                    'reviews'
                                  ])}
                                  )
                                </span>
                              </>
                            ) : (
                              <span className="text-sm text-ink-mid">
                                No reviews yet
                              </span>
                            )}
                          </div>

                          {list.length > 0 && (
                            <div className="mt-5 space-y-4 border-t border-border pt-4">
                              {list.map((review) => (
                                <div
                                  key={`${review.master_id}-${review.created_at}-${review.user_name}`}
                                  className="flex gap-3"
                                >
                                  <Avatar
                                    name={review.user_name || '?'}
                                    seed={review.user_name || review.created_at}
                                    size="sm"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                      <span className="font-semibold">
                                        {review.user_name || 'Member'}
                                      </span>
                                      <StarRating
                                        rating={review.rating}
                                        size="sm"
                                      />
                                      <span className="text-xs text-ink-dim">
                                        {formatDate(review.created_at)}
                                      </span>
                                    </div>
                                    {review.comment && (
                                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-ink-mid">
                                        {review.comment}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
              <div className="panel p-6">
              <h2 className="font-semibold">Rating summary</h2>
              <div className="mt-6 text-6xl font-semibold tracking-tight">
                {aggregateAvg.toFixed(1)}
              </div>
              <div className="mt-3">
                <StarRating rating={aggregateAvg} size="lg" />
              </div>
              <div className="mt-3 text-sm text-ink-mid">
                Based on {totalReviews}{' '}
                {labelCount(totalReviews, ['review', 'reviews', 'reviews'])}
              </div>
              <div className="mt-6 space-y-3">
                {distribution.map((item) => (
                  <div
                    key={item.stars}
                    className="grid grid-cols-[28px_1fr_38px] items-center gap-2 text-sm"
                  >
                    <span className="text-ink-mid">{item.stars} ★</span>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                    <span className="text-right text-ink-mid">
                      {item.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel mt-6 bg-accent-soft p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-accent text-accent">
                ✎
              </div>
              <h2 className="font-semibold">Share your experience</h2>
              <p className="mt-2 text-sm leading-6 text-ink-mid">
                Help others find trusted specialists.
              </p>
              <Link href="/masters/new" className="btn-outline mt-5 w-full">
                Write a review
              </Link>
            </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

function FilterSection({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border py-5 first:border-t-0 first:pt-0">
      <h3 className="mb-4 font-semibold text-ink">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function CheckLink({
  href,
  active,
  label,
  radio = false
}: {
  href: string;
  active: boolean;
  label: string;
  radio?: boolean;
}) {
  return (
    <InstantLink
      href={href}
      active={active}
      className="flex items-center gap-3 text-sm text-ink-mid hover:text-ink"
      activeClassName="flex items-center gap-3 text-sm font-medium text-ink"
    >
      <span
        className={`flex h-4 w-4 items-center justify-center border ${
          radio ? 'rounded-full' : 'rounded'
        } ${
          active
            ? 'border-accent bg-accent text-white'
            : 'border-border-strong bg-white'
        }`}
      >
        {active && <span className="text-[10px] leading-none">✓</span>}
      </span>
      <span>{label}</span>
    </InstantLink>
  );
}

function labelCount(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

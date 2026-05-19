import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import {
  SPECIALTY_GROUPS,
  specialtyLabel,
  emirateLabel,
  formatDate
} from '@/lib/utils';
import { StarRating } from '@/components/star-rating';
import { Avatar } from '@/components/avatar';
import { Nav } from '@/components/nav';

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
  { value: 'reviewed', label: 'Больше отзывов' },
  { value: 'rated', label: 'Выше рейтинг' },
  { value: 'newest', label: 'Свежие отзывы' }
] as const;

export default async function MastersPage({
  searchParams
}: {
  searchParams: Promise<{
    specialty?: string;
    emirate?: string;
    q?: string;
    sort?: string;
    rating?: string;
  }>;
}) {
  await requireUser();
  const params = await searchParams;
  const specialty = params.specialty || null;
  const emirate = params.emirate || null;
  const q = params.q?.trim() || null;
  const minRating = params.rating ? parseFloat(params.rating) : null;
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
    HAVING (${minRating}::numeric IS NULL OR AVG(r.rating) >= ${minRating})
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
    // reviewed (default)
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

  // Aggregate stats across filtered masters
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
      // approximate: distribute count by avg rounding
      const mAvg = m.avg_rating ? Math.round(parseFloat(m.avg_rating)) : 0;
      return acc + (mAvg === stars ? parseInt(m.review_count) : 0);
    }, 0);
    return {
      stars,
      count,
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
      rating: minRating ? String(minRating) : null,
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
        <section className="mb-7 panel-subtle p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
            <div>
              <div className="eyebrow mb-3">Trusted services directory</div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink max-w-3xl">
                Проверенные мастера, которых советуют свои
              </h1>
              <p className="mt-4 max-w-2xl text-ink-mid leading-relaxed">
                Каталог закрытого круга: реальные контакты, районы, отзывы и
                свежие рекомендации без случайной выдачи из поиска.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Metric value={rows.length} label="мастеров" />
              <Metric value={totalReviews} label="отзывов" />
              <Metric value={aggregateAvg.toFixed(1)} label="рейтинг" />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)_300px] gap-6">
          {/* Sidebar: filters */}
          <aside className="lg:sticky lg:top-[72px] lg:self-start">
            <div className="panel p-3">
              <div className="px-2 pt-2 pb-3">
                <div className="eyebrow">Специальности</div>
              </div>
              <FilterLink
                active={!specialty}
                href={buildHref({ specialty: null })}
                label="Все специальности"
              />
              {SPECIALTY_GROUPS.map((group, idx) => (
                <div
                  key={group.title}
                  className={
                    idx === 0
                      ? 'mt-4 pt-1'
                      : 'mt-4 pt-4 border-t border-border/80'
                  }
                >
                  <div className="text-[11px] font-bold text-ink-dim uppercase tracking-widest mb-2 px-2">
                    {group.title}
                  </div>
                  {group.items.map((s) => (
                    <FilterLink
                      key={s.value}
                      active={specialty === s.value}
                      href={buildHref({ specialty: s.value })}
                      label={s.label}
                    />
                  ))}
                </div>
              ))}
            </div>
          </aside>

          {/* Main column: results */}
          <section className="min-w-0">
            <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
              <div>
                <div className="text-sm text-ink-mid mb-1">
                  {emirate
                    ? emirateLabel(emirate)
                    : specialty
                      ? specialtyLabel(specialty)
                      : 'Все эмираты'}
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  <span>{rows.length}</span>{' '}
                  {labelCount(rows.length, [
                    'мастер найден',
                    'мастера найдено',
                    'мастеров найдено'
                  ])}
                </h2>
              </div>
            </div>

            <div className="panel-subtle p-1 flex gap-1 mb-5 overflow-x-auto">
              {SORTS.map((s) => (
                <Link
                  key={s.value}
                  href={buildHref({ sort: s.value })}
                  className={`px-4 py-2 text-sm transition whitespace-nowrap ${
                    sort === s.value
                      ? 'text-ink font-semibold bg-surface shadow-sm'
                      : 'text-ink-mid hover:text-ink'
                  }`}
                  style={{ borderRadius: 7 }}
                >
                  {s.label}
                </Link>
              ))}
            </div>

            {rows.length === 0 ? (
              <div className="panel text-center py-16 px-6">
                <div className="mx-auto mb-5 h-14 w-14 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-2xl text-accent">
                  +
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-2">
                  Пока пусто в этой категории
                </h3>
                <p className="text-ink-mid mb-6 max-w-md mx-auto">
                  Добавь первого проверенного мастера, чтобы следующий человек
                  не начинал поиск с нуля.
                </p>
                <Link href="/masters/new" className="btn-primary">
                  Добавить мастера
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {rows.map((m) => {
                  const avg = m.avg_rating ? parseFloat(m.avg_rating) : 0;
                  const count = parseInt(m.review_count);
                  const list = previewsByMaster.get(m.id) || [];
                  return (
                    <Link
                      key={m.id}
                      href={`/masters/${m.id}`}
                      className="block card hover:border-accent hover:-translate-y-0.5 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <Avatar name={m.name} seed={m.id} size="lg" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-3 flex-wrap">
                            <h2 className="font-bold text-xl tracking-tight text-ink">
                              {m.name}
                            </h2>
                          </div>
                          <div className="text-sm text-ink-mid mt-0.5">
                            {specialtyLabel(m.specialty)}
                            {m.area && (
                              <>
                                {' '}
                                · <span>{m.area}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {count > 0 ? (
                              <>
                                <StarRating rating={avg} showNumber />
                                <span className="text-accent text-sm hover:underline">
                                  ({count}{' '}
                                  {labelCount(count, [
                                    'отзыв',
                                    'отзыва',
                                    'отзывов'
                                  ])}
                                  )
                                </span>
                              </>
                            ) : (
                              <span className="text-sm text-ink-mid">
                                Без отзывов
                              </span>
                            )}
                          </div>

                          {list.length > 0 && (
                            <div className="mt-4 space-y-3 border-t border-border pt-3">
                              {list.map((p, i) => (
                                <div
                                  key={`${m.id}-${i}`}
                                  className="flex items-start gap-2"
                                >
                                  <Avatar
                                    name={p.user_name || '?'}
                                    size="sm"
                                    seed={p.user_name || ''}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 text-sm">
                                      <span className="font-semibold text-ink">
                                        {p.user_name || '—'}
                                      </span>
                                      <StarRating rating={p.rating} size="sm" />
                                      <span className="text-xs text-ink-mid">
                                        {formatDate(p.created_at)}
                                      </span>
                                    </div>
                                    {p.comment && (
                                      <p className="text-sm text-ink-mid mt-0.5 line-clamp-2">
                                        {p.comment}
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

          {/* Right rail: rating summary + CTA */}
          <aside className="space-y-4 lg:sticky lg:top-[72px] lg:self-start">
            <div className="card">
              <div className="eyebrow mb-3">
                Сводный рейтинг
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-ink">
                  {aggregateAvg.toFixed(1)}
                </span>
                <StarRating rating={aggregateAvg} size="md" />
              </div>
              <div className="text-xs text-ink-mid mt-1">
                По {totalReviews}{' '}
                {labelCount(totalReviews, ['отзыву', 'отзывам', 'отзывам'])}
              </div>
              <div className="mt-4 space-y-1.5">
                {distribution.map((d) => (
                  <div key={d.stars} className="flex items-center gap-2 text-xs">
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
                    <span className="w-9 text-right text-ink-mid">{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel p-5 text-center bg-ink text-white">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-white/10 mb-3 text-accent">
                +
              </div>
              <div className="font-semibold mb-1">
                Поделись опытом
              </div>
              <p className="text-xs text-white/68 mb-4">
                Помоги другим найти проверенных мастеров.
              </p>
              <Link href="/masters/new" className="btn-primary w-full bg-white text-ink hover:bg-accent hover:text-white">
                Добавить контакт
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="bg-surface border border-border p-4" style={{ borderRadius: 8 }}>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-xs text-ink-mid mt-1">{label}</div>
    </div>
  );
}

function FilterLink({
  active,
  href,
  label
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`block text-sm px-2 py-2 transition ${
        active
          ? 'bg-ink text-white font-semibold'
          : 'text-ink-mid hover:bg-surface-2 hover:text-ink'
      }`}
      style={{ borderRadius: 7 }}
    >
      {label}
    </Link>
  );
}

function labelCount(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

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
import { EmirateSelect } from '@/components/emirate-select';

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

const FEATURED_SPECIALTIES = [
  'plumber',
  'electrician',
  'ac',
  'handyman',
  'cleaner',
  'mover'
];

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
      <Nav
        query={q || undefined}
        emirate={emirate || undefined}
        showSearch={false}
      />
      <main className="shell py-8 sm:py-10">
        <section className="mb-6 flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="eyebrow mb-2">Мастера</div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
                Проверенные контакты
              </h1>
              <p className="mt-2 text-sm text-ink-mid max-w-xl">
                {rows.length}{' '}
                {labelCount(rows.length, [
                  'мастер найден',
                  'мастера найдено',
                  'мастеров найдено'
                ])}{' '}
                {emirate ? `в ${emirateLabel(emirate)}` : 'по всем эмиратам'}
              </p>
            </div>
            <Link href="/masters/new" className="btn-primary">
              Добавить мастера
            </Link>
          </div>

          <form className="panel p-2 grid gap-2 md:grid-cols-[minmax(0,1fr)_190px_auto]">
            {specialty && (
              <input type="hidden" name="specialty" value={specialty} />
            )}
            {emirate && <input type="hidden" name="emirate" value={emirate} />}
            {sort && <input type="hidden" name="sort" value={sort} />}
            <input
              type="search"
              name="q"
              defaultValue={q || ''}
              placeholder="Имя, район или компания"
              className="input h-11"
            />
            <div className="md:hidden">
              <EmirateSelect value={emirate || undefined} />
            </div>
            <button type="submit" className="btn-outline h-11">
              Найти
            </button>
          </form>
        </section>

        <div className="grid grid-cols-1 gap-5">
          <section className="min-w-0">
            <div className="mb-4 panel p-3 space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                <FilterLink
                  active={!specialty}
                  href={buildHref({ specialty: null })}
                  label="Все"
                />
                {FEATURED_SPECIALTIES.map((value) => (
                  <FilterLink
                    key={value}
                    active={specialty === value}
                    href={buildHref({ specialty: value })}
                    label={specialtyLabel(value)}
                  />
                ))}
                {specialty && !FEATURED_SPECIALTIES.includes(specialty) && (
                  <FilterLink
                    active
                    href={buildHref({ specialty })}
                    label={specialtyLabel(specialty)}
                  />
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                <details className="group">
                  <summary className="btn-outline h-10 cursor-pointer list-none">
                    Ещё категории
                  </summary>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-lg border border-border bg-surface p-2">
                    {SPECIALTIES.filter(
                      (s) => !FEATURED_SPECIALTIES.includes(s.value)
                    ).map((s) => (
                      <Link
                        key={s.value}
                        href={buildHref({ specialty: s.value })}
                        className={`px-2.5 py-2 text-sm transition ${
                          specialty === s.value
                            ? 'bg-ink text-white font-semibold'
                            : 'text-ink-mid hover:bg-surface-2 hover:text-ink'
                        }`}
                        style={{ borderRadius: 7 }}
                      >
                        {s.label}
                      </Link>
                    ))}
                  </div>
                </details>

                <div className="flex gap-1 overflow-x-auto">
                {SORTS.map((s) => (
                  <Link
                    key={s.value}
                    href={buildHref({ sort: s.value })}
                    className={`px-3 py-2 text-sm transition whitespace-nowrap ${
                      sort === s.value
                        ? 'text-ink font-semibold bg-surface border-border'
                        : 'text-ink-mid hover:text-ink border-transparent'
                    } border`}
                    style={{ borderRadius: 7 }}
                  >
                    {s.label}
                  </Link>
                ))}
                </div>

                <div className="hidden md:block shrink-0">
                  <EmirateSelect value={emirate || undefined} />
                </div>
              </div>
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
        </div>
      </main>
    </>
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

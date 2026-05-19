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
      <main className="shell py-10 sm:py-12">
        <section className="mb-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <div className="eyebrow mb-4">Fixclub directory</div>
            <h1 className="max-w-3xl text-5xl sm:text-6xl font-bold tracking-[-0.04em] leading-[0.95] text-ink">
              Домашние мастера, которых не стыдно передать своим.
            </h1>
          </div>
          <div className="lg:text-right">
            <div className="text-sm text-ink-mid">
              {rows.length}{' '}
              {labelCount(rows.length, [
                'проверенный контакт',
                'проверенных контакта',
                'проверенных контактов'
              ])}
            </div>
            <div className="mt-2 text-sm text-ink-dim">
              {emirate ? emirateLabel(emirate) : 'Все эмираты'}
            </div>
          </div>
        </section>

        <section className="mb-8 border-y border-border py-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_120px]">
            <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_112px]">
              {specialty && (
                <input type="hidden" name="specialty" value={specialty} />
              )}
              {emirate && <input type="hidden" name="emirate" value={emirate} />}
              {sort && <input type="hidden" name="sort" value={sort} />}
              <input
                type="search"
                name="q"
                defaultValue={q || ''}
                placeholder="Поиск по имени, району или компании"
                className="input h-11 bg-transparent"
              />
              <button type="submit" className="btn-primary h-11">
                Найти
              </button>
            </form>
            <EmirateSelect value={emirate || undefined} />
            <Link href="/masters/new" className="btn-outline h-11">
              Добавить
            </Link>
          </div>
        </section>

        <section className="mb-8 space-y-4">
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

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-start sm:justify-between">
            <details>
              <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-ink hover:text-accent">
                Ещё категории
                <span className="text-ink-dim">↓</span>
              </summary>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {SPECIALTIES.filter(
                  (s) => !FEATURED_SPECIALTIES.includes(s.value)
                ).map((s) => (
                  <Link
                    key={s.value}
                    href={buildHref({ specialty: s.value })}
                    className={`rounded-full border px-3 py-2 text-sm transition ${
                      specialty === s.value
                        ? 'border-ink bg-ink text-white'
                        : 'border-border text-ink-mid hover:border-accent hover:text-ink'
                    }`}
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
                  className={`rounded-full px-3 py-1.5 text-sm transition whitespace-nowrap ${
                    sort === s.value
                      ? 'bg-ink text-white'
                      : 'text-ink-mid hover:bg-surface-2 hover:text-ink'
                  }`}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {rows.length === 0 ? (
          <section className="border border-border bg-surface px-6 py-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Здесь пока пусто
            </h2>
            <p className="mx-auto mt-3 max-w-md text-ink-mid">
              Добавь первого проверенного мастера в эту категорию.
            </p>
            <Link href="/masters/new" className="btn-primary mt-6">
              Добавить мастера
            </Link>
          </section>
        ) : (
          <section className="divide-y divide-border border-t border-border">
            {rows.map((m) => {
              const avg = m.avg_rating ? parseFloat(m.avg_rating) : 0;
              const count = parseInt(m.review_count);
              const list = previewsByMaster.get(m.id) || [];
              const latest = list[0];
              return (
                <Link
                  key={m.id}
                  href={`/masters/${m.id}`}
                  className="group grid gap-5 py-7 transition hover:bg-surface/60 sm:grid-cols-[minmax(0,1fr)_220px] sm:px-3"
                >
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                        {specialtyLabel(m.specialty)}
                      </span>
                      {m.area && (
                        <span className="text-xs text-ink-dim">{m.area}</span>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-ink group-hover:text-accent">
                      {m.name}
                    </h2>
                    {latest?.comment && (
                      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-mid line-clamp-2">
                        “{latest.comment}”
                      </p>
                    )}
                    {latest && (
                      <div className="mt-3 text-xs text-ink-dim">
                        {latest.user_name || 'Участник'} ·{' '}
                        {formatDate(latest.created_at)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-4 sm:flex-col sm:items-end sm:text-right">
                    {count > 0 ? (
                      <div>
                        <StarRating rating={avg} showNumber />
                        <div className="mt-1 text-xs text-ink-dim">
                          {count}{' '}
                          {labelCount(count, ['отзыв', 'отзыва', 'отзывов'])}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-ink-dim">Без отзывов</div>
                    )}
                    <span className="text-sm font-semibold text-ink opacity-50 transition group-hover:opacity-100">
                      Открыть →
                    </span>
                  </div>
                </Link>
              );
            })}
          </section>
        )}
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
      className={`shrink-0 rounded-full border px-3.5 py-2 text-sm transition ${
        active
          ? 'border-ink bg-ink text-white'
          : 'border-border text-ink-mid hover:border-accent hover:text-ink'
      }`}
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

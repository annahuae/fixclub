import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import {
  SHOP_CATEGORIES,
  shopCategoryLabel,
  emirateLabel
} from '@/lib/utils';
import { StarRating } from '@/components/star-rating';
import { Avatar } from '@/components/avatar';
import { Nav } from '@/components/nav';

type ShopRow = {
  id: string;
  name: string;
  category: string;
  emirate: string | null;
  area: string | null;
  phone: string | null;
  avg_rating: string | null;
  review_count: string;
  last_review_at: string | null;
  shop_created_at: string;
};

const SORTS = [
  { value: 'reviewed', label: 'Больше отзывов' },
  { value: 'rated', label: 'Выше рейтинг' },
  { value: 'newest', label: 'Свежие отзывы' }
] as const;

export default async function ShopsPage({
  searchParams
}: {
  searchParams: Promise<{
    category?: string;
    emirate?: string;
    q?: string;
    sort?: string;
    rating?: string;
  }>;
}) {
  await requireUser();
  const params = await searchParams;
  const category = params.category || null;
  const emirate = params.emirate || null;
  const q = params.q?.trim() || null;
  const minRating = params.rating ? parseFloat(params.rating) : null;
  const sort = (params.sort as (typeof SORTS)[number]['value']) || 'reviewed';

  const unsorted = (await sql`
    SELECT
      s.id, s.name, s.category, s.emirate, s.area, s.phone,
      AVG(r.rating)::numeric(10,2) AS avg_rating,
      COUNT(r.id) AS review_count,
      MAX(r.created_at) AS last_review_at,
      s.created_at AS shop_created_at
    FROM shops s
    LEFT JOIN shop_reviews r ON r.shop_id = s.id
    WHERE
      (${category}::text IS NULL OR s.category = ${category})
      AND (${emirate}::text IS NULL OR s.emirate = ${emirate})
      AND (${q}::text IS NULL OR s.name ILIKE ${'%' + (q || '') + '%'} OR s.area ILIKE ${'%' + (q || '') + '%'} OR s.address ILIKE ${'%' + (q || '') + '%'})
    GROUP BY s.id
    HAVING (${minRating}::numeric IS NULL OR AVG(r.rating) >= ${minRating})
  `) as unknown as ShopRow[];

  const rows = [...unsorted].sort((a, b) => {
    if (sort === 'rated') {
      const ar = a.avg_rating ? parseFloat(a.avg_rating) : -1;
      const br = b.avg_rating ? parseFloat(b.avg_rating) : -1;
      if (ar !== br) return br - ar;
      return parseInt(b.review_count) - parseInt(a.review_count);
    }
    if (sort === 'newest') {
      const ad = a.last_review_at
        ? new Date(a.last_review_at).getTime()
        : new Date(a.shop_created_at).getTime();
      const bd = b.last_review_at
        ? new Date(b.last_review_at).getTime()
        : new Date(b.shop_created_at).getTime();
      return bd - ad;
    }
    const ac = parseInt(a.review_count);
    const bc = parseInt(b.review_count);
    if (ac !== bc) return bc - ac;
    const ar = a.avg_rating ? parseFloat(a.avg_rating) : -1;
    const br = b.avg_rating ? parseFloat(b.avg_rating) : -1;
    return br - ar;
  });

  function buildHref(over: Record<string, string | null>) {
    const sp = new URLSearchParams();
    const merged: Record<string, string | null> = {
      category,
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
    return s ? `/shops?${s}` : '/shops';
  }

  return (
    <>
      <Nav
        query={q || undefined}
        emirate={emirate || undefined}
        searchAction="/shops"
      />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-6">
          <aside className="lg:sticky lg:top-[72px] lg:self-start">
            <div className="bg-surface border border-border rounded-2xl p-3">
              <div className="text-[11px] font-bold text-ink-dim uppercase tracking-widest mb-2 px-2">
                Категория
              </div>
              <FilterLink
                active={!category}
                href={buildHref({ category: null })}
                label="Все"
              />
              {SHOP_CATEGORIES.map((c) => (
                <FilterLink
                  key={c.value}
                  active={category === c.value}
                  href={buildHref({ category: c.value })}
                  label={c.label}
                />
              ))}
            </div>
          </aside>

          <section className="min-w-0">
            <div className="flex items-baseline justify-between flex-wrap gap-3 mb-5">
              <h1 className="text-xl">
                <span className="font-bold">{rows.length}</span>{' '}
                <span className="text-ink-mid">
                  {labelCount(rows.length, [
                    'магазин',
                    'магазина',
                    'магазинов'
                  ])}{' '}
                  в{' '}
                </span>
                <span className="font-semibold text-accent">
                  {emirate
                    ? emirateLabel(emirate)
                    : category
                      ? shopCategoryLabel(category)
                      : 'UAE'}
                </span>
              </h1>
              <Link href="/shops/new" className="btn-primary text-sm">
                + Магазин
              </Link>
            </div>

            <div className="flex gap-1 mb-5 border-b border-border">
              {SORTS.map((s) => (
                <Link
                  key={s.value}
                  href={buildHref({ sort: s.value })}
                  className={`px-4 py-2 text-sm rounded-t-lg -mb-px border-b-2 transition ${
                    sort === s.value
                      ? 'border-accent text-accent font-semibold bg-accent-soft'
                      : 'border-transparent text-ink-mid hover:text-ink'
                  }`}
                >
                  {s.label}
                </Link>
              ))}
            </div>

            {rows.length === 0 ? (
              <div className="card text-center py-16">
                <p className="text-ink-mid mb-4">
                  Никого не нашли. Добавь первым.
                </p>
                <Link href="/shops/new" className="btn-primary">
                  + Добавить магазин
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {rows.map((s) => {
                  const avg = s.avg_rating ? parseFloat(s.avg_rating) : 0;
                  const count = parseInt(s.review_count);
                  return (
                    <Link
                      key={s.id}
                      href={`/shops/${s.id}`}
                      className="block card hover:border-accent transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <Avatar name={s.name} seed={s.id} size="lg" />
                        <div className="flex-1 min-w-0">
                          <h2 className="font-bold text-lg text-ink">
                            {s.name}
                          </h2>
                          <div className="text-sm text-ink-mid mt-0.5">
                            {shopCategoryLabel(s.category)}
                            {s.emirate && (
                              <>
                                {' '}
                                · <span>{emirateLabel(s.emirate)}</span>
                              </>
                            )}
                            {s.area && (
                              <>
                                {' '}
                                · <span>{s.area}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {count > 0 ? (
                              <>
                                <StarRating rating={avg} showNumber />
                                <span className="text-accent text-sm">
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
                              <span className="text-sm text-ink-dim">
                                Без отзывов
                              </span>
                            )}
                          </div>
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
      className={`block text-sm px-2 py-1.5 rounded-md transition ${
        active
          ? 'bg-accent-soft text-accent-strong font-semibold'
          : 'text-ink-mid hover:bg-surface-2 hover:text-ink'
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

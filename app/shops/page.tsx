import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import {
  SHOP_CATEGORIES,
  shopCategoryLabel,
  emirateLabel,
  formatDate
} from '@/lib/utils';
import { StarRating } from '@/components/star-rating';
import { Avatar } from '@/components/avatar';
import { Nav } from '@/components/nav';
import { CatalogTabs } from '@/components/catalog-tabs';
import { InstantLink } from '@/components/instant-link';
import { pluralKey } from '@/lib/i18n';
import { getT } from '@/lib/i18n-server';

type ShopRow = {
  id: string;
  name: string;
  category: string;
  categories: string[];
  avg_price: string | null;
  avg_speed: string | null;
  emirate: string | null;
  area: string | null;
  phone: string | null;
  avg_rating: string | null;
  review_count: string;
  last_review_at: string | null;
  shop_created_at: string;
};

type ReviewPreview = {
  shop_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_name: string | null;
};

const SORTS = [
  { value: 'reviewed', tKey: 'sort_most_reviewed' },
  { value: 'rated', tKey: 'sort_highest_rated' },
  { value: 'newest', tKey: 'sort_newest' }
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
  const { t, locale } = await getT();
  const category = params.category || null;
  const emirate = params.emirate || null;
  const q = params.q?.trim() || null;
  const minRating = params.rating ? parseFloat(params.rating) : null;
  const sort = (params.sort as (typeof SORTS)[number]['value']) || 'reviewed';

  const likeQ = '%' + (q || '') + '%';

  const matchedCategories: string[] = q
    ? Array.from(
        new Set(
          q
            .toLowerCase()
            .split(/\s+/)
            .filter((t) => t.length >= 2)
            .flatMap((token) =>
              SHOP_CATEGORIES.filter(
                (c) =>
                  c.label.toLowerCase().includes(token) ||
                  c.value.toLowerCase().includes(token)
              ).map((c) => c.value)
            )
        )
      )
    : [];

  const [unsortedRaw, previewsRaw] = await Promise.all([
    sql`
      SELECT
        s.id, s.name, s.category, s.categories, s.emirate, s.area, s.phone,
        AVG(r.rating)::numeric(10,2) AS avg_rating,
        AVG(r.price_rating)::numeric(10,2) AS avg_price,
        AVG(r.speed_rating)::numeric(10,2) AS avg_speed,
        COUNT(r.id) AS review_count,
        MAX(r.created_at) AS last_review_at,
        s.created_at AS shop_created_at
      FROM shops s
      LEFT JOIN shop_reviews r ON r.shop_id = s.id
      WHERE
        (${category}::text IS NULL OR ${category} = ANY(s.categories))
        AND (${emirate}::text IS NULL OR s.emirate = ${emirate})
        AND (
          ${q}::text IS NULL
          OR s.name ILIKE ${likeQ}
          OR s.area ILIKE ${likeQ}
          OR s.address ILIKE ${likeQ}
          OR s.description ILIKE ${likeQ}
          OR array_to_string(s.tags, ' ') ILIKE ${likeQ}
          OR (cardinality(${matchedCategories}::text[]) > 0
              AND s.categories && ${matchedCategories}::text[])
        )
      GROUP BY s.id
      HAVING (${minRating}::numeric IS NULL OR AVG(r.rating) >= ${minRating})
    `,
    sql`
      SELECT shop_id, rating, comment, created_at, user_name
      FROM (
        SELECT
          r.shop_id, r.rating, r.comment, r.created_at, u.name AS user_name,
          ROW_NUMBER() OVER (PARTITION BY r.shop_id ORDER BY r.created_at DESC) AS rn
        FROM shop_reviews r
        LEFT JOIN users u ON u.id = r.user_id
        WHERE r.shop_id IN (
          SELECT id FROM shops
          WHERE
            (${category}::text IS NULL OR ${category} = ANY(categories))
            AND (${emirate}::text IS NULL OR emirate = ${emirate})
            AND (
              ${q}::text IS NULL
              OR name ILIKE ${likeQ}
              OR area ILIKE ${likeQ}
              OR address ILIKE ${likeQ}
              OR description ILIKE ${likeQ}
              OR array_to_string(tags, ' ') ILIKE ${likeQ}
              OR (cardinality(${matchedCategories}::text[]) > 0
                  AND categories && ${matchedCategories}::text[])
            )
        )
      ) t
      WHERE rn <= 2
    `
  ]);

  const unsorted = unsortedRaw as unknown as ShopRow[];

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

  const previews = previewsRaw as unknown as ReviewPreview[];

  const previewsByShop = new Map<string, ReviewPreview[]>();
  for (const p of previews) {
    const list = previewsByShop.get(p.shop_id) || [];
    list.push(p);
    previewsByShop.set(p.shop_id, list);
  }

  const topRated = rows
    .filter((s) => parseInt(s.review_count) > 0 && s.avg_rating)
    .sort((a, b) => {
      const ar = parseFloat(a.avg_rating || '0');
      const br = parseFloat(b.avg_rating || '0');
      if (br !== ar) return br - ar;
      return parseInt(b.review_count) - parseInt(a.review_count);
    })
    .slice(0, 3);

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
      <main className="shell py-8">
        <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)_260px]">
          <aside className="hidden lg:block">
            <div className="panel sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto p-5">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-semibold text-ink">{t('filters_title')}</h2>
                <Link href="/shops" className="text-sm text-accent">
                  {t('filters_clear')}
                </Link>
              </div>

              <FilterSection title={t('filter_category')}>
                <CheckLink
                  href={buildHref({ category: null })}
                  active={!category}
                  label={t('filter_all_categories')}
                />
                {SHOP_CATEGORIES.map((c) => (
                  <CheckLink
                    key={c.value}
                    href={buildHref({ category: c.value })}
                    active={category === c.value}
                    label={shopCategoryLabel(c.value, locale)}
                  />
                ))}
              </FilterSection>
            </div>
          </aside>

          <section className="min-w-0">
            <CatalogTabs active="shops" />
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="font-semibold text-ink">
                {rows.length}{' '}
                {t(
                  pluralKey(locale, rows.length, {
                    one: 'shops_shop_one',
                    few: 'shops_shop_few',
                    many: 'shops_shop_many'
                  })
                )}{' '}
                <span className="text-accent">
                  {emirate
                    ? t('listing_in', { name: emirateLabel(emirate, locale) })
                    : t('listing_in_uae')}
                </span>
              </h1>
              <Link href="/shops/new" className="btn-outline lg:hidden">
                {t('nav_add')}
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
                  {t(s.tKey)}
                </InstantLink>
              ))}
            </div>

            {rows.length === 0 ? (
              <div className="card py-16 text-center">
                <h2 className="text-2xl font-semibold">
                  {t('listing_nothing_found')}
                </h2>
                <p className="mt-2 text-ink-mid">{t('listing_try_clearing')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rows.map((shop) => {
                  const avg = shop.avg_rating
                    ? parseFloat(shop.avg_rating)
                    : 0;
                  const count = parseInt(shop.review_count);
                  const list = previewsByShop.get(shop.id) || [];
                  return (
                    <Link
                      key={shop.id}
                      href={`/shops/${shop.id}`}
                      className="card block transition hover:border-accent/50 hover:shadow-lg"
                    >
                      <div className="flex gap-5">
                        <Avatar name={shop.name} seed={shop.id} size="lg" fallback="shop" />
                        <div className="min-w-0 flex-1">
                          <h2 className="text-xl font-semibold tracking-tight">
                            {shop.name}
                          </h2>
                          <div className="mt-1 text-sm text-ink-mid">
                            {(shop.categories && shop.categories.length > 0
                              ? shop.categories
                              : [shop.category]
                            )
                              .map((c) => shopCategoryLabel(c, locale))
                              .join(' · ')}
                            {shop.emirate && (
                              <> · {emirateLabel(shop.emirate, locale)}</>
                            )}
                            {shop.area && <> · {shop.area}</>}
                          </div>
                          <div className="mt-3 flex items-center flex-wrap gap-x-4 gap-y-1">
                            {count > 0 ? (
                              <>
                                <StarRating rating={avg} showNumber />
                                {shop.avg_price &&
                                  parseFloat(shop.avg_price) > 0 && (
                                    <StarRating
                                      rating={parseFloat(shop.avg_price)}
                                      glyph="dollar"
                                      levels={3}
                                    />
                                  )}
                                <span className="text-sm text-accent">
                                  ({count}{' '}
                                  {t(
                                    pluralKey(locale, count, {
                                      one: 'review_one',
                                      few: 'review_few',
                                      many: 'review_many'
                                    })
                                  )}
                                  )
                                </span>
                              </>
                            ) : (
                              <span className="text-sm text-ink-mid">
                                {t('listing_no_reviews')}
                              </span>
                            )}
                          </div>

                          {list.length > 0 && (
                            <div className="mt-5 space-y-4 border-t border-border pt-4">
                              {list.map((review) => (
                                <div
                                  key={`${review.shop_id}-${review.created_at}-${review.user_name}`}
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
                                        {review.user_name || t('review_member')}
                                      </span>
                                      <StarRating
                                        rating={review.rating}
                                        size="sm"
                                      />
                                      <span className="text-xs text-ink-dim">
                                        {formatDate(review.created_at, locale)}
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
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1 space-y-6">
              <div className="panel bg-accent-soft p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-accent text-accent">
                ✎
              </div>
              <h2 className="font-semibold">{t('share_experience')}</h2>
              <p className="mt-2 text-sm leading-6 text-ink-mid">
                {t('share_help_shops')}
              </p>
              <Link
                href="/new"
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-accent bg-surface px-5 text-sm font-semibold text-accent transition hover:bg-accent-soft"
              >
                <svg
                  className="h-[18px] w-[18px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
                {t('listing_write_a_review')}
              </Link>
              <p className="mt-3 text-xs text-ink-mid">
                {t('share_quick_via')}{' '}
                <a
                  href="https://t.me/fixclubuae_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent hover:underline"
                >
                  @fixclubuae_bot
                </a>
              </p>
            </div>

            {topRated.length > 0 && (
              <div className="panel p-5">
                <h2 className="font-semibold">{t('top_rated')}</h2>
                <div className="mt-4 space-y-3">
                  {topRated.map((s) => (
                    <Link
                      key={s.id}
                      href={`/shops/${s.id}`}
                      className="flex items-center gap-3 rounded-lg p-2 -m-2 hover:bg-surface-2"
                    >
                      <Avatar
                        name={s.name}
                        seed={s.id}
                        size="sm"
                        fallback="shop"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-ink">
                          {s.name}
                        </div>
                        <div className="truncate text-xs text-ink-mid">
                          {shopCategoryLabel(
                            s.categories?.[0] || s.category,
                            locale
                          )}
                        </div>
                      </div>
                      <span
                        className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-ink"
                        title="Average rating"
                      >
                        <span style={{ color: 'var(--star)' }}>★</span>
                        {parseFloat(s.avg_rating || '0').toFixed(1)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
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
  label
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <InstantLink
      href={href}
      active={active}
      className="flex items-center gap-3 text-sm text-ink-mid hover:text-ink"
      activeClassName="flex items-center gap-3 text-sm font-medium text-ink"
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded border ${
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


import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import {
  SPECIALTIES,
  SPECIALTY_GROUPS,
  LANGUAGES,
  specialtyLabel,
  specialtyGroupTitle,
  languageLabel,
  emirateLabel,
  formatDate
} from '@/lib/utils';
import { StarRating } from '@/components/star-rating';
import { Avatar } from '@/components/avatar';
import { Nav } from '@/components/nav';
import { InstantLink } from '@/components/instant-link';
import { CatalogTabs } from '@/components/catalog-tabs';
import { pluralKey } from '@/lib/i18n';
import { getT } from '@/lib/i18n-server';

type MasterRow = {
  id: string;
  name: string;
  specialty: string;
  specialties: string[];
  kind: string;
  area: string | null;
  phone: string | null;
  languages: string[];
  pace: string | null;
  avg_rating: string | null;
  avg_price: string | null;
  avg_speed: string | null;
  review_count: string;
};

type ReviewPreview = {
  master_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_name: string | null;
  imported_recommender_name: string | null;
};

const SORTS = [
  { value: 'reviewed', tKey: 'sort_most_reviewed' },
  { value: 'rated', tKey: 'sort_highest_rated' },
  { value: 'newest', tKey: 'sort_newest' }
] as const;

export default async function MastersPage({
  searchParams
}: {
  searchParams: Promise<{
    specialty?: string;
    emirate?: string;
    q?: string;
    sort?: string;
    kind?: string;
    lang?: string;
  }>;
}) {
  await requireUser();
  const params = await searchParams;
  const { t, locale } = await getT();
  const specialty = params.specialty || null;
  const emirate = params.emirate || null;
  const q = params.q?.trim() || null;
  const kind =
    params.kind === 'individual' || params.kind === 'company'
      ? params.kind
      : null;
  const lang = LANGUAGES.find((l) => l.value === params.lang)?.value || null;
  const sort = (params.sort as (typeof SORTS)[number]['value']) || 'reviewed';

  const likeQ = '%' + (q || '') + '%';

  // Match user query against specialty labels/values so "AC clean", "plumber",
  // "marble" all resolve to the right stored specialty values.
  const matchedSpecialties: string[] = q
    ? Array.from(
        new Set(
          q
            .toLowerCase()
            .split(/\s+/)
            .filter((t) => t.length >= 2)
            .flatMap((token) =>
              SPECIALTIES.filter(
                (s) =>
                  s.label.toLowerCase().includes(token) ||
                  s.value.toLowerCase().includes(token)
              ).map((s) => s.value)
            )
        )
      )
    : [];

  // If the whole query is just a specialty name ("ac", "электрик"), filter
  // strictly by specialty — skip the fuzzy ILIKE on name/area/description so
  // "ac" doesn't also pull in "Marcus" or any description containing "ac".
  const qLower = q?.toLowerCase() || '';
  const queryIsPureSpecialty =
    !!q &&
    SPECIALTIES.some(
      (s) => s.label.toLowerCase() === qLower || s.value.toLowerCase() === qLower
    );

  const [rowsUnsortedRaw, previewsRaw] = await Promise.all([
    sql`
      SELECT
        m.id, m.name, m.specialty, m.specialties, m.kind, m.area, m.phone, m.languages, m.pace,
        AVG(r.rating)::numeric(10,2) AS avg_rating,
        AVG(r.price_rating)::numeric(10,2) AS avg_price,
        AVG(r.speed_rating)::numeric(10,2) AS avg_speed,
        COUNT(r.id) AS review_count,
        MAX(r.created_at) AS last_review_at,
        m.created_at AS master_created_at
      FROM masters m
      LEFT JOIN reviews r ON r.master_id = m.id
      WHERE
        (${specialty}::text IS NULL OR ${specialty} = ANY(m.specialties))
        AND (${emirate}::text IS NULL OR m.emirate = ${emirate})
        AND (${kind}::text IS NULL OR m.kind = ${kind})
        AND (${lang}::text IS NULL OR ${lang} = ANY(m.languages))
        AND (
          ${q}::text IS NULL
          OR (${queryIsPureSpecialty}::boolean
              AND m.specialties && ${matchedSpecialties}::text[])
          OR (NOT ${queryIsPureSpecialty}::boolean AND (
            m.name ILIKE ${likeQ}
            OR m.area ILIKE ${likeQ}
            OR m.description ILIKE ${likeQ}
            OR array_to_string(m.tags, ' ') ILIKE ${likeQ}
            OR (cardinality(${matchedSpecialties}::text[]) > 0
                AND m.specialties && ${matchedSpecialties}::text[])
          ))
        )
      GROUP BY m.id
    `,
    sql`
      SELECT master_id, rating, comment, created_at, user_name, imported_recommender_name
      FROM (
        SELECT
          r.master_id, r.rating, r.comment, r.created_at, u.name AS user_name, r.imported_recommender_name,
          ROW_NUMBER() OVER (PARTITION BY r.master_id ORDER BY r.created_at DESC) AS rn
        FROM reviews r
        LEFT JOIN users u ON u.id = r.user_id
        WHERE r.master_id IN (
          SELECT id FROM masters
          WHERE
            (${specialty}::text IS NULL OR ${specialty} = ANY(specialties))
            AND (${emirate}::text IS NULL OR emirate = ${emirate})
            AND (${kind}::text IS NULL OR kind = ${kind})
            AND (${lang}::text IS NULL OR ${lang} = ANY(languages))
            AND (
              ${q}::text IS NULL
              OR (${queryIsPureSpecialty}::boolean
                  AND specialties && ${matchedSpecialties}::text[])
              OR (NOT ${queryIsPureSpecialty}::boolean AND (
                name ILIKE ${likeQ}
                OR area ILIKE ${likeQ}
                OR description ILIKE ${likeQ}
                OR array_to_string(tags, ' ') ILIKE ${likeQ}
                OR (cardinality(${matchedSpecialties}::text[]) > 0
                    AND specialties && ${matchedSpecialties}::text[])
              ))
            )
        )
      ) t
      WHERE rn <= 2
    `
  ]);

  const rowsUnsorted = rowsUnsortedRaw as unknown as (MasterRow & {
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

  const previews = previewsRaw as unknown as ReviewPreview[];

  const previewsByMaster = new Map<string, ReviewPreview[]>();
  for (const p of previews) {
    const list = previewsByMaster.get(p.master_id) || [];
    list.push(p);
    previewsByMaster.set(p.master_id, list);
  }

  const topRated = rows
    .filter((m) => parseInt(m.review_count) > 0 && m.avg_rating)
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
      specialty,
      emirate,
      q,
      sort,
      kind,
      lang,
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
                <h2 className="font-semibold text-ink">
                  {t('filters_title')}
                </h2>
                <Link href="/masters" className="text-sm text-accent">
                  {t('filters_clear')}
                </Link>
              </div>

              <FilterSection title={t('filter_specialty')}>
                <CheckLink
                  href={buildHref({ specialty: null })}
                  active={!specialty}
                  label={t('filter_all_specialties')}
                />
                {SPECIALTY_GROUPS.map((group) => (
                  <div key={group.title} className="mt-4 first:mt-3">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-dim">
                      {specialtyGroupTitle(group, locale)}
                    </div>
                    <div className="space-y-2">
                      {group.items.map((s) => (
                        <CheckLink
                          key={s.value}
                          href={buildHref({ specialty: s.value })}
                          active={specialty === s.value}
                          label={specialtyLabel(s.value, locale)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </FilterSection>

              <FilterSection title={t('filter_type')}>
                <CheckLink
                  href={buildHref({ kind: null })}
                  active={!kind}
                  label={t('filter_type_anyone')}
                  radio
                />
                <CheckLink
                  href={buildHref({ kind: 'individual' })}
                  active={kind === 'individual'}
                  label={t('filter_type_individuals')}
                  radio
                />
                <CheckLink
                  href={buildHref({ kind: 'company' })}
                  active={kind === 'company'}
                  label={t('filter_type_companies')}
                  radio
                />
              </FilterSection>

              <FilterSection title={t('filter_language')}>
                <CheckLink
                  href={buildHref({ lang: null })}
                  active={!lang}
                  label={t('filter_any_language')}
                  radio
                />
                {LANGUAGES.map((l) => (
                  <CheckLink
                    key={l.value}
                    href={buildHref({ lang: l.value })}
                    active={lang === l.value}
                    label={languageLabel(l.value, locale)}
                    radio
                  />
                ))}
              </FilterSection>
            </div>
          </aside>

          <section className="min-w-0">
            <CatalogTabs active="masters" />
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="font-semibold text-ink">
                {rows.length}{' '}
                {t(
                  pluralKey(locale, rows.length, {
                    one: 'masters_specialist_one',
                    few: 'masters_specialist_few',
                    many: 'masters_specialist_many'
                  })
                )}{' '}
                <span className="text-accent">
                  {emirate
                    ? t('listing_in', { name: emirateLabel(emirate, locale) })
                    : t('listing_in_uae')}
                </span>
              </h1>
              <Link href="/masters/new" className="btn-outline lg:hidden">
                {t('listing_write_a_review')}
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
                        <Avatar name={m.name} seed={m.id} size="lg" fallback="master" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-semibold tracking-tight">
                              {m.name}
                            </h2>
                            <span
                              className={
                                m.kind === 'company'
                                  ? 'inline-flex items-center rounded-full bg-[#e8f0fe] px-2 py-0.5 text-[11px] font-medium text-[#1967d2]'
                                  : 'inline-flex items-center rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-mid'
                              }
                            >
                              {m.kind === 'company'
                                ? t('kind_company')
                                : t('kind_individual')}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-ink-mid">
                            {(m.specialties && m.specialties.length > 0
                              ? m.specialties
                              : [m.specialty]
                            )
                              .map((s) => specialtyLabel(s, locale))
                              .join(' · ')}
                            {m.area && <> · {m.area}</>}
                          </div>
                          {m.languages?.length > 0 && (
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                              <span className="inline-flex items-center rounded-full bg-surface-2 px-2 py-0.5 text-ink-mid">
                                {m.languages
                                  .map((l) => languageLabel(l, locale))
                                  .join(' · ')}
                              </span>
                            </div>
                          )}
                          <div className="mt-3 flex items-center flex-wrap gap-x-4 gap-y-1">
                            {count > 0 ? (
                              <>
                                <StarRating rating={avg} showNumber />
                                {m.avg_price && parseFloat(m.avg_price) > 0 && (
                                  <StarRating
                                    rating={parseFloat(m.avg_price)}
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
                                  key={`${review.master_id}-${review.created_at}-${review.user_name}`}
                                  className="flex gap-3"
                                >
                                  <Avatar
                                    name={review.user_name || review.imported_recommender_name || '?'}
                                    seed={review.user_name || review.imported_recommender_name || review.created_at}
                                    size="sm"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                      <span className="font-semibold">
                                        {review.user_name || review.imported_recommender_name || t('review_member')}
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
                {t('share_help_specialists')}
              </p>
              <Link
                href="/masters/new"
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
                  {topRated.map((m) => (
                    <Link
                      key={m.id}
                      href={`/masters/${m.id}`}
                      className="flex items-center gap-3 rounded-lg p-2 -m-2 hover:bg-surface-2"
                    >
                      <Avatar
                        name={m.name}
                        seed={m.id}
                        size="sm"
                        fallback="master"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-ink">
                          {m.name}
                        </div>
                        <div className="truncate text-xs text-ink-mid">
                          {specialtyLabel(
                            m.specialties?.[0] || m.specialty,
                            locale
                          )}
                        </div>
                      </div>
                      <span
                        className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-ink"
                        title="Average rating"
                      >
                        <span style={{ color: 'var(--star)' }}>★</span>
                        {parseFloat(m.avg_rating || '0').toFixed(1)}
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


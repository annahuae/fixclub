import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser, isAdmin } from '@/lib/auth';
import { sql } from '@/lib/db';
import {
  shopCategoryLabel,
  emirateLabel,
  formatDate,
  priceTierLabel
} from '@/lib/utils';
import { StarRating, StarInput } from '@/components/star-rating';
import { Avatar } from '@/components/avatar';
import { MapEmbed } from '@/components/map-embed';
import { Nav } from '@/components/nav';
import { PhoneLink } from '@/components/phone-link';
import { AnalyticsEvent } from '@/components/analytics-event';
import { addShopReview, deleteShop } from '../actions';

type Shop = {
  id: string;
  name: string;
  category: string;
  categories: string[];
  emirate: string | null;
  area: string | null;
  address: string | null;
  phone: string | null;
  whatsapp_phone: string | null;
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

export default async function ShopPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; reviewed?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const sp = await searchParams;

  const [shopRowsRaw, reviewRowsRaw] = await Promise.all([
    sql`
      SELECT s.*, u.name AS added_by_name
      FROM shops s
      LEFT JOIN users u ON u.id = s.added_by
      WHERE s.id = ${id}
      LIMIT 1
    `,
    sql`
      SELECT r.id, r.rating, r.price_rating, r.speed_rating, r.comment, r.created_at, r.user_id, u.name AS user_name
      FROM shop_reviews r
      LEFT JOIN users u ON u.id = r.user_id
      WHERE r.shop_id = ${id}
      ORDER BY r.created_at DESC
    `
  ]);

  const shopRows = shopRowsRaw as unknown as Shop[];
  if (shopRows.length === 0) notFound();
  const shop = shopRows[0];
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
  const admin = await isAdmin();
  const canManage = admin || shop.added_by === user.userId;

  const mapValue = shop.maps_url || shop.address || null;

  return (
    <>
      <AnalyticsEvent name="card_view_shop" />
      {sp.created === '1' && <AnalyticsEvent name="shop_added" />}
      {sp.reviewed === '1' && <AnalyticsEvent name="review_shop_added" />}
      <Nav searchAction="/shops" />
      <main className="shell py-8">
        <Link href="/shops" className="text-sm text-ink-mid hover:text-accent">
          ← Back to shops
        </Link>

        <div className="panel mt-4 p-6">
          <div className="flex items-start gap-5">
            <Avatar name={shop.name} seed={shop.id} size="lg" fallback="shop" />
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-ink">{shop.name}</h1>
              <div className="text-sm text-ink-mid mt-1">
                {(shop.categories && shop.categories.length > 0
                  ? shop.categories
                  : [shop.category]
                )
                  .map((c) => shopCategoryLabel(c))
                  .join(' · ')}
                {shop.emirate && (
                  <>
                    {' '}
                    · <span>{emirateLabel(shop.emirate)}</span>
                  </>
                )}
                {shop.area && (
                  <>
                    {' '}
                    · <span>{shop.area}</span>
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
                      ({reviewRows.length})
                    </span>
                  </>
                ) : (
                  <span className="text-ink-mid text-sm">No reviews yet</span>
                )}
              </div>

              {(shop.whatsapp_phone || shop.phone) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {shop.whatsapp_phone && (
                    <PhoneLink phone={shop.whatsapp_phone} kind="whatsapp" />
                  )}
                  {shop.phone && (
                    <PhoneLink phone={shop.phone} kind="call" />
                  )}
                </div>
              )}

              {shop.address && (
                <div className="mt-3 text-sm text-ink">📍 {shop.address}</div>
              )}

              {shop.description && (
                <p className="mt-4 text-ink leading-relaxed whitespace-pre-wrap text-sm">
                  {shop.description}
                </p>
              )}

              <div className="mt-4 text-xs text-ink-dim">
                Added by{' '}
                <span className="text-ink">
                  {shop.added_by_name || 'member'}
                </span>{' '}
                · {formatDate(shop.created_at)}
              </div>

              {canManage && (
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link
                    href={`/shops/${shop.id}/edit`}
                    className="btn-ghost text-xs"
                  >
                    Edit shop
                  </Link>
                  <form action={deleteShop}>
                    <input type="hidden" name="id" value={shop.id} />
                    <button type="submit" className="btn-danger text-xs">
                      Delete shop
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {mapValue && <MapEmbed value={mapValue} className="mt-5" />}
        </div>

        <section className="mt-6">
          {!admin && !userHasReviewed ? (
            <div className="panel mb-6 p-6">
              <h2 className="text-xl font-bold mb-1">Write a review</h2>
              <p className="text-ink-mid text-sm mb-4">
                One review per shop. Keep it useful.
              </p>
              <form action={addShopReview} className="space-y-4">
                <input type="hidden" name="shop_id" value={shop.id} />
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
                    placeholder="What you bought, pricing, service, important details"
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
              You have already reviewed this shop.
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
      </main>
    </>
  );
}

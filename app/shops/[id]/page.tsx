import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { shopCategoryLabel, emirateLabel, formatDate } from '@/lib/utils';
import { StarRating, StarInput } from '@/components/star-rating';
import { Avatar } from '@/components/avatar';
import { MapEmbed } from '@/components/map-embed';
import { Nav } from '@/components/nav';
import { PhoneLink } from '@/components/phone-link';
import { addShopReview, deleteShop } from '../actions';

type Shop = {
  id: string;
  name: string;
  category: string;
  emirate: string | null;
  area: string | null;
  address: string | null;
  phone: string | null;
  phone_is_whatsapp: boolean | null;
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

export default async function ShopPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const shopRows = (await sql`
    SELECT s.*, u.name AS added_by_name
    FROM shops s
    LEFT JOIN users u ON u.id = s.added_by
    WHERE s.id = ${id}
    LIMIT 1
  `) as unknown as Shop[];

  if (shopRows.length === 0) notFound();
  const shop = shopRows[0];

  const reviewRows = (await sql`
    SELECT r.id, r.rating, r.comment, r.created_at, r.user_id, u.name AS user_name
    FROM shop_reviews r
    LEFT JOIN users u ON u.id = r.user_id
    WHERE r.shop_id = ${id}
    ORDER BY r.created_at DESC
  `) as unknown as Review[];

  const avg =
    reviewRows.length > 0
      ? reviewRows.reduce((s, r) => s + r.rating, 0) / reviewRows.length
      : 0;

  const userHasReviewed = reviewRows.some((r) => r.user_id === user.userId);
  const userAdded = shop.added_by === user.userId;

  const mapValue = shop.maps_url || shop.address || null;

  return (
    <>
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
                {shopCategoryLabel(shop.category)}
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
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {reviewRows.length > 0 ? (
                  <>
                    <StarRating rating={avg} size="lg" showNumber />
                    <span className="text-ink-mid text-sm">
                      ({reviewRows.length})
                    </span>
                  </>
                ) : (
                  <span className="text-ink-mid text-sm">No reviews yet</span>
                )}
              </div>

              {shop.phone && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {shop.phone_is_whatsapp && (
                    <PhoneLink phone={shop.phone} kind="whatsapp" />
                  )}
                  <PhoneLink phone={shop.phone} kind="call" />
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

              {userAdded && (
                <form action={deleteShop} className="mt-3">
                  <input type="hidden" name="id" value={shop.id} />
                  <button type="submit" className="btn-danger text-xs">
                    Delete shop
                  </button>
                </form>
              )}
            </div>
          </div>

          {mapValue && <MapEmbed value={mapValue} className="mt-5" />}
        </div>

        <section className="mt-6">
          {!userHasReviewed ? (
            <div className="panel mb-6 p-6">
              <h2 className="text-xl font-bold mb-1">Write a review</h2>
              <p className="text-ink-mid text-sm mb-4">
                One review per shop. Keep it useful.
              </p>
              <form action={addShopReview} className="space-y-4">
                <input type="hidden" name="shop_id" value={shop.id} />
                <div>
                  <label className="label">Rating</label>
                  <StarInput />
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
      </main>
    </>
  );
}

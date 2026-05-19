import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { specialtyLabel, formatDate } from '@/lib/utils';
import { StarRating, StarInput } from '@/components/star-rating';
import { Nav } from '@/components/nav';
import { addReview, deleteMaster } from '../actions';

type Master = {
  id: string;
  name: string;
  specialty: string;
  area: string | null;
  phone: string | null;
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

export default async function MasterPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const masterRows = (await sql`
    SELECT m.*, u.name AS added_by_name
    FROM masters m
    LEFT JOIN users u ON u.id = m.added_by
    WHERE m.id = ${id}
    LIMIT 1
  `) as Master[];

  if (masterRows.length === 0) notFound();
  const master = masterRows[0];

  const reviewRows = (await sql`
    SELECT r.id, r.rating, r.comment, r.created_at, r.user_id, u.name AS user_name
    FROM reviews r
    LEFT JOIN users u ON u.id = r.user_id
    WHERE r.master_id = ${id}
    ORDER BY r.created_at DESC
  `) as Review[];

  const avg =
    reviewRows.length > 0
      ? reviewRows.reduce((s, r) => s + r.rating, 0) / reviewRows.length
      : 0;

  const userHasReviewed = reviewRows.some((r) => r.user_id === user.userId);
  const userAddedMaster = master.added_by === user.userId;

  return (
    <>
      <Nav />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <Link
          href="/masters"
          className="text-xs uppercase tracking-widest text-ink-dim hover:text-accent"
        >
          ← Каталог
        </Link>

        <div className="mt-4 mb-8">
          <div className="flex items-baseline gap-3 flex-wrap mb-3">
            <span className="chip-accent">
              {specialtyLabel(master.specialty)}
            </span>
            {master.area && <span className="chip">{master.area}</span>}
          </div>
          <h1 className="font-display text-6xl mb-4">{master.name}</h1>

          <div className="flex items-center gap-6 flex-wrap">
            {reviewRows.length > 0 ? (
              <div className="flex items-center gap-3">
                <StarRating rating={avg} size="lg" />
                <div>
                  <div className="font-mono text-xl">{avg.toFixed(1)}</div>
                  <div className="text-xs text-ink-dim uppercase tracking-widest">
                    {reviewRows.length}{' '}
                    {reviewRows.length === 1 ? 'отзыв' : 'отзывов'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-ink-dim text-sm">
                Пока без отзывов — будь первым.
              </div>
            )}
            {master.phone && (
              <a
                href={`tel:${master.phone}`}
                className="font-mono text-lg text-accent hover:underline"
              >
                {master.phone}
              </a>
            )}
          </div>

          {master.description && (
            <p className="mt-6 text-ink leading-relaxed whitespace-pre-wrap">
              {master.description}
            </p>
          )}

          <div className="mt-6 text-xs text-ink-dim">
            Добавил{' '}
            <span className="text-ink">
              {master.added_by_name || 'участник круга'}
            </span>{' '}
            · {formatDate(master.created_at)}
          </div>

          {userAddedMaster && (
            <form action={deleteMaster} className="mt-4">
              <input type="hidden" name="id" value={master.id} />
              <button
                type="submit"
                className="btn-danger text-xs"
              >
                Удалить мастера
              </button>
            </form>
          )}
        </div>

        <div className="divider" />

        {!userHasReviewed ? (
          <div className="card mb-10">
            <h2 className="font-display text-3xl mb-1">Оставить отзыв</h2>
            <p className="text-ink-dim text-sm mb-5">
              Один отзыв на мастера. Пиши по делу.
            </p>
            <form action={addReview} className="space-y-5">
              <input type="hidden" name="master_id" value={master.id} />
              <div>
                <label className="label">Оценка</label>
                <StarInput />
              </div>
              <div>
                <label className="label">Комментарий</label>
                <textarea
                  name="comment"
                  rows={4}
                  placeholder="Что делал, как сработал, есть ли нюансы"
                  className="input resize-none"
                />
              </div>
              <button type="submit" className="btn-primary">
                Опубликовать отзыв
              </button>
            </form>
          </div>
        ) : (
          <div className="mb-10 p-4 border border-border rounded-md text-sm text-ink-dim">
            Ты уже оставлял отзыв этому мастеру.
          </div>
        )}

        {reviewRows.length > 0 && (
          <div>
            <h2 className="font-display text-3xl mb-5">Отзывы</h2>
            <div className="space-y-4">
              {reviewRows.map((r) => (
                <div key={r.id} className="card">
                  <div className="flex items-baseline justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <StarRating rating={r.rating} size="sm" />
                      <span className="text-sm text-ink">
                        {r.user_name || '—'}
                      </span>
                    </div>
                    <span className="text-xs text-ink-dim font-mono">
                      {formatDate(r.created_at)}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-ink-dim leading-relaxed whitespace-pre-wrap">
                      {r.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

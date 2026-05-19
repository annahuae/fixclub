import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { SPECIALTIES, specialtyLabel } from '@/lib/utils';
import { StarRating } from '@/components/star-rating';
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

export default async function MastersPage({
  searchParams
}: {
  searchParams: Promise<{ specialty?: string; q?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const specialty = params.specialty || null;
  const q = params.q?.trim() || null;

  const rows = (await sql`
    SELECT
      m.id, m.name, m.specialty, m.area, m.phone,
      AVG(r.rating)::numeric(10,2) AS avg_rating,
      COUNT(r.id) AS review_count
    FROM masters m
    LEFT JOIN reviews r ON r.master_id = m.id
    WHERE
      (${specialty}::text IS NULL OR m.specialty = ${specialty})
      AND (${q}::text IS NULL OR m.name ILIKE ${'%' + (q || '') + '%'} OR m.area ILIKE ${'%' + (q || '') + '%'})
    GROUP BY m.id
    ORDER BY avg_rating DESC NULLS LAST, m.created_at DESC
  `) as MasterRow[];

  const areas = (await sql`SELECT DISTINCT area FROM masters WHERE area IS NOT NULL ORDER BY area`) as {
    area: string;
  }[];

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-10">
          <div className="text-xs uppercase tracking-[0.3em] text-ink-dim mb-3">
            Каталог
          </div>
          <h1 className="font-display text-5xl">
            Проверенные <span className="italic text-accent">мастера</span>
          </h1>
        </div>

        <form className="mb-8 flex flex-col md:flex-row gap-3">
          <input
            type="search"
            name="q"
            defaultValue={q || ''}
            placeholder="Поиск по имени или району"
            className="input md:max-w-sm"
          />
          <select
            name="specialty"
            defaultValue={specialty || ''}
            className="input md:max-w-xs"
          >
            <option value="">Все специальности</option>
            {SPECIALTIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-ghost">
            Фильтровать
          </button>
        </form>

        {rows.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-ink-dim mb-4">
              Пока никого. Будь первым — добавь мастера.
            </p>
            <Link href="/masters/new" className="btn-primary">
              + Добавить мастера
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {rows.map((m) => {
              const avg = m.avg_rating ? parseFloat(m.avg_rating) : 0;
              const count = parseInt(m.review_count);
              return (
                <Link
                  key={m.id}
                  href={`/masters/${m.id}`}
                  className="card hover:border-accent transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-3 flex-wrap mb-2">
                        <h2 className="font-display text-2xl group-hover:text-accent transition-colors">
                          {m.name}
                        </h2>
                        <span className="chip-accent">
                          {specialtyLabel(m.specialty)}
                        </span>
                        {m.area && <span className="chip">{m.area}</span>}
                      </div>
                      {m.phone && (
                        <div className="font-mono text-sm text-ink-dim">
                          {m.phone}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {count > 0 ? (
                        <>
                          <StarRating rating={avg} showNumber />
                          <div className="text-xs text-ink-dim mt-1">
                            {count} {count === 1 ? 'отзыв' : 'отзывов'}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-ink-dim">
                          Без отзывов
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}

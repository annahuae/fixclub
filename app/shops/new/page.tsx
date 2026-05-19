import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { SHOP_CATEGORIES, EMIRATES } from '@/lib/utils';
import { Nav } from '@/components/nav';
import { addShop } from '../actions';

export default async function NewShopPage() {
  await requireUser();
  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-6 py-8">
        <Link href="/shops" className="text-sm text-ink-mid hover:text-accent">
          ← К магазинам
        </Link>
        <h1 className="text-3xl font-bold mt-4 mb-1">Добавить магазин</h1>
        <p className="text-ink-mid text-sm mb-6">
          Где сам покупал стройматериалы, инструменты, бытовуху.
        </p>

        <form action={addShop} className="card space-y-4">
          <div>
            <label className="label">Название</label>
            <input
              name="name"
              required
              placeholder="ACE Hardware / Pan Emirates"
              className="input"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Категория</label>
              <select name="category" required className="input">
                {SHOP_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Эмират</label>
              <select name="emirate" className="input" defaultValue="dubai">
                <option value="">— Не указан —</option>
                {EMIRATES.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Район</label>
              <input
                name="area"
                placeholder="Industrial 5 / Naif / Al Quoz"
                className="input"
              />
            </div>
            <div>
              <label className="label">Телефон</label>
              <input
                name="phone"
                placeholder="+971 4 ..."
                className="input font-mono"
              />
            </div>
          </div>

          <div>
            <label className="label">Адрес</label>
            <input
              name="address"
              placeholder="Например: Shop 12, Al Mulla Plaza, Naif Rd, Deira"
              className="input"
            />
          </div>

          <div>
            <label className="label">Ссылка на Google Maps</label>
            <input
              name="maps_url"
              placeholder="https://maps.app.goo.gl/..."
              className="input"
            />
          </div>

          <div>
            <label className="label">Описание</label>
            <textarea
              name="description"
              rows={4}
              placeholder="Что есть, цены, время работы, нюансы"
              className="input resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" className="btn-primary">
              Сохранить
            </button>
            <Link href="/shops" className="btn-ghost">
              Отмена
            </Link>
          </div>
        </form>
      </main>
    </>
  );
}

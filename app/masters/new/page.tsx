import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { SPECIALTY_GROUPS, EMIRATES } from '@/lib/utils';
import { Nav } from '@/components/nav';
import { addMaster } from '../actions';

export default async function NewMasterPage() {
  await requireUser();
  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-6 py-8">
        <Link href="/masters" className="text-sm text-ink-mid hover:text-accent">
          ← Каталог
        </Link>
        <h1 className="text-3xl font-bold mt-4 mb-1">Добавить мастера</h1>
        <p className="text-ink-mid text-sm mb-6">
          Только те, с кем сам работал или кого тебе лично рекомендовали.
        </p>

        <form action={addMaster} className="card space-y-4">
          <div>
            <label className="label">Имя / название</label>
            <input
              name="name"
              required
              placeholder="Ahmed / SwiftFix Plumbing"
              className="input"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Специальность</label>
              <select name="specialty" required className="input">
                {SPECIALTY_GROUPS.map((g) => (
                  <optgroup key={g.title} label={g.title}>
                    {g.items.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </optgroup>
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
                placeholder="Marina / JLT / Industrial 5"
                className="input"
              />
            </div>
            <div>
              <label className="label">Телефон</label>
              <input
                name="phone"
                placeholder="+971 50 ..."
                className="input font-mono"
              />
            </div>
          </div>

          <div>
            <label className="label">
              Ссылка на Google Maps (необязательно)
            </label>
            <input
              name="maps_url"
              placeholder="https://maps.app.goo.gl/... или адрес"
              className="input"
            />
          </div>

          <div>
            <label className="label">Описание / контекст</label>
            <textarea
              name="description"
              rows={4}
              placeholder="Что делает, в каких задачах хорош, есть ли язык, цены, нюансы"
              className="input resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" className="btn-primary">
              Сохранить
            </button>
            <Link href="/masters" className="btn-ghost">
              Отмена
            </Link>
          </div>
        </form>
      </main>
    </>
  );
}

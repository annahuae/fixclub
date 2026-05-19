import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { SPECIALTIES } from '@/lib/utils';
import { Nav } from '@/components/nav';
import { addMaster } from '../actions';

export default async function NewMasterPage() {
  await requireUser();
  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <Link
          href="/masters"
          className="text-xs uppercase tracking-widest text-ink-mid hover:text-accent"
        >
          ← Каталог
        </Link>
        <h1 className="font-bold tracking-tight text-5xl mt-4 mb-2">
          Новый <span className="text-accent">мастер</span>
        </h1>
        <p className="text-ink-mid text-sm mb-8">
          Добавляй только тех, с кем сам работал или кого тебе рекомендовали
          лично.
        </p>

        <form action={addMaster} className="card space-y-5">
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
                {SPECIALTIES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Район</label>
              <input
                name="area"
                placeholder="Marina / JLT / Downtown"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Телефон</label>
            <input
              name="phone"
              placeholder="+971 50 ..."
              className="input font-mono"
            />
          </div>

          <div>
            <label className="label">Описание / контекст</label>
            <textarea
              name="description"
              rows={4}
              placeholder="Что делает, в каких задачах хорош, есть ли язык, цены, любые детали"
              className="input resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
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

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
      <main className="shell py-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/masters"
            className="text-sm text-ink-mid hover:text-accent"
          >
            ← Catalog
          </Link>
          <div className="mt-5 mb-6">
            <div className="eyebrow mb-3">Write a review</div>
            <h1 className="text-4xl font-bold tracking-tight">
              Add specialist
            </h1>
            <p className="mt-2 text-ink-mid">
              Add only people you have worked with or were personally recommended.
            </p>
          </div>

        <form action={addMaster} className="panel space-y-5 p-6">
          <div>
            <label className="label">Name / company</label>
            <input
              name="name"
              required
              placeholder="Ahmed / SwiftFix Plumbing"
              className="input"
            />
          </div>

          <div>
            <label className="label">This is…</label>
            <div className="flex gap-3">
              <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm hover:border-accent has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
                <input
                  type="radio"
                  name="kind"
                  value="individual"
                  defaultChecked
                  className="h-4 w-4 accent-accent"
                />
                An individual
              </label>
              <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm hover:border-accent has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
                <input
                  type="radio"
                  name="kind"
                  value="company"
                  className="h-4 w-4 accent-accent"
                />
                A company
              </label>
            </div>
          </div>

          <div>
            <label className="label">
              Specialties{' '}
              <span className="text-ink-dim font-normal">
                (pick one or more)
              </span>
            </label>
            <div className="rounded-xl border border-border bg-surface p-4">
              {SPECIALTY_GROUPS.map((g) => (
                <div key={g.title} className="mt-3 first:mt-0">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-dim">
                    {g.title}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {g.items.map((s) => (
                      <label
                        key={s.value}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-2"
                      >
                        <input
                          type="checkbox"
                          name="specialties"
                          value={s.value}
                          className="h-4 w-4 accent-accent"
                        />
                        {s.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Emirate</label>
            <select name="emirate" className="input md:w-1/2" defaultValue="dubai">
              <option value="">— Not specified —</option>
              {EMIRATES.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Area</label>
              <input
                name="area"
                placeholder="Marina / JLT / Industrial 5"
                className="input"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">WhatsApp number</label>
              <input
                name="whatsapp_phone"
                placeholder="+971 50 ..."
                className="input font-mono"
              />
            </div>
            <div>
              <label className="label">Phone (for calls)</label>
              <input
                name="phone"
                placeholder="+971 50 ..."
                className="input font-mono"
              />
            </div>
          </div>

          <div>
            <label className="label">
              Google Maps link (optional)
            </label>
            <input
              name="maps_url"
              placeholder="https://maps.app.goo.gl/... or address"
              className="input"
            />
          </div>

          <div>
            <label className="label">Description / context</label>
            <textarea
              name="description"
              rows={4}
              placeholder="What they do, what they are good at, language, pricing, details"
              className="input resize-none"
            />
          </div>

          <div className="flex gap-3 border-t border-border pt-5">
            <button type="submit" className="btn-primary">
              Save
            </button>
            <Link href="/masters" className="btn-ghost">
              Cancel
            </Link>
          </div>
        </form>
        </div>
      </main>
    </>
  );
}

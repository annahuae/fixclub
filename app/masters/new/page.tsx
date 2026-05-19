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

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Specialty</label>
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
              <label className="label">Emirate</label>
              <select name="emirate" className="input" defaultValue="dubai">
                <option value="">— Not specified —</option>
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
              <label className="label">Area</label>
              <input
                name="area"
                placeholder="Marina / JLT / Industrial 5"
                className="input"
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                name="phone"
                placeholder="+971 50 ..."
                className="input font-mono"
              />
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-ink-mid">
                <input
                  type="checkbox"
                  name="phone_is_whatsapp"
                  value="1"
                  className="h-4 w-4 accent-accent"
                />
                This is a WhatsApp number
              </label>
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

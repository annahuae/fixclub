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
      <main className="shell py-8">
        <div className="mx-auto max-w-3xl">
          <Link href="/shops" className="text-sm text-ink-mid hover:text-accent">
            ← Shops
          </Link>
          <div className="mt-5 mb-6">
            <div className="eyebrow mb-3">Share a place</div>
            <h1 className="text-4xl font-bold tracking-tight">
              Add shop
            </h1>
            <p className="mt-2 text-ink-mid">
              Add places where you have bought materials, tools, or home goods.
            </p>
          </div>

        <form action={addShop} className="panel space-y-5 p-6">
          <div>
            <label className="label">Name</label>
            <input
              name="name"
              required
              placeholder="ACE Hardware / Pan Emirates"
              className="input"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select name="category" required className="input">
                {SHOP_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
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
                placeholder="Industrial 5 / Naif / Al Quoz"
                className="input"
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                name="phone"
                placeholder="+971 4 ..."
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
            <label className="label">Address</label>
            <input
              name="address"
              placeholder="Example: Shop 12, Al Mulla Plaza, Naif Rd, Deira"
              className="input"
            />
          </div>

          <div>
            <label className="label">Google Maps link</label>
            <input
              name="maps_url"
              placeholder="https://maps.app.goo.gl/..."
              className="input"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              name="description"
              rows={4}
              placeholder="What they sell, pricing, opening hours, details"
              className="input resize-none"
            />
          </div>

          <div className="flex gap-3 border-t border-border pt-5">
            <button type="submit" className="btn-primary">
              Save
            </button>
            <Link href="/shops" className="btn-ghost">
              Cancel
            </Link>
          </div>
        </form>
        </div>
      </main>
    </>
  );
}

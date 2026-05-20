import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireUser, isAdmin } from '@/lib/auth';
import { sql } from '@/lib/db';
import { SHOP_CATEGORIES, EMIRATES } from '@/lib/utils';
import { Nav } from '@/components/nav';
import { updateShop } from '../../actions';

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
};

export default async function EditShopPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const rows = (await sql`
    SELECT * FROM shops WHERE id = ${id} LIMIT 1
  `) as unknown as Shop[];

  if (rows.length === 0) notFound();
  const shop = rows[0];
  const admin = await isAdmin();
  if (!admin && shop.added_by !== user.userId) redirect(`/shops/${id}`);

  return (
    <>
      <Nav showSearch={false} />
      <main className="shell py-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href={`/shops/${id}`}
            className="text-sm text-ink-mid hover:text-accent"
          >
            ← {shop.name}
          </Link>
          <div className="mt-5 mb-6">
            <h1 className="text-4xl font-bold tracking-tight">Edit shop</h1>
          </div>

          <form action={updateShop} className="panel space-y-5 p-6">
            <input type="hidden" name="id" value={id} />

            <div>
              <label className="label">Name</label>
              <input
                name="name"
                required
                defaultValue={shop.name}
                className="input"
              />
            </div>

            <div>
              <label className="label">
                Categories{' '}
                <span className="text-ink-dim font-normal">
                  (pick one or more)
                </span>
              </label>
              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {SHOP_CATEGORIES.map((c) => {
                    const checked =
                      shop.categories && shop.categories.length > 0
                        ? shop.categories.includes(c.value)
                        : shop.category === c.value;
                    return (
                      <label
                        key={c.value}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-2"
                      >
                        <input
                          type="checkbox"
                          name="categories"
                          value={c.value}
                          defaultChecked={checked}
                          className="h-4 w-4 accent-accent"
                        />
                        {c.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <label className="label">Emirate</label>
              <select
                name="emirate"
                defaultValue={shop.emirate || ''}
                className="input md:w-1/2"
              >
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
                  defaultValue={shop.area || ''}
                  className="input"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">WhatsApp number</label>
                <input
                  name="whatsapp_phone"
                  defaultValue={shop.whatsapp_phone || ''}
                  placeholder="+971 50 ..."
                  className="input font-mono"
                />
              </div>
              <div>
                <label className="label">Phone (for calls)</label>
                <input
                  name="phone"
                  defaultValue={shop.phone || ''}
                  placeholder="+971 4 ..."
                  className="input font-mono"
                />
              </div>
            </div>

            <div>
              <label className="label">Address</label>
              <input
                name="address"
                defaultValue={shop.address || ''}
                className="input"
              />
            </div>

            <div>
              <label className="label">Google Maps link</label>
              <input
                name="maps_url"
                defaultValue={shop.maps_url || ''}
                className="input"
              />
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                name="description"
                defaultValue={shop.description || ''}
                rows={4}
                className="input resize-none"
              />
            </div>

            <div className="flex gap-3 border-t border-border pt-5">
              <button type="submit" className="btn-primary">
                Save changes
              </button>
              <Link href={`/shops/${id}`} className="btn-ghost">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

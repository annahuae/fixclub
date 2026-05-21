'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { requireUser, isAdmin } from '@/lib/auth';
import { normalizeTags } from '@/lib/utils';

export async function addShop(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get('name') || '').trim();
  const categories = formData
    .getAll('categories')
    .map((v) => String(v).trim())
    .filter(Boolean);
  const emirate = String(formData.get('emirate') || '').trim() || null;
  const area = String(formData.get('area') || '').trim() || null;
  const address = String(formData.get('address') || '').trim() || null;
  const phone = String(formData.get('phone') || '').trim() || null;
  const whatsappPhone =
    String(formData.get('whatsapp_phone') || '').trim() || null;
  const mapsUrl = String(formData.get('maps_url') || '').trim() || null;
  const website = normalizeUrl(String(formData.get('website') || '').trim()) || null;
  const description =
    String(formData.get('description') || '').trim() || null;
  const tags = normalizeTags(formData.getAll('tags'));

  if (!name || categories.length === 0) {
    redirect('/shops/new');
  }
  const primary = categories[0];

  const rows = (await sql`
    INSERT INTO shops (name, category, categories, emirate, area, address, phone, whatsapp_phone, maps_url, website, description, tags, added_by)
    VALUES (${name}, ${primary}, ${categories}, ${emirate}, ${area}, ${address}, ${phone}, ${whatsappPhone}, ${mapsUrl}, ${website}, ${description}, ${tags}, ${user.userId})
    RETURNING id
  `) as { id: string }[];

  revalidatePath('/shops');
  redirect(`/shops/${rows[0].id}?created=1`);
}

function normalizeUrl(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[a-z0-9-]+\.[a-z]{2,}/i.test(s)) return 'https://' + s;
  return s;
}

function clampShopRating(raw: FormDataEntryValue | null): number {
  const n = parseInt(String(raw || '0'));
  if (!Number.isFinite(n) || n < 1 || n > 5) return 0;
  return n;
}

export async function addShopReview(formData: FormData) {
  const user = await requireUser();
  const shopId = String(formData.get('shop_id') || '');
  const rating = clampShopRating(formData.get('rating'));
  const priceRating = clampShopRating(formData.get('price_rating')) || null;
  const speedRating = clampShopRating(formData.get('speed_rating')) || null;
  const comment = String(formData.get('comment') || '').trim() || null;

  if (!shopId || !rating) {
    redirect(`/shops/${shopId}`);
  }

  const existing = (await sql`
    SELECT id FROM shop_reviews
    WHERE shop_id = ${shopId} AND user_id = ${user.userId} LIMIT 1
  `) as { id: string }[];

  if (existing.length === 0) {
    await sql`
      INSERT INTO shop_reviews (shop_id, user_id, rating, price_rating, speed_rating, comment)
      VALUES (${shopId}, ${user.userId}, ${rating}, ${priceRating}, ${speedRating}, ${comment})
    `;
  }

  revalidatePath(`/shops/${shopId}`);
  revalidatePath('/shops');
  redirect(`/shops/${shopId}?reviewed=1`);
}

export async function updateShop(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get('id') || '');
  if (!id) redirect('/shops');

  const name = String(formData.get('name') || '').trim();
  const categories = formData
    .getAll('categories')
    .map((v) => String(v).trim())
    .filter(Boolean);
  const emirate = String(formData.get('emirate') || '').trim() || null;
  const area = String(formData.get('area') || '').trim() || null;
  const address = String(formData.get('address') || '').trim() || null;
  const phone = String(formData.get('phone') || '').trim() || null;
  const whatsappPhone =
    String(formData.get('whatsapp_phone') || '').trim() || null;
  const mapsUrl = String(formData.get('maps_url') || '').trim() || null;
  const website = normalizeUrl(String(formData.get('website') || '').trim()) || null;
  const description =
    String(formData.get('description') || '').trim() || null;
  const tags = normalizeTags(formData.getAll('tags'));

  if (!name || categories.length === 0) {
    redirect(`/shops/${id}/edit`);
  }
  const primary = categories[0];

  const admin = await isAdmin();
  const result = (await sql`
    UPDATE shops SET
      name = ${name},
      category = ${primary},
      categories = ${categories},
      emirate = ${emirate},
      area = ${area},
      address = ${address},
      phone = ${phone},
      whatsapp_phone = ${whatsappPhone},
      maps_url = ${mapsUrl},
      website = ${website},
      description = ${description},
      tags = ${tags}
    WHERE id = ${id} AND (${admin}::boolean OR added_by = ${user.userId})
    RETURNING id
  `) as { id: string }[];

  if (result.length === 0) redirect(`/shops/${id}`);

  revalidatePath('/shops');
  revalidatePath(`/shops/${id}`);
  redirect(`/shops/${id}`);
}

export async function deleteShop(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get('id') || '');
  if (!id) redirect('/shops');
  const admin = await isAdmin();

  await sql`
    DELETE FROM shops
    WHERE id = ${id} AND (${admin}::boolean OR added_by = ${user.userId})
  `;

  revalidatePath('/shops');
  redirect('/shops');
}

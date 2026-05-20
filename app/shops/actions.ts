'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { requireUser, isAdmin } from '@/lib/auth';

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
  const description =
    String(formData.get('description') || '').trim() || null;

  if (!name || categories.length === 0) {
    redirect('/shops/new');
  }
  const primary = categories[0];

  const rows = (await sql`
    INSERT INTO shops (name, category, categories, emirate, area, address, phone, whatsapp_phone, maps_url, description, added_by)
    VALUES (${name}, ${primary}, ${categories}, ${emirate}, ${area}, ${address}, ${phone}, ${whatsappPhone}, ${mapsUrl}, ${description}, ${user.userId})
    RETURNING id
  `) as { id: string }[];

  revalidatePath('/shops');
  redirect(`/shops/${rows[0].id}`);
}

export async function addShopReview(formData: FormData) {
  const user = await requireUser();
  const shopId = String(formData.get('shop_id') || '');
  const rating = parseInt(String(formData.get('rating') || '0'));
  const comment = String(formData.get('comment') || '').trim() || null;

  if (!shopId || rating < 1 || rating > 5) {
    redirect(`/shops/${shopId}`);
  }

  const existing = (await sql`
    SELECT id FROM shop_reviews
    WHERE shop_id = ${shopId} AND user_id = ${user.userId} LIMIT 1
  `) as { id: string }[];

  if (existing.length === 0) {
    await sql`
      INSERT INTO shop_reviews (shop_id, user_id, rating, comment)
      VALUES (${shopId}, ${user.userId}, ${rating}, ${comment})
    `;
  }

  revalidatePath(`/shops/${shopId}`);
  revalidatePath('/shops');
  redirect(`/shops/${shopId}`);
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
  const description =
    String(formData.get('description') || '').trim() || null;

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
      description = ${description}
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

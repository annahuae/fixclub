'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function addShop(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get('name') || '').trim();
  const category = String(formData.get('category') || '').trim();
  const emirate = String(formData.get('emirate') || '').trim() || null;
  const area = String(formData.get('area') || '').trim() || null;
  const address = String(formData.get('address') || '').trim() || null;
  const phone = String(formData.get('phone') || '').trim() || null;
  const phoneIsWhatsapp = !!formData.get('phone_is_whatsapp') && !!phone;
  const phone2 = String(formData.get('phone2') || '').trim() || null;
  const phone2IsWhatsapp = !!formData.get('phone2_is_whatsapp') && !!phone2;
  const mapsUrl = String(formData.get('maps_url') || '').trim() || null;
  const description =
    String(formData.get('description') || '').trim() || null;

  if (!name || !category) {
    redirect('/shops/new');
  }

  const rows = (await sql`
    INSERT INTO shops (name, category, emirate, area, address, phone, phone_is_whatsapp, phone2, phone2_is_whatsapp, maps_url, description, added_by)
    VALUES (${name}, ${category}, ${emirate}, ${area}, ${address}, ${phone}, ${phoneIsWhatsapp}, ${phone2}, ${phone2IsWhatsapp}, ${mapsUrl}, ${description}, ${user.userId})
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

export async function deleteShop(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get('id') || '');
  if (!id) redirect('/shops');

  await sql`
    DELETE FROM shops WHERE id = ${id} AND added_by = ${user.userId}
  `;

  revalidatePath('/shops');
  redirect('/shops');
}

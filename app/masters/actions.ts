'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { normalizeTags } from '@/lib/utils';

export async function addMaster(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get('name') || '').trim();
  const specialties = formData
    .getAll('specialties')
    .map((v) => String(v).trim())
    .filter(Boolean);
  const kindRaw = String(formData.get('kind') || 'individual').trim();
  const kind = kindRaw === 'company' ? 'company' : 'individual';
  const emirate = String(formData.get('emirate') || '').trim() || null;
  const area = String(formData.get('area') || '').trim() || null;
  const phone = String(formData.get('phone') || '').trim() || null;
  const whatsappPhone =
    String(formData.get('whatsapp_phone') || '').trim() || null;
  const languages = formData
    .getAll('languages')
    .map((v) => String(v).trim())
    .filter(Boolean);
  const paceRaw = String(formData.get('pace') || '').trim();
  const pace = ['fast', 'average', 'slow'].includes(paceRaw) ? paceRaw : null;
  const instagram = normalizeInstagram(
    String(formData.get('instagram') || '').trim() || null
  );
  const mapsUrl = String(formData.get('maps_url') || '').trim() || null;
  const description =
    String(formData.get('description') || '').trim() || null;
  const tags = normalizeTags(formData.getAll('tags'));

  if (!name || specialties.length === 0) {
    redirect('/masters/new');
  }
  const primary = specialties[0];

  const rows = (await sql`
    INSERT INTO masters (name, phone, whatsapp_phone, specialty, specialties, kind, emirate, area, languages, pace, instagram, maps_url, description, tags, added_by)
    VALUES (${name}, ${phone}, ${whatsappPhone}, ${primary}, ${specialties}, ${kind}, ${emirate}, ${area}, ${languages}, ${pace}, ${instagram}, ${mapsUrl}, ${description}, ${tags}, ${user.userId})
    RETURNING id
  `) as { id: string }[];

  revalidatePath('/masters');
  redirect(`/masters/${rows[0].id}?created=1`);
}

function normalizeInstagram(input: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  // Strip protocol/host/leading @ and slashes — keep just the handle.
  const handle = trimmed
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/\/+$/, '')
    .split(/[\s?#]/)[0];
  return handle || null;
}

function clampRating(raw: FormDataEntryValue | null): number {
  const n = parseInt(String(raw || '0'));
  if (!Number.isFinite(n) || n < 1 || n > 5) return 0;
  return n;
}

export async function addReview(formData: FormData) {
  const user = await requireUser();
  const masterId = String(formData.get('master_id') || '');
  const rating = clampRating(formData.get('rating'));
  const priceRating = clampRating(formData.get('price_rating')) || null;
  const speedRating = clampRating(formData.get('speed_rating')) || null;
  const comment = String(formData.get('comment') || '').trim() || null;

  if (!masterId || !rating) {
    redirect(`/masters/${masterId}`);
  }

  const existing = (await sql`
    SELECT id FROM reviews WHERE master_id = ${masterId} AND user_id = ${user.userId} LIMIT 1
  `) as { id: string }[];

  if (existing.length === 0) {
    await sql`
      INSERT INTO reviews (master_id, user_id, rating, price_rating, speed_rating, comment)
      VALUES (${masterId}, ${user.userId}, ${rating}, ${priceRating}, ${speedRating}, ${comment})
    `;
  }

  revalidatePath(`/masters/${masterId}`);
  revalidatePath('/masters');
  redirect(`/masters/${masterId}?reviewed=1`);
}

export async function deleteMaster(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get('id') || '');
  if (!id) redirect('/masters');

  // Only the user who added the master can delete it (admin can delete anything via admin panel)
  await sql`
    DELETE FROM masters
    WHERE id = ${id} AND added_by = ${user.userId}
  `;

  revalidatePath('/masters');
  redirect('/masters');
}

'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { requireUser } from '@/lib/auth';

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
  const mapsUrl = String(formData.get('maps_url') || '').trim() || null;
  const description =
    String(formData.get('description') || '').trim() || null;

  if (!name || specialties.length === 0) {
    redirect('/masters/new');
  }
  const primary = specialties[0];

  const rows = (await sql`
    INSERT INTO masters (name, phone, whatsapp_phone, specialty, specialties, kind, emirate, area, languages, pace, maps_url, description, added_by)
    VALUES (${name}, ${phone}, ${whatsappPhone}, ${primary}, ${specialties}, ${kind}, ${emirate}, ${area}, ${languages}, ${pace}, ${mapsUrl}, ${description}, ${user.userId})
    RETURNING id
  `) as { id: string }[];

  revalidatePath('/masters');
  redirect(`/masters/${rows[0].id}?created=1`);
}

export async function addReview(formData: FormData) {
  const user = await requireUser();
  const masterId = String(formData.get('master_id') || '');
  const rating = parseInt(String(formData.get('rating') || '0'));
  const comment = String(formData.get('comment') || '').trim() || null;

  if (!masterId || rating < 1 || rating > 5) {
    redirect(`/masters/${masterId}`);
  }

  // one review per user per master
  const existing = (await sql`
    SELECT id FROM reviews WHERE master_id = ${masterId} AND user_id = ${user.userId} LIMIT 1
  `) as { id: string }[];

  if (existing.length === 0) {
    await sql`
      INSERT INTO reviews (master_id, user_id, rating, comment)
      VALUES (${masterId}, ${user.userId}, ${rating}, ${comment})
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

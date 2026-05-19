'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function addMaster(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get('name') || '').trim();
  const specialty = String(formData.get('specialty') || '').trim();
  const area = String(formData.get('area') || '').trim() || null;
  const phone = String(formData.get('phone') || '').trim() || null;
  const description =
    String(formData.get('description') || '').trim() || null;

  if (!name || !specialty) {
    redirect('/masters/new');
  }

  const rows = (await sql`
    INSERT INTO masters (name, phone, specialty, area, description, added_by)
    VALUES (${name}, ${phone}, ${specialty}, ${area}, ${description}, ${user.userId})
    RETURNING id
  `) as { id: string }[];

  revalidatePath('/masters');
  redirect(`/masters/${rows[0].id}`);
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
  redirect(`/masters/${masterId}`);
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

'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function updateName(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get('name') || '').trim();
  if (!name) redirect('/profile?error=Name+cannot+be+empty');
  if (name.length > 15) redirect('/profile?error=Name+is+too+long');

  await sql`UPDATE users SET name = ${name} WHERE id = ${user.userId}`;

  revalidatePath('/profile');
  redirect('/profile?saved=1');
}

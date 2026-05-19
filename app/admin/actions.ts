'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import {
  checkAdminPassword,
  destroyAdminCookie,
  isAdmin,
  setAdminCookie
} from '@/lib/auth';
import { generateInviteCode } from '@/lib/utils';

async function requireAdmin() {
  if (!(await isAdmin())) redirect('/admin');
}

export async function adminLogin(formData: FormData) {
  const password = String(formData.get('password') || '');
  if (!checkAdminPassword(password)) {
    redirect('/admin?error=Неверный+пароль');
  }
  await setAdminCookie();
  redirect('/admin?tab=requests');
}

export async function adminLogout() {
  await destroyAdminCookie();
  redirect('/');
}

export async function approveRequest(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') || '');
  if (!id) redirect('/admin?tab=requests');

  // Mark request approved and generate a fresh invite code for them
  await sql`
    UPDATE access_requests
    SET status = 'approved', reviewed_at = NOW()
    WHERE id = ${id}
  `;
  const reqRows = (await sql`
    SELECT name FROM access_requests WHERE id = ${id} LIMIT 1
  `) as { name: string }[];
  const note = reqRows.length > 0 ? `Approved: ${reqRows[0].name}` : 'Approved';

  const code = generateInviteCode();
  await sql`
    INSERT INTO invite_codes (code, note) VALUES (${code}, ${note})
  `;

  revalidatePath('/admin');
  redirect(`/admin?tab=invites`);
}

export async function rejectRequest(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') || '');
  if (!id) redirect('/admin?tab=requests');
  await sql`
    UPDATE access_requests
    SET status = 'rejected', reviewed_at = NOW()
    WHERE id = ${id}
  `;
  revalidatePath('/admin');
  redirect('/admin?tab=requests');
}

export async function generateInvite(formData: FormData) {
  await requireAdmin();
  const note = String(formData.get('note') || '').trim() || null;
  const code = generateInviteCode();
  await sql`INSERT INTO invite_codes (code, note) VALUES (${code}, ${note})`;
  revalidatePath('/admin');
  redirect('/admin?tab=invites');
}

export async function deleteInvite(formData: FormData) {
  await requireAdmin();
  const code = String(formData.get('code') || '');
  await sql`DELETE FROM invite_codes WHERE code = ${code} AND used_by IS NULL`;
  revalidatePath('/admin');
  redirect('/admin?tab=invites');
}

export async function deleteUser(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') || '');
  await sql`DELETE FROM users WHERE id = ${id}`;
  revalidatePath('/admin');
  redirect('/admin?tab=users');
}

export async function deleteMasterAsAdmin(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') || '');
  await sql`DELETE FROM masters WHERE id = ${id}`;
  revalidatePath('/admin');
  revalidatePath('/masters');
  redirect('/admin');
}

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

  const reqRows = (await sql`
    SELECT name, email, password_hash FROM access_requests
    WHERE id = ${id} LIMIT 1
  `) as { name: string; email: string; password_hash: string | null }[];

  if (reqRows.length === 0) {
    redirect('/admin?tab=requests');
  }
  const r = reqRows[0];

  if (r.password_hash) {
    // Modern flow: create user directly with their pre-set password
    const exists = (await sql`
      SELECT 1 FROM users WHERE LOWER(email) = LOWER(${r.email}) LIMIT 1
    `) as { '?column?': number }[];
    if (exists.length === 0) {
      await sql`
        INSERT INTO users (name, email, password_hash)
        VALUES (${r.name}, ${r.email}, ${r.password_hash})
      `;
    }
    await sql`
      UPDATE access_requests
      SET status = 'approved', reviewed_at = NOW()
      WHERE id = ${id}
    `;
    revalidatePath('/admin');
    redirect('/admin?tab=users');
  } else {
    // Legacy: generate an invite code
    await sql`
      UPDATE access_requests
      SET status = 'approved', reviewed_at = NOW()
      WHERE id = ${id}
    `;
    const code = generateInviteCode();
    await sql`
      INSERT INTO invite_codes (code, note)
      VALUES (${code}, ${`Approved: ${r.name}`})
    `;
    revalidatePath('/admin');
    redirect('/admin?tab=invites');
  }
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

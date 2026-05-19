import { redirect } from 'next/navigation';
import { getSessionUser, isAdmin } from '@/lib/auth';

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const params = await searchParams;
  const user = await getSessionUser();
  if (user) redirect('/masters');
  if (await isAdmin()) redirect('/masters');
  if (params.invite) {
    redirect(`/access?mode=signup&invite=${encodeURIComponent(params.invite)}`);
  }
  redirect('/access');
}

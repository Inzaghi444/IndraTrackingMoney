import 'server-only';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { auth } from '@/lib/auth';

/**
 * Session di-cache per request supaya layout + page tidak query dua kali.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/**
 * Dipakai di Server Component / Server Action yang WAJIB login.
 * user_id selalu diambil dari session — tidak pernah dari input klien.
 */
export async function requireUser() {
  const session = await getSession();
  if (!session?.user) redirect('/login');
  return session.user;
}

/** Varian untuk Server Action: lempar error, bukan redirect */
export async function requireUserAction() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('UNAUTHORIZED');
  }
  return session.user;
}

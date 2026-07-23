'use server';

import { authOptions } from '@/lib/authOptions';
import { getServerSession } from 'next-auth';

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export async function getTokenWorkaround() {
  const session = await getSession();
  return session?.accessToken;
}

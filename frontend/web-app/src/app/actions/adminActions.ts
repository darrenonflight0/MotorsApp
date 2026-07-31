'use server';

import { fetchWrapper } from '@/lib/fetchWrapper';

export type ManagedUser = {
  username: string;
  name: string;
  verified: boolean;
  isAdmin: boolean;
  profilePicture?: string | null;
};

type Err = { error: { status: number; message: string } };

/** Empty query returns current admins; a query searches all users by username. */
export async function listUsers(q: string): Promise<ManagedUser[]> {
  const res = await fetchWrapper.get(`roles/users?q=${encodeURIComponent(q)}`);
  return Array.isArray(res) ? res : [];
}

export async function grantAdmin(username: string): Promise<ManagedUser | Err> {
  return fetchWrapper.post(`roles/${encodeURIComponent(username)}/admin`, {});
}

export async function revokeAdmin(username: string): Promise<ManagedUser | Err> {
  return fetchWrapper.del(`roles/${encodeURIComponent(username)}/admin`);
}

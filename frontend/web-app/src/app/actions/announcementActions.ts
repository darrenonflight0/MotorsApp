'use server';

import { fetchWrapper } from '@/lib/fetchWrapper';

type Result = { sent: boolean } | { error: { status: number; message: string } };

/** Admin: broadcast a platform-wide announcement to every user (backend enforces Admin). */
export async function sendAnnouncement(input: {
  title: string;
  message: string;
  href?: string;
}): Promise<Result> {
  return await fetchWrapper.post('announcements', input);
}

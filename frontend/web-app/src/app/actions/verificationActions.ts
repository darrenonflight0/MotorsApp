'use server';

import { fetchWrapper } from '@/lib/fetchWrapper';

export type ApplicationStatus = {
  id: string;
  username: string;
  idType: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
};

export type MyVerification = {
  verified: boolean;
  application: ApplicationStatus | null;
};

export type ReviewApplication = ApplicationStatus & {
  selfieImage: string;
  idImage: string;
};

export type PublicProfile = {
  username: string;
  name: string;
  verified: boolean;
  profilePicture?: string | null;
};

type Err = { error: { status: number; message: string } };

export async function applyToSell(payload: {
  idType: string;
  selfieImage: string;
  idImage: string;
}): Promise<ApplicationStatus | Err> {
  return await fetchWrapper.post('verification/apply', payload);
}

export async function getMyVerification(): Promise<MyVerification | Err> {
  return await fetchWrapper.get('verification/mine');
}

// ── Admin ──
export async function getPendingApplications(): Promise<ReviewApplication[] | Err> {
  return await fetchWrapper.get('verification/admin/pending');
}

export async function approveApplication(id: string): Promise<ApplicationStatus | Err> {
  return await fetchWrapper.post(`verification/admin/${id}/approve`, {});
}

export async function rejectApplication(id: string, reason: string): Promise<ApplicationStatus | Err> {
  return await fetchWrapper.post(`verification/admin/${id}/reject`, { reason });
}

// ── Profiles (blue tick lookup) ──
export async function getPublicProfile(username: string): Promise<PublicProfile | Err> {
  return await fetchWrapper.get(`profile/${encodeURIComponent(username)}`);
}

export async function setProfilePicture(profilePicture: string): Promise<{ profilePicture: string } | Err> {
  return await fetchWrapper.post('profile/me/picture', { profilePicture });
}

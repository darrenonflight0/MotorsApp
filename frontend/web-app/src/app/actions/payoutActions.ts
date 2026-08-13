'use server';

import { fetchWrapper } from '@/lib/fetchWrapper';

export type PayoutBank = { name: string; code: string };

export type PayoutMethod = {
  provider: string;
  bankName?: string;
  accountName?: string;
  accountLast4?: string;
  currency?: string;
  updatedAt?: string;
};

export type PayoutStatus = {
  provider: string;
  method: PayoutMethod | null;
};

type Result<T> = T | { error: { status: number; message: string } };

/** The caller's current payout destination (and the active provider). */
export async function getMyPayout(): Promise<Result<PayoutStatus>> {
  return await fetchWrapper.get('payouts/mine');
}

/** Banks the seller can pay out to for a currency. */
export async function getPayoutBanks(currency?: string): Promise<Result<PayoutBank[]>> {
  const q = currency ? `?currency=${encodeURIComponent(currency)}` : '';
  return await fetchWrapper.get(`payouts/banks${q}`);
}

/** Register (or replace) the caller's payout destination. */
export async function registerPayout(input: {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  currency?: string;
}): Promise<Result<PayoutMethod>> {
  return await fetchWrapper.post('payouts/recipient', input);
}

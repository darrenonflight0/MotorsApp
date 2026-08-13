'use server';

import { fetchWrapper } from '@/lib/fetchWrapper';

export type BidDeposit = {
  auctionId: string;
  required?: boolean;
  amount: number;
  currency?: string;
  held: boolean;
  status?: string;
  activeProvider?: string;
  fundsAreReal?: boolean;
};

type Result<T> = T | { error: { status: number; message: string } };

/** Whether the caller needs — and already holds — a bid deposit for this auction. */
export async function getBidDeposit(auctionId: string): Promise<Result<BidDeposit>> {
  return await fetchWrapper.get(`biddeposits/${auctionId}`);
}

/** Confirm the caller's deposit payment, qualifying them to bid. */
export async function placeBidDeposit(
  auctionId: string,
  paymentReference?: string
): Promise<Result<BidDeposit>> {
  const query = paymentReference
    ? `?paymentReference=${encodeURIComponent(paymentReference)}`
    : '';
  return await fetchWrapper.post(`biddeposits/${auctionId}${query}`, {});
}

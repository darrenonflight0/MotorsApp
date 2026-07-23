'use server';

import { fetchWrapper } from '@/lib/fetchWrapper';
import { Escrow } from '@/types';

type EscrowResult = Escrow | { error: { status: number; message: string } };

export async function getEscrowForAuction(auctionId: string): Promise<EscrowResult> {
  return await fetchWrapper.get(`escrow/${auctionId}`);
}

export async function getMyEscrows(): Promise<Escrow[] | { error: unknown }> {
  return await fetchWrapper.get('escrow/mine');
}

export async function depositEscrow(
  auctionId: string,
  paymentReference?: string
): Promise<EscrowResult> {
  const query = paymentReference
    ? `?paymentReference=${encodeURIComponent(paymentReference)}`
    : '';
  return await fetchWrapper.post(`escrow/${auctionId}/deposit${query}`, {});
}

export async function confirmDelivery(auctionId: string): Promise<EscrowResult> {
  return await fetchWrapper.post(`escrow/${auctionId}/confirm-delivery`, {});
}

export async function disputeEscrow(auctionId: string): Promise<EscrowResult> {
  return await fetchWrapper.post(`escrow/${auctionId}/dispute`, {});
}

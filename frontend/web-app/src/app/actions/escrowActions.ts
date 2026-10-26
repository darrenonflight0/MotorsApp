'use server';

import { fetchWrapper } from '@/lib/fetchWrapper';
import { Escrow, EscrowMessage, LogisticsJob } from '@/types';

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

type JobResult = LogisticsJob | { error: { status: number; message: string } };

// Logistics team / admin only (backend enforces the role).
export async function getLogisticsJobs(): Promise<LogisticsJob[] | { error: unknown }> {
  return await fetchWrapper.get('escrow/logistics/jobs');
}

export async function postShipmentUpdate(
  auctionId: string,
  update: { stage: string; location?: string; trackingRef?: string; note?: string }
): Promise<JobResult> {
  return await fetchWrapper.post(`escrow/${auctionId}/shipment`, update);
}

type MessagesResult = EscrowMessage[] | { error: { status: number; message: string } };

export async function getEscrowMessages(auctionId: string): Promise<MessagesResult> {
  return await fetchWrapper.get(`escrow/${auctionId}/messages`);
}

export async function sendEscrowMessage(auctionId: string, text: string): Promise<MessagesResult> {
  return await fetchWrapper.post(`escrow/${auctionId}/messages`, { text });
}

// ── Admin-only (backend enforces the Admin role) ──

export async function getDisputedEscrows(): Promise<Escrow[] | { error: unknown }> {
  return await fetchWrapper.get('escrow/admin/disputed');
}

export async function getAllEscrows(): Promise<Escrow[] | { error: unknown }> {
  return await fetchWrapper.get('escrow/admin/all');
}

export async function resolveEscrow(
  auctionId: string,
  outcome: 'release' | 'refund'
): Promise<EscrowResult> {
  return await fetchWrapper.post(`escrow/${auctionId}/resolve?outcome=${outcome}`, {});
}

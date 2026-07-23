'use client';

import {
  confirmDelivery,
  depositEscrow,
  disputeEscrow,
  getEscrowForAuction,
} from '@/app/actions/escrowActions';
import Heading from '@/app/components/Heading';
import { numberWithCommas } from '@/lib/format';
import { Escrow } from '@/types';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

type Props = {
  auctionId: string;
  username: string;
};

const statusCopy: Record<Escrow['status'], { label: string; cls: string; hint: string }> = {
  AwaitingDeposit: {
    label: 'Awaiting deposit',
    cls: 'bg-amber-500/10 text-amber-700',
    hint: 'The buyer pays into escrow. The seller is only paid after delivery is confirmed.',
  },
  Funded: {
    label: 'Funds held in escrow',
    cls: 'bg-racing/10 text-racing',
    hint: 'Yamkela holds the funds. Confirm delivery to release them to the seller.',
  },
  Released: {
    label: 'Released to seller',
    cls: 'bg-racing/10 text-racing',
    hint: 'Settlement complete. Funds were released to the seller.',
  },
  Refunded: {
    label: 'Refunded to buyer',
    cls: 'bg-chrome/60 text-asphalt',
    hint: 'Dispute resolved with a refund to the buyer.',
  },
  Disputed: {
    label: 'In dispute',
    cls: 'bg-redline/10 text-redline',
    hint: 'An admin is reviewing this transaction. Funds stay locked meanwhile.',
  },
};

export default function EscrowPanel({ auctionId, username }: Props) {
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    getEscrowForAuction(auctionId).then((res) => {
      if (!('error' in res)) setEscrow(res);
      setLoading(false);
    });
  }, [auctionId]);

  useEffect(load, [load]);

  async function run(action: (id: string) => Promise<Escrow | { error: { message: string } }>, ok: string) {
    setBusy(true);
    try {
      const res = await action(auctionId);
      if ('error' in res) throw new Error(res.error.message);
      setEscrow(res);
      toast.success(ok);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Escrow action failed');
    } finally {
      setBusy(false);
    }
  }

  if (loading || !escrow) return null;

  const isBuyer = escrow.buyer === username;
  const isSeller = escrow.seller === username;
  if (!isBuyer && !isSeller) return null;

  const status = statusCopy[escrow.status];

  return (
    <div className="rounded-xl border border-chrome/80 bg-paper-raised shadow-lot">
      <div className="flex items-center justify-between border-b border-chrome/70 p-4">
        <Heading title="Escrow settlement" />
        <span className={`eyebrow rounded-full px-2.5 py-1 ${status.cls}`}>{status.label}</span>
      </div>

      <div className="p-4">
        <div className="flex items-end justify-between">
          <div>
            <span className="eyebrow">Amount held</span>
            <p className="readout text-2xl font-bold text-ink">${numberWithCommas(escrow.amount)}</p>
          </div>
          <div className="text-right text-sm text-asphalt">
            <div>
              Buyer <span className="font-display font-semibold text-ink">{escrow.buyer}</span>
            </div>
            <div>
              Seller <span className="font-display font-semibold text-ink">{escrow.seller}</span>
            </div>
          </div>
        </div>

        <p className="mt-3 text-sm text-asphalt">{status.hint}</p>

        <div className="mt-4 flex flex-wrap gap-3">
          {isBuyer && escrow.status === 'AwaitingDeposit' && (
            <button
              disabled={busy}
              onClick={() => run(depositEscrow, 'Funds deposited into escrow')}
              className="btn-primary"
            >
              {busy ? 'Working…' : 'Deposit into escrow'}
            </button>
          )}
          {isBuyer && escrow.status === 'Funded' && (
            <button
              disabled={busy}
              onClick={() => run(confirmDelivery, 'Delivery confirmed, funds released')}
              className="btn-primary"
            >
              {busy ? 'Working…' : 'Confirm delivery'}
            </button>
          )}
          {(isBuyer || isSeller) && escrow.status === 'Funded' && (
            <button
              disabled={busy}
              onClick={() => run(disputeEscrow, 'Dispute opened for admin review')}
              className="rounded-lg border border-redline/40 px-5 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-redline transition-colors hover:bg-redline hover:text-paper active:translate-y-px disabled:opacity-50"
            >
              Open dispute
            </button>
          )}
        </div>

        <p className="mt-4 border-t border-chrome/70 pt-3 text-xs leading-relaxed text-asphalt">
          Never pay outside escrow. Yamkela staff will never ask you to transfer money
          directly, share your password, or settle by gift cards or crypto.
        </p>
      </div>
    </div>
  );
}

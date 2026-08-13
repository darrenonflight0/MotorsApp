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
import PaystackDepositButton from './PaystackDepositButton';

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
    cls: 'bg-line/60 text-muted',
    hint: 'Dispute resolved with a refund to the buyer.',
  },
  Disputed: {
    label: 'In dispute',
    cls: 'bg-redline/10 text-redline',
    hint: 'An admin is reviewing this transaction. Funds stay locked meanwhile.',
  },
  Defaulted: {
    label: 'Defaulted',
    cls: 'bg-redline/10 text-redline',
    hint: 'The buyer did not pay within the funding window. The sale was cancelled and the bid deposit forfeited.',
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
  const premiumPct = escrow.buyerPremiumPercent ?? 7;
  const premium = escrow.buyerPremium ?? Math.round((escrow.amount * premiumPct) / 100);
  const total = escrow.total ?? escrow.amount + premium;

  return (
    <div className="rounded-xl border border-line/80 bg-surface shadow-lot">
      <div className="flex items-center justify-between border-b border-line/70 p-4">
        <Heading title="Escrow settlement" />
        <span className={`eyebrow rounded-full px-2.5 py-1 ${status.cls}`}>{status.label}</span>
      </div>

      <div className="p-4">
        <div className="flex items-end justify-between">
          <div>
            <span className="eyebrow">Amount held</span>
            <p className="readout text-2xl font-bold text-fg">${numberWithCommas(escrow.amount)}</p>
          </div>
          <div className="text-right text-sm text-muted">
            <div>
              Buyer <span className="font-display font-semibold text-fg">{escrow.buyer}</span>
            </div>
            <div>
              Seller <span className="font-display font-semibold text-fg">{escrow.seller}</span>
            </div>
          </div>
        </div>

        <p className="mt-3 text-sm text-muted">{status.hint}</p>

        {isBuyer && escrow.status === 'AwaitingDeposit' && (
          <div className="mt-4 rounded-lg border border-line/70 bg-canvas p-3 text-sm">
            <div className="flex justify-between text-muted">
              <span>Winning bid</span>
              <span className="readout text-fg">${numberWithCommas(escrow.amount)}</span>
            </div>
            <div className="mt-1 flex justify-between text-muted">
              <span>Buyer&apos;s premium ({premiumPct}%)</span>
              <span className="readout text-fg">${numberWithCommas(premium)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-line/70 pt-2 font-display font-bold text-fg">
              <span>Total to pay</span>
              <span className="readout">${numberWithCommas(total)}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              A {premiumPct}% buyer&apos;s premium is added to the winning bid at checkout. The seller
              receives the bid; the premium is Yamkela&apos;s fee.
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          {isBuyer && escrow.status === 'AwaitingDeposit' && (
            escrow.fundsAreReal && escrow.activeProvider === 'Paystack' ? (
              <PaystackDepositButton
                auctionId={auctionId}
                amount={total}
                // TODO: surface the buyer's real email (add the OIDC `email` scope);
                // a reserved placeholder is fine for Paystack test mode.
                email={`${username}@example.com`}
                onFunded={setEscrow}
              />
            ) : (
              <button
                disabled={busy}
                onClick={() => run(depositEscrow, 'Funds deposited into escrow')}
                className="btn-primary"
              >
                {busy ? 'Working…' : 'Deposit into escrow'}
              </button>
            )
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

        <p className="mt-4 border-t border-line/70 pt-3 text-xs leading-relaxed text-muted">
          Never pay outside escrow. Yamkela staff will never ask you to transfer money
          directly, share your password, or settle by gift cards or crypto.
        </p>
      </div>
    </div>
  );
}

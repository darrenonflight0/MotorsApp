'use client';

import { getBidDeposit, placeBidDeposit, BidDeposit } from '@/app/actions/bidDepositActions';
import { money } from '@/lib/format';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import Script from 'next/script';
import toast from 'react-hot-toast';

type Props = {
  auctionId: string;
  username?: string | null;
  children: ReactNode;
};

type PaystackPop = {
  setup: (opts: {
    key: string;
    email: string;
    amount: number;
    currency: string;
    metadata?: Record<string, unknown>;
    callback: (response: { reference: string }) => void;
    onClose: () => void;
  }) => { openIframe: () => void };
};

const PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
const CURRENCY = process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY ?? 'GHS';

export default function BidDepositGate({ auctionId, username, children }: Props) {
  const [deposit, setDeposit] = useState<BidDeposit | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  const load = useCallback(() => {
    getBidDeposit(auctionId).then((res) => {
      if (!('error' in res)) setDeposit(res);
      setLoading(false);
    });
  }, [auctionId]);

  useEffect(load, [load]);

  async function confirm(paymentReference?: string) {
    setBusy(true);
    try {
      const res = await placeBidDeposit(auctionId, paymentReference);
      if ('error' in res) throw new Error(res.error.message);
      setDeposit(res);
      toast.success('Deposit received — you can now bid');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not confirm your deposit');
    } finally {
      setBusy(false);
    }
  }

  function payWithPaystack(amount: number) {
    const Paystack = (window as unknown as { PaystackPop?: PaystackPop }).PaystackPop;
    if (!PUBLIC_KEY) return toast.error('Payments are not configured. Please contact support.');
    if (!Paystack) return toast.error('Payment window is still loading — try again in a moment.');

    Paystack.setup({
      key: PUBLIC_KEY,
      email: `${username ?? 'bidder'}@example.com`,
      amount: Math.round(amount * 100),
      currency: CURRENCY,
      metadata: { auctionId, purpose: 'bid-deposit' },
      callback: (response) => void confirm(response.reference),
      onClose: () => toast('Deposit cancelled', { icon: '↩️' }),
    }).openIframe();
  }

  if (loading) return null;

  // No deposit required, or already held → let them bid.
  if (!deposit || !deposit.required || deposit.held) return <>{children}</>;

  const usesPaystack = deposit.fundsAreReal && deposit.activeProvider === 'Paystack';

  return (
    <div className="rounded-xl border border-line/70 bg-canvas p-4">
      {usesPaystack && (
        <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" onLoad={() => setReady(true)} />
      )}
      <span className="eyebrow">Refundable bid deposit</span>
      <p className="mt-1 text-sm text-muted">
        To bid on this lot, place a fully refundable deposit of{' '}
        <span className="readout font-bold text-fg">{money(deposit.amount)}</span>. It&apos;s
        returned automatically if you don&apos;t win, or when you pay for the car after winning. This keeps
        bidding fair by stopping bids from people who can&apos;t pay.
      </p>

      <button
        disabled={busy}
        onClick={() => (usesPaystack ? payWithPaystack(deposit.amount) : confirm())}
        className="btn-primary mt-3 disabled:opacity-50"
      >
        {busy
          ? 'Confirming…'
          : usesPaystack
            ? `Deposit ${CURRENCY} ${deposit.amount.toLocaleString()} with Paystack`
            : `Place ${money(deposit.amount)} deposit`}
      </button>
      {usesPaystack && (
        <span className="mt-1 block text-xs text-muted">
          Secured by Paystack · {ready ? 'card, bank & mobile money' : 'loading secure checkout…'}
        </span>
      )}
    </div>
  );
}

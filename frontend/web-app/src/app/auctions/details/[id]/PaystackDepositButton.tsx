'use client';

import { depositEscrow } from '@/app/actions/escrowActions';
import { Escrow } from '@/types';
import { useState } from 'react';
import Script from 'next/script';
import toast from 'react-hot-toast';

type Props = {
  auctionId: string;
  amount: number;
  email: string;
  onFunded: (escrow: Escrow) => void;
};

// Minimal shape of the Paystack inline (v1) global.
type PaystackPop = {
  setup: (opts: {
    key: string;
    email: string;
    amount: number;
    currency: string;
    ref?: string;
    metadata?: Record<string, unknown>;
    callback: (response: { reference: string }) => void;
    onClose: () => void;
  }) => { openIframe: () => void };
};

const PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
const CURRENCY = process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY ?? 'GHS';

export default function PaystackDepositButton({ auctionId, amount, email, onFunded }: Props) {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  // Confirm the deposit with the backend, which verifies the transaction with
  // Paystack before moving the escrow to Funded.
  async function confirmDeposit(reference: string) {
    setBusy(true);
    try {
      const res = await depositEscrow(auctionId, reference);
      if ('error' in res) throw new Error(res.error.message);
      onFunded(res);
      toast.success('Payment received — funds are held in escrow');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'We could not confirm your payment');
    } finally {
      setBusy(false);
    }
  }

  function pay() {
    const Paystack = (window as unknown as { PaystackPop?: PaystackPop }).PaystackPop;
    if (!PUBLIC_KEY) {
      toast.error('Payments are not configured. Please contact support.');
      return;
    }
    if (!Paystack) {
      toast.error('Payment window is still loading — try again in a moment.');
      return;
    }

    const handler = Paystack.setup({
      key: PUBLIC_KEY,
      email,
      amount: Math.round(amount * 100), // minor units (pesewas/kobo/cents)
      currency: CURRENCY,
      metadata: { auctionId },
      callback: (response) => {
        // Paystack's callback is synchronous; kick off the async confirmation.
        void confirmDeposit(response.reference);
      },
      onClose: () => {
        toast('Payment cancelled', { icon: '↩️' });
      },
    });
    handler.openIframe();
  }

  return (
    <>
      <Script
        src="https://js.paystack.co/v1/inline.js"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
      <div className="flex flex-col gap-1">
        <button disabled={busy} onClick={pay} className="btn-primary disabled:opacity-50">
          {busy ? 'Confirming…' : `Pay ${CURRENCY} ${amount.toLocaleString()} with Paystack`}
        </button>
        <span className="text-xs text-muted">
          Secured by Paystack · {ready ? 'card, bank & mobile money' : 'loading secure checkout…'}
        </span>
      </div>
    </>
  );
}

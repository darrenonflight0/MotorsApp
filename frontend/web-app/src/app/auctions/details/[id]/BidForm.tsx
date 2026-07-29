'use client';

import { placeBidForAuction } from '@/app/actions/bidActions';
import { useBidStore } from '@/hooks/useBidStore';
import { numberWithCommas } from '@/lib/format';
import { useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

type Props = {
  auctionId: string;
  highBid: number;
};

export default function BidForm({ auctionId, highBid }: Props) {
  const { register, handleSubmit, reset, setValue, watch, formState } = useForm();
  const addBid = useBidStore((state) => state.addBid);
  const [submitting, setSubmitting] = useState(false);
  const minNext = highBid + 1;

  async function onSubmit(data: FieldValues) {
    setSubmitting(true);
    try {
      const bid = await placeBidForAuction(auctionId, +data.amount);
      if (bid.error) throw bid.error;
      addBid(bid);
      reset();
      toast.success(`Bid placed: $${numberWithCommas(+data.amount)}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message;
      toast.error(message || 'Could not place bid');
    } finally {
      setSubmitting(false);
    }
  }

  function quickAdd(delta: number) {
    const current = Number(watch('amount')) || highBid;
    setValue('amount', Math.max(minNext, current + delta), { shouldValidate: true });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-line bg-surface p-4 shadow-lot">
      <div className="flex items-center justify-between">
        <span className="eyebrow">Place your bid</span>
        <span className="readout text-xs text-muted">
          Min next <span className="font-bold text-fg">${numberWithCommas(minNext)}</span>
        </span>
      </div>

      <div className="mt-3 flex items-stretch gap-2">
        <div className="flex flex-1 items-center rounded-lg border border-line/30 bg-surface px-3 focus-within:border-redline">
          <span className="readout text-lg font-bold text-muted">$</span>
          <input
            type="number"
            inputMode="numeric"
            {...register('amount', { required: true, min: minNext })}
            className="readout w-full bg-transparent px-2 py-3 text-lg font-bold text-fg outline-none"
            placeholder={numberWithCommas(minNext)}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-redline px-6 font-display text-sm font-bold uppercase tracking-wide text-paper transition-colors hover:bg-redline-deep disabled:opacity-50"
        >
          {submitting ? 'Placing…' : 'Place bid'}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="eyebrow">Quick add</span>
        {[5, 10, 25].map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => quickAdd(q)}
            className="readout rounded-md border border-line bg-canvas px-3 py-1 text-sm font-semibold text-fg transition-colors hover:border-redline hover:text-redline"
          >
            +${q}
          </button>
        ))}
      </div>

      {formState.errors.amount && (
        <p className="mt-2 text-xs font-medium text-redline">
          Enter an amount of at least ${numberWithCommas(minNext)}.
        </p>
      )}
    </form>
  );
}

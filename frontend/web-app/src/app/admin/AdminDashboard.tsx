'use client';

import { resolveEscrow } from '@/app/actions/escrowActions';
import { numberWithCommas } from '@/lib/format';
import { Escrow } from '@/types';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

type Props = {
  initialDisputed: Escrow[];
  initialAll: Escrow[];
};

const statusCls: Record<Escrow['status'], string> = {
  AwaitingDeposit: 'bg-amber-500/10 text-amber-700',
  Funded: 'bg-racing/10 text-racing',
  Released: 'bg-racing/10 text-racing',
  Refunded: 'bg-line/60 text-muted',
  Disputed: 'bg-redline/10 text-redline',
  Defaulted: 'bg-redline/10 text-redline',
};

export default function AdminDashboard({ initialDisputed, initialAll }: Props) {
  const [disputed, setDisputed] = useState(initialDisputed);
  const [all, setAll] = useState(initialAll);
  const [busy, setBusy] = useState<string | null>(null);

  const stats = useMemo(() => {
    const by = (s: Escrow['status']) => all.filter((e) => e.status === s).length;
    const held = all
      .filter((e) => e.status === 'Funded' || e.status === 'Disputed')
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      total: all.length,
      disputed: by('Disputed'),
      funded: by('Funded'),
      released: by('Released'),
      held,
    };
  }, [all]);

  async function resolve(auctionId: string, outcome: 'release' | 'refund') {
    setBusy(auctionId);
    try {
      const res = await resolveEscrow(auctionId, outcome);
      if ('error' in res) throw new Error(res.error.message);
      // Drop it from the disputed queue and refresh its row in the full list.
      setDisputed((d) => d.filter((e) => e.auctionId !== auctionId));
      setAll((a) => a.map((e) => (e.auctionId === auctionId ? res : e)));
      toast.success(outcome === 'release' ? 'Released to seller' : 'Refunded to buyer');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not resolve the dispute');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-10">
      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Escrows total" value={stats.total.toString()} />
        <Stat label="Open disputes" value={stats.disputed.toString()} accent={stats.disputed > 0} />
        <Stat label="Funds held" value={`$${numberWithCommas(stats.held)}`} />
        <Stat label="Released" value={stats.released.toString()} />
      </section>

      {/* Dispute queue */}
      <section>
        <span className="eyebrow">Needs attention</span>
        <h2 className="mb-4 mt-1 font-display text-2xl font-bold tracking-tight text-fg">
          Dispute queue
        </h2>
        {disputed.length === 0 ? (
          <p className="rounded-xl border border-line/70 bg-surface p-6 text-sm text-muted">
            No open disputes. 🎉
          </p>
        ) : (
          <div className="space-y-3">
            {disputed.map((e) => (
              <div
                key={e.id}
                className="flex flex-col gap-4 rounded-xl border border-redline/30 bg-surface p-4 shadow-lot sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="readout text-lg font-bold text-fg">${numberWithCommas(e.amount)}</div>
                  <div className="mt-0.5 truncate text-sm text-muted">
                    Buyer <span className="font-semibold text-fg">{e.buyer}</span> · Seller{' '}
                    <span className="font-semibold text-fg">{e.seller}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted">Auction {e.auctionId}</div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    disabled={busy === e.auctionId}
                    onClick={() => resolve(e.auctionId, 'release')}
                    className="btn-primary text-sm disabled:opacity-50"
                  >
                    Release to seller
                  </button>
                  <button
                    disabled={busy === e.auctionId}
                    onClick={() => resolve(e.auctionId, 'refund')}
                    className="rounded-lg border border-line/40 px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-fg transition-colors hover:bg-ink hover:text-paper disabled:opacity-50"
                  >
                    Refund buyer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* All escrows */}
      <section>
        <span className="eyebrow">Oversight</span>
        <h2 className="mb-4 mt-1 font-display text-2xl font-bold tracking-tight text-fg">
          All escrows
        </h2>
        <div className="overflow-x-auto rounded-xl border border-line/70">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="p-3">Auction</th>
                <th className="p-3">Buyer</th>
                <th className="p-3">Seller</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3">Provider</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chrome/60">
              {all.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted">
                    No escrows yet.
                  </td>
                </tr>
              ) : (
                all.map((e) => (
                  <tr key={e.id} className="bg-canvas">
                    <td className="max-w-[160px] truncate p-3 font-mono text-xs text-muted">{e.auctionId}</td>
                    <td className="p-3">{e.buyer}</td>
                    <td className="p-3">{e.seller}</td>
                    <td className="readout p-3 text-right">${numberWithCommas(e.amount)}</td>
                    <td className="p-3 text-muted">{e.paymentProvider ?? '—'}</td>
                    <td className="p-3">
                      <span className={`eyebrow rounded-full px-2 py-0.5 ${statusCls[e.status]}`}>
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-5 shadow-lot ${
        accent ? 'border-redline/40 bg-redline/5' : 'border-line/80 bg-surface'
      }`}
    >
      <div className={`readout text-3xl font-bold ${accent ? 'text-redline' : 'text-fg'}`}>{value}</div>
      <div className="eyebrow mt-1">{label}</div>
    </div>
  );
}

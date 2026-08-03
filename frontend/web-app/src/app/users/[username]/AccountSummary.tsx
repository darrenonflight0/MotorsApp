import { numberWithCommas } from '@/lib/format';
import { Escrow } from '@/types';
import { HiLockClosed, HiTrendingDown, HiTrendingUp } from 'react-icons/hi';

// Loyalty tiers keyed to lifetime transacted value (money spent + earned).
// Tuned for vehicle-scale amounts.
const TIERS = [
  { name: 'Rookie', min: 0 },
  { name: 'Bronze', min: 10_000 },
  { name: 'Silver', min: 50_000 },
  { name: 'Gold', min: 150_000 },
  { name: 'Platinum', min: 500_000 },
  { name: 'Elite', min: 1_000_000 },
] as const;

function tierFor(volume: number) {
  let idx = 0;
  TIERS.forEach((t, i) => {
    if (volume >= t.min) idx = i;
  });
  const current = TIERS[idx];
  const next = TIERS[idx + 1] ?? null;
  const progress = next
    ? Math.min(100, Math.round(((volume - current.min) / (next.min - current.min)) * 100))
    : 100;
  return { current, next, progress };
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Private financial summary shown only on the owner's own showroom: how much
 * they've spent as a buyer, earned as a seller, their net position, a dated
 * transaction history, and their loyalty level.
 */
export default function AccountSummary({ username, escrows }: { username: string; escrows: Escrow[] }) {
  const purchases = escrows.filter((e) => e.buyer === username);
  const sales = escrows.filter((e) => e.seller === username);

  const spent = purchases
    .filter((e) => ['Funded', 'Released', 'Disputed'].includes(e.status))
    .reduce((s, e) => s + (e.total ?? e.amount), 0);
  const earned = sales.filter((e) => e.status === 'Released').reduce((s, e) => s + e.amount, 0);
  const inEscrow = purchases.filter((e) => e.status === 'Funded').reduce((s, e) => s + (e.total ?? e.amount), 0);
  const net = earned - spent;
  const volume = spent + earned;
  const soldCount = sales.filter((e) => e.status === 'Released').length;

  const { current, next, progress } = tierFor(volume);

  const rows = [
    ...purchases.map((e) => ({
      dir: 'out' as const,
      label: 'Bought',
      id: e.id,
      auctionId: e.auctionId,
      status: e.status,
      date: e.fundedAt ?? e.createdAt,
      amount: e.total ?? e.amount,
    })),
    ...sales.map((e) => ({
      dir: 'in' as const,
      label: 'Sold',
      id: e.id,
      auctionId: e.auctionId,
      status: e.status,
      date: e.closedAt ?? e.fundedAt ?? e.createdAt,
      amount: e.amount,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <section className="mb-10 rounded-2xl border border-line/80 bg-surface p-6 shadow-lot sm:p-8">
      <div className="flex items-center gap-1.5">
        <HiLockClosed className="h-3.5 w-3.5 text-muted" />
        <span className="eyebrow">Private · only you can see this</span>
      </div>
      <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-fg">Your account</h2>

      {/* Level */}
      <div className="mt-4 rounded-xl border border-line/70 bg-canvas p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="eyebrow">Level</span>
            <p className="font-display text-2xl font-extrabold text-fg">{current.name}</p>
          </div>
          <div className="text-right text-sm text-muted">
            Lifetime volume
            <div className="readout text-lg font-bold text-fg">${numberWithCommas(volume)}</div>
          </div>
        </div>
        {next ? (
          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-line/50">
              <div className="h-full rounded-full bg-redline" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-muted">
              ${numberWithCommas(next.min - volume)} more transacted to reach{' '}
              <span className="font-semibold text-fg">{next.name}</span>
            </p>
          </div>
        ) : (
          <p className="mt-3 text-xs font-semibold text-redline">Top tier reached 🏆</p>
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total spent" value={`$${numberWithCommas(spent)}`} sub={`${purchases.length} purchase${purchases.length === 1 ? '' : 's'}`} />
        <Stat label="Total earned" value={`$${numberWithCommas(earned)}`} sub={`${soldCount} sale${soldCount === 1 ? '' : 's'}`} accent />
        <Stat
          label="Net position"
          value={`${net < 0 ? '−' : ''}$${numberWithCommas(Math.abs(net))}`}
          sub={net >= 0 ? 'net earned' : 'net spend'}
        />
        <Stat label="Held in escrow" value={`$${numberWithCommas(inEscrow)}`} sub="pending delivery" />
      </div>

      {/* History */}
      <h3 className="mb-2 mt-6 font-display font-bold text-fg">Transaction history</h3>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line/50 p-6 text-center text-sm text-muted">
          No transactions yet. Winning or selling a lot will show up here.
        </p>
      ) : (
        <ul className="divide-y divide-line/60 overflow-hidden rounded-xl border border-line/70">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 p-3">
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                  r.dir === 'in' ? 'bg-racing/10 text-racing' : 'bg-redline/10 text-redline'
                }`}
              >
                {r.dir === 'in' ? <HiTrendingUp className="h-4 w-4" /> : <HiTrendingDown className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-display text-sm font-semibold text-fg">
                  {r.label} · lot {r.auctionId.slice(0, 8)}
                </div>
                <div className="text-xs text-muted">
                  {fmtDate(r.date)} · {r.status}
                </div>
              </div>
              <div className={`readout font-bold ${r.dir === 'in' ? 'text-racing' : 'text-fg'}`}>
                {r.dir === 'in' ? '+' : '−'}${numberWithCommas(r.amount)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 shadow-lot ${accent ? 'border-racing/30 bg-racing/5' : 'border-line/70 bg-canvas'}`}>
      <div className="eyebrow">{label}</div>
      <div className="readout mt-1 text-xl font-bold text-fg">{value}</div>
      <div className="mt-0.5 text-xs text-muted">{sub}</div>
    </div>
  );
}

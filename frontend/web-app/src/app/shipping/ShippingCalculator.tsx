'use client';

import { numberWithCommas } from '@/lib/format';
import { useMemo, useState } from 'react';

// Indicative base ocean freight per destination port (USD). Illustrative only.
const destinations = [
  { label: 'Tema, Ghana', base: 1450 },
  { label: 'Shanghai, China', base: 1200 },
  { label: 'Yokohama, Japan', base: 900 },
  { label: 'New York, USA', base: 1100 },
  { label: 'Halifax, Canada', base: 1250 },
  { label: 'Durban, South Africa', base: 1550 },
];

const methods = [
  { id: 'roro', label: 'RoRo', multiplier: 1 },
  { id: 'container-shared', label: 'Container (shared)', multiplier: 1.25 },
  { id: 'container-sole', label: 'Container (sole)', multiplier: 2.1 },
  { id: 'air', label: 'Air freight', multiplier: 4.5 },
];

export default function ShippingCalculator() {
  const [dest, setDest] = useState(destinations[0].label);
  const [method, setMethod] = useState(methods[0].id);
  const [insure, setInsure] = useState(true);

  const quote = useMemo(() => {
    const d = destinations.find((x) => x.label === dest)!;
    const m = methods.find((x) => x.id === method)!;
    const freight = Math.round(d.base * m.multiplier);
    const insurance = insure ? Math.round(freight * 0.015) : 0;
    const docs = 120;
    return { freight, insurance, docs, total: freight + insurance + docs };
  }, [dest, method, insure]);

  return (
    <div className="rounded-xl border border-chrome/80 bg-paper-raised p-6 shadow-lot">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label">Destination port</label>
          <select
            value={dest}
            onChange={(e) => setDest(e.target.value)}
            className="field-input"
          >
            {destinations.map((d) => (
              <option key={d.label} value={d.label}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Shipping method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="field-input"
          >
            {methods.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2.5 text-sm text-ink">
        <input
          type="checkbox"
          checked={insure}
          onChange={(e) => setInsure(e.target.checked)}
          className="h-4 w-4 accent-redline"
        />
        Add marine insurance (1.5% of freight)
      </label>

      <div className="mt-5 space-y-2 border-t border-chrome/70 pt-4 text-sm">
        <Row label="Ocean freight" value={quote.freight} />
        {quote.insurance > 0 && <Row label="Marine insurance" value={quote.insurance} />}
        <Row label="Documentation" value={quote.docs} />
        <div className="flex items-center justify-between border-t border-chrome/70 pt-3">
          <span className="font-display font-bold text-ink">Estimated total</span>
          <span className="readout text-2xl font-bold text-redline">
            ${numberWithCommas(quote.total)}
          </span>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-asphalt">
        Estimates are indicative and exclude destination duties and local port charges.
        A binding quote is issued after your vehicle is won and inspected.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-asphalt">
      <span>{label}</span>
      <span className="readout text-ink">${numberWithCommas(value)}</span>
    </div>
  );
}

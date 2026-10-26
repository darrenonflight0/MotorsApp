'use client';

import { postShipmentUpdate } from '@/app/actions/escrowActions';
import { Escrow, LogisticsJob, ShipmentStage } from '@/types';
import { useState } from 'react';
import toast from 'react-hot-toast';

const STAGES: { value: ShipmentStage; label: string }[] = [
  { value: 'Preparing', label: 'Preparing' },
  { value: 'Collected', label: 'Collected' },
  { value: 'AtPort', label: 'At port' },
  { value: 'Loaded', label: 'Loaded on vessel' },
  { value: 'InTransit', label: 'In transit' },
  { value: 'Arrived', label: 'Arrived' },
];

type Props = {
  // Only the fields the tracker needs, so it works for both the buyer/seller
  // escrow view and the amount-free logistics view.
  escrow: Pick<Escrow, 'auctionId' | 'status' | 'shipment'>;
  canUpdate: boolean;
  onChange?: (e: LogisticsJob) => void;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function ShipmentTracker({ escrow, canUpdate, onChange }: Props) {
  const shipment = escrow.shipment;
  const current = STAGES.findIndex((s) => s.value === (shipment?.stage ?? 'Preparing'));
  const [stage, setStage] = useState<ShipmentStage>(STAGES[Math.max(current, 0)].value);
  const [location, setLocation] = useState('');
  const [trackingRef, setTrackingRef] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  if (escrow.status === 'AwaitingDeposit' || escrow.status === 'Defaulted') return null;

  async function post() {
    setSaving(true);
    try {
      const res = await postShipmentUpdate(escrow.auctionId, {
        stage,
        location: location.trim() || undefined,
        trackingRef: trackingRef.trim() || undefined,
        note: note.trim() || undefined,
      });
      if ('error' in res) throw new Error(res.error.message);
      onChange?.(res);
      setLocation('');
      setNote('');
      toast.success('Shipping update sent to the buyer');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not post update');
    } finally {
      setSaving(false);
    }
  }

  const latest = shipment?.updates?.[0];

  return (
    <div className="mt-4 rounded-lg border border-line/70 bg-canvas p-3">
      <div className="flex items-center justify-between">
        <span className="eyebrow">Shipment</span>
        {shipment?.trackingRef && (
          <span className="text-xs text-muted">
            Ref <span className="readout font-semibold text-fg">{shipment.trackingRef}</span>
          </span>
        )}
      </div>

      <ol className="mt-3 flex items-center" aria-label="Shipment progress">
        {STAGES.map((s, i) => {
          const done = i <= current;
          return (
            <li key={s.value} className="flex flex-1 flex-col items-center text-center last:flex-none">
              <div className="flex w-full items-center">
                <span
                  className={`h-3 w-3 shrink-0 rounded-full border-2 ${
                    done ? 'border-racing bg-racing' : 'border-line bg-canvas'
                  }`}
                />
                {i < STAGES.length - 1 && (
                  <span className={`h-0.5 flex-1 ${i < current ? 'bg-racing' : 'bg-line'}`} />
                )}
              </div>
              <span className={`mt-1 text-[10px] leading-tight ${done ? 'text-fg' : 'text-muted'}`}>
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>

      {latest ? (
        <p className="mt-3 text-sm text-fg">
          <span className="font-semibold">{STAGES.find((s) => s.value === latest.stage)?.label}</span>
          {latest.location ? ` · ${latest.location}` : ''}
          <span className="block text-xs text-muted">Updated {fmt(latest.at)}</span>
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted">
          {canUpdate
            ? 'No updates yet. Post the first one once the car is collected.'
            : 'Our logistics partner will collect the car and post updates here. You’ll be notified when they do.'}
        </p>
      )}

      {shipment && shipment.updates.length > 0 && (
        <ul className="mt-3 space-y-2 border-t border-line/70 pt-3">
          {shipment.updates.map((u, i) => (
            <li key={`${u.at}-${i}`} className="text-xs text-muted">
              <span className="font-semibold text-fg">
                {STAGES.find((s) => s.value === u.stage)?.label}
              </span>
              {u.location ? ` · ${u.location}` : ''} · {fmt(u.at)}
              {u.note && <span className="block text-fg/80">{u.note}</span>}
            </li>
          ))}
        </ul>
      )}

      {canUpdate && escrow.status === 'Funded' && (
        <div className="mt-3 grid gap-2 border-t border-line/70 pt-3">
          <span className="eyebrow">Post an update</span>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as ShipmentStage)}
            className="rounded-lg border border-line/70 bg-surface px-3 py-2 text-sm text-fg"
          >
            {STAGES.map((s, i) => (
              <option key={s.value} value={s.value} disabled={i < current}>
                {s.label}
              </option>
            ))}
          </select>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={120}
            placeholder="Current location (e.g. Yokohama Port, Japan)"
            className="rounded-lg border border-line/70 bg-surface px-3 py-2 text-sm text-fg"
          />
          <input
            value={trackingRef}
            onChange={(e) => setTrackingRef(e.target.value)}
            maxLength={80}
            placeholder="Tracking / vessel / container number (optional)"
            className="rounded-lg border border-line/70 bg-surface px-3 py-2 text-sm text-fg"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="Note to the buyer (optional)"
            className="rounded-lg border border-line/70 bg-surface px-3 py-2 text-sm text-fg"
          />
          <button disabled={saving} onClick={post} className="btn-primary justify-self-start disabled:opacity-50">
            {saving ? 'Sending…' : 'Send update'}
          </button>
        </div>
      )}
    </div>
  );
}

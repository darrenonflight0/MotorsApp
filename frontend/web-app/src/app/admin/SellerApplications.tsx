'use client';

import {
  approveApplication,
  rejectApplication,
  ReviewApplication,
} from '@/app/actions/verificationActions';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiBadgeCheck } from 'react-icons/hi';

export default function SellerApplications({ initial }: { initial: ReviewApplication[] }) {
  const [apps, setApps] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  async function decide(id: string, action: 'approve' | 'reject') {
    setBusy(id);
    try {
      const res =
        action === 'approve'
          ? await approveApplication(id)
          : await rejectApplication(id, reasons[id] || 'Did not meet verification requirements.');
      if ('error' in res) throw new Error(res.error.message);
      setApps((a) => a.filter((x) => x.id !== id));
      toast.success(action === 'approve' ? 'Auctioneer verified ✓' : 'Application rejected');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update the application');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section>
      <span className="eyebrow">Gatekeeping</span>
      <h2 className="mb-4 mt-1 flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-ink">
        Seller verifications
        {apps.length > 0 && (
          <span className="rounded-full bg-redline px-2 py-0.5 text-xs font-bold text-paper">{apps.length}</span>
        )}
      </h2>

      {apps.length === 0 ? (
        <p className="rounded-xl border border-chrome/70 bg-paper-raised p-6 text-sm text-asphalt">
          No pending applications. 🎉
        </p>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {apps.map((app) => (
              <motion.div
                key={app.id}
                layout
                exit={{ opacity: 0, scale: 0.96 }}
                className="rounded-xl border border-chrome/80 bg-paper-raised p-4 shadow-lot"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display font-bold text-ink">@{app.username}</p>
                    <p className="text-xs text-chrome-dark">
                      {app.idType} · {new Date(app.submittedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <figure>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={app.selfieImage} alt="selfie" className="aspect-square w-full rounded-lg border border-chrome/70 object-cover" />
                    <figcaption className="mt-1 text-center text-xs text-asphalt">Selfie</figcaption>
                  </figure>
                  <figure>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={app.idImage} alt="id document" className="aspect-square w-full rounded-lg border border-chrome/70 object-cover" />
                    <figcaption className="mt-1 text-center text-xs text-asphalt">{app.idType}</figcaption>
                  </figure>
                </div>

                <input
                  value={reasons[app.id] ?? ''}
                  onChange={(e) => setReasons((r) => ({ ...r, [app.id]: e.target.value }))}
                  placeholder="Rejection reason (optional)"
                  className="field-input mt-3 text-sm"
                />

                <div className="mt-3 flex gap-2">
                  <button
                    disabled={busy === app.id}
                    onClick={() => decide(app.id, 'approve')}
                    className="btn-primary flex flex-1 items-center justify-center gap-1 text-sm disabled:opacity-50"
                  >
                    <HiBadgeCheck /> Approve
                  </button>
                  <button
                    disabled={busy === app.id}
                    onClick={() => decide(app.id, 'reject')}
                    className="flex-1 rounded-lg border border-redline/40 px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-redline transition-colors hover:bg-redline hover:text-paper disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

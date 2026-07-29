'use client';

import { useWatchlistStore } from '@/hooks/useWatchlistStore';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const KEY = 'yamkela-last-visit';

type Props = {
  name?: string | null;
};

// A quiet, honest re-engagement nudge: recognises returning visitors and points
// them at the lots they already saved. No fabricated urgency.
export default function ReturnGreeting({ name }: Props) {
  const lots = useWatchlistStore((s) => s.lots);
  const reduceMotion = useReducedMotion();
  const [returning, setReturning] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const last = localStorage.getItem(KEY);
    // Treat a gap of 30+ minutes as a genuine return visit.
    if (last && Date.now() - Number(last) > 30 * 60 * 1000) {
      setReturning(true);
    }
    localStorage.setItem(KEY, String(Date.now()));
  }, []);

  if (dismissed || !returning) return null;

  const live = lots.filter((l) => new Date(l.auctionEnd) > new Date()).length;
  const greeting = name ? `Welcome back, ${name.split(' ')[0]}.` : 'Welcome back.';
  const detail =
    live > 0
      ? `${live} of your saved ${live === 1 ? 'lot is' : 'lots are'} still live.`
      : lots.length > 0
        ? 'Your saved lots are waiting.'
        : 'New lots have gone live since you were last here.';

  return (
    <AnimatePresence>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-line/80 bg-surface px-5 py-3.5 shadow-lot"
      >
        <p className="text-sm text-fg">
          <span className="font-display font-bold">{greeting}</span>{' '}
          <span className="text-muted">{detail}</span>
        </p>
        <div className="flex shrink-0 items-center gap-3">
          {lots.length > 0 && (
            <Link
              href="/watchlist"
              className="text-sm font-semibold text-redline transition-colors hover:text-redline-deep"
            >
              View watchlist
            </Link>
          )}
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="text-muted transition-colors hover:text-fg"
          >
            ✕
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

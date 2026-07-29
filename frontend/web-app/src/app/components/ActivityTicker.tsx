'use client';

import { useActivityStore } from '@/hooks/useActivityStore';
import { numberWithCommas } from '@/lib/format';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';

function ago(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return `${m}m ago`;
}

// Renders only when real bids have streamed in this session — never a fabricated feed.
export default function ActivityTicker() {
  const activity = useActivityStore((s) => s.activity);
  if (activity.length === 0) return null;

  const latest = activity[0];

  return (
    <div className="mb-8 flex items-center gap-3 rounded-full border border-line/80 bg-surface px-4 py-2 shadow-lot">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-racing opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-racing" />
      </span>
      <span className="eyebrow shrink-0">Live</span>
      <div className="min-w-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={latest.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="truncate text-sm text-fg"
          >
            <Link href={`/auctions/details/${latest.auctionId}`} className="hover:text-redline">
              <span className="font-display font-semibold">{latest.bidder}</span> bid{' '}
              <span className="readout font-bold text-redline">
                ${numberWithCommas(latest.amount)}
              </span>{' '}
              <span className="text-muted">· {ago(latest.at)}</span>
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

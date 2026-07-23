'use client';

import { useWatchlistStore } from '@/hooks/useWatchlistStore';
import { Auction } from '@/types';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';

type Props = {
  auction: Auction;
  variant?: 'overlay' | 'inline';
};

export default function WatchButton({ auction, variant = 'overlay' }: Props) {
  const toggle = useWatchlistStore((s) => s.toggle);
  // Subscribe to a derived boolean so the button re-renders when lots change.
  const watchedInStore = useWatchlistStore((s) => s.lots.some((l) => l.id === auction.id));
  const reduceMotion = useReducedMotion();

  // Avoid hydration mismatch: persisted state is client-only.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const watched = mounted && watchedInStore;

  const base =
    variant === 'overlay'
      ? 'absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-paper-raised/90 shadow-sm backdrop-blur transition-colors hover:bg-paper-raised'
      : 'inline-grid h-10 w-10 place-items-center rounded-lg border border-chrome-dark/25 transition-colors hover:border-redline';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(auction);
      }}
      aria-pressed={watched}
      aria-label={watched ? 'Remove from watchlist' : 'Save to watchlist'}
      title={watched ? 'Saved to your watchlist' : 'Save to your watchlist'}
      className={base}
    >
      <motion.span
        key={watched ? 'on' : 'off'}
        initial={reduceMotion ? false : { scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        className="grid place-items-center"
      >
        {watched ? (
          <AiFillHeart className="text-redline" size={18} />
        ) : (
          <AiOutlineHeart className="text-ink" size={18} />
        )}
      </motion.span>
    </button>
  );
}

'use client';

import { useWatchlistStore } from '@/hooks/useWatchlistStore';
import { numberWithCommas } from '@/lib/format';
import CarImage from '../components/CarImage';
import CountdownTimer from '../components/CountdownTimer';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { AiFillHeart } from 'react-icons/ai';

export default function WatchlistView() {
  const lots = useWatchlistStore((s) => s.lots);
  const remove = useWatchlistStore((s) => s.remove);
  const reduceMotion = useReducedMotion();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  if (lots.length === 0) {
    return (
      <div className="flex h-[45vh] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line/30 bg-surface/60 text-center">
        <AiFillHeart className="text-chrome" size={40} />
        <p className="font-display text-lg font-bold text-fg">Your watchlist is empty</p>
        <p className="max-w-sm text-sm text-muted">
          Tap the heart on any lot to save it here. We&apos;ll keep your countdowns running so you
          never miss the close.
        </p>
        <Link href="/" className="btn-primary mt-2">
          Browse live lots
        </Link>
      </div>
    );
  }

  const endingSoon = lots.filter((l) => new Date(l.auctionEnd) > new Date()).length;

  return (
    <>
      <div className="mb-6 flex items-center gap-3 text-sm text-muted">
        <span className="readout font-bold text-fg">{lots.length}</span> saved
        {endingSoon > 0 && (
          <>
            <span className="h-1 w-1 rounded-full bg-line" />
            <span>
              <span className="readout font-bold text-redline">{endingSoon}</span> still live
            </span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {lots.map((lot, i) => {
          const hasBid = lot.currentHighBid > 0;
          return (
            <motion.div
              key={lot.id}
              layout
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              className="group overflow-hidden rounded-xl border border-line/80 bg-surface shadow-lot"
            >
              <Link href={`/auctions/details/${lot.id}`} className="block">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink">
                  <div className="transition-transform duration-500 group-hover:scale-[1.04]">
                    <CarImage imageUrl={lot.imageUrl} />
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <CountdownTimer auctionEnd={lot.auctionEnd} />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg font-bold leading-tight text-fg">
                    {lot.make} {lot.model}
                  </h3>
                  <div className="mt-3 flex items-end justify-between border-t border-line/70 pt-3">
                    <div>
                      <span className="eyebrow">Current bid</span>
                      <p className={`readout text-xl font-bold ${hasBid ? 'text-fg' : 'text-muted'}`}>
                        {hasBid ? `$${numberWithCommas(lot.currentHighBid)}` : 'No bids yet'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        remove(lot.id);
                      }}
                      className="text-xs font-medium text-muted transition-colors hover:text-redline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

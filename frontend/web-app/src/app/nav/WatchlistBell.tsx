'use client';

import { useWatchlistStore } from '@/hooks/useWatchlistStore';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AiOutlineHeart } from 'react-icons/ai';

export default function WatchlistBell() {
  const count = useWatchlistStore((s) => s.lots.length);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Link
      href="/watchlist"
      className="relative grid h-9 w-9 place-items-center rounded-lg text-fg transition-colors hover:text-redline"
      aria-label={`Watchlist${mounted && count ? `, ${count} saved` : ''}`}
      title="Your watchlist"
    >
      <AiOutlineHeart size={22} />
      {mounted && count > 0 && (
        <span className="readout absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-redline px-1 text-[10px] font-bold text-paper">
          {count}
        </span>
      )}
    </Link>
  );
}

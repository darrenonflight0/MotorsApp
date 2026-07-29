'use client';

import { useEffect, useState } from 'react';

type Props = {
  auctionEnd: string;
  size?: 'sm' | 'lg';
};

type Urgency = 'ended' | 'critical' | 'soon' | 'live';

function urgencyOf(secondsLeft: number): Urgency {
  if (secondsLeft <= 0) return 'ended';
  if (secondsLeft < 600) return 'critical'; // < 10 min
  if (secondsLeft < 3600 * 6) return 'soon'; // < 6 hours
  return 'live';
}

function segments(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  const all = [
    { v: String(days), u: 'd' },
    { v: pad(hours), u: 'h' },
    { v: pad(minutes), u: 'm' },
    { v: pad(seconds), u: 's' },
  ];
  return days > 0 ? all : all.slice(1); // drop days once inside 24h
}

const DIGIT_COLOR: Record<Urgency, string> = {
  ended: 'text-muted',
  critical: 'text-redline',
  soon: 'text-paper',
  live: 'text-paper',
};

const DOT_COLOR: Record<Urgency, string> = {
  ended: 'bg-asphalt',
  critical: 'bg-redline',
  soon: 'bg-redline',
  live: 'bg-racing',
};

export default function CountdownTimer({ auctionEnd, size = 'sm' }: Props) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    Math.floor((new Date(auctionEnd).getTime() - Date.now()) / 1000)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(Math.floor((new Date(auctionEnd).getTime() - Date.now()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [auctionEnd]);

  const urgency = urgencyOf(secondsLeft);
  const big = size === 'lg';

  return (
    <div
      className={`inline-flex items-center gap-2.5 rounded-md border border-line/80 bg-ink/95 shadow-lg backdrop-blur-sm ${
        big ? 'px-4 py-2.5' : 'px-2.5 py-1.5'
      }`}
    >
      <span className="relative flex h-2 w-2">
        {(urgency === 'critical' || urgency === 'soon') && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${DOT_COLOR[urgency]}`} />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${DOT_COLOR[urgency]}`} />
      </span>

      {urgency === 'ended' ? (
        <span className={`eyebrow ${big ? 'text-xs' : ''} !text-muted`}>Auction ended</span>
      ) : (
        <div className="flex flex-col">
          <div className={`readout flex items-baseline gap-1 font-semibold ${DIGIT_COLOR[urgency]} ${big ? 'text-xl' : 'text-sm'}`}>
            {segments(secondsLeft).map((seg, i) => (
              <span key={i} className="flex items-baseline">
                {seg.v}
                <span className={`ml-0.5 text-[0.6em] font-medium text-muted`}>{seg.u}</span>
              </span>
            ))}
          </div>
          <span className={`tick-strip mt-1 h-[3px] w-full ${urgency === 'live' ? 'text-muted' : 'text-redline/70'}`} />
        </div>
      )}
    </div>
  );
}

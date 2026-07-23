import { Auction } from '@/types';
import { numberWithCommas } from '@/lib/format';
import Link from 'next/link';
import CarImage from '../components/CarImage';
import CountdownTimer from '../components/CountdownTimer';
import WatchButton from '../components/WatchButton';

type Props = {
  auction: Auction;
};

export default function AuctionCard({ auction }: Props) {
  const lot = auction.id.slice(0, 4).toUpperCase();
  const hasBid = auction.currentHighBid > 0;
  const reserveMet = hasBid && auction.reservePrice > 0 && auction.currentHighBid >= auction.reservePrice;

  const quickSpecs = [
    { label: 'Year', value: auction.year },
    { label: 'Mileage', value: `${numberWithCommas(auction.milage)} mi` },
    { label: 'Colour', value: auction.color },
  ];

  return (
    <Link
      href={`/auctions/details/${auction.id}`}
      className="group block overflow-hidden rounded-xl border border-chrome/80 bg-paper-raised shadow-lot transition-all duration-300 hover:-translate-y-1 hover:border-chrome-dark/40 hover:shadow-lot-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-redline"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink">
        <span className="eyebrow absolute left-3 top-3 z-20 rounded bg-paper-raised/90 px-2 py-1 !text-ink shadow-sm">
          Lot {lot}
        </span>
        <WatchButton auction={auction} />

        {/* Ken Burns: slow zoom + pan reveals more of the car on hover */}
        <div className="h-full w-full transition-transform duration-[1200ms] ease-out group-hover:scale-[1.12] group-hover:-translate-y-1">
          <CarImage imageUrl={auction.imageUrl} />
        </div>

        {/* Base gradient so the countdown stays legible */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink/70 to-transparent transition-opacity duration-300 group-hover:opacity-0" />
        <div className="absolute bottom-3 left-3 z-10 transition-all duration-300 group-hover:translate-y-2 group-hover:opacity-0">
          <CountdownTimer auctionEnd={auction.auctionEnd} />
        </div>

        {/* Second view: spec panel slides up on hover */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink via-ink/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="translate-y-3 p-4 transition-transform duration-300 group-hover:translate-y-0">
            <div className="grid grid-cols-3 gap-2">
              {quickSpecs.map((s) => (
                <div key={s.label}>
                  <span className="eyebrow !text-chrome">{s.label}</span>
                  <p className="readout truncate text-sm font-bold text-paper">{s.value}</p>
                </div>
              ))}
            </div>
            <span className="mt-3 inline-flex items-center gap-1 font-display text-xs font-bold uppercase tracking-wide text-redline">
              View lot
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-bold leading-tight text-ink transition-colors group-hover:text-redline">
            {auction.make} {auction.model}
          </h3>
          <span className="readout mt-0.5 shrink-0 text-sm text-asphalt">{auction.year}</span>
        </div>

        <div className="mt-3 flex items-end justify-between border-t border-chrome/70 pt-3">
          <div>
            <span className="eyebrow">Current bid</span>
            <p className={`readout text-xl font-bold ${hasBid ? 'text-ink' : 'text-asphalt'}`}>
              {hasBid ? `$${numberWithCommas(auction.currentHighBid)}` : 'No bids yet'}
            </p>
          </div>
          {reserveMet && (
            <span className="eyebrow rounded-full bg-racing/10 px-2 py-1 !text-racing">Reserve met</span>
          )}
        </div>
      </div>
    </Link>
  );
}

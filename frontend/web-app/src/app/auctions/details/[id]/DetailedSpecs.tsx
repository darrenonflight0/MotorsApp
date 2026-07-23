import { Auction } from '@/types';
import Link from 'next/link';

type Props = {
  auction: Auction;
};

function statusBadge(status: string): { text: string; cls: string } {
  switch (status) {
    case 'Live':
      return { text: 'Live', cls: 'bg-racing/10 text-racing' };
    case 'Finished':
      return { text: 'Finished', cls: 'bg-chrome/60 text-asphalt' };
    default:
      return { text: 'Reserve not met', cls: 'bg-amber-500/10 text-amber-700' };
  }
}

function Spec({ label, value, mono }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div>
      <span className="eyebrow">{label}</span>
      <p className={`mt-1 font-semibold text-ink ${mono ? 'readout' : 'font-display'}`}>{value}</p>
    </div>
  );
}

export default function DetailedSpecs({ auction }: Props) {
  const status = statusBadge(auction.status);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="eyebrow">Seller</span>
          <p className="mt-1">
            <Link
              href={`/users/${encodeURIComponent(auction.seller)}`}
              className="font-display font-semibold text-ink underline-offset-4 transition-colors hover:text-redline hover:underline"
            >
              {auction.seller}
            </Link>
          </p>
        </div>
        <span className={`eyebrow rounded-full px-2.5 py-1 ${status.cls}`}>{status.text}</span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-chrome/70 pt-5">
        <Spec label="Make" value={auction.make} />
        <Spec label="Model" value={auction.model} />
        <Spec label="Year" value={auction.year} mono />
        <Spec label="Colour" value={auction.color} />
        <Spec label="Mileage" value={(auction.milage ?? 0).toLocaleString()} mono />
        <Spec
          label="Reserve price"
          value={(auction.reservePrice ?? 0) > 0 ? `$${auction.reservePrice.toLocaleString()}` : 'No reserve'}
          mono
        />
      </div>
    </div>
  );
}

import { Bid } from '@/types';
import { numberWithCommas } from '@/lib/format';
import { format } from 'date-fns';

type Props = {
  bid: Bid;
};

function statusStyle(status: string): { text: string; cls: string } {
  switch (status) {
    case 'Accepted':
      return { text: 'Bid accepted', cls: 'bg-racing/10 text-racing' };
    case 'AcceptedBelowReserve':
      return { text: 'Reserve not met', cls: 'bg-amber-500/10 text-amber-700' };
    case 'TooLow':
      return { text: 'Bid too low', cls: 'bg-redline/10 text-redline' };
    default:
      return { text: 'Bid placed after finish', cls: 'bg-redline/10 text-redline' };
  }
}

export default function BidItem({ bid }: Props) {
  const status = statusStyle(bid.bidStatus);

  return (
    <div className="flex items-center justify-between border-b border-chrome/60 px-4 py-3 last:border-0">
      <div className="flex flex-col">
        <span className="font-display font-semibold text-ink">{bid.bidder}</span>
        <span className="readout mt-0.5 text-xs text-asphalt">
          {format(new Date(bid.bidTime), 'dd MMM yyyy h:mm a')}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className={`eyebrow rounded-full px-2.5 py-1 ${status.cls}`}>{status.text}</span>
        <span className="readout font-bold text-ink">${numberWithCommas(bid.amount)}</span>
      </div>
    </div>
  );
}

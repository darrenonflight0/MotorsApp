'use client';

import { getBidsForAuction } from '@/app/actions/bidActions';
import { useAuctionStore } from '@/hooks/useAuctionStore';
import { useBidStore } from '@/hooks/useBidStore';
import { Auction, Bid } from '@/types';
import { numberWithCommas } from '@/lib/format';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import toast from 'react-hot-toast';
import BidItem from './BidItem';
import BidForm from './BidForm';
import BidDepositGate from './BidDepositGate';
import Heading from '@/app/components/Heading';

type Props = {
  user: { username?: string | null } | null;
  auction: Auction;
};

export default function BidList({ user, auction }: Props) {
  const [loading, setLoading] = useState(true);

  const { bids, setBids } = useBidStore(
    useShallow((state) => ({ bids: state.bids, setBids: state.setBids }))
  );
  const setCurrentPrice = useAuctionStore((state) => state.setCurrentPrice);

  const highBid = bids.reduce(
    (prev, current) =>
      prev > current.amount ? prev : current.bidStatus.includes('Accepted') ? current.amount : prev,
    0
  );

  useEffect(() => {
    getBidsForAuction(auction.id)
      .then((res: Bid[] | { error: unknown }) => {
        if ('error' in res) throw res.error;
        setBids(res);
      })
      .catch(() => toast.error('Could not load bids'))
      .finally(() => setLoading(false));
  }, [auction.id, setBids]);

  useEffect(() => {
    if (highBid > 0) setCurrentPrice(auction.id, highBid);
  }, [highBid, auction.id, setCurrentPrice]);

  const auctionFinished = new Date(auction.auctionEnd) < new Date();
  const canBid = user && !auctionFinished && user.username !== auction.seller;

  if (loading) {
    return (
      <div className="animate-pulse rounded-xl border border-line/80 bg-surface p-4 shadow-lot">
        <div className="h-5 w-24 rounded bg-line/50" />
        <div className="mt-4 h-10 w-full rounded bg-line/40" />
        <div className="mt-2 h-10 w-full rounded bg-line/40" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line/80 bg-surface shadow-lot">
      <div className="flex items-center justify-between border-b border-line/70 p-4">
        <Heading title="Bids" />
        <div className="text-right">
          <span className="eyebrow">High bid</span>
          <p className={`readout text-xl font-bold ${highBid > 0 ? 'text-redline' : 'text-muted'}`}>
            {highBid > 0 ? `$${numberWithCommas(highBid)}` : 'No bids yet'}
          </p>
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto">
        {bids.length === 0 ? (
          <div className="p-5 text-sm text-muted">Be the first to bid on this lot.</div>
        ) : (
          bids.map((bid) => <BidItem key={bid.id} bid={bid} />)
        )}
      </div>

      <div className="border-t border-line/70 p-4">
        {auctionFinished ? (
          <span className="text-sm font-semibold text-muted">This auction has finished</span>
        ) : !user ? (
          <span className="text-sm text-muted">Please log in to place a bid</span>
        ) : user.username === auction.seller ? (
          <span className="text-sm text-muted">You cannot bid on your own auction</span>
        ) : (
          canBid && (
            <BidDepositGate auctionId={auction.id} username={user?.username}>
              <BidForm auctionId={auction.id} highBid={highBid} />
            </BidDepositGate>
          )
        )}
      </div>
    </div>
  );
}

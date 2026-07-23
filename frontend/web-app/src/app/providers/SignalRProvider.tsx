'use client';

import { useActivityStore } from '@/hooks/useActivityStore';
import { useAuctionStore } from '@/hooks/useAuctionStore';
import { useBidStore } from '@/hooks/useBidStore';
import { useNotificationStore } from '@/hooks/useNotificationStore';
import { Auction, AuctionFinished, Bid } from '@/types';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { ReactNode, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

// NOTE: ASP.NET Core SignalR serializes hub messages as camelCase JSON by
// default, so incoming payloads match our camelCase Auction/Bid types.

type Props = {
  children: ReactNode;
};

export default function SignalRProvider({ children }: Props) {
  const connection = useRef<HubConnection | null>(null);
  const setCurrentPrice = useAuctionStore((state) => state.setCurrentPrice);
  const addBid = useBidStore((state) => state.addBid);
  const addNotification = useNotificationStore((state) => state.add);
  const pushActivity = useActivityStore((state) => state.push);

  useEffect(() => {
    if (!connection.current) {
      connection.current = new HubConnectionBuilder()
        .withUrl(process.env.NEXT_PUBLIC_NOTIFY_URL!)
        .withAutomaticReconnect()
        .build();

      connection.current
        .start()
        .catch((err) => console.error('SignalR connection error:', err));
    }

    connection.current.on('BidPlaced', (bid: Bid) => {
      if (bid.bidStatus?.includes('Accepted')) {
        setCurrentPrice(bid.auctionId, bid.amount);
        pushActivity({ bidder: bid.bidder, amount: bid.amount, auctionId: bid.auctionId });
      }
      addBid(bid);
      addNotification({
        type: 'BidPlaced',
        message: `New bid of $${bid.amount} placed`,
        href: `/auctions/details/${bid.auctionId}`,
      });
    });

    connection.current.on('AuctionCreated', (auction: Auction) => {
      addNotification({
        type: 'AuctionCreated',
        message: `${auction.make} ${auction.model} just listed`,
        href: `/auctions/details/${auction.id}`,
      });
      toast(`New auction: ${auction.make} ${auction.model}`);
    });

    connection.current.on(
      'AuctionEndExtended',
      (extended: { auctionId: string; newAuctionEnd: string }) => {
        addNotification({
          type: 'AuctionExtended',
          message: 'Late bid: auction end time extended',
          href: `/auctions/details/${extended.auctionId}`,
        });
        toast('A late bid extended an auction');
      }
    );

    connection.current.on('AuctionFinished', (finished: AuctionFinished) => {
      addNotification({
        type: 'AuctionFinished',
        message: finished.itemSold
          ? `Auction finished: sold to ${finished.winner}`
          : 'Auction finished: reserve not met',
        href: `/auctions/details/${finished.auctionId}`,
      });
      toast(finished.itemSold ? 'An auction has finished with a sale' : 'An auction has finished');
    });

    return () => {
      connection.current?.off('BidPlaced');
      connection.current?.off('AuctionCreated');
      connection.current?.off('AuctionEndExtended');
      connection.current?.off('AuctionFinished');
    };
  }, [setCurrentPrice, addBid, addNotification, pushActivity]);

  return children;
}

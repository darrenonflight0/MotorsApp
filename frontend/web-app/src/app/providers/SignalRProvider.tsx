'use client';

import { useActivityStore } from '@/hooks/useActivityStore';
import { useAuctionStore } from '@/hooks/useAuctionStore';
import { useBidStore } from '@/hooks/useBidStore';
import { useNotificationStore } from '@/hooks/useNotificationStore';
import { playRev, primeRevSound } from '@/lib/revSound';
import { Auction, AuctionFinished, Bid } from '@/types';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { useSession } from 'next-auth/react';
import { ReactNode, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

// NOTE: ASP.NET Core SignalR serializes hub messages as camelCase JSON by
// default, so incoming payloads match our camelCase Auction/Bid types.

type Props = {
  children: ReactNode;
};

export default function SignalRProvider({ children }: Props) {
  const connection = useRef<HubConnection | null>(null);
  const { data: session } = useSession();
  // Kept in a ref so the SignalR handlers always read the latest username
  // without re-subscribing on every session change.
  const usernameRef = useRef<string | undefined>(undefined);
  usernameRef.current = session?.user?.username;
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
      playRev();
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
      playRev();
    });

    connection.current.on(
      'SecondChanceOffered',
      (offer: { auctionId: string; buyer: string; amount: number }) => {
        // Only the offered bidder should hear about it.
        if (!offer.buyer || offer.buyer !== usernameRef.current) return;
        addNotification({
          type: 'SecondChance',
          message: `Second chance: buy this lot for $${offer.amount}`,
          href: `/auctions/details/${offer.auctionId}`,
        });
        toast.success(`You've been offered a second chance to buy a lot for $${offer.amount}`);
        playRev();
      }
    );

    connection.current.on(
      'Announcement',
      (a: { title?: string; message: string; href?: string }) => {
        addNotification({
          type: 'Announcement',
          message: a.title ? `${a.title}: ${a.message}` : a.message,
          href: a.href || '/',
        });
        toast(a.message, { icon: '📣', duration: 6000 });
        playRev();
      }
    );

    return () => {
      connection.current?.off('BidPlaced');
      connection.current?.off('AuctionCreated');
      connection.current?.off('AuctionEndExtended');
      connection.current?.off('AuctionFinished');
      connection.current?.off('SecondChanceOffered');
      connection.current?.off('Announcement');
    };
  }, [setCurrentPrice, addBid, addNotification, pushActivity]);

  // Audio can't play until the user has interacted with the page, so resume the
  // rev-sound audio context on the first gesture.
  useEffect(() => {
    const prime = () => primeRevSound();
    window.addEventListener('pointerdown', prime, { once: true });
    window.addEventListener('keydown', prime, { once: true });
    return () => {
      window.removeEventListener('pointerdown', prime);
      window.removeEventListener('keydown', prime);
    };
  }, []);

  return children;
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Auction } from '@/types';

// A saved lot keeps just enough to render a card without a round-trip.
export type WatchedLot = {
  id: string;
  make: string;
  model: string;
  year: number;
  imageUrl: string;
  auctionEnd: string;
  currentHighBid: number;
  reservePrice: number;
  savedAt: number;
};

type State = {
  lots: WatchedLot[];
};

type Actions = {
  toggle: (auction: Auction) => void;
  remove: (id: string) => void;
  isWatched: (id: string) => boolean;
  clear: () => void;
};

export const useWatchlistStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      lots: [],

      toggle: (auction: Auction) => {
        const exists = get().lots.some((l) => l.id === auction.id);
        if (exists) {
          set((s) => ({ lots: s.lots.filter((l) => l.id !== auction.id) }));
        } else {
          const lot: WatchedLot = {
            id: auction.id,
            make: auction.make,
            model: auction.model,
            year: auction.year,
            imageUrl: auction.imageUrl,
            auctionEnd: auction.auctionEnd,
            currentHighBid: auction.currentHighBid,
            reservePrice: auction.reservePrice,
            savedAt: Date.now(),
          };
          set((s) => ({ lots: [lot, ...s.lots] }));
        }
      },

      remove: (id: string) => set((s) => ({ lots: s.lots.filter((l) => l.id !== id) })),

      isWatched: (id: string) => get().lots.some((l) => l.id === id),

      clear: () => set({ lots: [] }),
    }),
    { name: 'yamkela-watchlist' }
  )
);

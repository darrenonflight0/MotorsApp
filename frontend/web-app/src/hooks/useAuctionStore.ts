import { Auction, PagedResult } from '@/types';
import { create } from 'zustand';

type State = {
  auctions: Auction[];
  totalCount: number;
  pageCount: number;
};

type Actions = {
  setData: (data: PagedResult<Auction>) => void;
  setCurrentPrice: (auctionId: string, amount: number) => void;
};

const initialState: State = {
  auctions: [],
  pageCount: 0,
  totalCount: 0,
};

export const useAuctionStore = create<State & Actions>()((set) => ({
  ...initialState,

  setData: (data: PagedResult<Auction>) => {
    // Guard against error responses / malformed payloads (e.g. search offline).
    if (!data || !Array.isArray(data.results)) {
      set(() => ({ ...initialState }));
      return;
    }
    set(() => ({
      auctions: data.results,
      totalCount: data.totalCount ?? 0,
      pageCount: data.pageCount ?? 0,
    }));
  },

  setCurrentPrice: (auctionId: string, amount: number) => {
    set((state) => ({
      auctions: state.auctions.map((auction) =>
        auction.id === auctionId ? { ...auction, currentHighBid: amount } : auction
      ),
    }));
  },
}));

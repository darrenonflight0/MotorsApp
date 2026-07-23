import { create } from 'zustand';

export type Activity = {
  id: string;
  bidder: string;
  amount: number;
  auctionId: string;
  at: number;
};

type State = {
  activity: Activity[];
};

type Actions = {
  push: (a: Omit<Activity, 'id' | 'at'>) => void;
};

// A rolling feed of real accepted bids pushed over SignalR. Social proof that
// the marketplace is live — no fabricated events.
export const useActivityStore = create<State & Actions>()((set) => ({
  activity: [],
  push: (a) =>
    set((state) => ({
      activity: [
        { ...a, id: crypto.randomUUID(), at: Date.now() },
        ...state.activity,
      ].slice(0, 12),
    })),
}));

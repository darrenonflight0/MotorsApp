import { create } from 'zustand';

export type Notification = {
  id: string;
  type: 'AuctionCreated' | 'BidPlaced' | 'AuctionFinished' | 'AuctionExtended' | 'SecondChance';
  message: string;
  href?: string;
  createdAt: number;
  read: boolean;
};

type State = {
  notifications: Notification[];
};

type Actions = {
  add: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAllRead: () => void;
  clear: () => void;
};

export const useNotificationStore = create<State & Actions>()((set) => ({
  notifications: [],

  add: (n) =>
    set((state) => ({
      notifications: [
        {
          ...n,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          read: false,
        },
        ...state.notifications,
      ].slice(0, 30),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  clear: () => set({ notifications: [] }),
}));

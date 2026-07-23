// Shapes mirror the .NET backend DTOs (note: `milage` is intentionally spelled
// this way to match AuctionService/SearchService).

export type PagedResult<T> = {
  results: T[];
  pageCount: number;
  totalCount: number;
};

export type Auction = {
  id: string;
  reservePrice: number;
  seller: string;
  winner?: string;
  soldAmount: number;
  currentHighBid: number;
  createdAt: string;
  updatedAt: string;
  auctionEnd: string;
  status: string;
  make: string;
  model: string;
  year: number;
  color: string;
  milage: number;
  imageUrl: string;
  country?: string;
  description?: string;
};

export type Bid = {
  id: string;
  auctionId: string;
  bidder: string;
  bidTime: string;
  amount: number;
  bidStatus: string;
};

export type AuctionFinished = {
  itemSold: boolean;
  auctionId: string;
  winner?: string;
  seller: string;
  amount?: number;
};

export type Escrow = {
  id: string;
  auctionId: string;
  seller: string;
  buyer: string;
  amount: number;
  status: 'AwaitingDeposit' | 'Funded' | 'Released' | 'Refunded' | 'Disputed';
  createdAt: string;
  fundedAt?: string;
  closedAt?: string;
};

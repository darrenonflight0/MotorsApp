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
  vehicleType?: string;
  description?: string;
  images?: string[];
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
  buyerPremiumPercent?: number;
  buyerPremium?: number;
  total?: number;
  status: 'AwaitingDeposit' | 'Funded' | 'Released' | 'Refunded' | 'Disputed' | 'Defaulted';
  createdAt: string;
  fundedAt?: string;
  closedAt?: string;
  paymentProvider?: string;
  activeProvider?: string;
  fundsAreReal?: boolean;
  shipment?: Shipment;
};

export type ShipmentStage = 'Preparing' | 'Collected' | 'AtPort' | 'Loaded' | 'InTransit' | 'Arrived';

export type ShipmentUpdate = {
  at: string;
  by: string;
  stage: ShipmentStage;
  location?: string;
  note?: string;
};

export type Shipment = {
  stage: ShipmentStage;
  trackingRef?: string;
  updates: ShipmentUpdate[];
};

/** What the logistics team sees of a sale: no amounts or payment details. */
export type LogisticsJob = {
  id: string;
  auctionId: string;
  seller: string;
  buyer: string;
  status: Escrow['status'];
  fundedAt?: string;
  shipment: Shipment;
};

export type EscrowMessage = {
  at: string;
  from: string;
  text: string;
};

import { getData } from '@/app/actions/auctionActions';
import AuctionCard from '@/app/auctions/AuctionCard';
import { Auction, PagedResult } from '@/types';

type Props = {
  params: { username: string };
};

async function safeGet(query: string): Promise<PagedResult<Auction>> {
  try {
    const res = await getData(query);
    if (res && Array.isArray(res.results)) return res;
  } catch {
    // fall through to empty
  }
  return { results: [], pageCount: 0, totalCount: 0 };
}

export default async function UserPage({ params }: Props) {
  const username = decodeURIComponent(params.username);

  const [selling, won] = await Promise.all([
    safeGet(`?seller=${encodeURIComponent(username)}&pageSize=12&orderBy=new`),
    safeGet(`?winner=${encodeURIComponent(username)}&pageSize=12&orderBy=new`),
  ]);

  const liveCount = selling.results.filter(
    (a) => new Date(a.auctionEnd) > new Date()
  ).length;

  return (
    <div>
      <section className="mb-10 overflow-hidden rounded-2xl bg-ink px-6 py-10 text-paper sm:px-10">
        <span className="eyebrow !text-chrome">Seller showroom</span>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          {username}
        </h1>
        <div className="mt-6 flex flex-wrap gap-10">
          <div>
            <div className="readout text-3xl font-bold">{String(liveCount).padStart(2, '0')}</div>
            <div className="eyebrow mt-1 !text-chrome">Live lots</div>
          </div>
          <div>
            <div className="readout text-3xl font-bold">
              {String(selling.totalCount).padStart(2, '0')}
            </div>
            <div className="eyebrow mt-1 !text-chrome">Lots listed</div>
          </div>
          <div>
            <div className="readout text-3xl font-bold">{String(won.totalCount).padStart(2, '0')}</div>
            <div className="eyebrow mt-1 !text-chrome">Auctions won</div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl font-bold tracking-tight text-ink">
          Lots by {username}
        </h2>
        {selling.results.length === 0 ? (
          <div className="rounded-xl border border-dashed border-chrome-dark/30 bg-paper-raised/60 p-10 text-center text-asphalt">
            No lots listed yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {selling.results.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </section>

      {won.results.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 font-display text-2xl font-bold tracking-tight text-ink">
            Auctions won
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {won.results.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

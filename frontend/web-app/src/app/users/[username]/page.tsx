import { getData } from '@/app/actions/auctionActions';
import { getPublicProfile } from '@/app/actions/verificationActions';
import AuctionCard from '@/app/auctions/AuctionCard';
import VerifiedBadge from '@/app/components/VerifiedBadge';
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

  const [selling, won, profileRes] = await Promise.all([
    safeGet(`?seller=${encodeURIComponent(username)}&pageSize=12&orderBy=new`),
    safeGet(`?winner=${encodeURIComponent(username)}&pageSize=12&orderBy=new`),
    getPublicProfile(username),
  ]);
  const profile = profileRes && !('error' in profileRes) ? profileRes : null;

  const liveCount = selling.results.filter(
    (a) => new Date(a.auctionEnd) > new Date()
  ).length;

  return (
    <div>
      <section className="mb-10 overflow-hidden rounded-2xl bg-ink px-6 py-10 text-paper sm:px-10">
        <span className="eyebrow !text-chrome">Seller showroom</span>
        <div className="mt-3 flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-chrome/40 bg-ink-soft">
            {profile?.profilePicture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.profilePicture} alt={username} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-2xl font-black text-chrome">
                {username.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <h1 className="flex items-center gap-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            {username}
            <VerifiedBadge verified={profile?.verified} />
          </h1>
        </div>
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

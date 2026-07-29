import { getCurrentUser } from '@/app/actions/authActions';
import { getDetailedViewData } from '@/app/actions/auctionActions';
import { getPublicProfile } from '@/app/actions/verificationActions';
import Heading from '@/app/components/Heading';
import CountdownTimer from '@/app/components/CountdownTimer';
import VerifiedBadge from '@/app/components/VerifiedBadge';
import Gallery from './Gallery';
import Link from 'next/link';
import DetailedSpecs from './DetailedSpecs';
import BidList from './BidList';
import DeleteButton from './DeleteButton';
import EscrowPanel from './EscrowPanel';
import WatchButton from '@/app/components/WatchButton';

export default async function Details({ params }: { params: { id: string } }) {
  const auction = await getDetailedViewData(params.id);
  const user = await getCurrentUser();

  const isSeller = user && user.username === auction.seller;
  const sellerProfile = await getPublicProfile(auction.seller);
  const sellerVerified = sellerProfile && !('error' in sellerProfile) ? sellerProfile.verified : false;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Heading title={`${auction.make} ${auction.model}`} subtitle={`Year: ${auction.year}`} />
        <div className="flex items-center gap-3">
          {isSeller && (
            <>
              <Link
                href={`/auctions/update/${auction.id}`}
                className="rounded-lg bg-ink px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-paper transition-colors hover:bg-ink-soft active:translate-y-px"
              >
                Edit
              </Link>
              <DeleteButton id={auction.id} />
            </>
          )}
          <WatchButton auction={auction} variant="inline" />
        </div>
      </div>

      {/* Auctioneer verification status — shown on every listing */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted">
        <span>Sold by</span>
        <Link
          href={`/users/${encodeURIComponent(auction.seller)}`}
          className="inline-flex items-center gap-1 font-display font-semibold text-fg hover:text-redline"
        >
          @{auction.seller}
          <VerifiedBadge verified={sellerVerified} size="sm" />
        </Link>
        <VerifiedBadge verified={sellerVerified} variant="badge" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Gallery
          images={auction.images && auction.images.length ? auction.images : [auction.imageUrl]}
          alt={`${auction.make} ${auction.model}`}
        />
        <div className="rounded-xl border border-line/80 bg-surface p-5 shadow-lot">
          <CountdownTimer auctionEnd={auction.auctionEnd} size="lg" />
          <div className="mt-5">
            <DetailedSpecs auction={auction} />
          </div>
        </div>
      </div>

      <section className="mt-8 max-w-5xl rounded-xl border border-line/80 bg-surface p-5 shadow-lot">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg font-bold tracking-tight text-fg">
            Condition &amp; disclosures
          </h2>
          <span className="eyebrow shrink-0">Seller-declared</span>
        </div>
        <p className="mt-3 whitespace-pre-line leading-relaxed text-muted [text-wrap:pretty]">
          {auction.description?.trim()
            ? auction.description
            : 'The seller has not provided a condition statement for this vehicle.'}
        </p>
        <p className="mt-4 border-t border-line/60 pt-3 text-xs leading-relaxed text-muted">
          This description is provided by the seller. Yamkela Motors is a marketplace facilitator
          and does not independently verify vehicle condition — review all disclosures and our{' '}
          <Link href="/terms" className="font-medium text-redline hover:text-redline-deep">
            Terms
          </Link>{' '}
          before bidding.
        </p>
      </section>

      <div className="mt-8 grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-2">
        <BidList user={user} auction={auction} />
        {user?.username && <EscrowPanel auctionId={auction.id} username={user.username} />}
      </div>
    </div>
  );
}

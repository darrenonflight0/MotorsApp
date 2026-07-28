import { getCurrentUser } from '@/app/actions/authActions';
import Heading from '@/app/components/Heading';
import { HiBadgeCheck } from 'react-icons/hi';
import Link from 'next/link';
import AuctionForm from '../AuctionForm';

export default async function Create() {
  const user = await getCurrentUser();

  // Only verified auctioneers may list a car.
  if (!user?.verified) {
    return (
      <div className="mx-auto max-w-md px-1 py-8">
        <div className="rounded-2xl border border-chrome/80 bg-paper-raised p-8 text-center shadow-lot">
          <HiBadgeCheck className="mx-auto h-14 w-14 text-sky-500/40" />
          <h1 className="mt-3 font-display text-2xl font-bold text-ink">Get verified to sell</h1>
          <p className="mt-2 text-sm leading-relaxed text-asphalt">
            {user
              ? 'Only verified auctioneers can list cars. Complete a quick identity check to earn your blue tick.'
              : 'Sign in and complete identity verification to list your car for auction.'}
          </p>
          <Link href="/verify" className="btn-primary mt-6 inline-block">
            {user ? 'Start verification' : 'Get started'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-chrome/80 bg-paper-raised p-6 shadow-lot sm:p-8">
      <Heading title="Sell your car" subtitle="Please enter the details of your car below" />
      <div className="mt-6">
        <AuctionForm />
      </div>
    </div>
  );
}

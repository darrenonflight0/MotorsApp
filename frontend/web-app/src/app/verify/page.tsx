import { getCurrentUser } from '@/app/actions/authActions';
import { getMyVerification, MyVerification } from '@/app/actions/verificationActions';
import PageHero from '@/app/components/PageHero';
import Link from 'next/link';
import VerifyFlow from './VerifyFlow';

export const metadata = {
  title: 'Become a verified auctioneer · Yamkela Motors',
};

export default async function VerifyPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div>
        <PageHero
          eyebrow="Sell your car"
          title="Sign in to get started"
          subtitle="You need a Yamkela Motors account before you can apply to auction your car."
        />
        <Link href="/" className="btn-primary">Back to auctions</Link>
      </div>
    );
  }

  const res = await getMyVerification();
  const initial: MyVerification = res && !('error' in res) ? res : { verified: false, application: null };

  return <VerifyFlow initial={initial} />;
}

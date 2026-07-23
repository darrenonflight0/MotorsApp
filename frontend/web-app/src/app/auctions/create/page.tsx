import Heading from '@/app/components/Heading';
import AuctionForm from '../AuctionForm';

export default function Create() {
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-chrome/80 bg-paper-raised p-6 shadow-lot sm:p-8">
      <Heading title="Sell your car" subtitle="Please enter the details of your car below" />
      <div className="mt-6">
        <AuctionForm />
      </div>
    </div>
  );
}

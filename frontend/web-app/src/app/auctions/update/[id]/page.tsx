import { getDetailedViewData } from '@/app/actions/auctionActions';
import Heading from '@/app/components/Heading';
import AuctionForm from '../../AuctionForm';

export default async function Update({ params }: { params: { id: string } }) {
  const auction = await getDetailedViewData(params.id);

  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-line/80 bg-surface p-6 shadow-lot sm:p-8">
      <Heading title="Update your auction" subtitle="You can only edit make, model, year, colour and mileage" />
      <div className="mt-6">
        <AuctionForm auction={auction} />
      </div>
    </div>
  );
}

'use client';

import { deleteAuction } from '@/app/actions/auctionActions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

type Props = {
  id: string;
};

export default function DeleteButton({ id }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function doDelete() {
    setLoading(true);
    deleteAuction(id)
      .then((res) => {
        if (res.error) throw res.error;
        router.push('/');
      })
      .catch((err) => {
        toast.error(err.message || 'Could not delete auction');
      })
      .finally(() => setLoading(false));
  }

  return (
    <button
      onClick={doDelete}
      disabled={loading}
      className="rounded-lg border border-redline/40 px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-redline transition-colors hover:bg-redline hover:text-paper active:translate-y-px disabled:opacity-50"
    >
      {loading ? 'Deleting…' : 'Delete'}
    </button>
  );
}

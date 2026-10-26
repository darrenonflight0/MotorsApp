'use client';

import ShipmentTracker from '@/app/auctions/details/[id]/ShipmentTracker';
import { LogisticsJob } from '@/types';
import Link from 'next/link';
import { useState } from 'react';

export default function LogisticsJobs({ initial }: { initial: LogisticsJob[] }) {
  const [jobs, setJobs] = useState(initial);

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-line/80 bg-surface p-8 text-center text-sm text-muted shadow-lot">
        No paid sales are waiting on logistics right now.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {jobs.map((job) => (
        <section key={job.id} className="rounded-xl border border-line/80 bg-surface p-4 shadow-lot">
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm">
              <Link
                href={`/auctions/details/${job.auctionId}`}
                className="font-display font-bold text-fg underline-offset-2 hover:underline"
              >
                Auction {job.auctionId.slice(0, 8)}
              </Link>
              <div className="mt-1 text-muted">
                Collect from <span className="font-semibold text-fg">{job.seller}</span>
              </div>
              <div className="text-muted">
                Deliver for <span className="font-semibold text-fg">{job.buyer}</span>
              </div>
            </div>
          </div>
          <ShipmentTracker
            escrow={job}
            canUpdate
            onChange={(updated) =>
              setJobs((list) =>
                // A sale that has arrived leaves the queue.
                updated.shipment.stage === 'Arrived'
                  ? list.filter((j) => j.id !== updated.id)
                  : list.map((j) => (j.id === updated.id ? updated : j))
              )
            }
          />
        </section>
      ))}
    </div>
  );
}

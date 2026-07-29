'use client';

import { useParamsStore } from '@/hooks/useParamsStore';

const pageSizeButtons = [4, 8, 12];

const orderButtons = [
  { label: 'Ending soon', value: 'endingSoon' },
  { label: 'Recently added', value: 'new' },
  { label: 'Make', value: 'make' },
];

const filterButtons = [
  { label: 'Live auctions', value: 'live' },
  { label: 'Ending < 6 hours', value: 'endingSoon' },
  { label: 'Completed', value: 'finished' },
];

type SegmentProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function Segment({ label, active, onClick }: SegmentProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`px-3.5 py-2 text-sm font-medium transition-colors first:rounded-l-lg last:rounded-r-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-redline ${
        active
          ? 'border border-ink bg-ink text-paper'
          : 'border border-line/80 bg-surface text-fg hover:border-line/40 hover:text-redline'
      }`}
    >
      {label}
    </button>
  );
}

export default function Filters() {
  const pageSize = useParamsStore((state) => state.pageSize);
  const setParams = useParamsStore((state) => state.setParams);
  const orderBy = useParamsStore((state) => state.orderBy);
  const filterBy = useParamsStore((state) => state.filterBy);

  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="eyebrow">Filter by</span>
        <div className="inline-flex -space-x-px">
          {filterButtons.map(({ label, value }) => (
            <Segment
              key={value}
              label={label}
              active={filterBy === value}
              onClick={() => setParams({ filterBy: value })}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="eyebrow">Order by</span>
        <div className="inline-flex -space-x-px">
          {orderButtons.map(({ label, value }) => (
            <Segment
              key={value}
              label={label}
              active={orderBy === value}
              onClick={() => setParams({ orderBy: value })}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="eyebrow">Page size</span>
        <div className="inline-flex -space-x-px">
          {pageSizeButtons.map((value) => (
            <Segment
              key={value}
              label={String(value)}
              active={pageSize === value}
              onClick={() => setParams({ pageSize: value })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

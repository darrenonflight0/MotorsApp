'use client';

import { useParamsStore } from '@/hooks/useParamsStore';
import Heading from './Heading';

type Props = {
  title?: string;
  subtitle?: string;
  showReset?: boolean;
};

export default function EmptyFilter({
  title = 'No matches for this filter',
  subtitle = 'Try changing or resetting the filter',
  showReset,
}: Props) {
  const reset = useParamsStore((state) => state.reset);

  return (
    <div className="flex h-[40vh] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line/30 bg-surface/60">
      <Heading title={title} subtitle={subtitle} center />
      <div className="mt-4">
        {showReset && (
          <button onClick={reset} className="btn-primary">
            Remove filters
          </button>
        )}
      </div>
    </div>
  );
}

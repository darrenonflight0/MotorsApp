'use client';

type Props = {
  currentPage: number;
  pageCount: number;
  pageChanged: (page: number) => void;
};

export default function AppPagination({ currentPage, pageCount, pageChanged }: Props) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  if (pageCount <= 1) return null;

  const base =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-redline';

  return (
    <nav className="flex items-center gap-1.5" aria-label="Pagination">
      <button
        disabled={currentPage === 1}
        onClick={() => pageChanged(currentPage - 1)}
        className={`${base} border-line/80 bg-surface font-medium text-fg hover:border-line/40 hover:text-redline disabled:pointer-events-none disabled:opacity-40`}
      >
        Prev
      </button>
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => pageChanged(page)}
          aria-current={currentPage === page ? 'page' : undefined}
          className={`${base} readout font-semibold ${
            currentPage === page
              ? 'border-ink bg-ink text-paper'
              : 'border-line/80 bg-surface text-fg hover:border-line/40 hover:text-redline'
          }`}
        >
          {page}
        </button>
      ))}
      <button
        disabled={currentPage === pageCount}
        onClick={() => pageChanged(currentPage + 1)}
        className={`${base} border-line/80 bg-surface font-medium text-fg hover:border-line/40 hover:text-redline disabled:pointer-events-none disabled:opacity-40`}
      >
        Next
      </button>
    </nav>
  );
}

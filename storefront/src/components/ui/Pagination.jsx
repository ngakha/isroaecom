import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

export default function Pagination({ page, totalPages, total, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted">
        {total} results
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-md text-primary-600 hover:bg-primary-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={18} />
        </button>

        {start > 1 && (
          <>
            <PageButton page={1} current={page} onClick={onPageChange} />
            {start > 2 && <span className="px-1 text-muted">...</span>}
          </>
        )}

        {pages.map((p) => (
          <PageButton key={p} page={p} current={page} onClick={onPageChange} />
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-1 text-muted">...</span>}
            <PageButton page={totalPages} current={page} onClick={onPageChange} />
          </>
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-md text-primary-600 hover:bg-primary-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

function PageButton({ page, current, onClick }) {
  return (
    <button
      onClick={() => onClick(page)}
      className={clsx(
        'min-w-[32px] h-8 px-2 text-sm rounded-md transition-colors',
        page === current
          ? 'bg-primary-900 text-white'
          : 'text-primary-600 hover:bg-primary-100'
      )}
    >
      {page}
    </button>
  );
}

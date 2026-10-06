import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ActivityPaginationProps {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
}

const ActivityPagination: React.FC<ActivityPaginationProps> = ({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  itemLabel,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label={`${itemLabel} pages`}
      className="mt-auto flex shrink-0 flex-col gap-3 border-t border-[color:var(--border-color)] pt-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p
        aria-live="polite"
        className="text-center text-xs tabular-nums text-[color:var(--text-secondary)] sm:text-left"
      >
        Showing {startIndex + 1}–{endIndex} of {totalItems}
      </p>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex min-h-9 touch-manipulation items-center gap-1 rounded-lg border border-[color:var(--border-color)] bg-[color:var(--bg-secondary)] px-3 py-1.5 text-xs font-semibold text-[color:var(--text-primary)] transition-colors hover:border-[color:var(--color-primary-main)] hover:bg-[color:var(--color-primary-lighter)] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
          Previous
        </button>

        <span
          aria-current="page"
          className="min-w-20 text-center text-xs font-medium tabular-nums text-[color:var(--text-secondary)]"
        >
          Page {currentPage} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex min-h-9 touch-manipulation items-center gap-1 rounded-lg border border-[color:var(--border-color)] bg-[color:var(--bg-secondary)] px-3 py-1.5 text-xs font-semibold text-[color:var(--text-primary)] transition-colors hover:border-[color:var(--color-primary-main)] hover:bg-[color:var(--color-primary-lighter)] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      </div>
    </nav>
  );
};

export default ActivityPagination;

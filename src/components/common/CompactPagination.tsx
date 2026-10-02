import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CompactPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}

export const CompactPagination: React.FC<CompactPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [4, 8, 15, 25, 50],
  itemLabel = 'data',
  className = '',
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  return (
    <div
      className={`px-4 py-3 bg-[#F7F7F2] border-t border-[#E5E9E3] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#68736B] ${className}`}
    >
      {/* Information text */}
      <div className="flex items-center gap-2 font-mono text-[11px] text-[#68736B]">
        <span>
          Menampilkan <strong className="text-[#202923] font-bold">{startItem}–{endItem}</strong> dari{' '}
          <strong className="text-[#202923] font-bold">{totalItems}</strong> {itemLabel}
        </span>
        <span className="text-[#E5E9E3] hidden sm:inline">|</span>
        <span className="text-[#858D86] hidden sm:inline">
          Halaman {currentPage} dari {Math.max(1, totalPages)}
        </span>
      </div>

      {/* Controls: Page size + Prev/Next buttons */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#68736B] font-mono">
            <span className="hidden md:inline">Baris:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-white border border-[#E5E9E3] rounded-lg px-2 py-1 text-xs text-[#202923] font-mono focus:outline-none focus:ring-1 focus:ring-[#276749]"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / hal
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-[#E5E9E3] text-[#202923] rounded-lg hover:bg-[#E5F3E8] hover:text-[#276749] disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Sebelumnya</span>
          </button>
          <span className="px-2 font-mono text-[#68736B] text-[11px] sm:hidden">
            {currentPage}/{Math.max(1, totalPages)}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages || totalPages === 0}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-[#E5E9E3] text-[#202923] rounded-lg hover:bg-[#E5F3E8] hover:text-[#276749] disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
          >
            <span>Berikutnya</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

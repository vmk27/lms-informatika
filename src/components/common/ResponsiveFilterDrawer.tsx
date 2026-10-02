import React, { useState } from 'react';
import { Filter, X, RotateCcw, Check } from 'lucide-react';

interface ResponsiveFilterDrawerProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  activeFilterCount: number;
  onResetFilters: () => void;
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveFilterDrawer: React.FC<ResponsiveFilterDrawerProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Cari data...',
  activeFilterCount,
  onResetFilters,
  children,
  className = '',
}) => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-2xs space-y-3 ${className}`}>
      {/* Top Search + Filter Button Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-sans"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
            🔍
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mobile Filter Trigger Button */}
        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(true)}
          className={`md:hidden inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all shrink-0 ${
            activeFilterCount > 0
              ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-xs'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center font-mono">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Desktop Inline Filters */}
      <div className="hidden md:flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100">
        {children}
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-500 hover:text-red-600 font-medium transition-colors ml-auto"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filter ({activeFilterCount})</span>
          </button>
        )}
      </div>

      {/* Mobile Bottom Sheet Filter Drawer */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs md:hidden animate-in fade-in duration-150">
          <div className="w-full max-h-[85vh] bg-white rounded-t-2xl shadow-xl flex flex-col p-5 space-y-4 overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Filter Data</h3>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-mono font-bold">
                    {activeFilterCount} aktif
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Inputs Stack */}
            <div className="space-y-3.5 py-1">{children}</div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onResetFilters();
                  setIsMobileDrawerOpen(false);
                }}
                className="w-full py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-full py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Terapkan Filter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

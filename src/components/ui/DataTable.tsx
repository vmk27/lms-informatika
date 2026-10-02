import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AlertCircle, ArrowUpDown } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* 1. VIRTUAL SCROLLING HOOK (useVirtualScroll)                               */
/* -------------------------------------------------------------------------- */

export interface UseVirtualScrollOptions {
  itemCount: number;
  rowHeight: number;
  overscan?: number;
  containerHeight?: number;
}

export interface UseVirtualScrollReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  offsetY: number;
  visibleRange: number[];
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  scrollTop: number;
  viewportHeight: number;
}

export function useVirtualScroll({
  itemCount,
  rowHeight,
  overscan = 4,
  containerHeight: initialContainerHeight = 440,
}: UseVirtualScrollOptions): UseVirtualScrollReturn {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState<number>(initialContainerHeight);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleResize = () => {
      if (el.clientHeight > 0) {
        setViewportHeight(el.clientHeight);
      }
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = itemCount * rowHeight;

  const { startIndex, endIndex, offsetY, visibleRange } = useMemo(() => {
    if (itemCount === 0) {
      return { startIndex: 0, endIndex: 0, offsetY: 0, visibleRange: [] };
    }

    const calculatedStart = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const visibleCount = Math.ceil(viewportHeight / rowHeight);
    const calculatedEnd = Math.min(itemCount, calculatedStart + visibleCount + overscan * 2);
    const top = calculatedStart * rowHeight;

    const indices: number[] = [];
    for (let i = calculatedStart; i < calculatedEnd; i++) {
      indices.push(i);
    }

    return {
      startIndex: calculatedStart,
      endIndex: calculatedEnd,
      offsetY: top,
      visibleRange: indices,
    };
  }, [scrollTop, rowHeight, viewportHeight, itemCount, overscan]);

  return {
    containerRef,
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    visibleRange,
    handleScroll,
    scrollTop,
    viewportHeight,
  };
}

/* -------------------------------------------------------------------------- */
/* 2. GENERIC DATA TABLE COMPONENT                                            */
/* -------------------------------------------------------------------------- */

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  width?: string;
  minWidth?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  sortable?: boolean;
  render: (item: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  keyExtractor: (item: T, index: number) => string;
  rowHeight?: number;
  containerHeight?: number | string;
  virtualized?: boolean;
  minWidth?: string;
  emptyMessage?: string;
  emptyIcon?: React.ComponentType<{ className?: string }>;
  onRowClick?: (item: T, index: number) => void;
  className?: string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
  stickyHeader?: boolean;
  headerTitle?: string;
  headerSubtitle?: string;
  headerActions?: React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  rowHeight = 52,
  containerHeight = 460,
  virtualized = true,
  minWidth = '780px',
  emptyMessage = 'Tidak ada data yang tersedia.',
  emptyIcon: EmptyIcon = AlertCircle,
  onRowClick,
  className = '',
  onSort,
  stickyHeader = true,
  headerTitle,
  headerSubtitle,
  headerActions,
}: DataTableProps<T>) {
  const isNumericHeight = typeof containerHeight === 'number';
  const numericHeight = isNumericHeight ? (containerHeight as number) : 460;

  const {
    containerRef,
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    handleScroll,
  } = useVirtualScroll({
    itemCount: data.length,
    rowHeight,
    overscan: 4,
    containerHeight: numericHeight,
  });

  const shouldVirtualize = virtualized && data.length > 12;

  const visibleData = useMemo(() => {
    if (!shouldVirtualize) {
      return data.map((item, idx) => ({ item, index: idx }));
    }
    return data.slice(startIndex, endIndex).map((item, idx) => ({
      item,
      index: startIndex + idx,
    }));
  }, [data, shouldVirtualize, startIndex, endIndex]);

  return (
    <div className={`bg-white border border-[#E5E9E3] rounded-xl shadow-2xs overflow-hidden flex flex-col ${className}`}>
      {/* Table Card Header */}
      {(headerTitle || headerActions) && (
        <div className="p-4 border-b border-[#E5E9E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div>
            {headerTitle && (
              <h3 className="text-sm font-bold text-[#202923] tracking-tight">
                {headerTitle}
              </h3>
            )}
            {headerSubtitle && (
              <p className="text-xs text-[#68736B] mt-0.5">{headerSubtitle}</p>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center gap-2 shrink-0">{headerActions}</div>
          )}
        </div>
      )}

      {/* Main Table Scroll Container */}
      <div
        ref={containerRef}
        onScroll={shouldVirtualize ? handleScroll : undefined}
        style={{
          maxHeight: isNumericHeight ? `${containerHeight}px` : containerHeight,
          height: isNumericHeight ? `${containerHeight}px` : undefined,
          WebkitOverflowScrolling: 'touch',
        }}
        className="overflow-x-auto overflow-y-auto relative will-change-scroll flex-1"
      >
        <div style={{ minWidth }} className="w-full">
          {/* Table Header */}
          <div
            className={`flex items-center text-[11px] text-[#68736B] font-bold uppercase tracking-wider select-none bg-[#F7F7F2] border-b border-[#E5E9E3] z-10 ${
              stickyHeader ? 'sticky top-0 shadow-2xs' : ''
            }`}
          >
            {columns.map((col) => {
              const alignClass =
                col.align === 'center'
                  ? 'text-center justify-center'
                  : col.align === 'right'
                  ? 'text-right justify-end'
                  : 'text-left justify-start';

              return (
                <div
                  key={col.key}
                  style={{ width: col.width, minWidth: col.minWidth }}
                  className={`py-3 px-4 shrink-0 truncate flex items-center gap-1.5 ${
                    col.className || 'flex-1'
                  } ${alignClass}`}
                >
                  {col.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-[#202923] transition-colors uppercase font-bold"
                    >
                      <span>{col.header}</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-[#858D86]" />
                    </button>
                  ) : (
                    <span>{col.header}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {data.length === 0 && (
            <div className="py-14 text-center text-[#858D86] text-xs flex flex-col items-center justify-center gap-2">
              <EmptyIcon className="w-8 h-8 text-[#858D86]" />
              <span>{emptyMessage}</span>
            </div>
          )}

          {/* Virtualized Rows */}
          {data.length > 0 && shouldVirtualize && (
            <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
              <div
                style={{
                  transform: `translateY(${offsetY}px)`,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                }}
              >
                {visibleData.map(({ item, index }) => (
                  <div
                    key={keyExtractor(item, index)}
                    onClick={() => onRowClick && onRowClick(item, index)}
                    style={{ height: `${rowHeight}px` }}
                    className={`flex items-center border-b border-[#E5E9E3] hover:bg-[#E5F3E8]/40 transition-colors text-xs text-[#202923] contain-layout group ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                  >
                    {columns.map((col) => {
                      const alignClass =
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                          ? 'text-right'
                          : 'text-left';

                      return (
                        <div
                          key={col.key}
                          style={{ width: col.width, minWidth: col.minWidth }}
                          className={`px-4 shrink-0 truncate align-middle ${
                            col.className || 'flex-1'
                          } ${alignClass}`}
                        >
                          {col.render(item, index)}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Non-virtualized Rows */}
          {data.length > 0 && !shouldVirtualize && (
            <div>
              {visibleData.map(({ item, index }) => (
                <div
                  key={keyExtractor(item, index)}
                  onClick={() => onRowClick && onRowClick(item, index)}
                  style={{ height: `${rowHeight}px` }}
                  className={`flex items-center border-b border-[#E5E9E3] hover:bg-[#E5F3E8]/40 transition-colors text-xs text-[#202923] group ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col) => {
                    const alignClass =
                      col.align === 'center'
                        ? 'text-center'
                        : col.align === 'right'
                        ? 'text-right'
                        : 'text-left';

                    return (
                      <div
                        key={col.key}
                        style={{ width: col.width, minWidth: col.minWidth }}
                        className={`px-4 shrink-0 truncate align-middle ${
                          col.className || 'flex-1'
                        } ${alignClass}`}
                      >
                        {col.render(item, index)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table Footer */}
      <div className="px-4 py-2.5 bg-[#F7F7F2] border-t border-[#E5E9E3] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#68736B] font-mono select-none">
        <div className="flex items-center gap-2">
          <span>Total: <strong className="text-[#202923]">{data.length}</strong> data terdaftar</span>
          {shouldVirtualize && (
            <span className="text-[#276749] bg-[#E5F3E8] px-2 py-0.5 rounded border border-[#48A878]/30 font-semibold text-[10px]">
              Virtual Windowing Aktif
            </span>
          )}
        </div>
        <div className="text-[#858D86]">
          Render efisien · Bebas lag memori
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

export interface VirtualTableColumn<T> {
  key: string;
  header: React.ReactNode;
  width?: string;
  className?: string;
  render: (item: T, index: number) => React.ReactNode;
}

interface VirtualTableProps<T> {
  data: T[];
  columns: VirtualTableColumn<T>[];
  rowHeight?: number;
  containerHeight?: number | string;
  overscan?: number;
  keyExtractor: (item: T, index: number) => string;
  emptyMessage?: string;
  minWidth?: string;
}

export function VirtualTable<T>({
  data,
  columns,
  rowHeight = 52,
  containerHeight = 440,
  overscan = 5,
  keyExtractor,
  emptyMessage = 'Tidak ada data untuk ditampilkan.',
  minWidth = '760px',
}: VirtualTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState<number>(
    typeof containerHeight === 'number' ? containerHeight : 440
  );

  // Update viewport height on mount and resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateHeight = () => {
      setViewportHeight(el.clientHeight || 440);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalCount = data.length;
  const totalHeight = totalCount * rowHeight;

  // Calculate visible range
  const { startIndex, endIndex, offsetY } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const visibleCount = Math.ceil(viewportHeight / rowHeight);
    const end = Math.min(totalCount, start + visibleCount + overscan * 2);
    const top = start * rowHeight;

    return {
      startIndex: start,
      endIndex: end,
      offsetY: top,
    };
  }, [scrollTop, rowHeight, viewportHeight, totalCount, overscan]);

  const visibleItems = useMemo(() => {
    return data.slice(startIndex, endIndex).map((item, idx) => ({
      item,
      originalIndex: startIndex + idx,
    }));
  }, [data, startIndex, endIndex]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: typeof containerHeight === 'number' ? `${containerHeight}px` : containerHeight,
        WebkitOverflowScrolling: 'touch',
      }}
      className="overflow-x-auto overflow-y-auto relative border border-slate-200 rounded-xl bg-white will-change-scroll"
    >
      <div style={{ minWidth }}>
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-xs border-b border-slate-200 flex items-center text-[11px] text-slate-500 font-bold uppercase tracking-wider select-none shadow-2xs">
          {columns.map((col) => (
            <div
              key={col.key}
              style={{ width: col.width }}
              className={`py-3 px-4 shrink-0 truncate ${col.className || 'flex-1'}`}
            >
              {col.header}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {totalCount === 0 && (
          <div className="py-12 text-center text-xs text-slate-400">
            {emptyMessage}
          </div>
        )}

        {/* Virtual Rows Container */}
        {totalCount > 0 && (
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
              {visibleItems.map(({ item, originalIndex }) => (
                <div
                  key={keyExtractor(item, originalIndex)}
                  style={{ height: `${rowHeight}px` }}
                  className="flex items-center border-b border-slate-100 hover:bg-blue-50/30 transition-colors text-xs text-slate-700 contain-layout group"
                >
                  {columns.map((col) => (
                    <div
                      key={col.key}
                      style={{ width: col.width }}
                      className={`px-4 shrink-0 truncate ${col.className || 'flex-1'}`}
                    >
                      {col.render(item, originalIndex)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

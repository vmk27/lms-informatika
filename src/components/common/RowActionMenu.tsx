import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

export interface ActionMenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'warning' | 'primary';
  disabled?: boolean;
}

interface RowActionMenuProps {
  items: ActionMenuItem[];
  align?: 'left' | 'right';
  className?: string;
  buttonLabel?: string;
}

export const RowActionMenu: React.FC<RowActionMenuProps> = ({
  items,
  align = 'right',
  className = '',
  buttonLabel = 'Menu aksi',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter valid items
  const validItems = items.filter(Boolean);
  if (validItems.length === 0) return null;

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-label={buttonLabel}
        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } z-30 mt-1.5 w-48 rounded-xl bg-white p-1 shadow-lg ring-1 ring-slate-900/10 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100`}
        >
          <div className="py-1">
            {validItems.map((item) => {
              const Icon = item.icon;
              const isDanger = item.variant === 'danger';
              const isWarning = item.variant === 'warning';
              const isPrimary = item.variant === 'primary';

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={item.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    item.onClick();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed ${
                    isDanger
                      ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                      : isWarning
                      ? 'text-amber-700 hover:bg-amber-50 hover:text-amber-800'
                      : isPrimary
                      ? 'text-blue-700 hover:bg-blue-50 hover:text-blue-800'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

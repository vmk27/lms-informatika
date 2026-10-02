import React from 'react';
import { ActionMenuItem, RowActionMenu } from './RowActionMenu';

export interface MobileDataCardProps {
  title: string;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  progress?: {
    label: string;
    valueText: string;
    percentage: number;
    barColorClass?: string;
  };
  metrics?: {
    label: string;
    value: string | React.ReactNode;
  }[];
  primaryAction?: {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'emerald';
  };
  menuItems?: ActionMenuItem[];
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const MobileDataCard: React.FC<MobileDataCardProps> = ({
  title,
  subtitle,
  badge,
  progress,
  metrics,
  primaryAction,
  menuItems = [],
  onClick,
  className = '',
  children,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-[#E5E9E3] rounded-xl p-3.5 sm:p-4 space-y-2.5 shadow-2xs transition-all ${
        onClick ? 'cursor-pointer hover:border-[#48A878] hover:shadow-xs' : ''
      } ${className}`}
    >
      {/* Top row: Title + Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-[#202923] text-sm tracking-tight truncate">
            {title}
          </h4>
          {subtitle && (
            <div className="text-xs text-[#68736B] mt-0.5 truncate">{subtitle}</div>
          )}
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>

      {/* Metrics Grid */}
      {metrics && metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#E5E9E3] text-xs">
          {metrics.map((m, idx) => (
            <div key={idx} className="space-y-0.5">
              <span className="text-[10px] text-[#A3B1A8] uppercase font-semibold block tracking-wider">
                {m.label}
              </span>
              <span className="font-bold text-[#202923] text-xs truncate block">
                {m.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {progress && (
        <div className="space-y-1 pt-0.5">
          <div className="flex justify-between text-[11px] font-mono text-[#68736B]">
            <span>{progress.label}</span>
            <span className="font-bold text-[#202923]">{progress.valueText}</span>
          </div>
          <div className="w-full h-1.5 bg-[#F7F7F2] rounded-full overflow-hidden border border-[#E5E9E3]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progress.barColorClass || 'bg-[#276749]'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, progress.percentage))}%` }}
            />
          </div>
        </div>
      )}

      {/* Children */}
      {children}

      {/* Footer Actions */}
      {(primaryAction || (menuItems && menuItems.length > 0)) && (
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E5E9E3]">
          <div>
            {primaryAction && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  primaryAction.onClick();
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  primaryAction.variant === 'secondary'
                    ? 'bg-[#F7F7F2] hover:bg-[#E5E9E3] text-[#202923]'
                    : primaryAction.variant === 'emerald'
                    ? 'bg-[#E5F3E8] hover:bg-[#cbe6d2] text-[#276749] border border-[#48A878]/30'
                    : 'bg-[#E5F3E8] hover:bg-[#276749] hover:text-white text-[#276749] border border-[#48A878]/30'
                }`}
              >
                {primaryAction.icon && <primaryAction.icon className="w-3.5 h-3.5" />}
                <span>{primaryAction.label}</span>
              </button>
            )}
          </div>

          {menuItems && menuItems.length > 0 && (
            <RowActionMenu items={menuItems} align="right" />
          )}
        </div>
      )}
    </div>
  );
};

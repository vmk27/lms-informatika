import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Search, Filter } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* 1. PAGE HEADER COMPONENT                                                  */
/* -------------------------------------------------------------------------- */
export interface PageHeaderProps {
  title: string;
  description?: string;
  badgeText?: string;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'neutral';
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badgeText,
  badgeVariant = 'primary',
  actions,
  children,
}) => {
  const badgeStyles = {
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs">
      <div className="space-y-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
            {title}
          </h1>
          {badgeText && (
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badgeStyles[badgeVariant]}`}
            >
              {badgeText}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
        {children}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 2. STAT CARD COMPONENT                                                    */
/* -------------------------------------------------------------------------- */
export interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: LucideIcon;
  iconColor?: 'blue' | 'emerald' | 'amber' | 'indigo' | 'rose';
  progressPct?: number;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  icon: Icon,
  iconColor = 'blue',
  progressPct,
  trend,
  onClick,
  className = '',
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      bar: 'bg-blue-600',
      border: 'hover:border-blue-300',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      bar: 'bg-emerald-600',
      border: 'hover:border-emerald-300',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      bar: 'bg-amber-600',
      border: 'hover:border-amber-300',
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      bar: 'bg-indigo-600',
      border: 'hover:border-indigo-300',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      bar: 'bg-rose-600',
      border: 'hover:border-rose-300',
    },
  };

  const scheme = colorMap[iconColor];

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-2xs transition-all ${
        onClick ? `cursor-pointer ${scheme.border} group hover:shadow-xs` : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-semibold">{label}</span>
        {Icon && (
          <div
            className={`w-7 h-7 rounded-lg ${scheme.bg} ${scheme.text} flex items-center justify-center shrink-0 transition-transform ${
              onClick ? 'group-hover:scale-110' : ''
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight tabular-nums">
          {value}
        </div>
        {trend && (
          <span
            className={`inline-flex items-center text-xs font-semibold ${
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend.isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            <span>{trend.value}</span>
          </span>
        )}
      </div>

      {progressPct !== undefined && (
        <div className="space-y-1 pt-1">
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${scheme.bar} transition-all duration-300`}
              style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
            />
          </div>
          {subValue && (
            <div className="text-[11px] text-slate-500 flex justify-between font-mono tabular-nums">
              <span>{subValue}</span>
              <span>{progressPct}%</span>
            </div>
          )}
        </div>
      )}

      {progressPct === undefined && subValue && (
        <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 truncate">
          {subValue}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 3. STATUS BADGE COMPONENT                                                 */
/* -------------------------------------------------------------------------- */
export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  icon?: LucideIcon;
  dot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon: Icon,
  dot = false,
  className = '',
}) => {
  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const dotColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
    neutral: 'bg-slate-400',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-[11px] px-2.5 py-0.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{children}</span>
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/* 4. EMPTY STATE COMPONENT                                                  */
/* -------------------------------------------------------------------------- */
export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon,
  actionText,
  onAction,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center space-y-3 shadow-2xs">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
      {actionText && onAction && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onAction}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            {actionText}
          </button>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 5. LOADING SKELETON COMPONENT                                             */
/* -------------------------------------------------------------------------- */
export const LoadingSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 4,
  className = '',
}) => {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="h-10 bg-slate-100 rounded-lg w-full" />
      ))}
    </div>
  );
};

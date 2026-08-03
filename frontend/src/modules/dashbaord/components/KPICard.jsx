import React from 'react';
import { Skeleton } from './Skeleton.jsx';

export default function KPICard({
  label,
  value,
  subLabel,
  secondary,
  icon: Icon,
  color = 'bg-[var(--accent-2)]',
  borderColor = null,
  loading = false,
  onClick = null,
}) {
  const safeValue = typeof value === 'number' ? value : Number(value) || 0;
  const safeSecondaryValue = typeof secondary === 'number' ? secondary : Number(secondary) || 0;

  if (loading) {
    return (
      <div className="p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
          </div>
          <div className={`w-12 h-12 rounded-xl ${color} opacity-50`} />
        </div>
        {subLabel && <Skeleton className="h-3 w-20" />}
      </div>
    );
  }

  const cardStyle = borderColor ? { borderColor } : {};

  return (
    <div
      onClick={onClick}
      className={`p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md transition-all ${onClick ? 'cursor-pointer' : ''}`}
      style={cardStyle}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-[var(--ink)]">
            {typeof safeValue === 'number' && safeValue >= 1000
              ? `Rs ${safeValue.toLocaleString()}`
              : safeValue}
          </p>
          {subLabel && (
            <p className="text-xs text-[var(--muted)] mt-1">{subLabel}</p>
          )}
          {secondary !== undefined && secondary !== null && (
            <div className="mt-1 space-y-0.5">
              {typeof secondary === 'object' ? (
                Object.entries(secondary).map(([key, val]) => (
                  <p key={key} className="text-xs text-[var(--muted)]">
                    {key}: {typeof val === 'number' && val >= 1000 ? `Rs ${val.toLocaleString()}` : val}
                  </p>
                ))
              ) : (
                <p className="text-xs text-[var(--muted)]">
                  {typeof safeSecondaryValue === 'number' && safeSecondaryValue >= 1000
                    ? `Rs ${safeSecondaryValue.toLocaleString()}`
                    : safeSecondaryValue}
                </p>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${color} shrink-0`}>
            <Icon size={20} className="text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

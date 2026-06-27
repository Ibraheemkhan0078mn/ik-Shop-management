import React from 'react';

export const Skeleton = ({ className = '', height = 'h-4', width = 'w-full' }) => {
  return (
    <div
      className={`animate-pulse bg-[var(--surface-muted)] rounded ${height} ${width} ${className}`}
      style={{ minWidth: '20px' }}
    />
  );
};

export const CardSkeleton = () => (
  <div className="p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="w-12 h-12 rounded-lg bg-[var(--surface-muted)]" />
    </div>
    <Skeleton className="h-3 w-20" />
  </div>
);

export const ChartSkeleton = ({ height = 300 }) => (
  <div className="p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm">
    <Skeleton className="h-5 w-32 mb-4" />
    <div style={{ height: `${height}px` }} className="flex items-center justify-center">
      <div className="w-full h-full bg-[var(--surface-muted)] rounded-lg animate-pulse" />
    </div>
  </div>
);

export default Skeleton;

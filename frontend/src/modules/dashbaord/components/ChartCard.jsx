import React from 'react';
import { Skeleton } from './Skeleton.jsx';
import { ChevronDown } from 'lucide-react';

const TIME_RANGE_OPTIONS = [
  { value: '7D', label: '7 Days' },
  { value: '30D', label: '30 Days' },
  { value: '90D', label: '90 Days' },
  { value: '1Y', label: '1 Year' },
  { value: 'All', label: 'All Time' },
];

export default function ChartCard({
  title,
  children,
  loading = false,
  height = 300,
  showFilter = true,
  defaultFilter = '30D',
  onFilterChange = null,
  emptyMessage = null,
  isEmpty = false,
  filterSlot = null,
}) {
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [selectedFilter, setSelectedFilter] = React.useState(defaultFilter);

  const handleFilterSelect = (value) => {
    setSelectedFilter(value);
    setFilterOpen(false);
    if (onFilterChange) {
      onFilterChange(value);
    }
  };

  if (loading) {
    return <ChartSkeleton height={height} />;
  }

  return (
    <div className="p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--ink)] font-display">{title}</h3>
        {showFilter && (
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--app-bg)] border border-[var(--border)] rounded-lg hover:border-[var(--accent-2)] transition-colors"
            >
              {TIME_RANGE_OPTIONS.find(opt => opt.value === selectedFilter)?.label || '30 Days'}
              <ChevronDown size={14} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
            </button>
            {filterOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg z-10 overflow-hidden">
                {TIME_RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterSelect(option.value)}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                      selectedFilter === option.value
                        ? 'bg-[var(--accent-2)]/10 text-[var(--accent-2)]'
                        : 'hover:bg-[var(--app-bg)] text-[var(--ink)]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {filterSlot}
      </div>
      <div style={{ height: `${height}px` }} className="relative">
        {isEmpty ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-[var(--muted)]">{emptyMessage || 'No data for this period'}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export const ChartSkeleton = ({ height = 300 }) => (
  <div className="p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm">
    <Skeleton className="h-5 w-32 mb-4" />
    <div style={{ height: `${height}px` }} className="flex items-center justify-center">
      <div className="w-full h-full bg-[var(--surface-muted)] rounded-lg animate-pulse" />
    </div>
  </div>
);

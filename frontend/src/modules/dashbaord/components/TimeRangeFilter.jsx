import React from 'react';
import { ChevronDown, Calendar } from 'lucide-react';

const TIME_RANGE_OPTIONS = [
  { value: 'Today', label: 'Today' },
  { value: '3D', label: '3 Days' },
  { value: '7D', label: '7 Days' },
  { value: '30D', label: '30 Days' },
  { value: '3M', label: '3 Months' },
  { value: '90D', label: '90 Days' },
  { value: '1Y', label: '1 Year' },
  { value: 'All', label: 'All Time' },
  { value: 'Custom', label: 'Custom Range' },
];

export default function TimeRangeFilter({
  value = '30D',
  onChange,
  size = 'default',
  disabled = false,
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showCustomPicker, setShowCustomPicker] = React.useState(false);
  const [customStartDate, setCustomStartDate] = React.useState('');
  const [customEndDate, setCustomEndDate] = React.useState('');

  const handleSelect = (optionValue) => {
    setIsOpen(false);
    if (optionValue === 'Custom') {
      setShowCustomPicker(true);
    } else if (onChange) {
      onChange(optionValue);
    }
  };

  const handleCustomApply = () => {
    if (customStartDate && customEndDate && onChange) {
      onChange({ type: 'custom', startDate: customStartDate, endDate: customEndDate });
    }
    setShowCustomPicker(false);
  };

  const selectedOption = TIME_RANGE_OPTIONS.find(opt => opt.value === value) || TIME_RANGE_OPTIONS[3];
  
  // Display custom range if selected
  const displayLabel = typeof value === 'object' && value.type === 'custom' 
    ? `${new Date(value.startDate).toLocaleDateString()} - ${new Date(value.endDate).toLocaleDateString()}`
    : selectedOption.label;

  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    default: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base',
  };

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 ${sizeClasses[size]} bg-[var(--app-bg)] border border-[var(--border)] rounded-lg hover:border-[var(--accent-2)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span>{displayLabel}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-40 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg z-20 overflow-hidden">
            {TIME_RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  (value === option.value || (typeof value === 'object' && value.type === 'custom' && option.value === 'Custom'))
                    ? 'bg-[var(--accent-2)]/10 text-[var(--accent-2)] font-medium'
                    : 'hover:bg-[var(--app-bg)] text-[var(--ink)]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Custom Date Picker Modal */}
      {showCustomPicker && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/50"
            onClick={() => setShowCustomPicker(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg z-40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={16} className="text-[var(--muted)]" />
              <h3 className="text-sm font-semibold text-[var(--ink)]">Custom Date Range</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--app-bg)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--app-bg)]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowCustomPicker(false)}
                  className="flex-1 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--app-bg)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCustomApply}
                  disabled={!customStartDate || !customEndDate}
                  className="flex-1 px-3 py-1.5 text-sm bg-[var(--accent-2)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

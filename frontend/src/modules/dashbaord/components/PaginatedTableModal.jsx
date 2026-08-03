import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PaginatedTableModal({
  isOpen,
  onClose,
  title,
  columns,
  data,
  loading = false,
  pagination = null,
  onPageChange = null,
  rowColors = null,
  emptyMessage = 'No data available',
  filterSlot = null,
}) {
  const [currentPage, setCurrentPage] = useState(1);

  if (!isOpen) return null;

  const totalPages = pagination?.totalPages || 1;
  const currentData = data || [];
  const safeCurrentPage = pagination?.page || currentPage;

  const handlePrevPage = () => {
    const newPage = Math.max(1, safeCurrentPage - 1);
    setCurrentPage(newPage);
    if (onPageChange) onPageChange(newPage);
  };

  const handleNextPage = () => {
    const newPage = Math.min(totalPages, safeCurrentPage + 1);
    setCurrentPage(newPage);
    if (onPageChange) onPageChange(newPage);
  };

  const getRowStyle = (row, index) => {
    if (rowColors && typeof rowColors === 'function') {
      return rowColors(row, index);
    }
    return {};
  };

  const getRowClassName = (row, index) => {
    if (rowColors && typeof rowColors === 'function') {
      const style = rowColors(row, index);
      if (style.borderColor) {
        return `border-l-4 ${style.borderColor}`;
      }
    }
    return '';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[var(--surface)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--ink)]">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--app-bg)] transition-colors"
            >
              <X size={20} className="text-[var(--muted)]" />
            </button>
          </div>

          {/* Filter Slot */}
          {filterSlot && (
            <div className="p-4 border-b border-[var(--border)]">
              {filterSlot}
            </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="p-8 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[var(--accent-2)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : currentData.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-[var(--muted)]">{emptyMessage}</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-[var(--surface-muted)] sticky top-0">
                  <tr>
                    {columns.map((col, index) => (
                      <th
                        key={index}
                        className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider"
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={`border-b border-[var(--border)] hover:bg-[var(--app-bg)] transition-colors ${getRowClassName(row, rowIndex)}`}
                      style={getRowStyle(row, rowIndex)}
                    >
                      {columns.map((col, colIndex) => (
                        <td
                          key={colIndex}
                          className="px-4 py-3 text-sm text-[var(--ink)]"
                        >
                          {col.render ? col.render(row, rowIndex) : row[col.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {pagination?.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-[var(--border)]">
              <span className="text-xs text-[var(--muted)]">
                Page {safeCurrentPage} of {totalPages} ({pagination?.total} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={safeCurrentPage <= 1}
                  className="p-2 rounded-lg border border-[var(--border)] hover:border-[var(--accent-2)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-medium text-[var(--ink)] px-2">
                  {safeCurrentPage}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={safeCurrentPage >= totalPages}
                  className="p-2 rounded-lg border border-[var(--border)] hover:border-[var(--accent-2)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

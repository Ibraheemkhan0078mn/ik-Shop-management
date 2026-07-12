import React from "react";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

/**
 * KPI Card Component - Simple read-only card displaying single metric
 * No dropdowns, just big bold numbers
 */
export function KpiCard({ label, value, icon: Icon, color, description, isCurrency = true }) {
    return (
        <div className="rounded-xl border shadow-sm p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 mb-3">
                <Icon size={20} style={{ color }} />
                <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>{label}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>
                {isCurrency ? `Rs ${value?.toLocaleString() || 0}` : (value?.toLocaleString() || 0)}
            </p>
            {description && (
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{description}</p>
            )}
        </div>
    );
}

/**
 * Breakdown Item - Row in breakdown table showing label, count, value, percentage
 */
export function BreakdownItem({ label, value, count, percentage, color }) {
    return (
        <div className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
            <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{label}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{count} transactions</p>
            </div>
            <div className="text-right">
                <p className="text-sm font-bold" style={{ color }}>Rs {value?.toLocaleString() || 0}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{percentage}%</p>
            </div>
        </div>
    );
}

/**
 * Transaction Table Component
 */
export function TransactionTable({ transactions, type }) {
    if (!transactions || transactions.length === 0) {
        return <p className="text-sm py-4 text-center" style={{ color: 'var(--muted)' }}>No transactions in this period.</p>;
    }

    return (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead style={{ background: 'var(--surface-muted)' }}>
                        <tr>
                            {getTableHeaders(type).map((header, idx) => (
                                <th key={idx} className="px-4 py-2 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                        {transactions.slice(0, 50).map((transaction, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                {renderTransactionRow(transaction, type)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {transactions.length > 50 && (
                <div className="px-4 py-2 text-xs text-center" style={{ color: 'var(--muted)' }}>
                    Showing first 50 of {transactions.length} transactions
                </div>
            )}
        </div>
    );
}

/**
 * Source Section - Expandable section with KPI header and detailed content
 */
export function SourceSection({ 
    title, 
    icon: Icon, 
    color, 
    kpiValue, 
    kpiDescription, 
    count, 
    breakdown, 
    breakdownLabelKey, 
    transactions, 
    transactionType, 
    isExpanded, 
    onToggle, 
    extraBreakdown 
}) {
    return (
        <div className="rounded-xl border shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-5 text-left"
            >
                <div className="flex items-center gap-3">
                    <Icon size={22} style={{ color }} />
                    <div>
                        <h3 className="text-md font-semibold" style={{ color: 'var(--ink)' }}>{title}</h3>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>{kpiDescription} • {count} transactions</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <p className="text-xl font-bold" style={{ color }}>Rs {kpiValue?.toLocaleString() || 0}</p>
                    {isExpanded ? <ChevronUp size={20} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={20} style={{ color: 'var(--muted)' }} />}
                </div>
            </button>

            {isExpanded && (
                <div className="px-5 pb-5 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                    {breakdown && breakdown.length > 0 && (
                        <div className="mb-4">
                            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--ink)' }}>Breakdown</p>
                            <div className="space-y-1">
                                {breakdown.map((item, idx) => (
                                    <BreakdownItem
                                        key={idx}
                                        label={item[breakdownLabelKey] || item.label || item.method || item.category || item.reason || item.supplierName || item.staffName || '-'}
                                        value={item.total || item.value || 0}
                                        count={item.count || 0}
                                        percentage={item.percentage || 0}
                                        color={color}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    {extraBreakdown}
                    {transactions && transactions.length > 0 && (
                        <div>
                            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--ink)' }}>Transactions</p>
                            <TransactionTable transactions={transactions} type={transactionType} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Render transaction row based on type
 */
export function renderTransactionRow(transaction, type) {
    switch (type) {
        case 'sales':
            return (
                <>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.orderNumber}</td>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.customerName || 'N/A'}</td>
                    <td className="px-4 py-2 text-sm capitalize" style={{ color: 'var(--ink)' }}>{transaction.paymentMethod}</td>
                    <td className="px-4 py-2 text-sm font-medium text-right" style={{ color: '#10b981' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        case 'purchases':
            return (
                <>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.invoiceNumber}</td>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.supplierName || 'N/A'}</td>
                    <td className="px-4 py-2 text-sm font-medium text-right" style={{ color: '#3b82f6' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        case 'expenses':
            return (
                <>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.title}</td>
                    <td className="px-4 py-2 text-sm capitalize" style={{ color: 'var(--ink)' }}>{transaction.category}</td>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--muted)' }}>{transaction.description || '-'}</td>
                    <td className="px-4 py-2 text-sm font-medium text-right" style={{ color: '#ef4444' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        case 'wastages':
            return (
                <>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.productName}</td>
                    <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--ink)' }}>{transaction.quantity}</td>
                    <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--ink)' }}>Rs {transaction.costPrice?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2 text-sm font-medium text-right" style={{ color: '#dc2626' }}>Rs {transaction.totalLoss?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        case 'purchaseReturns':
            return (
                <>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.returnNumber}</td>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.supplierName || 'N/A'}</td>
                    <td className="px-4 py-2 text-sm font-medium text-right" style={{ color: '#06b6d4' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        case 'productReturns':
            return (
                <>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.returnNumber}</td>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.customerName || 'N/A'}</td>
                    <td className="px-4 py-2 text-sm font-medium text-right" style={{ color: '#f59e0b' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        case 'salaryPayments':
            return (
                <>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.staffName}</td>
                    <td className="px-4 py-2 text-sm font-medium text-right" style={{ color: '#8b5cf6' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        default:
            return null;
    }
}

/**
 * Get table headers based on transaction type
 */
export function getTableHeaders(type) {
    switch (type) {
        case 'sales': return ['Order #', 'Customer', 'Payment Method', 'Amount', 'Date'];
        case 'purchases': return ['Invoice #', 'Supplier', 'Amount', 'Date'];
        case 'expenses': return ['Title', 'Category', 'Description', 'Amount', 'Date'];
        case 'wastages': return ['Product', 'Quantity', 'Cost Price', 'Total Loss', 'Date'];
        case 'purchaseReturns': return ['Return #', 'Supplier', 'Amount', 'Date'];
        case 'productReturns': return ['Return #', 'Customer', 'Amount', 'Date'];
        case 'salaryPayments': return ['Staff Name', 'Amount', 'Date'];
        default: return [];
    }
}

/**
 * Period Filter Bar Component
 */
export function PeriodFilterBar({ 
    period, 
    onPeriodChange, 
    fromDate, 
    toDate, 
    onFromDateChange, 
    onToDateChange,
    onRefresh,
    onExpandAll,
    onCollapseAll,
    showExpandCollapse = true
}) {
    const PERIOD_OPTIONS = [
        { value: "today", label: "Today" },
        { value: "yesterday", label: "Yesterday" },
        { value: "week", label: "This Week" },
        { value: "month", label: "This Month" },
        { value: "custom", label: "Custom Range" },
    ];

    return (
        <div className="rounded-xl border shadow-sm mb-6 no-print" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between p-4 flex-wrap gap-3">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex gap-2 flex-wrap">
                        {PERIOD_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => onPeriodChange(opt.value)}
                                className="px-4 py-2 rounded-lg transition"
                                style={{
                                    background: period === opt.value ? 'var(--accent-2)' : 'var(--surface-muted)',
                                    color: period === opt.value ? 'white' : 'var(--ink)'
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
                {showExpandCollapse && (
                    <div className="flex gap-2">
                        <button
                            onClick={onExpandAll}
                            className="px-3 py-1 text-sm rounded border transition"
                            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
                        >
                            Expand All
                        </button>
                        <button
                            onClick={onCollapseAll}
                            className="px-3 py-1 text-sm rounded border transition"
                            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
                        >
                            Collapse All
                        </button>
                    </div>
                )}
            </div>
            {period === "custom" && (
                <div className="flex gap-2 px-4 pb-4">
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => onFromDateChange(e.target.value)}
                        className="px-3 py-2 rounded-lg border"
                        style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--ink)' }}
                    />
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => onToDateChange(e.target.value)}
                        className="px-3 py-2 rounded-lg border"
                        style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--ink)' }}
                    />
                </div>
            )}
        </div>
    );
}

/**
 * Loading Spinner Component
 */
export function LoadingSpinner() {
    return (
        <div className="rounded-xl border shadow-sm flex items-center justify-center p-12" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <RefreshCw className="animate-spin" size={40} style={{ color: 'var(--accent-2)' }} />
        </div>
    );
}

/**
 * Summary Card Component
 */
export function SummaryCard({ icon: Icon, label, value, description, isCurrency = true, color = 'var(--ink)' }) {
    return (
        <div className="rounded-xl border shadow-sm p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3 mb-2">
                {Icon && <Icon size={18} style={{ color: 'var(--muted)' }} />}
                <span className="text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>{label}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color }}>
                {isCurrency ? `Rs ${value?.toLocaleString() || 0}` : (value?.toLocaleString() || 0)}
            </p>
            {description && (
                <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>{description}</p>
            )}
        </div>
    );
}

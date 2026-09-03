import React, { useState, useMemo } from "react";
import { RefreshCw, ChevronDown, DollarSign, ShoppingCart, Package, Wallet, HandCoins, Calendar, TrendingUp } from "lucide-react";
import { useGetSalesReportQuery } from "../services/reports.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PdfModal from "../../../shared/components/PdfModal.jsx";
import SalesKPIReportPdfTemplate from "../components/SalesKPIReportPdfTemplate.jsx";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getReportsLabels } from "../labels/reportsLabels.js";

// ---------- Breakdown row ----------
function BreakdownItem({ label, value, count, percentage, color }) {
    return (
        <div className="flex items-center justify-between py-2.5 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
            <div className="flex-1 min-w-0 flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>{label}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{count} transactions</p>
                </div>
            </div>
            <div className="text-right shrink-0 pl-3">
                <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--ink)' }}>Rs {value?.toLocaleString() || 0}</p>
                <p className="text-xs" style={{ color }}>{percentage}%</p>
            </div>
        </div>
    );
}

// ---------- Transaction table renderer ----------
function renderTransactionRow(transaction, type, formatDate, onExpandOrder) {
    switch (type) {
        case 'sales':
            return (
                <>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>
                        <button 
                            onClick={() => onExpandOrder && onExpandOrder(transaction)}
                            className="text-left hover:underline flex items-center gap-1"
                        >
                            {transaction.orderNumber}
                            <ChevronDown size={14} style={{ color: 'var(--muted)' }} />
                        </button>
                    </td>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>{transaction.customerName || 'Walk-in'}</td>
                    <td className="px-4 py-2.5 text-sm capitalize" style={{ color: 'var(--muted)' }}>{transaction.paymentMethod}</td>
                    <td className="px-4 py-2.5 text-sm text-right tabular-nums" style={{ color: 'var(--muted)' }}>Rs {transaction.totalCostPrice?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 text-sm text-right tabular-nums" style={{ color: 'var(--ink)' }}>Rs {transaction.totalSalePrice?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 text-sm font-semibold text-right tabular-nums" style={{ color: 'var(--accent-2)' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 text-sm font-semibold text-right tabular-nums" style={{ color: transaction.orderProfit >= 0 ? '#10b981' : '#dc2626' }}>
                        Rs {transaction.orderProfit?.toLocaleString() || 0}
                        <div className="text-xs mt-0.5">({transaction.orderMargin}%)</div>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-right" style={{ color: 'var(--muted)' }}>{formatDate(transaction.date)}</td>
                </>
            );
        default:
            return null;
    }
}

function getTableHeaders(type, labels) {
    switch (type) {
        case 'sales': return [labels.orderNumber, labels.customer, labels.paymentMethod, 'Effective Cost', 'Total Sale', labels.amount, 'Profit (Margin)', labels.date];
        default: return [];
    }
}

const MAX_TRANSACTIONS_DISPLAY = 50;

function TransactionTable({ transactions, type, labels }) {
    const [expandedOrderId, setExpandedOrderId] = React.useState(null);

    if (!transactions || transactions.length === 0) {
        return <p className="text-sm py-6 text-center" style={{ color: 'var(--muted)' }}>{labels.noTransactionsInPeriod}</p>;
    }

    const formatDate = (dateStr) => {
        try {
            return new Date(dateStr).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    const handleExpandOrder = (transaction) => {
        if (type === 'sales' && transaction.items && transaction.items.length > 0) {
            setExpandedOrderId(expandedOrderId === transaction.id ? null : transaction.id);
        }
    };

    const displayTransactions = transactions.slice(0, MAX_TRANSACTIONS_DISPLAY);

    return (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <div className="overflow-x-auto">
                <table className="w-full" role="table" aria-label={`${type} transactions`}>
                    <thead style={{ background: 'var(--surface-muted)' }}>
                        <tr>
                            {getTableHeaders(type, labels).map((header, idx) => (
                                <th key={idx} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                        {displayTransactions.map((transaction, idx) => (
                            <React.Fragment key={idx}>
                                <tr className="transition-colors" style={{ background: 'transparent' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-muted)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                    {renderTransactionRow(transaction, type, formatDate, handleExpandOrder)}
                                </tr>
                                {type === 'sales' && expandedOrderId === transaction.id && transaction.items && (
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <td colSpan={getTableHeaders(type, labels).length} className="px-4 py-4">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                                                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Order Details</p>
                                                    <div className="flex gap-4 text-xs" style={{ color: 'var(--muted)' }}>
                                                        <span>Type: <strong style={{ color: 'var(--ink)' }}>{transaction.orderType}</strong></span>
                                                        <span>Status: <strong style={{ color: 'var(--ink)' }}>{transaction.status}</strong></span>
                                                        {transaction.waiter && <span>Waiter: <strong style={{ color: 'var(--ink)' }}>{transaction.waiter}</strong></span>}
                                                    </div>
                                                </div>
                                                <div className="rounded border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                                                    <table className="w-full text-sm">
                                                        <thead style={{ background: 'var(--app-bg)' }}>
                                                            <tr>
                                                                <th className="px-3 py-2 text-left text-xs font-semibold" style={{ color: 'var(--muted)' }}>Product</th>
                                                                <th className="px-3 py-2 text-left text-xs font-semibold" style={{ color: 'var(--muted)' }}>Batch</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Qty</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Purchase Cost</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Sale/Unit</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Sale Discount</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Sale Tax</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Item Total</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Profit</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                                            {transaction.items.map((item, itemIdx) => (
                                                                <tr key={itemIdx}>
                                                                    <td className="px-3 py-2" style={{ color: 'var(--ink)' }}>
                                                                        <div>{item.productName}</div>
                                                                        {item.portionType !== 'full' && (
                                                                            <div className="text-xs capitalize" style={{ color: 'var(--muted)' }}>({item.portionType})</div>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-xs" style={{ color: 'var(--muted)' }}>{item.batchNumber || 'N/A'}</td>
                                                                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--ink)' }}>{item.quantity}</td>
                                                                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--muted)' }}>
                                                                        <div className="space-y-0.5">
                                                                            <div>Rs {item.costPrice?.toLocaleString() || 0}</div>
                                                                            <div className="text-xs" style={{ color: 'var(--muted)' }}>
                                                                                Base: {item.basePurchasePrice?.toLocaleString() || 0}
                                                                                {item.purchaseDiscount > 0 && (
                                                                                    <div style={{ color: '#f59e0b' }}>-Disc: {item.purchaseDiscount?.toLocaleString()}</div>
                                                                                )}
                                                                                {item.purchaseTax > 0 && (
                                                                                    <div style={{ color: '#8b5cf6' }}>+Tax: {item.purchaseTax?.toLocaleString()}</div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--ink)' }}>
                                                                        Rs {item.unitPrice?.toLocaleString() || 0}
                                                                        <div className="text-xs mt-0.5" style={{ color: 'var(--accent-2)' }}>
                                                                            (Total: {item.itemSaleTotal?.toLocaleString()})
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right tabular-nums text-xs" style={{ color: '#f59e0b' }}>
                                                                        {item.discountAmount > 0 ? (
                                                                            <>
                                                                                <div>Rs {item.discountAmount.toLocaleString()}</div>
                                                                                <div className="mt-0.5">({item.discountPercent}%)</div>
                                                                            </>
                                                                        ) : '-'}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right tabular-nums text-xs" style={{ color: '#8b5cf6' }}>
                                                                        {item.taxAmount > 0 ? (
                                                                            <>
                                                                                <div>Rs {item.taxAmount.toLocaleString()}</div>
                                                                                <div className="mt-0.5">({item.taxPercent}%)</div>
                                                                            </>
                                                                        ) : '-'}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right tabular-nums font-semibold" style={{ color: 'var(--accent-2)' }}>
                                                                        Rs {item.itemTotal?.toLocaleString() || 0}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right tabular-nums font-semibold" style={{ color: item.itemProfit >= 0 ? '#10b981' : '#dc2626' }}>
                                                                        Rs {item.itemProfit?.toLocaleString() || 0}
                                                                        <div className="text-xs mt-0.5">({item.itemMargin}%)</div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot style={{ background: 'var(--surface-muted)', borderTop: '2px solid var(--border)' }}>
                                                            <tr className="font-semibold">
                                                                <td colSpan="3" className="px-3 py-2 text-right" style={{ color: 'var(--ink)' }}>Order Totals:</td>
                                                                <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--muted)' }}>Rs {transaction.totalCostPrice?.toLocaleString() || 0}</td>
                                                                <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--ink)' }}>Rs {transaction.totalSalePrice?.toLocaleString() || 0}</td>
                                                                <td className="px-3 py-2 text-right tabular-nums" style={{ color: '#f59e0b' }}>Rs {transaction.totalItemDiscounts?.toLocaleString() || 0}</td>
                                                                <td className="px-3 py-2 text-right tabular-nums" style={{ color: '#8b5cf6' }}>Rs {transaction.totalItemTaxes?.toLocaleString() || 0}</td>
                                                                <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--accent-2)' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                                                                <td className="px-3 py-2 text-right tabular-nums" style={{ color: transaction.orderProfit >= 0 ? '#10b981' : '#dc2626' }}>
                                                                    Rs {transaction.orderProfit?.toLocaleString() || 0}
                                                                    <div className="text-xs mt-0.5">({transaction.orderMargin}%)</div>
                                                                </td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                                {transaction.note && (
                                                    <div className="mt-2 p-2 rounded" style={{ background: 'var(--app-bg)' }}>
                                                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Note:</p>
                                                        <p className="text-sm" style={{ color: 'var(--ink)' }}>{transaction.note}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            {transactions.length > MAX_TRANSACTIONS_DISPLAY && (
                <div className="px-4 py-2.5 text-xs text-center border-t" style={{ color: 'var(--muted)', borderColor: 'var(--border)', background: 'var(--surface-muted)' }}>
                    Showing first {MAX_TRANSACTIONS_DISPLAY} of {transactions.length} transactions
                </div>
            )}
        </div>
    );
}

const COLORS = {
    sales: '#10b981',
    purchases: '#3b82f6',
    expenses: '#ef4444',
    salaries: '#8b5cf6',
    wastage: '#dc2626',
    purchaseReturns: '#06b6d4',
    productReturns: '#f59e0b',
    qarza: '#0f766e',
    qarzaPayable: '#7c3aed',
    profit: '#10b981',
    loss: '#dc2626'
};

export default function SalesKPIReport() {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getReportsLabels(language);
    const [period, setPeriod] = useState("all");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [orderId, setOrderId] = useState("");
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const limit = 100;

    const PERIOD_OPTIONS = useMemo(() => [
        { value: "all", label: "All time" },
        { value: "today", label: labels.today },
        { value: "month", label: labels.thisMonth },
        { value: "3month", label: labels.last3Months },
        { value: "year", label: labels.thisYear },
        { value: "custom", label: labels.customRange },
    ], [labels]);

    const filters = useMemo(() => ({ 
        period,
        fromDate: period === "custom" ? fromDate : undefined,
        toDate: period === "custom" ? toDate : undefined,
        orderId: orderId || undefined,
        page,
        limit
    }), [period, fromDate, toDate, orderId, page]);

    const { data, isLoading, isFetching, error, refetch } = useGetSalesReportQuery(filters);

    if (error) {
        showError(error?.data?.message || "Failed to load sales report");
    }

    const handleRefresh = () => refetch();

    const summary = data?.summary || {};
    const breakdowns = data?.breakdowns || {};
    const sales = data?.data || [];
    const total = data?.total || 0;
    const totalPages = Math.max(1, data?.totalPages || Math.ceil(total / limit));

    const showLoader = isLoading || isFetching;

    return (
        <div className="p-6 min-h-screen" style={{ background: 'var(--app-bg)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--ink)' }}>{labels.salesReport}</h1>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>{labels.salesDataFor}</p>
                </div>
                <div className="flex gap-2 no-print">
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 rounded-xl border transition-colors flex items-center gap-2"
                        style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--ink)' }}
                    >
                        <RefreshCw size={16} className={showLoader ? "animate-spin" : ""} style={{ color: 'var(--accent-2)' }} />
                        {labels.refresh}
                    </button>
                    <button
                        onClick={() => setIsPdfModalOpen(true)}
                        className="px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90 flex items-center gap-2"
                        style={{ background: 'var(--accent-2)' }}
                    >
                        {labels.exportPdf}
                    </button>
                </div>
            </div>

            {/* Date filter — redesigned as a single unified bar with pill segmented control */}
            <div
                className="rounded-2xl border p-4 mb-6 no-print"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 shrink-0" style={{ color: 'var(--muted)' }}>
                            <Calendar size={16} style={{ color: 'var(--accent-2)' }} />
                            <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{labels.periodFilter}</span>
                        </div>
                        <div className="flex gap-1 p-1 rounded-xl flex-wrap" style={{ background: 'var(--app-bg)' }}>
                            {PERIOD_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setPeriod(opt.value)}
                                    className="px-3.5 py-1.5 text-sm rounded-lg font-medium transition-all"
                                    style={{
                                        background: period === opt.value ? 'var(--accent-2)' : 'transparent',
                                        color: period === opt.value ? 'white' : 'var(--muted)'
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                {period === "custom" && (
                    <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                            style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }}
                        />
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                            style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }}
                        />
                    </div>
                )}
                <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex-1">
                        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>Order ID or Order Number</label>
                        <input
                            type="text"
                            placeholder="Enter order ID or order number..."
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                            style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }}
                        />
                    </div>
                </div>
            </div>

            {showLoader ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 rounded-full" style={{ borderColor: 'var(--accent-2)' }}></div>
                </div>
            ) : (
                <div>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg p-2" style={{ background: `${COLORS.sales}17` }}>
                                    <ShoppingCart size={18} style={{ color: COLORS.sales }} />
                                </div>
                                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Total Sales</p>
                            </div>
                            <p className="text-2xl font-bold tabular-nums mt-2" style={{ color: 'var(--ink)' }}>
                                Rs {(summary.totalSales || 0).toLocaleString()}
                            </p>
                            <p className="text-xs mt-1" style={{ color: COLORS.sales }}>Profit: Rs {(summary.grossProfit || 0).toLocaleString()} ({summary.grossMarginPercentage || 0}%)</p>
                        </div>

                        <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg p-2" style={{ background: `${COLORS.sales}17` }}>
                                    <DollarSign size={18} style={{ color: COLORS.sales }} />
                                </div>
                                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Gross Profit</p>
                            </div>
                            <p className="text-2xl font-bold tabular-nums mt-2" style={{ color: 'var(--ink)' }}>
                                Rs {(summary.grossProfit || 0).toLocaleString()}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Margin: {summary.grossMarginPercentage || 0}%</p>
                        </div>

                        <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg p-2" style={{ background: `${COLORS.sales}17` }}>
                                    <Package size={18} style={{ color: COLORS.sales }} />
                                </div>
                                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Orders</p>
                            </div>
                            <p className="text-2xl font-bold tabular-nums mt-2" style={{ color: 'var(--ink)' }}>
                                {summary.salesCount || 0}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Avg: Rs {(summary.avgOrderValue || 0).toFixed(0).toLocaleString()}</p>
                        </div>

                        <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg p-2" style={{ background: `${COLORS.sales}17` }}>
                                    <TrendingUp size={18} style={{ color: COLORS.sales }} />
                                </div>
                                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>COGS</p>
                            </div>
                            <p className="text-2xl font-bold tabular-nums mt-2" style={{ color: 'var(--ink)' }}>
                                Rs {(summary.totalCostOfGoodsSold || 0).toLocaleString()}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Cost of goods sold</p>
                        </div>

                        <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg p-2" style={{ background: `${COLORS.sales}17` }}>
                                    <Wallet size={18} style={{ color: COLORS.sales }} />
                                </div>
                                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Discount</p>
                            </div>
                            <p className="text-2xl font-bold tabular-nums mt-2" style={{ color: 'var(--ink)' }}>
                                Rs {(summary.totalDiscount || 0).toLocaleString()}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Total discounts</p>
                        </div>
                    </div>

                    {/* Sales Breakdown */}
                    <div className="rounded-2xl border overflow-hidden mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl p-2.5" style={{ background: 'var(--surface-muted)' }}>
                                    <HandCoins size={20} style={{ color: COLORS.sales }} />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold" style={{ color: 'var(--ink)' }}>Sales by Payment Method</h3>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Breakdown of sales transactions</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-5">
                            {breakdowns.salesByPaymentMethod && breakdowns.salesByPaymentMethod.length > 0 ? (
                                <div className="space-y-0">
                                    {breakdowns.salesByPaymentMethod.map((item, idx) => (
                                        <BreakdownItem 
                                            key={idx} 
                                            label={item.method} 
                                            value={item.total} 
                                            count={item.count} 
                                            percentage={item.percentage} 
                                            color={COLORS.sales} 
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm py-4 text-center" style={{ color: 'var(--muted)' }}>No payment method data available</p>
                            )}
                        </div>
                    </div>

                    {/* Sales Transactions */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>Sales Transactions</h2>
                        <TransactionTable transactions={sales} type="sales" labels={labels} />
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)' }}>
                            <span className="text-xs" style={{ color: 'var(--muted)' }}>{total ? `${(page - 1) * limit + 1}-${Math.min(page * limit, total)} of ${total} transactions` : "0 transactions"}</span>
                            <div className="flex items-center gap-2">
                                <button disabled={page === 1} onClick={() => setPage(value => value - 1)} className="px-3 py-1.5 text-xs rounded border disabled:opacity-40" style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--muted)' }}>Previous</button>
                                <span className="text-xs" style={{ color: 'var(--muted)' }}>Page {page} of {totalPages}</span>
                                <button disabled={page === totalPages} onClick={() => setPage(value => value + 1)} className="px-3 py-1.5 text-xs rounded border disabled:opacity-40" style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--muted)' }}>Next</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* PDF Modal */}
            {isPdfModalOpen && (
                <PdfModal
                    isOpen={isPdfModalOpen}
                    onClose={() => setIsPdfModalOpen(false)}
                    fileName={`${labels.salesReport}.pdf`}
                    labels={labels}
                >
                    <SalesKPIReportPdfTemplate
                        summary={summary}
                        sales={sales}
                        labels={labels}
                        selectedPeriodLabel={period === "custom" ? `${fromDate} to ${toDate}` : period}
                    />
                </PdfModal>
            )}
        </div>
    );
}
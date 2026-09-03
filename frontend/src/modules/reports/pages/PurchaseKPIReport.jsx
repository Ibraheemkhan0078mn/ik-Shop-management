import React, { useState, useMemo } from "react";
import { RefreshCw, ChevronDown, DollarSign, Package, Wallet, Calendar, TrendingUp, Truck, AlertCircle } from "lucide-react";
import { useGetPurchaseReportQuery } from "../services/reports.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PdfModal from "../../../shared/components/PdfModal.jsx";
import PurchaseKPIReportPdfTemplate from "../components/PurchaseKPIReportPdfTemplate.jsx";
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
function renderPurchaseTransactionRow(transaction, formatDate, onExpandPurchase) {
    return (
        <>
            <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>
                <button 
                    onClick={() => onExpandPurchase && onExpandPurchase(transaction)}
                    className="text-left hover:underline flex items-center gap-1"
                >
                    {transaction.invoiceNumber}
                    <ChevronDown size={14} style={{ color: 'var(--muted)' }} />
                </button>
            </td>
            <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>{transaction.supplier?.name || 'Unknown'}</td>
            <td className="px-4 py-2.5 text-sm capitalize" style={{ color: 'var(--muted)' }}>{transaction.status || 'pending'}</td>
            <td className="px-4 py-2.5 text-sm capitalize" style={{ color: 'var(--muted)' }}>{transaction.paymentStatus || 'unpaid'}</td>
            <td className="px-4 py-2.5 text-sm text-right tabular-nums" style={{ color: 'var(--ink)' }}>Rs {transaction.totalAmount?.toLocaleString() || 0}</td>
            <td className="px-4 py-2.5 text-sm text-right tabular-nums" style={{ color: transaction.paidAmount > 0 ? '#10b981' : '#dc2626' }}>Rs {transaction.paidAmount?.toLocaleString() || 0}</td>
            <td className="px-4 py-2.5 text-sm text-right tabular-nums font-semibold" style={{ color: '#dc2626' }}>Rs {((transaction.totalAmount || 0) - (transaction.paidAmount || 0)).toLocaleString() || 0}</td>
            <td className="px-4 py-2.5 text-sm text-right" style={{ color: 'var(--muted)' }}>{formatDate(transaction.date || transaction.createdAt)}</td>
        </>
    );
}

function PurchaseTransactionTable({ purchases = [], labels }) {
    const [expandedPurchaseId, setExpandedPurchaseId] = useState(null);

    if (!purchases || purchases.length === 0) {
        return <p className="text-sm py-6 text-center" style={{ color: 'var(--muted)' }}>No purchase records in this period</p>;
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

    const handleExpandPurchase = (purchase) => {
        setExpandedPurchaseId(expandedPurchaseId === purchase._id ? null : purchase._id);
    };

    const displayPurchases = purchases.slice(0, 50);

    return (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <div className="overflow-x-auto">
                <table className="w-full" role="table" aria-label="purchase transactions">
                    <thead style={{ background: 'var(--surface-muted)' }}>
                        <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Invoice</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Supplier</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Status</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Payment</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Total Amount</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Paid</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Due</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                        {displayPurchases.map((purchase, idx) => (
                            <React.Fragment key={idx}>
                                <tr className="transition-colors" style={{ background: 'transparent' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-muted)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                    {renderPurchaseTransactionRow(purchase, formatDate, handleExpandPurchase)}
                                </tr>
                                {expandedPurchaseId === purchase._id && purchase.items && (
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <td colSpan="8" className="px-4 py-4">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                                                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Purchase Details</p>
                                                    <div className="flex gap-4 text-xs" style={{ color: 'var(--muted)' }}>
                                                        <span>Supplier: <strong style={{ color: 'var(--ink)' }}>{purchase.supplierName}</strong></span>
                                                        <span>Status: <strong style={{ color: 'var(--ink)' }}>{purchase.status}</strong></span>
                                                    </div>
                                                </div>
                                                <div className="rounded border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                                                    <table className="w-full text-sm">
                                                        <thead style={{ background: 'var(--app-bg)' }}>
                                                            <tr>
                                                                <th className="px-3 py-2 text-left text-xs font-semibold" style={{ color: 'var(--muted)' }}>Product</th>
                                                                <th className="px-3 py-2 text-left text-xs font-semibold" style={{ color: 'var(--muted)' }}>Batch</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Qty</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Cost/Unit</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                                            {purchase.items.map((item, itemIdx) => (
                                                                <tr key={itemIdx}>
                                                                    <td className="px-3 py-2" style={{ color: 'var(--ink)' }}>
                                                                        <div>{item.product?.name || item.productName || 'N/A'}</div>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-xs" style={{ color: 'var(--muted)' }}>{item.batch?.batchNumber || item.batchNumber || 'N/A'}</td>
                                                                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--ink)' }}>{item.quantity}</td>
                                                                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--muted)' }}>Rs {item.costPrice?.toLocaleString() || 0}</td>
                                                                    <td className="px-3 py-2 text-right tabular-nums font-semibold" style={{ color: 'var(--accent-2)' }}>Rs {((item.costPrice || 0) * (item.quantity || 0)).toLocaleString() || 0}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                                                                {/* Purchase Returns Section */}
                                                                                                {purchase.purchaseReturns && purchase.purchaseReturns.length > 0 && (
                                                                                                    <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                                                                                                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Purchase Returns ({purchase.purchaseReturns.length})</p>
                                                                                                        <div className="space-y-2">
                                                                                                            {purchase.purchaseReturns.map((ret, retIdx) => (
                                                                                                                <div key={retIdx} className="text-xs p-2 rounded" style={{ background: 'var(--app-bg)', borderColor: 'var(--border)', border: '1px solid' }}>
                                                                                                                    <div className="flex items-center justify-between mb-1">
                                                                                                                        <span style={{ color: 'var(--ink)' }}><strong>{ret.purchaseReturnNumber}</strong></span>
                                                                                                                        <span style={{ color: 'var(--muted)' }}>{new Date(ret.createdAt).toLocaleDateString()}</span>
                                                                                                                    </div>
                                                                                                                    <div className="flex justify-between gap-4">
                                                                                                                        <span style={{ color: 'var(--muted)' }}>Items: <strong style={{ color: 'var(--ink)' }}>{ret.items?.length || 0}</strong></span>
                                                                                                                        <span style={{ color: 'var(--muted)' }}>Refund: <strong style={{ color: 'var(--accent-2)' }}>Rs {ret.totalRefundAmount?.toLocaleString() || 0}</strong></span>
                                                                                                                        <span style={{ color: 'var(--muted)' }}>Status: <strong style={{ color: 'var(--ink)' }}>{ret.status}</strong></span>
                                                                                                                    </div>
                                                                                                                    {/* Return Items */}
                                                                                                                    {ret.items && ret.items.length > 0 && (
                                                                                                                        <div className="mt-2 pl-2 border-l-2" style={{ borderColor: 'var(--accent-2)' }}>
                                                                                                                            {ret.items.map((retItem, retItemIdx) => (
                                                                                                                                <div key={retItemIdx} className="text-xs py-1" style={{ color: 'var(--muted)' }}>
                                                                                                                                    {retItem.product?.name || retItem.productName || 'Unknown'} - Qty: {retItem.quantity}
                                                                                                                                </div>
                                                                                                                            ))}
                                                                                                                        </div>
                                                                                                                    )}
                                                                                                                </div>
                                                                                                            ))}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            {purchases.length > 50 && (
                <div className="px-4 py-2.5 text-xs text-center border-t" style={{ color: 'var(--muted)', borderColor: 'var(--border)', background: 'var(--surface-muted)' }}>
                    Showing first {50} of {purchases.length} purchases
                </div>
            )}
        </div>
    );
}

const COLORS = {
    purchases: '#3b82f6',
    suppliers: '#8b5cf6',
    pending: '#f59e0b',
    delivered: '#10b981',
    rejected: '#dc2626',
    returnsPurchase: '#06b6d4',
    unpaid: '#ef4444',
    profit: '#10b981',
};

const MAX_TRANSACTIONS_DISPLAY = 50;

export default function PurchaseKPIReport() {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getReportsLabels(language);
    const [period, setPeriod] = useState("all");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [supplierId, setSupplierId] = useState("");
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

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
        supplierId: supplierId || undefined,
    }), [period, fromDate, toDate, supplierId]);

    const { data, isLoading, isFetching, error, refetch } = useGetPurchaseReportQuery(filters);

    if (error) {
        showError(error?.data?.message || "Failed to load purchase report");
    }

    const handleRefresh = () => refetch();

    // Extract data from response
    const purchases = data?.data || [];
    const summary = data?.summary || {};
    const breakdowns = data?.supplierBreakdown || [];
    const showLoader = isLoading || isFetching;

    return (
        <div className="p-6 min-h-screen" style={{ background: 'var(--app-bg)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--ink)' }}>Purchase Report (KPI)</h1>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>Purchase performance overview and metrics</p>
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

            {/* Date filter */}
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
            </div>

            {showLoader ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-2)' }}></div>
                </div>
            ) : (
                <div>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                        <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg p-2" style={{ background: `${COLORS.purchases}17` }}>
                                    <DollarSign size={18} style={{ color: COLORS.purchases }} />
                                </div>
                                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Total Purchased</p>
                            </div>
                            <p className="text-2xl font-bold tabular-nums mt-2" style={{ color: 'var(--ink)' }}>
                                Rs {(summary.totalPurchases ?? 0).toLocaleString()}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Total cost</p>
                        </div>

                        <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg p-2" style={{ background: `${COLORS.purchases}17` }}>
                                    <Package size={18} style={{ color: COLORS.purchases }} />
                                </div>
                                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Purchase Orders</p>
                            </div>
                            <p className="text-2xl font-bold tabular-nums mt-2" style={{ color: 'var(--ink)' }}>
                                {summary.totalBills || 0}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Total bills</p>
                        </div>

                        <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg p-2" style={{ background: `${COLORS.delivered}17` }}>
                                    <Truck size={18} style={{ color: COLORS.delivered }} />
                                </div>
                                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Delivered</p>
                            </div>
                            <p className="text-2xl font-bold tabular-nums mt-2" style={{ color: 'var(--ink)' }}>
                                {summary.totalDeliveredCount || 0}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Orders</p>
                        </div>

                        <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg p-2" style={{ background: `${COLORS.unpaid}17` }}>
                                    <AlertCircle size={18} style={{ color: COLORS.unpaid }} />
                                </div>
                                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Outstanding</p>
                            </div>
                            <p className="text-2xl font-bold tabular-nums mt-2" style={{ color: 'var(--ink)' }}>
                                Rs {(summary.totalDue ?? 0).toLocaleString()}
                            </p>
                            <p className="text-xs mt-1" style={{ color: COLORS.unpaid }}>Amount due</p>
                        </div>

                        <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg p-2" style={{ background: `${COLORS.suppliers}17` }}>
                                    <Wallet size={18} style={{ color: COLORS.suppliers }} />
                                </div>
                                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Total Paid</p>
                            </div>
                            <p className="text-2xl font-bold tabular-nums mt-2" style={{ color: 'var(--ink)' }}>
                                Rs {(summary.totalPaid ?? 0).toLocaleString()}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Amount paid</p>
                        </div>

                        <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg p-2" style={{ background: `${COLORS.returnsPurchase}17` }}>
                                    <RefreshCw size={18} style={{ color: COLORS.returnsPurchase }} />
                                </div>
                                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Rejected</p>
                            </div>
                            <p className="text-2xl font-bold tabular-nums mt-2" style={{ color: '#dc2626' }}>
                                {summary.totalRejectedCount || 0}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Purchase count</p>
                        </div>
                    </div>

                    {/* Purchase by Supplier Breakdown */}
                    <div className="rounded-2xl border overflow-hidden mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl p-2.5" style={{ background: 'var(--surface-muted)' }}>
                                    <Package size={20} style={{ color: COLORS.suppliers }} />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold" style={{ color: 'var(--ink)' }}>Purchases by Supplier</h3>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Breakdown of supplier purchases</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-5">
                            {breakdowns && breakdowns.length > 0 ? (
                                <div className="space-y-0">
                                    {breakdowns.map((item, idx) => (
                                        <BreakdownItem 
                                            key={idx} 
                                            label={item.supplierName} 
                                            value={item.totalAmount} 
                                            count={item.billsCount} 
                                            percentage={(summary.totalPurchases && summary.totalPurchases > 0) ? ((item.totalAmount / summary.totalPurchases) * 100).toFixed(1) : 0}
                                            color={COLORS.suppliers} 
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm py-4 text-center" style={{ color: 'var(--muted)' }}>No supplier data available</p>
                            )}
                        </div>
                    </div>

                    {/* Purchase Transactions */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>Purchase Transactions</h2>
                        <PurchaseTransactionTable purchases={purchases} labels={labels} />
                    </div>
                </div>
            )}

            {/* PDF Modal */}
            {isPdfModalOpen && (
                <PdfModal
                    isOpen={isPdfModalOpen}
                    onClose={() => setIsPdfModalOpen(false)}
                    fileName={`Purchase-Report-KPI.pdf`}
                    labels={labels}
                >
                    <PurchaseKPIReportPdfTemplate
                        summary={summary}
                        breakdowns={breakdowns}
                        labels={labels}
                        selectedPeriodLabel={period === "custom" ? `${fromDate} to ${toDate}` : period}
                    />
                </PdfModal>
            )}
        </div>
    );
}

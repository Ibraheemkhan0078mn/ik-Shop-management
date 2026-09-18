import React, { useState, useMemo } from "react";
import { RefreshCw, DollarSign, Package, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { useGetPurchaseReportQuery } from "../services/reports.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PdfModal from "../../../shared/components/PdfModal.jsx";
import PurchaseKPIReportPdfTemplate from "../components/PurchaseKPIReportPdfTemplate.jsx";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getReportsLabels } from "../labels/reportsLabels.js";

// ---------- Transaction table renderer ----------
function renderPurchaseTransactionRow(transaction, formatDate, onExpandPurchase, labels) {
    const totalPurchaseAmount = transaction.totalAmount || 0;
    const totalReturnAmount = transaction.purchaseReturns ? transaction.purchaseReturns.reduce((sum, ret) => sum + (ret.totalRefundAmount || 0), 0) : 0;
    const netAmount = totalPurchaseAmount - totalReturnAmount;

    return (
        <>
            <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>
                {/* Commented out expand button - client will expand purchase details manually
                <button
                    onClick={() => onExpandPurchase && onExpandPurchase(transaction)}
                    className="text-left hover:underline flex items-center gap-1"
                >
                    {transaction.invoiceNumber}
                    <ChevronDown size={14} style={{ color: 'var(--muted)' }} />
                </button>
                */}
                {transaction.invoiceNumber}
            </td>
            <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>{transaction.supplier?.name || 'Unknown'}</td>
            <td className="px-4 py-2.5 text-sm capitalize" style={{ color: 'var(--muted)' }}>{transaction.status || 'pending'}</td>
            <td className="px-4 py-2.5 text-sm text-right tabular-nums" style={{ color: 'var(--ink)' }}>Rs {totalPurchaseAmount.toLocaleString()}</td>
            <td className="px-4 py-2.5 text-sm text-right tabular-nums" style={{ color: '#f59e0b' }}>Rs {totalReturnAmount.toLocaleString()}</td>
            <td className="px-4 py-2.5 text-sm text-right tabular-nums font-semibold" style={{ color: 'var(--accent-2)' }}>Rs {netAmount.toLocaleString()}</td>
            <td className="px-4 py-2.5 text-sm text-right" style={{ color: 'var(--muted)' }}>{formatDate(transaction.date || transaction.createdAt)}</td>
        </>
    );
}

function PurchaseTransactionTable({ purchases = [], labels = {} }) {
    // Commented out expand functionality - client will expand purchase details manually
    // const [expandedPurchaseId, setExpandedPurchaseId] = useState(null);

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

    // Commented out expand handler - client will expand purchase details manually
    // const handleExpandPurchase = (purchase) => {
    //     setExpandedPurchaseId(expandedPurchaseId === purchase._id ? null : purchase._id);
    // };

    const displayPurchases = purchases.slice(0, 50);

    return (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <div className="overflow-x-auto">
                <table className="w-full" role="table" aria-label="purchase transactions">
                    <thead style={{ background: 'var(--surface-muted)' }}>
                        <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.invoiceNo}</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.supplier}</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.deliveryStatus}</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.grandPurchaseTotal}</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.grandReturnTotal}</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.net}</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.date}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                        {displayPurchases.map((purchase, idx) => (
                            <React.Fragment key={idx}>
                                <tr className="transition-colors" style={{ background: 'transparent' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-muted)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                    {renderPurchaseTransactionRow(purchase, formatDate, null, labels)}
                                </tr>
                                {/* Commented out expanded purchase details - client will expand purchase details manually
                                {expandedPurchaseId === purchase._id && purchase.items && (
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <td colSpan="7" className="px-4 py-4">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                                                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Purchase Details</p>
                                                    <div className="flex gap-4 text-xs" style={{ color: 'var(--muted)' }}>
                                                        <span>Supplier: <strong style={{ color: 'var(--ink)' }}>{purchase.supplierName}</strong></span>
                                                        <span>Status: <strong style={{ color: 'var(--ink)' }}>{purchase.status}</strong></span>
                                                        <span>Bill Discount: <strong style={{ color: 'var(--ink)' }}>{purchase.discountType === 'fixed' ? `Rs ${(purchase.discount || 0).toLocaleString()}` : `${(purchase.discount || 0).toLocaleString()}%`}</strong></span>
                                                        <span>Bill Tax: <strong style={{ color: 'var(--ink)' }}>{purchase.gstType === 'fixed' ? `Rs ${(purchase.gst || 0).toLocaleString()}` : `${(purchase.gst || 0).toLocaleString()}%`}</strong></span>
                                                    </div>
                                                </div>
                                                <div className="rounded border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                                                    <table className="w-full text-sm">
                                                        <thead style={{ background: 'var(--app-bg)' }}>
                                                            <tr>
                                                                <th className="px-3 py-2 text-left text-xs font-semibold" style={{ color: 'var(--muted)' }}>#</th>
                                                                <th className="px-3 py-2 text-left text-xs font-semibold" style={{ color: 'var(--muted)' }}>Item</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Cost Price</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Disc</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Tax</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Final Unit</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Qty</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Returned</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                                            {purchase.items.map((item, itemIdx) => {
                                                                const batch = item.batch || {};
                                                                const quantity = Number(item.quantity || 0);
                                                                const costPrice = Number(batch.costPrice ?? item.costPrice ?? item.price ?? item.perItemPrice ?? 0);
                                                                const discountType = batch.discountEntryType ?? item.discountEntryType ?? item.discountType ?? "percentage";
                                                                const discountValue = Number(batch.discountEntryValue ?? batch.discountInPercentage ?? item.discountEntryValue ?? item.discount ?? 0);
                                                                const discountScope = batch.discountScope ?? item.discountScope ?? "entire";
                                                                const taxType = batch.taxEntryType ?? item.taxEntryType ?? item.taxType ?? "percentage";
                                                                const taxValue = Number(batch.taxEntryValue ?? batch.taxInPercentage ?? item.taxEntryValue ?? item.tax ?? 0);
                                                                const taxScope = batch.taxScope ?? item.taxScope ?? "entire";

                                                                const discountAmountPerUnit = discountType === "percentage"
                                                                    ? costPrice * (discountValue / 100)
                                                                    : (discountScope === "perUnit" ? discountValue : discountValue / Math.max(1, quantity || 1));
                                                                const discountedUnitPrice = Math.max(0, costPrice - discountAmountPerUnit);
                                                                const taxAmountPerUnit = taxType === "percentage"
                                                                    ? discountedUnitPrice * (taxValue / 100)
                                                                    : (taxScope === "perUnit" ? taxValue : taxValue / Math.max(1, quantity || 1));
                                                                const unitCosting = discountedUnitPrice + taxAmountPerUnit;
                                                                const subtotal = unitCosting * quantity;
                                                                const discountPercentEquivalent = discountType === "fixed" && costPrice > 0 ? (discountAmountPerUnit / costPrice) * 100 : discountValue;
                                                                const taxPercentEquivalent = taxType === "fixed" && discountedUnitPrice > 0 ? (taxAmountPerUnit / discountedUnitPrice) * 100 : taxValue;

                                                                const displayDiscountText = discountType === "fixed" ? `${discountPercentEquivalent.toFixed(2)}%` : `${discountValue.toFixed(2)}%`;
                                                                const displayTaxText = taxType === "fixed" ? `${taxPercentEquivalent.toFixed(2)}%` : `${taxValue.toFixed(2)}%`;

                                                                const batchId = item.batch?._id || item.batch;
                                                                const returnedQty = purchase.purchaseReturns?.reduce((sum, ret) => {
                                                                    const retItem = ret.items?.find(i =>
                                                                        (i.batch?._id || i.batch) === batchId ||
                                                                        i.batchNumber === item.batch?.batchNumber
                                                                    );
                                                                    return sum + (retItem?.quantity || 0);
                                                                }, 0) || 0;

                                                                return (
                                                                <tr key={itemIdx}>
                                                                    <td className="px-3 py-2" style={{ color: 'var(--ink)' }}>{itemIdx + 1}</td>
                                                                    <td className="px-3 py-2" style={{ color: 'var(--ink)' }}>
                                                                        <div>{item.product?.name || item.productName || 'N/A'}</div>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--ink)' }}>{costPrice.toLocaleString()}</td>
                                                                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: '#dc2626' }}>{displayDiscountText}</td>
                                                                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: '#10b981' }}>{displayTaxText}</td>
                                                                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--ink)' }}>{unitCosting.toLocaleString()}</td>
                                                                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--ink)' }}>{quantity}</td>
                                                                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: returnedQty > 0 ? '#dc2626' : 'var(--muted)' }}>{returnedQty}</td>
                                                                    <td className="px-3 py-2 text-right tabular-nums font-semibold" style={{ color: 'var(--accent-2)' }}>{subtotal.toLocaleString()}</td>
                                                                </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                    {purchase.purchaseReturns && purchase.purchaseReturns.length > 0 && (
                                                        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                                                            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Return Details</p>
                                                            <div className="rounded border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                                                                <table className="w-full text-xs">
                                                                    <thead style={{ background: 'var(--app-bg)' }}>
                                                                        <tr>
                                                                            <th className="px-2 py-1.5 text-left text-xs font-semibold" style={{ color: 'var(--muted)' }}>Return #</th>
                                                                            <th className="px-2 py-1.5 text-left text-xs font-semibold" style={{ color: 'var(--muted)' }}>Date</th>
                                                                            <th className="px-2 py-1.5 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Items</th>
                                                                            <th className="px-2 py-1.5 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Refund</th>
                                                                            <th className="px-2 py-1.5 text-center text-xs font-semibold" style={{ color: 'var(--muted)' }}>Status</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                                                        {purchase.purchaseReturns.map((ret, retIdx) => (
                                                                            <tr key={retIdx}>
                                                                                <td className="px-2 py-1.5" style={{ color: 'var(--ink)' }}>{ret.purchaseReturnNumber || ret.returnNumber || '—'}</td>
                                                                                <td className="px-2 py-1.5" style={{ color: 'var(--muted)' }}>{new Date(ret.createdAt).toLocaleDateString()}</td>
                                                                                <td className="px-2 py-1.5 text-right" style={{ color: 'var(--ink)' }}>{ret.items?.length || 0}</td>
                                                                                <td className="px-2 py-1.5 text-right" style={{ color: 'var(--accent-2)' }}>Rs {ret.totalRefundAmount?.toLocaleString() || 0}</td>
                                                                                <td className="px-2 py-1.5 text-center" style={{ color: 'var(--muted)' }}>{ret.status || '—'}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                */}
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
    const [period, setPeriod] = useState("today");
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
    const purchaseReturns = purchases.flatMap((purchase) => purchase.purchaseReturns || []);
    const totalPurchaseReturns = purchaseReturns.reduce(
        (total, purchaseReturn) => total + Number(purchaseReturn.totalRefundAmount ?? purchaseReturn.totalAmount ?? 0),
        0
    );
    const grossPurchased = Number(summary.totalPurchases ?? 0);
    const netPurchased = Math.max(0, grossPurchased - totalPurchaseReturns);
    const adjustedOutstanding = Math.max(0, Number(summary.totalDue ?? 0) - totalPurchaseReturns);
    const reportSummary = {
        ...summary,
        totalPurchases: grossPurchased,
        netPurchased,
        totalPurchaseReturns,
        totalPurchaseReturnCount: purchaseReturns.length,
        totalDue: adjustedOutstanding,
    };
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
                    <div className="flex flex-wrap flex-1 gap-4 mb-6">
                        <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg p-2" style={{ background: `${COLORS.purchases}17` }}>
                                    <DollarSign size={18} style={{ color: COLORS.purchases }} />
                                </div>
                                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Total Purchased</p>
                            </div>
                            <p className="text-2xl font-bold tabular-nums mt-2" style={{ color: 'var(--ink)' }}>
                                Rs {reportSummary.totalPurchases.toLocaleString()}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{summary.totalBills || 0} orders</p>
                        </div>

                        <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg p-2" style={{ background: `${COLORS.returnsPurchase}17` }}>
                                    <RefreshCw size={18} style={{ color: COLORS.returnsPurchase }} />
                                </div>
                                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Returns</p>
                            </div>
                            <p className="text-2xl font-bold tabular-nums mt-2" style={{ color: COLORS.returnsPurchase }}>
                                Rs {reportSummary.totalPurchaseReturns.toLocaleString()}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{reportSummary.totalPurchaseReturnCount} returns</p>
                        </div>

                        <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg p-2" style={{ background: `${COLORS.profit}17` }}>
                                    <TrendingUp size={18} style={{ color: COLORS.profit }} />
                                </div>
                                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Net Amount Spent</p>
                            </div>
                            <p className="text-2xl font-bold tabular-nums mt-2" style={{ color: 'var(--ink)' }}>
                                Rs {reportSummary.netPurchased.toLocaleString()}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>After returns</p>
                        </div>

                        {/* <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg p-2" style={{ background: `${COLORS.unpaid}17` }}>
                                    <AlertCircle size={18} style={{ color: COLORS.unpaid }} />
                                </div>
                                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Outstanding</p>
                            </div>
                            <p className="text-2xl font-bold tabular-nums mt-2" style={{ color: 'var(--ink)' }}>
                                Rs {reportSummary.totalDue.toLocaleString()}
                            </p>
                            <p className="text-xs mt-1" style={{ color: COLORS.unpaid }}>Amount due</p>
                        </div> */}

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
                        summary={reportSummary}
                        breakdowns={{ bySupplier: breakdowns }}
                        labels={labels}
                        selectedPeriodLabel={period === "custom" ? `${fromDate} to ${toDate}` : period}
                    />
                </PdfModal>
            )}
        </div>
    );
}

// src/reports/components/MainBusinessReport.jsx
import React, { useState, useMemo } from "react";
import { RefreshCw, TrendingUp, TrendingDown, ChevronDown, ChevronUp, DollarSign, ShoppingCart, Package, Receipt, Users, AlertCircle, Wallet, Filter, ArrowDownRight, ArrowUpRight, HandCoins, Calendar } from "lucide-react";
import { useGetMainBusinessReportKPIQuery, useGetMainBusinessReportDataQuery } from "../services/reports.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PdfModal from "../../../shared/components/PdfModal.jsx";
import MainBusinessReportPdfTemplate from "../components/MainBusinessReportPdfTemplate.jsx";
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
function renderTransactionRow(transaction, type) {
    switch (type) {
        case 'sales':
            return (
                <>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>{transaction.orderNumber}</td>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>{transaction.customerName || 'N/A'}</td>
                    <td className="px-4 py-2.5 text-sm capitalize" style={{ color: 'var(--muted)' }}>{transaction.paymentMethod}</td>
                    <td className="px-4 py-2.5 text-sm font-semibold text-right tabular-nums" style={{ color: 'var(--accent-2)' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        case 'purchases':
            return (
                <>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>{transaction.invoiceNumber}</td>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>{transaction.supplierName || 'N/A'}</td>
                    <td className="px-4 py-2.5 text-sm font-semibold text-right tabular-nums" style={{ color: 'var(--accent-2)' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        case 'expenses':
            return (
                <>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>{transaction.title}</td>
                    <td className="px-4 py-2.5 text-sm capitalize" style={{ color: 'var(--muted)' }}>{transaction.category}</td>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--muted)' }}>{transaction.description || '-'}</td>
                    <td className="px-4 py-2.5 text-sm font-semibold text-right tabular-nums" style={{ color: 'var(--accent-2)' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        case 'wastages':
            return (
                <>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>{transaction.productName}</td>
                    <td className="px-4 py-2.5 text-sm text-right tabular-nums" style={{ color: 'var(--muted)' }}>{transaction.quantity}</td>
                    <td className="px-4 py-2.5 text-sm text-right tabular-nums" style={{ color: 'var(--muted)' }}>Rs {transaction.costPrice?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 text-sm font-semibold text-right tabular-nums" style={{ color: 'var(--accent-2)' }}>Rs {transaction.totalLoss?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        case 'purchaseReturns':
            return (
                <>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>{transaction.returnNumber}</td>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>{transaction.supplierName || 'N/A'}</td>
                    <td className="px-4 py-2.5 text-sm font-semibold text-right tabular-nums" style={{ color: 'var(--accent-2)' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        case 'productReturns':
            return (
                <>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>{transaction.returnNumber}</td>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>{transaction.customerName || 'N/A'}</td>
                    <td className="px-4 py-2.5 text-sm font-semibold text-right tabular-nums" style={{ color: 'var(--accent-2)' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        case 'salaryPayments':
            return (
                <>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>{transaction.staffName}</td>
                    <td className="px-4 py-2.5 text-sm font-semibold text-right tabular-nums" style={{ color: 'var(--accent-2)' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        default:
            return null;
    }
}

function getTableHeaders(type, labels) {
    switch (type) {
        case 'sales': return [labels.orderNumber, labels.customer, labels.paymentMethod, labels.amount, labels.date];
        case 'purchases': return [labels.invoiceNumber, labels.supplier, labels.amount, labels.date];
        case 'expenses': return [labels.title, labels.category, labels.description, labels.amount, labels.date];
        case 'wastages': return [labels.product, labels.quantity, labels.costPrice, labels.totalLoss, labels.date];
        case 'purchaseReturns': return [labels.returnNumber, labels.supplier, labels.amount, labels.date];
        case 'productReturns': return [labels.returnNumber, labels.customer, labels.amount, labels.date];
        case 'salaryPayments': return [labels.staffName, labels.amount, labels.date];
        default: return [];
    }
}

function TransactionTable({ transactions, type, labels }) {
    if (!transactions || transactions.length === 0) {
        return <p className="text-sm py-6 text-center" style={{ color: 'var(--muted)' }}>{labels.noTransactionsInPeriod}</p>;
    }
    return (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <div className="overflow-x-auto">
                <table className="w-full">
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
                        {transactions.slice(0, 50).map((transaction, idx) => (
                            <tr key={idx} className="transition-colors" style={{ background: 'transparent' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-muted)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                {renderTransactionRow(transaction, type)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {transactions.length > 50 && (
                <div className="px-4 py-2.5 text-xs text-center border-t" style={{ color: 'var(--muted)', borderColor: 'var(--border)', background: 'var(--surface-muted)' }}>
                    {labels.showingFirst50} {transactions.length} {labels.transactions}
                </div>
            )}
        </div>
    );
}
// ---------- Mini metric chip — soft, inline, shown even when collapsed ----------
function MetricChip({ label, value, isCurrency = true, color }) {
    if (value === undefined || value === null) return null;
    return (
        <div
            className="flex flex-col items-start px-3 py-2 rounded-xl min-w-[92px]"
            style={{ background: 'var(--surface-muted)' }}
        >
            <p className="text-[10px] font-medium uppercase tracking-wide truncate" style={{ color: 'var(--muted)' }}>{label}</p>
            <p className="text-sm font-bold tabular-nums" style={{ color: color || 'var(--ink)' }}>
                {isCurrency ? `Rs ${Number(value).toLocaleString()}` : `${value}${typeof value === 'number' && !isCurrency ? '' : ''}`}
            </p>
        </div>
    );
}

// ---------- Full-width source section, now with an inline metrics row ----------
function SourceSection({ eyebrow, title, description, icon: Icon, color, kpiValue, count, metrics, breakdown, breakdownLabelKey, transactions, transactionType, isExpanded, onToggle, extraBreakdown, labels }) {
    return (
        <div className="rounded-2xl border overflow-hidden transition-shadow" style={{ background: 'var(--surface)', borderColor: isExpanded ? color : 'var(--border)', boxShadow: isExpanded ? `0 0 0 1px ${color}33` : 'none' }}>
            <button onClick={onToggle} className="w-full flex items-center justify-between gap-4 p-5 text-left">
                <div className="flex items-start gap-3.5 min-w-0">
                    <div className="shrink-0 rounded-xl p-2.5 flex items-center justify-center" style={{ background: `${color}17` }}>
                        <Icon size={20} style={{ color }} />
                    </div>
                    <div className="min-w-0">
                        {eyebrow && <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color }}>{eyebrow}</p>}
                        <h3 className="text-md font-semibold" style={{ color: 'var(--ink)' }}>{title}</h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{description} · {count} {labels.transactions}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <p className="text-xl font-bold tabular-nums text-right" style={{ color }}>Rs {kpiValue?.toLocaleString() || 0}</p>
                    <div className="rounded-full p-1.5" style={{ background: isExpanded ? `${color}17` : 'var(--surface-muted)' }}>
                        {isExpanded ? <ChevronUp size={16} style={{ color }} /> : <ChevronDown size={16} style={{ color: 'var(--muted)' }} />}
                    </div>
                </div>
            </button>

            {/* Inline metrics row — always visible, soft chips, no click needed */}
            {metrics && metrics.length > 0 && (
                <div className="px-5 pb-4 -mt-1 flex flex-wrap gap-2">
                    {metrics.map((m, idx) => (
                        <MetricChip key={idx} label={m.label} value={m.value} isCurrency={m.isCurrency} color={m.color} />
                    ))}
                </div>
            )}

            {isExpanded && (
                <div className="px-5 pb-5 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                    {breakdown && breakdown.length > 0 && (
                        <div className="mb-4">
                            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>{labels.breakdown}</p>
                            <div className="space-y-0">
                                {breakdown.map((item, idx) => (
                                    <BreakdownItem key={idx} label={item[breakdownLabelKey]} value={item.total} count={item.count} percentage={item.percentage} color={color} />
                                ))}
                            </div>
                        </div>
                    )}
                    {extraBreakdown}
                    {transactions && transactions.length > 0 && (
                        <div>
                            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--ink)' }}>{labels.transactions}</p>
                            <TransactionTable transactions={transactions} type={transactionType} labels={labels} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function GroupHeading({ eyebrow, title, description }) {
    return (
        <div className="mb-4">
            {eyebrow && <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--accent-2)' }}>{eyebrow}</p>}
            <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>{title}</h2>
            {description && <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{description}</p>}
        </div>
    );
}

const SECTION_KEYS = ['sales', 'purchases', 'expenses', 'salaries', 'purchaseReturns', 'productReturns', 'wastages', 'qarza'];

export default function MainBusinessReport() {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getReportsLabels(language);

    const PERIOD_OPTIONS = useMemo(() => [
        { value: "all", label: "All time" },
        { value: "today", label: labels.today },
        { value: "month", label: labels.thisMonth },
        { value: "3month", label: labels.last3Months },
        { value: "year", label: labels.thisYear },
        { value: "custom", label: labels.customRange },
    ], [labels]);

    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [period, setPeriod] = useState("all");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [expandedSections, setExpandedSections] = useState({});

    const filters = { period };
    if (period === "custom" && fromDate && toDate) {
        filters.fromDate = fromDate;
        filters.toDate = toDate;
    }

    const kpiQuery = useGetMainBusinessReportKPIQuery(filters);
    const dataQuery = useGetMainBusinessReportDataQuery(filters);
    const isLoading = kpiQuery.isLoading || dataQuery.isLoading;
    const isFetching = kpiQuery.isFetching || dataQuery.isFetching;
    const error = kpiQuery.error || dataQuery.error;

    if (error) {
        showError(error?.data?.message || "Failed to load report");
    }

    const handleRefresh = () => {
        kpiQuery.refetch();
        dataQuery.refetch();
    };
    const showLoader = isLoading || isFetching;

    const toggleSection = (key) => {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleExpandAll = () => {
        const all = {};
        SECTION_KEYS.forEach(k => { all[k] = true; });
        setExpandedSections(all);
    };

    const handleCollapseAll = () => setExpandedSections({});

    const summary = kpiQuery.data?.summary || {};
    const details = kpiQuery.data?.details || {};
    const breakdowns = dataQuery.data?.breakdowns || {};
    const transactions = dataQuery.data?.transactions || {};

    const qarzaNet = (summary.totalReceivable || 0) - (summary.totalPayable || 0);
    const isProfit = summary.netProfit >= 0;
    const selectedPeriodLabel = PERIOD_OPTIONS.find(p => p.value === period)?.label || '';

    // Stat used for the hero strip — replaces the old separate KPI-card grids.
    // Consolidated: sales/purchases/expenses/salaries + margin + qarza net are
    // shown once each, here, instead of duplicated across KpiCard + SourceSection.
    const heroStats = [
        { label: labels.totalSales, value: summary.totalSales, icon: ShoppingCart, color: '#10b981' },
        { label: labels.totalPurchases, value: summary.totalPurchases, icon: Package, color: '#3b82f6' },
        { label: labels.totalExpenses, value: summary.totalExpenses, icon: Receipt, color: '#ef4444' },
        { label: labels.totalSalaries, value: summary.totalSalaries, icon: Users, color: '#8b5cf6' },
        { label: labels.wastageLoss, value: summary.totalWastage, icon: AlertCircle, color: '#dc2626' },
    ];

    return (
        <div className="p-6 min-h-screen" style={{ background: 'var(--app-bg)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--ink)' }}>{labels.mainBusinessReport}</h1>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>{labels.businessOverview}</p>
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
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={handleExpandAll}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
                            style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--muted)' }}
                        >
                            {labels.expandAll}
                        </button>
                        <button
                            onClick={handleCollapseAll}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
                            style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--muted)' }}
                        >
                            {labels.collapseAll}
                        </button>
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
                    {/* ===================== HERO: FINAL BUSINESS RESULT ===================== */}
                    <div className="mb-6">
                        <div
                            className="rounded-2xl border p-6 md:p-7"
                            style={{
                                background: `linear-gradient(135deg, ${isProfit ? 'var(--accent-2)0F' : '#dc26260F'} 0%, var(--surface) 60%)`,
                                borderColor: 'var(--border)'
                            }}
                        >
                            <div className="flex items-start justify-between flex-wrap gap-6 mb-6">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
                                        {labels.finalBusinessResult} · {selectedPeriodLabel}
                                    </p>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Wallet size={22} style={{ color: isProfit ? 'var(--accent-2)' : '#dc2626' }} />
                                        <span className="text-base font-semibold" style={{ color: isProfit ? 'var(--accent-2)' : '#dc2626' }}>
                                            {isProfit ? labels.profit : labels.loss}
                                        </span>
                                    </div>
                                    <p className="text-4xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                                        Rs {Math.abs(summary.netProfit || 0).toLocaleString()}
                                    </p>
                                    <p className="text-xs mt-2 max-w-md" style={{ color: 'var(--muted)' }}>{labels.businessFormula}</p>
                                </div>
                                <div className="flex gap-6 md:gap-8">
                                    <div className="text-right">
                                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>{labels.netMargin}</p>
                                        <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>{summary.netMarginPercentage || 0}%</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>{labels.netQarza}</p>
                                        <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>Rs {qarzaNet.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Inline stat strip — replaces the separate KPI card grid entirely */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
                                {heroStats.map((s, idx) => (
                                    <div key={idx} className="flex items-center gap-2.5 min-w-0">
                                        <div className="shrink-0 rounded-lg p-1.5" style={{ background: `${s.color}17` }}>
                                            <s.icon size={14} style={{ color: s.color }} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[11px] truncate" style={{ color: 'var(--muted)' }}>{s.label}</p>
                                            <p className="text-sm font-bold tabular-nums truncate" style={{ color: 'var(--ink)' }}>Rs {s.value?.toLocaleString() || 0}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ===================== PER-SOURCE FULL WIDTH SECTIONS ===================== */}
                    <div>
                        <GroupHeading title={labels.paymentSourceSections} description={labels.businessOverview} />
                        <div className="space-y-3">
                            <SourceSection
                                eyebrow={labels.sales} title={labels.sales} description={labels.revenueFromCompletedOrders}
                                icon={ShoppingCart} color="#10b981" kpiValue={summary.totalSales} count={details.salesCount || 0}
                                metrics={[
                                    { label: labels.grossProfit || 'Margin', value: summary.salesMargin, isCurrency: true },
                                    { label: labels.retailSales || 'Retail', value: summary.retailSales, isCurrency: true },
                                    { label: labels.wholesaleSales || 'Wholesale', value: summary.wholesaleSales, isCurrency: true },
                                    { label: labels.avgOrderValue || 'Avg Order', value: details.avgOrderValue, isCurrency: true },
                                ]}
                                breakdown={breakdowns.salesByPaymentMethod} breakdownLabelKey="method"
                                transactions={transactions.sales} transactionType="sales"
                                isExpanded={!!expandedSections.sales} onToggle={() => toggleSection('sales')} labels={labels}
                            />

                            <SourceSection
                                eyebrow={labels.purchases} title={labels.purchases} description={labels.costOfInventoryPurchases}
                                icon={Package} color="#3b82f6" kpiValue={summary.totalPurchases} count={details.purchaseCount || 0}
                                metrics={[
                                    { label: 'Avg Invoice', value: details.avgPurchaseValue, isCurrency: true },
                                    { label: 'Suppliers', value: details.supplierCount, isCurrency: false },
                                ]}
                                transactions={transactions.purchases} transactionType="purchases"
                                isExpanded={!!expandedSections.purchases} onToggle={() => toggleSection('purchases')} labels={labels}
                            />

                            <SourceSection
                                eyebrow={labels.expenses} title={labels.expenses} description={labels.operatingExpenses}
                                icon={Receipt} color="#ef4444" kpiValue={summary.totalExpenses} count={details.expenseCount || 0}
                                metrics={[{ label: 'Avg/Txn', value: details.avgExpenseValue, isCurrency: true }]}
                                breakdown={breakdowns.expensesByCategory} breakdownLabelKey="category"
                                transactions={transactions.expenses} transactionType="expenses"
                                isExpanded={!!expandedSections.expenses} onToggle={() => toggleSection('expenses')} labels={labels}
                            />

                            <SourceSection
                                eyebrow={labels.salaries} title={labels.salaries} description={labels.staffSalaryPayments}
                                icon={Users} color="#8b5cf6" kpiValue={summary.totalSalaries} count={details.salaryPaymentCount || 0}
                                metrics={[{ label: 'Avg/Staff', value: details.avgSalaryPerStaff, isCurrency: true }]}
                                breakdown={breakdowns.salariesByStaff} breakdownLabelKey="staffName"
                                transactions={transactions.salaryPayments} transactionType="salaryPayments"
                                isExpanded={!!expandedSections.salaries} onToggle={() => toggleSection('salaries')} labels={labels}
                            />

                          <SourceSection
    eyebrow={labels.wastage} title={labels.wastage} description={labels.inventoryWastageCost}
    icon={AlertCircle} color="#dc2626" kpiValue={summary.totalWastage} count={details.wastageCount || 0}
    metrics={[{ label: '% of Purchases', value: details.wastagePercentOfPurchases, isCurrency: false }]}
    transactions={transactions.wastages} transactionType="wastages"
    isExpanded={!!expandedSections.wastages} onToggle={() => toggleSection('wastages')} labels={labels}
    extraBreakdown={breakdowns.wastagesByProduct && breakdowns.wastagesByProduct.length > 0 && (
        <div className="mb-4">
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>{labels.byProduct}</p>
            <div className="space-y-0">
                {breakdowns.wastagesByProduct.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2.5 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>{item.productName}</p>
                            <p className="text-xs" style={{ color: 'var(--muted)' }}>{item.count} {labels.records} • {item.totalQuantity} {labels.units}</p>
                        </div>
                        <div className="text-right shrink-0 pl-3">
                            <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--ink)' }}>Rs {item.total?.toLocaleString() || 0}</p>
                            <p className="text-xs" style={{ color: '#dc2626' }}>{item.percentage}%</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )}
/>

                            {/* Qarza section */}
                            <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: expandedSections.qarza ? '#0f766e' : 'var(--border)' }}>
                                <button onClick={() => toggleSection('qarza')} className="w-full flex items-center justify-between gap-4 p-5 text-left">
                                    <div className="flex items-start gap-3.5 min-w-0">
                                        <div className="shrink-0 rounded-xl p-2.5 flex items-center justify-center" style={{ background: '#0f766e17' }}>
                                            <HandCoins size={20} style={{ color: '#0f766e' }} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#0f766e' }}>{labels.qarza || labels.qarzaReceivablePayable}</p>
                                            <h3 className="text-md font-semibold" style={{ color: 'var(--ink)' }}>{labels.qarzaReceivablePayable}</h3>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{labels.outstandingCredit}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="text-right">
                                            <p className="text-xl font-bold tabular-nums" style={{ color: qarzaNet >= 0 ? '#0f766e' : '#7c3aed' }}>Rs {qarzaNet.toLocaleString()}</p>
                                            <p className="text-xs" style={{ color: 'var(--muted)' }}>{labels.netQarza}</p>
                                        </div>
                                        <div className="rounded-full p-1.5" style={{ background: expandedSections.qarza ? '#0f766e17' : 'var(--surface-muted)' }}>
                                            {expandedSections.qarza ? <ChevronUp size={16} style={{ color: '#0f766e' }} /> : <ChevronDown size={16} style={{ color: 'var(--muted)' }} />}
                                        </div>
                                    </div>
                                </button>
                                {expandedSections.qarza && (
                                    <div className="px-5 pb-5 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 rounded-xl border" style={{ background: 'var(--surface-muted)', borderColor: 'var(--border)' }}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <ArrowDownRight size={16} style={{ color: '#0f766e' }} />
                                                    <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>{labels.receivable}</p>
                                                </div>
                                                <p className="text-xl font-bold tabular-nums" style={{ color: '#0f766e' }}>Rs {summary.totalReceivable?.toLocaleString() || 0}</p>
                                            </div>
                                            <div className="p-4 rounded-xl border" style={{ background: 'var(--surface-muted)', borderColor: 'var(--border)' }}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <ArrowUpRight size={16} style={{ color: '#7c3aed' }} />
                                                    <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>{labels.payable}</p>
                                                </div>
                                                <p className="text-xl font-bold tabular-nums" style={{ color: '#7c3aed' }}>Rs {summary.totalPayable?.toLocaleString() || 0}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <PdfModal isOpen={isPdfModalOpen} onClose={() => setIsPdfModalOpen(false)} fileName={`${labels.mainBusinessReport}.pdf`} labels={labels}>
                <MainBusinessReportPdfTemplate
                    summary={summary} details={details} breakdowns={breakdowns} transactions={transactions}
                    labels={labels} selectedPeriodLabel={selectedPeriodLabel}
                    initialExpandedSections={{ sales: true, purchases: true, expenses: true, salaries: true, purchaseReturns: true, productReturns: true, wastages: true, qarza: true }}
                />
            </PdfModal>
        </div>
    );
}
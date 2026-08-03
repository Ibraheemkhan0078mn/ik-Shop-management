import React, { useState, useRef, useMemo } from "react";
import { Calendar, RefreshCw, TrendingUp, TrendingDown, ChevronDown, ChevronUp, DollarSign, ShoppingCart, Package, Receipt, Users, AlertCircle, Wallet, Filter } from "lucide-react";
import { useGetMainBusinessReportQuery } from "../services/reports.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PdfPreviewModal from "../../../shared/components/PdfPreviewModal.jsx";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getReportsLabels } from "../labels/reportsLabels.js"; 
 
// ---------- Layer 1: plain KPI card, NEVER has a dropdown ----------
function KpiCard({ label, value, icon: Icon, color, description, isCurrency = true }) {
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

// ---------- Breakdown row (used inside sections) ----------
function BreakdownItem({ label, value, count, percentage, color }) {
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

// ---------- Transaction table renderer ----------
function renderTransactionRow(transaction, type) {
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
        return <p className="text-sm py-4 text-center" style={{ color: 'var(--muted)' }}>{labels.noTransactionsInPeriod}</p>;
    }
    return (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead style={{ background: 'var(--surface-muted)' }}>
                        <tr>
                            {getTableHeaders(type, labels).map((header, idx) => (
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
                    {labels.showingFirst50} {transactions.length} {labels.transactions}
                </div>
            )}
        </div>
    );
}

// ---------- Layer 2: full-width source section, own KPI + expand/collapse ----------
function SourceSection({ id, title, icon: Icon, color, kpiValue, kpiDescription, count, breakdown, breakdownLabelKey, transactions, transactionType, isExpanded, onToggle, extraBreakdown, labels }) {
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
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>{kpiDescription} • {count} {labels.transactions}</p>
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
                            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--ink)' }}>{labels.breakdown}</p>
                            <div className="space-y-1">
                                {breakdown.map((item, idx) => (
                                    <BreakdownItem
                                        key={idx}
                                        label={item[breakdownLabelKey]}
                                        value={item.total}
                                        count={item.count}
                                        percentage={item.percentage}
                                        color={color}
                                    />
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

const SECTION_KEYS = ['sales', 'purchases', 'expenses', 'salaries', 'purchaseReturns', 'productReturns', 'wastages', 'qarza'];

export default function MainBusinessReport() {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getReportsLabels(language);

    const PERIOD_OPTIONS = useMemo(() => [
        { value: "today", label: labels.today },
        { value: "month", label: labels.thisMonth },
        { value: "3month", label: labels.last3Months },
        { value: "year", label: labels.thisYear },
        { value: "custom", label: labels.customRange },
    ], [labels]);

    const targetRef = useRef(null);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [period, setPeriod] = useState("today");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [expandedSections, setExpandedSections] = useState({});

    const filters = { period };
    if (period === "custom" && fromDate && toDate) {
        filters.fromDate = fromDate;
        filters.toDate = toDate;
    }

    const { data, isLoading, isFetching, error, refetch } = useGetMainBusinessReportQuery(filters);

    if (error) {
        showError(error?.data?.message || "Failed to load report");
    }

    const handleRefresh = () => refetch();
    const showLoader = isLoading || isFetching;

    const toggleSection = (key) => {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleExpandAll = () => {
        const all = {};
        SECTION_KEYS.forEach(k => { all[k] = true; });
        setExpandedSections(all);
    };

    const handleCollapseAll = () => {
        setExpandedSections({});
    };

    const summary = data?.summary || {};
    const details = data?.details || {};
    const breakdowns = data?.breakdowns || {};
    const transactions = data?.transactions || {};

    const qarzaNet = (summary.totalReceivable || 0) - (summary.totalPayable || 0);

    return (
        <div className="p-6 min-h-screen bg-[var(--app-bg)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--ink)] font-display">{labels.mainBusinessReport}</h1>
                    <p className="text-sm text-[var(--muted)]">{labels.businessOverview}</p>
                </div>
                <div className="flex gap-2 no-print">
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--app-bg)] transition-colors flex items-center gap-2"
                    >
                        <RefreshCw size={16} className={showLoader ? "animate-spin" : ""} />
                        {labels.refresh}
                    </button>
                    <button
                        onClick={() => setIsPdfModalOpen(true)}
                        className="px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2"
                        style={{ background: 'var(--accent-2)' }}
                    >
                        {labels.exportPdf}
                    </button>
                </div>
            </div>

            {/* Date filter */}
            <div className="card p-4 mb-6 no-print">
                <div className="flex items-center gap-2 mb-3">
                    <Filter size={16} className="text-[var(--accent-2)]" />
                    <span className="text-sm font-semibold text-[var(--ink)]">{labels.periodFilter}</span>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex gap-2 flex-wrap">
                        {PERIOD_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setPeriod(opt.value)}
                                className="px-4 py-2 rounded-lg transition-colors"
                                style={{
                                    background: period === opt.value ? 'var(--accent-2)' : 'var(--surface-muted)',
                                    color: period === opt.value ? 'white' : 'var(--ink)'
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleExpandAll}
                            className="px-3 py-1 text-sm rounded border border-[var(--border)] transition-colors"
                            style={{ background: 'var(--surface)', color: 'var(--ink)' }}
                        >
                            {labels.expandAll}
                        </button>
                        <button
                            onClick={handleCollapseAll}
                            className="px-3 py-1 text-sm rounded border border-[var(--border)] transition-colors"
                            style={{ background: 'var(--surface)', color: 'var(--ink)' }}
                        >
                            {labels.collapseAll}
                        </button>
                    </div>
                </div>
                {period === "custom" && (
                    <div className="flex gap-2 mt-4">
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        />
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        />
                    </div>
                )}
            </div>

            {showLoader ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-2)]"></div>
                </div>
            ) : (
                <div ref={targetRef}>

                    {/* ===================== LAYER 1: TOP KPI GRID (no dropdowns) ===================== */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <KpiCard label={labels.totalSales} value={summary.totalSales} icon={ShoppingCart} color="#10b981" description={`${details.salesCount || 0} ${labels.orders}`} />
                        <KpiCard label={labels.totalPurchases} value={summary.totalPurchases} icon={Package} color="#3b82f6" description={`${details.purchaseCount || 0} ${labels.purchases}`} />
                        <KpiCard label={labels.totalExpenses} value={summary.totalExpenses} icon={Receipt} color="#ef4444" description={`${details.expenseCount || 0} ${labels.expenses}`} />
                        <KpiCard label={labels.totalSalaries} value={summary.totalSalaries} icon={Users} color="#8b5cf6" description={`${details.salaryPaymentCount || 0} ${labels.payments}`} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <KpiCard label={labels.purchaseReturns} value={summary.totalPurchaseReturns} icon={TrendingUp} color="#06b6d4" description={`${details.purchaseReturnCount || 0} ${labels.returns}`} />
                        <KpiCard label={labels.saleReturns} value={summary.totalProductReturns} icon={TrendingDown} color="#f59e0b" description={`${details.productReturnCount || 0} ${labels.returns}`} />
                        <KpiCard label={labels.wastageLoss} value={summary.totalWastage} icon={AlertCircle} color="#dc2626" description={`${details.wastageCount || 0} ${labels.records}`} />
                        <KpiCard label={labels.saleCount} value={details.salesCount} icon={ShoppingCart} color="#2563eb" description={labels.completedOrders} isCurrency={false} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <KpiCard label={labels.qarzaReceivable} value={summary.totalReceivable} icon={DollarSign} color="#0f766e" description={labels.owedToYouByCustomers} />
                        <KpiCard label={labels.qarzaPayable} value={summary.totalPayable} icon={AlertCircle} color="#7c3aed" description={labels.owedByYouToSuppliers} />
                        <KpiCard label={labels.grossProfit} value={summary.grossProfit} icon={TrendingUp} color="#16a34a" description={`${labels.grossMargin} ${summary.grossMarginPercentage || 0}%`} />
                        <KpiCard label={labels.netProfitLoss} value={summary.netProfit} icon={summary.netProfit >= 0 ? DollarSign : AlertCircle} color={summary.netProfit >= 0 ? "#10b981" : "#dc2626"} description={`${labels.netMargin} ${summary.netMarginPercentage || 0}%`} />
                    </div>

                    {/* Final combined card: entire business result */}
                    <div className="rounded-xl border-2 shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: summary.netProfit >= 0 ? '#10b981' : '#dc2626' }}>
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
 <Wallet size={22} style={{ color: summary.netProfit >= 0 ? '#10b981' : '#dc2626' }} />
                                    <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>
                                        {labels.finalBusinessResult} ({summary.netProfit >= 0 ? labels.profit : labels.loss})
                                    </span>
                                </div>
                                <p className="text-3xl font-bold" style={{ color: summary.netProfit >= 0 ? '#10b981' : '#dc2626' }}>
                                    Rs {Math.abs(summary.netProfit || 0).toLocaleString()}
                                </p>
                                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                                    {labels.businessFormula}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm" style={{ color: 'var(--muted)' }}>{labels.netMargin}</p>
                                <p className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>{summary.netMarginPercentage || 0}%</p>
                                <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>{labels.netQarza}</p>
                                <p className="text-lg font-bold" style={{ color: qarzaNet >= 0 ? '#0f766e' : '#7c3aed' }}>Rs {qarzaNet.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* ===================== LAYER 2: PER-SOURCE FULL WIDTH SECTIONS ===================== */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>{labels.paymentSourceSections}</h2>
                        </div>

                        <SourceSection
                            title={labels.sales}
                            icon={ShoppingCart}
                            color="#10b981"
                            kpiValue={summary.totalSales}
                            kpiDescription={labels.revenueFromCompletedOrders}
                            count={details.salesCount || 0}
                            breakdown={breakdowns.salesByPaymentMethod}
                            breakdownLabelKey="method"
                            transactions={transactions.sales}
                            transactionType="sales"
                            isExpanded={!!expandedSections.sales}
                            onToggle={() => toggleSection('sales')}
                            labels={labels}
                        />

                        <SourceSection
                            title={labels.purchases}
                            icon={Package}
                            color="#3b82f6"
                            kpiValue={summary.totalPurchases}
                            kpiDescription={labels.costOfInventoryPurchases}
                            count={details.purchaseCount || 0}
                            transactions={transactions.purchases}
                            transactionType="purchases"
                            isExpanded={!!expandedSections.purchases}
                            onToggle={() => toggleSection('purchases')}
                            labels={labels}
                        />

                        <SourceSection
                            title={labels.expenses}
                            icon={Receipt}
                            color="#ef4444"
                            kpiValue={summary.totalExpenses}
                            kpiDescription={labels.operatingExpenses}
                            count={details.expenseCount || 0}
                            breakdown={breakdowns.expensesByCategory}
                            breakdownLabelKey="category"
                            transactions={transactions.expenses}
                            transactionType="expenses"
                            isExpanded={!!expandedSections.expenses}
                            onToggle={() => toggleSection('expenses')}
                            labels={labels}
                        />

                        <SourceSection
                            title={labels.salaries}
                            icon={Users}
                            color="#8b5cf6"
                            kpiValue={summary.totalSalaries}
                            kpiDescription={labels.staffSalaryPayments}
                            count={details.salaryPaymentCount || 0}
                            breakdown={breakdowns.salariesByStaff}
                            breakdownLabelKey="staffName"
                            transactions={transactions.salaryPayments}
                            transactionType="salaryPayments"
                            isExpanded={!!expandedSections.salaries}
                            onToggle={() => toggleSection('salaries')}
                            labels={labels}
                        />

                        <SourceSection
                            title={labels.purchaseReturns}
                            icon={TrendingUp}
                            color="#06b6d4"
                            kpiValue={summary.totalPurchaseReturns}
                            kpiDescription={labels.returnsSentToSuppliers}
                            count={details.purchaseReturnCount || 0}
                            breakdown={breakdowns.purchaseReturnsBySupplier}
                            breakdownLabelKey="supplierName"
                            transactions={transactions.purchaseReturns}
                            transactionType="purchaseReturns"
                            isExpanded={!!expandedSections.purchaseReturns}
                            onToggle={() => toggleSection('purchaseReturns')}
                            labels={labels}
                        />

                        <SourceSection
                            title={labels.saleReturns}
                            icon={TrendingDown}
                            color="#f59e0b"
                            kpiValue={summary.totalProductReturns}
                            kpiDescription={labels.customerProductReturns}
                            count={details.productReturnCount || 0}
                            breakdown={breakdowns.productReturnsByReason}
                            breakdownLabelKey="reason"
                            transactions={transactions.productReturns}
                            transactionType="productReturns"
                            isExpanded={!!expandedSections.productReturns}
                            onToggle={() => toggleSection('productReturns')}
                            labels={labels}
                        />

                        <SourceSection
                            title={labels.wastage}
                            icon={AlertCircle}
                            color="#dc2626"
                            kpiValue={summary.totalWastage}
                            kpiDescription={labels.inventoryWastageCost}
                            count={details.wastageCount || 0}
                            transactions={transactions.wastages}
                            transactionType="wastages"
                            isExpanded={!!expandedSections.wastages}
                            onToggle={() => toggleSection('wastages')}
                            labels={labels}
                            extraBreakdown={breakdowns.wastagesByProduct && breakdowns.wastagesByProduct.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm font-semibold mb-2" style={{ color: 'var(--ink)' }}>{labels.byProduct}</p>
                                    <div className="space-y-1">
                                        {breakdowns.wastagesByProduct.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{item.productName}</p>
                                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{item.count} {labels.records} • {item.totalQuantity} {labels.units}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold" style={{ color: '#dc2626' }}>Rs {item.total?.toLocaleString() || 0}</p>
                                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{item.percentage}%</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        />

                        {/* Combined Qarza section: receivable + payable */}
                        <div className="rounded-xl border shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <button
                                onClick={() => toggleSection('qarza')}
                                className="w-full flex items-center justify-between p-5 text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <DollarSign size={22} style={{ color: '#0f766e' }} />
                                    <div>
                                        <h3 className="text-md font-semibold" style={{ color: 'var(--ink)' }}>{labels.qarzaReceivablePayable}</h3>
                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>{labels.outstandingCredit}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <p className="text-xl font-bold" style={{ color: qarzaNet >= 0 ? '#0f766e' : '#7c3aed' }}>Rs {qarzaNet.toLocaleString()} net</p>
                                    {expandedSections.qarza ? <ChevronUp size={20} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={20} style={{ color: 'var(--muted)' }} />}
                                </div>
                            </button>
                            {expandedSections.qarza && (
                                <div className="px-5 pb-5 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                                            <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>{labels.receivable}</p>
                                            <p className="text-xl font-bold" style={{ color: '#0f766e' }}>Rs {summary.totalReceivable?.toLocaleString() || 0}</p>
                                        </div>
                                        <div className="p-4 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                                            <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>{labels.payable}</p>
                                            <p className="text-xl font-bold" style={{ color: '#7c3aed' }}>Rs {summary.totalPayable?.toLocaleString() || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <PdfPreviewModal
                isOpen={isPdfModalOpen}
                onClose={() => setIsPdfModalOpen(false)}
                fileName={`${labels.mainBusinessReport}.pdf`}
                onBeforeExport={handleExpandAll}
                onAfterExport={handleCollapseAll}
            >
                {/* PDF export reuses the same on-screen ref content; keeping simple summary for print */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <KpiCard label={labels.totalSales} value={summary.totalSales} icon={ShoppingCart} color="#10b981" description={labels.revenueFromCompletedOrders} />
                    <KpiCard label={labels.totalPurchases} value={summary.totalPurchases} icon={Package} color="#3b82f6" description={labels.costOfInventoryPurchases} />
                    <KpiCard label={labels.totalExpenses} value={summary.totalExpenses} icon={Receipt} color="#ef4444" description={labels.operatingExpenses} />
                    <KpiCard label={labels.totalSalaries} value={summary.totalSalaries} icon={Users} color="#8b5cf6" description={labels.staffSalaryPayments} />
                    <KpiCard label={labels.purchaseReturns} value={summary.totalPurchaseReturns} icon={TrendingUp} color="#06b6d4" description={labels.returnsToSuppliers} />
                    <KpiCard label={labels.saleReturns} value={summary.totalProductReturns} icon={TrendingDown} color="#f59e0b" description={labels.customerProductReturns} />
                    <KpiCard label={labels.wastageLoss} value={summary.totalWastage} icon={AlertCircle} color="#dc2626" description={labels.inventoryWastageCost} />
                    <KpiCard label={labels.netProfitLoss} value={summary.netProfit} icon={summary.netProfit >= 0 ? DollarSign : AlertCircle} color={summary.netProfit >= 0 ? "#10b981" : "#dc2626"} description={summary.netProfit >= 0 ? labels.netProfitForPeriod : labels.netLossForPeriod} />
                </div>

                <div className="space-y-4">
                    <SourceSection title={labels.sales} icon={ShoppingCart} color="#10b981" kpiValue={summary.totalSales} kpiDescription={labels.revenueFromCompletedOrders} count={details.salesCount || 0} breakdown={breakdowns.salesByPaymentMethod} breakdownLabelKey="method" transactions={transactions.sales} transactionType="sales" isExpanded={true} onToggle={() => {}} labels={labels} />
                    <SourceSection title={labels.purchases} icon={Package} color="#3b82f6" kpiValue={summary.totalPurchases} kpiDescription={labels.costOfInventoryPurchases} count={details.purchaseCount || 0} transactions={transactions.purchases} transactionType="purchases" isExpanded={true} onToggle={() => {}} labels={labels} />
                    <SourceSection title={labels.expenses} icon={Receipt} color="#ef4444" kpiValue={summary.totalExpenses} kpiDescription={labels.operatingExpenses} count={details.expenseCount || 0} breakdown={breakdowns.expensesByCategory} breakdownLabelKey="category" transactions={transactions.expenses} transactionType="expenses" isExpanded={true} onToggle={() => {}} labels={labels} />
                    <SourceSection title={labels.salaries} icon={Users} color="#8b5cf6" kpiValue={summary.totalSalaries} kpiDescription={labels.staffSalaryPayments} count={details.salaryPaymentCount || 0} breakdown={breakdowns.salariesByStaff} breakdownLabelKey="staffName" transactions={transactions.salaryPayments} transactionType="salaryPayments" isExpanded={true} onToggle={() => {}} labels={labels} />
                    <SourceSection title={labels.purchaseReturns} icon={TrendingUp} color="#06b6d4" kpiValue={summary.totalPurchaseReturns} kpiDescription={labels.returnsSentToSuppliers} count={details.purchaseReturnCount || 0} breakdown={breakdowns.purchaseReturnsBySupplier} breakdownLabelKey="supplierName" transactions={transactions.purchaseReturns} transactionType="purchaseReturns" isExpanded={true} onToggle={() => {}} labels={labels} />
                    <SourceSection title={labels.saleReturns} icon={TrendingDown} color="#f59e0b" kpiValue={summary.totalProductReturns} kpiDescription={labels.customerProductReturns} count={details.productReturnCount || 0} breakdown={breakdowns.productReturnsByReason} breakdownLabelKey="reason" transactions={transactions.productReturns} transactionType="productReturns" isExpanded={true} onToggle={() => {}} labels={labels} />
                    <SourceSection title={labels.wastage} icon={AlertCircle} color="#dc2626" kpiValue={summary.totalWastage} kpiDescription={labels.inventoryWastageCost} count={details.wastageCount || 0} transactions={transactions.wastages} transactionType="wastages" isExpanded={true} onToggle={() => {}} labels={labels} />
                </div>
            </PdfPreviewModal>
        </div>
    );
}
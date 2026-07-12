import React, { useState, useRef } from "react";
import { Calendar, Download, RefreshCw, TrendingUp, TrendingDown, ChevronDown, ChevronUp, DollarSign, ShoppingCart, Package, Receipt, Users, AlertCircle, Wallet } from "lucide-react";
import { useGetMainBusinessReportQuery } from "../services/reports.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PdfPreviewModal from "../../../shared/components/PdfPreviewModal.jsx";

const PERIOD_OPTIONS = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "custom", label: "Custom Range" },
];

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

function getTableHeaders(type) {
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

function TransactionTable({ transactions, type }) {
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

// ---------- Layer 2: full-width source section, own KPI + expand/collapse ----------
function SourceSection({ id, title, icon: Icon, color, kpiValue, kpiDescription, count, breakdown, breakdownLabelKey, transactions, transactionType, isExpanded, onToggle, extraBreakdown }) {
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
                    <div>
                        <p className="text-sm font-semibold mb-2" style={{ color: 'var(--ink)' }}>Transactions</p>
                        <TransactionTable transactions={transactions} type={transactionType} />
                    </div>
                </div>
            )}
        </div>
    );
}

const SECTION_KEYS = ['sales', 'purchases', 'expenses', 'salaries', 'purchaseReturns', 'productReturns', 'wastages', 'qarza'];

export default function MainBusinessReport() {
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

    const { data, isLoading, error, refetch } = useGetMainBusinessReportQuery(filters);

    if (error) {
        showError(error?.data?.message || "Failed to load report");
    }

    const handleRefresh = () => refetch();

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
        <div className="p-6 min-h-screen" style={{ background: 'var(--app-bg)' }}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>Main Business Report</h1>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>Complete business overview with detailed breakdowns</p>
                </div>
                <div className="flex gap-2 no-print">
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border transition"
                        style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--ink)' }}
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                    <button
                        onClick={() => setIsPdfModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition"
                        style={{ background: 'var(--accent-2)' }}
                    >
                        <Download size={16} />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Date filter - applies to entire report */}
            <div className="rounded-xl border shadow-sm mb-6 no-print" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between p-4 flex-wrap gap-3">
                    <div className="flex items-center gap-4 flex-wrap">
                        <Calendar size={20} style={{ color: 'var(--muted)' }} />
                        <div className="flex gap-2 flex-wrap">
                            {PERIOD_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setPeriod(opt.value)}
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
                    <div className="flex gap-2">
                        <button
                            onClick={handleExpandAll}
                            className="px-3 py-1 text-sm rounded border transition"
                            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
                        >
                            Expand All
                        </button>
                        <button
                            onClick={handleCollapseAll}
                            className="px-3 py-1 text-sm rounded border transition"
                            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
                        >
                            Collapse All
                        </button>
                    </div>
                </div>
                {period === "custom" && (
                    <div className="flex gap-2 px-4 pb-4">
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="px-3 py-2 rounded-lg border"
                            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--ink)' }}
                        />
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="px-3 py-2 rounded-lg border"
                            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--ink)' }}
                        />
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="rounded-xl border shadow-sm flex items-center justify-center p-12" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <RefreshCw className="animate-spin" size={40} style={{ color: 'var(--accent-2)' }} />
                </div>
            ) : (
                <div ref={targetRef}>

                    {/* ===================== LAYER 1: TOP KPI GRID (no dropdowns) ===================== */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <KpiCard label="Total Sales" value={summary.totalSales} icon={ShoppingCart} color="#10b981" description={`${details.salesCount || 0} orders`} />
                        <KpiCard label="Total Purchases" value={summary.totalPurchases} icon={Package} color="#3b82f6" description={`${details.purchaseCount || 0} purchases`} />
                        <KpiCard label="Total Expenses" value={summary.totalExpenses} icon={Receipt} color="#ef4444" description={`${details.expenseCount || 0} expenses`} />
                        <KpiCard label="Total Salaries" value={summary.totalSalaries} icon={Users} color="#8b5cf6" description={`${details.salaryPaymentCount || 0} payments`} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <KpiCard label="Purchase Returns" value={summary.totalPurchaseReturns} icon={TrendingUp} color="#06b6d4" description={`${details.purchaseReturnCount || 0} returns`} />
                        <KpiCard label="Sale Returns" value={summary.totalProductReturns} icon={TrendingDown} color="#f59e0b" description={`${details.productReturnCount || 0} returns`} />
                        <KpiCard label="Wastage Loss" value={summary.totalWastage} icon={AlertCircle} color="#dc2626" description={`${details.wastageCount || 0} records`} />
                        <KpiCard label="Sale Count" value={details.salesCount} icon={ShoppingCart} color="#2563eb" description="Completed orders" isCurrency={false} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <KpiCard label="Qarza Receivable" value={summary.totalReceivable} icon={DollarSign} color="#0f766e" description="Owed to you by customers" />
                        <KpiCard label="Qarza Payable" value={summary.totalPayable} icon={AlertCircle} color="#7c3aed" description="Owed by you to suppliers" />
                        <KpiCard label="Gross Profit" value={summary.grossProfit} icon={TrendingUp} color="#16a34a" description={`Gross margin ${summary.grossMarginPercentage || 0}%`} />
                        <KpiCard label="Net Profit/Loss" value={summary.netProfit} icon={summary.netProfit >= 0 ? DollarSign : AlertCircle} color={summary.netProfit >= 0 ? "#10b981" : "#dc2626"} description={`Net margin ${summary.netMarginPercentage || 0}%`} />
                    </div>

                    {/* Final combined card: entire business result */}
                    <div className="rounded-xl border-2 shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: summary.netProfit >= 0 ? '#10b981' : '#dc2626' }}>
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
 <Wallet size={22} style={{ color: summary.netProfit >= 0 ? '#10b981' : '#dc2626' }} />
                                    <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>
                                        FINAL BUSINESS RESULT ({summary.netProfit >= 0 ? 'Profit' : 'Loss'})
                                    </span>
                                </div>
                                <p className="text-3xl font-bold" style={{ color: summary.netProfit >= 0 ? '#10b981' : '#dc2626' }}>
                                    Rs {Math.abs(summary.netProfit || 0).toLocaleString()}
                                </p>
                                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                                    Sales − Purchases − Expenses − Salaries − Wastage − Sale Returns + Purchase Returns
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm" style={{ color: 'var(--muted)' }}>Net Margin</p>
                                <p className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>{summary.netMarginPercentage || 0}%</p>
                                <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>Net Qarza (Receivable − Payable)</p>
                                <p className="text-lg font-bold" style={{ color: qarzaNet >= 0 ? '#0f766e' : '#7c3aed' }}>Rs {qarzaNet.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* ===================== LAYER 2: PER-SOURCE FULL WIDTH SECTIONS ===================== */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>Payment Source Sections</h2>
                        </div>

                        <SourceSection
                            title="Sales"
                            icon={ShoppingCart}
                            color="#10b981"
                            kpiValue={summary.totalSales}
                            kpiDescription="Revenue from completed POS orders"
                            count={details.salesCount || 0}
                            breakdown={breakdowns.salesByPaymentMethod}
                            breakdownLabelKey="method"
                            transactions={transactions.sales}
                            transactionType="sales"
                            isExpanded={!!expandedSections.sales}
                            onToggle={() => toggleSection('sales')}
                        />

                        <SourceSection
                            title="Purchases"
                            icon={Package}
                            color="#3b82f6"
                            kpiValue={summary.totalPurchases}
                            kpiDescription="Cost of inventory purchases"
                            count={details.purchaseCount || 0}
                            transactions={transactions.purchases}
                            transactionType="purchases"
                            isExpanded={!!expandedSections.purchases}
                            onToggle={() => toggleSection('purchases')}
                        />

                        <SourceSection
                            title="Expenses"
                            icon={Receipt}
                            color="#ef4444"
                            kpiValue={summary.totalExpenses}
                            kpiDescription="Operating expenses"
                            count={details.expenseCount || 0}
                            breakdown={breakdowns.expensesByCategory}
                            breakdownLabelKey="category"
                            transactions={transactions.expenses}
                            transactionType="expenses"
                            isExpanded={!!expandedSections.expenses}
                            onToggle={() => toggleSection('expenses')}
                        />

                        <SourceSection
                            title="Salaries"
                            icon={Users}
                            color="#8b5cf6"
                            kpiValue={summary.totalSalaries}
                            kpiDescription="Staff salary payments"
                            count={details.salaryPaymentCount || 0}
                            breakdown={breakdowns.salariesByStaff}
                            breakdownLabelKey="staffName"
                            transactions={transactions.salaryPayments}
                            transactionType="salaryPayments"
                            isExpanded={!!expandedSections.salaries}
                            onToggle={() => toggleSection('salaries')}
                        />

                        <SourceSection
                            title="Purchase Returns"
                            icon={TrendingUp}
                            color="#06b6d4"
                            kpiValue={summary.totalPurchaseReturns}
                            kpiDescription="Returns sent back to suppliers"
                            count={details.purchaseReturnCount || 0}
                            breakdown={breakdowns.purchaseReturnsBySupplier}
                            breakdownLabelKey="supplierName"
                            transactions={transactions.purchaseReturns}
                            transactionType="purchaseReturns"
                            isExpanded={!!expandedSections.purchaseReturns}
                            onToggle={() => toggleSection('purchaseReturns')}
                        />

                        <SourceSection
                            title="Sale Returns"
                            icon={TrendingDown}
                            color="#f59e0b"
                            kpiValue={summary.totalProductReturns}
                            kpiDescription="Customer product returns"
                            count={details.productReturnCount || 0}
                            breakdown={breakdowns.productReturnsByReason}
                            breakdownLabelKey="reason"
                            transactions={transactions.productReturns}
                            transactionType="productReturns"
                            isExpanded={!!expandedSections.productReturns}
                            onToggle={() => toggleSection('productReturns')}
                        />

                        <SourceSection
                            title="Wastage"
                            icon={AlertCircle}
                            color="#dc2626"
                            kpiValue={summary.totalWastage}
                            kpiDescription="Inventory wastage cost"
                            count={details.wastageCount || 0}
                            transactions={transactions.wastages}
                            transactionType="wastages"
                            isExpanded={!!expandedSections.wastages}
                            onToggle={() => toggleSection('wastages')}
                            extraBreakdown={breakdowns.wastagesByProduct && breakdowns.wastagesByProduct.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm font-semibold mb-2" style={{ color: 'var(--ink)' }}>By Product</p>
                                    <div className="space-y-1">
                                        {breakdowns.wastagesByProduct.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{item.productName}</p>
                                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{item.count} records • {item.totalQuantity} units</p>
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
                                        <h3 className="text-md font-semibold" style={{ color: 'var(--ink)' }}>Qarza (Receivable &amp; Payable)</h3>
                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>Outstanding customer and supplier credit</p>
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
                                            <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Receivable (customers owe you)</p>
                                            <p className="text-xl font-bold" style={{ color: '#0f766e' }}>Rs {summary.totalReceivable?.toLocaleString() || 0}</p>
                                        </div>
                                        <div className="p-4 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                                            <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Payable (you owe suppliers)</p>
                                            <p className="text-xl font-bold" style={{ color: '#7c3aed' }}>Rs {summary.totalPayable?.toLocaleString() || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Transaction Summary counts (kept, informational) */}
                    <div className="rounded-xl border shadow-sm p-6 mt-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>Transaction Summary</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                            <div className="p-4 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                                <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Sales Count</p>
                                <p className="text-xl font-bold" style={{ color: 'var(--ink)' }}>{details.salesCount || 0}</p>
                            </div>
                            <div className="p-4 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                                <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Purchase Count</p>
                                <p className="text-xl font-bold" style={{ color: 'var(--ink)' }}>{details.purchaseCount || 0}</p>
                            </div>
                            <div className="p-4 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                                <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Expense Count</p>
                                <p className="text-xl font-bold" style={{ color: 'var(--ink)' }}>{details.expenseCount || 0}</p>
                            </div>
                            <div className="p-4 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                                <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Wastage Count</p>
                                <p className="text-xl font-bold" style={{ color: 'var(--ink)' }}>{details.wastageCount || 0}</p>
                            </div>
                            <div className="p-4 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                                <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Purchase Returns</p>
                                <p className="text-xl font-bold" style={{ color: 'var(--ink)' }}>{details.purchaseReturnCount || 0}</p>
                            </div>
                            <div className="p-4 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                                <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Sale Returns</p>
                                <p className="text-xl font-bold" style={{ color: 'var(--ink)' }}>{details.productReturnCount || 0}</p>
                            </div>
                            <div className="p-4 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                                <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Salary Payments</p>
                                <p className="text-xl font-bold" style={{ color: 'var(--ink)' }}>{details.salaryPaymentCount || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Profit/Loss Calculation breakdown, kept as-is */}
                    <div className="rounded-xl border shadow-sm p-4 mt-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-md font-semibold mb-3" style={{ color: 'var(--ink)' }}>Profit/Loss Calculation</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm" style={{ color: 'var(--ink)' }}>
                                <span>+ Sales:</span>
                                <span>Rs {summary.totalSales?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm" style={{ color: 'var(--ink)' }}>
                                <span>- Purchases:</span>
                                <span>Rs {summary.totalPurchases?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm" style={{ color: 'var(--ink)' }}>
                                <span>- Expenses:</span>
                                <span>Rs {summary.totalExpenses?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm" style={{ color: 'var(--ink)' }}>
                                <span>- Wastage:</span>
                                <span>Rs {summary.totalWastage?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm" style={{ color: 'var(--ink)' }}>
                                <span>- Salaries:</span>
                                <span>Rs {summary.totalSalaries?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm" style={{ color: 'var(--ink)' }}>
                                <span>- Sale Returns:</span>
                                <span>Rs {summary.totalProductReturns?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm" style={{ color: 'var(--ink)' }}>
                                <span>+ Purchase Returns:</span>
                                <span>Rs {summary.totalPurchaseReturns?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold pt-2 border-t" style={{ borderColor: 'var(--border)', color: summary.netProfit >= 0 ? '#10b981' : '#dc2626' }}>
                                <span>= Net:</span>
                                <span>Rs {summary.netProfit?.toLocaleString() || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <PdfPreviewModal
                isOpen={isPdfModalOpen}
                onClose={() => setIsPdfModalOpen(false)}
                fileName="main-business-report.pdf"
                onBeforeExport={handleExpandAll}
                onAfterExport={handleCollapseAll}
            >
                {/* PDF export reuses the same on-screen ref content; keeping simple summary for print */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <KpiCard label="Total Sales" value={summary.totalSales} icon={ShoppingCart} color="#10b981" description="Revenue from completed orders" />
                    <KpiCard label="Total Purchases" value={summary.totalPurchases} icon={Package} color="#3b82f6" description="Cost of inventory purchases" />
                    <KpiCard label="Total Expenses" value={summary.totalExpenses} icon={Receipt} color="#ef4444" description="Operating expenses" />
                    <KpiCard label="Total Salaries" value={summary.totalSalaries} icon={Users} color="#8b5cf6" description="Staff salary payments" />
                    <KpiCard label="Purchase Returns" value={summary.totalPurchaseReturns} icon={TrendingUp} color="#06b6d4" description="Returns to suppliers" />
                    <KpiCard label="Sale Returns" value={summary.totalProductReturns} icon={TrendingDown} color="#f59e0b" description="Customer product returns" />
                    <KpiCard label="Wastage Loss" value={summary.totalWastage} icon={AlertCircle} color="#dc2626" description="Inventory wastage cost" />
                    <KpiCard label="Net Profit/Loss" value={summary.netProfit} icon={summary.netProfit >= 0 ? DollarSign : AlertCircle} color={summary.netProfit >= 0 ? "#10b981" : "#dc2626"} description={summary.netProfit >= 0 ? "Net profit for period" : "Net loss for period"} />
                </div>

                <div className="space-y-4">
                    <SourceSection title="Sales" icon={ShoppingCart} color="#10b981" kpiValue={summary.totalSales} kpiDescription="Revenue from completed POS orders" count={details.salesCount || 0} breakdown={breakdowns.salesByPaymentMethod} breakdownLabelKey="method" transactions={transactions.sales} transactionType="sales" isExpanded={true} onToggle={() => {}} />
                    <SourceSection title="Purchases" icon={Package} color="#3b82f6" kpiValue={summary.totalPurchases} kpiDescription="Cost of inventory purchases" count={details.purchaseCount || 0} transactions={transactions.purchases} transactionType="purchases" isExpanded={true} onToggle={() => {}} />
                    <SourceSection title="Expenses" icon={Receipt} color="#ef4444" kpiValue={summary.totalExpenses} kpiDescription="Operating expenses" count={details.expenseCount || 0} breakdown={breakdowns.expensesByCategory} breakdownLabelKey="category" transactions={transactions.expenses} transactionType="expenses" isExpanded={true} onToggle={() => {}} />
                    <SourceSection title="Salaries" icon={Users} color="#8b5cf6" kpiValue={summary.totalSalaries} kpiDescription="Staff salary payments" count={details.salaryPaymentCount || 0} breakdown={breakdowns.salariesByStaff} breakdownLabelKey="staffName" transactions={transactions.salaryPayments} transactionType="salaryPayments" isExpanded={true} onToggle={() => {}} />
                    <SourceSection title="Purchase Returns" icon={TrendingUp} color="#06b6d4" kpiValue={summary.totalPurchaseReturns} kpiDescription="Returns sent back to suppliers" count={details.purchaseReturnCount || 0} breakdown={breakdowns.purchaseReturnsBySupplier} breakdownLabelKey="supplierName" transactions={transactions.purchaseReturns} transactionType="purchaseReturns" isExpanded={true} onToggle={() => {}} />
                    <SourceSection title="Sale Returns" icon={TrendingDown} color="#f59e0b" kpiValue={summary.totalProductReturns} kpiDescription="Customer product returns" count={details.productReturnCount || 0} breakdown={breakdowns.productReturnsByReason} breakdownLabelKey="reason" transactions={transactions.productReturns} transactionType="productReturns" isExpanded={true} onToggle={() => {}} />
                    <SourceSection title="Wastage" icon={AlertCircle} color="#dc2626" kpiValue={summary.totalWastage} kpiDescription="Inventory wastage cost" count={details.wastageCount || 0} transactions={transactions.wastages} transactionType="wastages" isExpanded={true} onToggle={() => {}} />
                </div>
            </PdfPreviewModal>
        </div>
    );
}
import React, { useState } from "react";
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, DollarSign, ShoppingCart, Package, Receipt, Users, AlertCircle, Wallet, ArrowDownRight, ArrowUpRight, HandCoins } from "lucide-react";

function KpiCard({ label, description, value, icon: Icon, color, isCurrency = true }) {
    return (
        <div
            className="rounded-xl border shadow-sm p-5 transition-shadow hover:shadow-md"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{label}</p>
                    {description && (
                        <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--muted)' }}>{description}</p>
                    )}
                </div>
                <div
                    className="shrink-0 rounded-lg p-2 flex items-center justify-center"
                    style={{ background: `${color}1A` }}
                >
                    <Icon size={18} style={{ color }} />
                </div>
            </div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                {isCurrency ? `Rs ${value?.toLocaleString() || 0}` : (value?.toLocaleString() || 0)}
            </p>
        </div>
    );
}

function BreakdownItem({ label, value, count, percentage, color }) {
    return (
        <div className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>{label}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{count} transactions</p>
            </div>
            <div className="text-right shrink-0 pl-3">
                <p className="text-sm font-bold tabular-nums" style={{ color }}>Rs {value?.toLocaleString() || 0}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{percentage}%</p>
            </div>
        </div>
    );
}

function renderTransactionRow(transaction, type) {
    switch (type) {
        case 'sales':
            return (
                <>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.orderNumber}</td>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.customerName || 'N/A'}</td>
                    <td className="px-4 py-2 text-sm capitalize" style={{ color: 'var(--ink)' }}>{transaction.paymentMethod}</td>
                    <td className="px-4 py-2 text-sm font-medium text-right tabular-nums" style={{ color: '#10b981' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        case 'purchases':
            return (
                <>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.invoiceNumber}</td>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.supplierName || 'N/A'}</td>
                    <td className="px-4 py-2 text-sm font-medium text-right tabular-nums" style={{ color: '#3b82f6' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        case 'expenses':
            return (
                <>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.title}</td>
                    <td className="px-4 py-2 text-sm capitalize" style={{ color: 'var(--ink)' }}>{transaction.category}</td>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--muted)' }}>{transaction.description || '-'}</td>
                    <td className="px-4 py-2 text-sm font-medium text-right tabular-nums" style={{ color: '#ef4444' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        case 'wastages':
            return (
                <>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.productName}</td>
                    <td className="px-4 py-2 text-sm text-right tabular-nums" style={{ color: 'var(--ink)' }}>{transaction.quantity}</td>
                    <td className="px-4 py-2 text-sm text-right tabular-nums" style={{ color: 'var(--ink)' }}>Rs {transaction.costPrice?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2 text-sm font-medium text-right tabular-nums" style={{ color: '#dc2626' }}>Rs {transaction.totalLoss?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        case 'purchaseReturns':
            return (
                <>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.returnNumber}</td>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.supplierName || 'N/A'}</td>
                    <td className="px-4 py-2 text-sm font-medium text-right tabular-nums" style={{ color: '#06b6d4' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        case 'productReturns':
            return (
                <>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.returnNumber}</td>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.customerName || 'N/A'}</td>
                    <td className="px-4 py-2 text-sm font-medium text-right tabular-nums" style={{ color: '#f59e0b' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        case 'salaryPayments':
            return (
                <>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.staffName}</td>
                    <td className="px-4 py-2 text-sm font-medium text-right tabular-nums" style={{ color: '#8b5cf6' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
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
                    <thead className="bg-(--surface-muted)">
                        <tr>
                            {getTableHeaders(type, labels).map((header, idx) => (
                                <th key={idx} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                        {transactions.slice(0, 50).map((transaction, idx) => (
                            <tr key={idx} className="hover:bg-(--surface-muted) transition-colors">
                                {renderTransactionRow(transaction, type)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {transactions.length > 50 && (
                <div className="px-4 py-2 text-xs text-center border-t" style={{ color: 'var(--muted)', borderColor: 'var(--border)', background: 'var(--surface-muted)' }}>
                    {labels.showingFirst50} {transactions.length} {labels.transactions}
                </div>
            )}
        </div>
    );
}

// ---------- Mini metric chip — soft, inline, shown even when collapsed ----------
function MetricChip({ label, value, isCurrency = true, showPercentage = false, color }) {
    if (value === undefined || value === null) return null;
    const displayValue = isCurrency ? `Rs ${Number(value).toLocaleString()}` : `${Number(value).toLocaleString()}${showPercentage ? '%' : ''}`;
    
    return (
        <div
            className="flex flex-col items-start px-3.5 py-2.5 rounded-xl min-w-[110px]"
            style={{ 
                background: `linear-gradient(135deg, ${color}08 0%, var(--surface-muted) 100%)`,
                border: `1px solid ${color}30`
            }}
        >
            <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                <p className="text-[10px] font-semibold uppercase tracking-wide truncate" style={{ color: 'var(--muted)' }}>{label}</p>
            </div>
            <p className="text-sm font-bold tabular-nums truncate" style={{ color: color || 'var(--ink)' }}>
                {displayValue}
            </p>
        </div>
    );
}

function SourceSection({ eyebrow, title, description, icon: Icon, color, kpiValue, count, metrics, breakdown, breakdownLabelKey, transactions, transactionType, isExpanded, onToggle, extraBreakdown, labels }) {
    return (
        <div className="rounded-xl border shadow-sm overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between gap-4 p-5 text-left"
            >
                <div className="flex items-start gap-3 min-w-0">
                    <div
                        className="shrink-0 rounded-lg p-2.5 flex items-center justify-center"
                        style={{ background: `${color}1A` }}
                    >
                        <Icon size={20} style={{ color }} />
                    </div>
                    <div className="min-w-0">
                        {eyebrow && (
                            <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color }}>
                                {eyebrow}
                            </p>
                        )}
                        <h3 className="text-md font-semibold" style={{ color: 'var(--ink)' }}>{title}</h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                            {description} · {count} {labels.transactions}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <p className="text-xl font-bold tabular-nums text-right" style={{ color }}>Rs {kpiValue?.toLocaleString() || 0}</p>
                    {isExpanded ? <ChevronUp size={20} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={20} style={{ color: 'var(--muted)' }} />}
                </div>
            </button>

            {/* Metrics row - always visible */}
            {metrics && metrics.length > 0 && (
                <div className="px-5 py-3 border-t flex flex-wrap gap-2" style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)' }}>
                    {metrics.map((metric, idx) => (
                        <MetricChip
                            key={idx}
                            label={metric.label}
                            value={metric.value}
                            isCurrency={metric.isCurrency}
                            color={metric.color || color}
                        />
                    ))}
                </div>
            )}

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

function GroupHeading({ eyebrow, title, description }) {
    return (
        <div className="mb-4">
            {eyebrow && (
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--accent-2)' }}>
                    {eyebrow}
                </p>
            )}
            <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>{title}</h2>
            {description && (
                <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{description}</p>
            )}
        </div>
    );
}

export default function MainBusinessReportPdfTemplate({ summary = {}, details = {}, breakdowns = {}, transactions = {}, labels = {}, selectedPeriodLabel = '', initialExpandedSections = {} }) {
    const [expandedSections, setExpandedSections] = useState(() => ({
        sales: true,
        purchases: true,
        expenses: true,
        salaries: true,
        purchaseReturns: true,
        productReturns: true,
        wastages: true,
        qarza: true,
        ...initialExpandedSections,
    }));

    const qarzaNet = (summary.totalReceivable || 0) - (summary.totalPayable || 0);
    const isProfit = summary.netProfit >= 0;

    const toggleSection = (key) => {
        setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="p-6 bg-(--app-bg) text-(--ink) min-h-screen">
            <div className="mb-6">
                <h1 className="text-2xl font-bold font-display">{labels.mainBusinessReport}</h1>
                <p className="text-sm text-(--muted)">{labels.businessOverview} · {selectedPeriodLabel}</p>
            </div>

            <div className="mb-8">
                <div
                    className="rounded-2xl border-2 shadow-sm p-6 md:p-7 relative overflow-hidden"
                    style={{
                        background: `linear-gradient(135deg, ${isProfit ? '#10b98112' : '#dc262612'} 0%, var(--surface) 55%)`,
                        borderColor: isProfit ? '#10b981' : '#dc2626'
                    }}
                >
                    <div className="flex items-start justify-between flex-wrap gap-6">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
                                {labels.finalBusinessResult}
                            </p>
                            <div className="flex items-center gap-2 mb-1">
                                <Wallet size={24} style={{ color: isProfit ? '#10b981' : '#dc2626' }} />
                                <span className="text-base font-semibold" style={{ color: isProfit ? '#10b981' : '#dc2626' }}>
                                    {isProfit ? labels.profit : labels.loss}
                                </span>
                            </div>
                            <p className="text-4xl font-bold tabular-nums" style={{ color: isProfit ? '#10b981' : '#dc2626' }}>
                                Rs {Math.abs(summary.netProfit || 0).toLocaleString()}
                            </p>
                            <p className="text-xs mt-2 max-w-md" style={{ color: 'var(--muted)' }}>
                                {labels.businessFormula}
                            </p>
                        </div>

                        <div className="flex gap-6 md:gap-8">
                            <div className="text-right">
                                <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>{labels.netMargin}</p>
                                <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>{summary.netMarginPercentage || 0}%</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>{labels.netQarza}</p>
                                <p className="text-2xl font-bold tabular-nums" style={{ color: qarzaNet >= 0 ? '#0f766e' : '#7c3aed' }}>
                                    Rs {qarzaNet.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <GroupHeading
                    eyebrow={labels.overview}
                    title={labels.overview}
                    description={`${labels.businessOverview} — ${selectedPeriodLabel}`}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        label={labels.totalSales}
                        description={labels.revenueFromCompletedOrders}
                        value={summary.totalSales}
                        icon={ShoppingCart}
                        color="#10b981"
                    />
                    <KpiCard
                        label={labels.totalPurchases}
                        description={labels.costOfInventoryPurchases}
                        value={summary.totalPurchases}
                        icon={Package}
                        color="#3b82f6"
                    />
                    <KpiCard
                        label={labels.totalExpenses}
                        description={labels.operatingExpenses}
                        value={summary.totalExpenses}
                        icon={Receipt}
                        color="#ef4444"
                    />
                    <KpiCard
                        label={labels.totalSalaries}
                        description={labels.staffSalaryPayments}
                        value={summary.totalSalaries}
                        icon={Users}
                        color="#8b5cf6"
                    />
                </div>
            </div>

            <div className="mb-8">
                <GroupHeading
                    title={labels.returnsAndWastage}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        label={labels.purchaseReturns}
                        description={labels.returnsSentToSuppliers || labels.returnsToSuppliers}
                        value={summary.totalPurchaseReturns}
                        icon={TrendingUp}
                        color="#06b6d4"
                    />
                    <KpiCard
                        label={labels.saleReturns}
                        description={labels.customerProductReturns}
                        value={summary.totalProductReturns}
                        icon={TrendingDown}
                        color="#f59e0b"
                    />
                    <KpiCard
                        label={labels.wastageLoss}
                        description={labels.inventoryWastageCost}
                        value={summary.totalWastage}
                        icon={AlertCircle}
                        color="#dc2626"
                    />
                    <KpiCard
                        label={labels.saleCount}
                        description={labels.revenueFromCompletedOrders}
                        value={details.salesCount}
                        icon={ShoppingCart}
                        color="#2563eb"
                        isCurrency={false}
                    />
                </div>
            </div>

            <div className="mb-8">
                <GroupHeading
                    title={labels.profitability}
                    description={labels.businessFormula}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        label={labels.grossProfit}
                        description={`${labels.totalSales} − ${labels.totalPurchases}`}
                        value={summary.grossProfit}
                        icon={TrendingUp}
                        color="#16a34a"
                    />
                    <KpiCard
                        label={labels.netProfitLoss}
                        description={isProfit ? labels.netProfitForPeriod : labels.netLossForPeriod}
                        value={summary.netProfit}
                        icon={isProfit ? DollarSign : AlertCircle}
                        color={isProfit ? "#10b981" : "#dc2626"}
                    />
                    <KpiCard
                        label={labels.receivable}
                        description={labels.qarzaReceivablePayable}
                        value={summary.totalReceivable}
                        icon={ArrowDownRight}
                        color="#0f766e"
                    />
                    <KpiCard
                        label={labels.payable}
                        description={labels.qarzaReceivablePayable}
                        value={summary.totalPayable}
                        icon={ArrowUpRight}
                        color="#7c3aed"
                    />
                </div>
            </div>

            <div>
                <GroupHeading
                    title={labels.paymentSourceSections}
                    description={labels.businessOverview}
                />
                <div className="space-y-4">
                    <SourceSection
                        eyebrow={labels.sales}
                        title={labels.sales}
                        description={labels.revenueFromCompletedOrders}
                        icon={ShoppingCart}
                        color="#10b981"
                        kpiValue={summary.totalSales}
                        count={details.salesCount || 0}
                        metrics={[
                            { label: labels.grossProfit || 'Margin', value: summary.salesMargin, isCurrency: true },
                            { label: labels.retailSales || 'Retail', value: summary.retailSales, isCurrency: true },
                            { label: labels.wholesaleSales || 'Wholesale', value: summary.wholesaleSales, isCurrency: true },
                            { label: labels.avgOrderValue || 'Avg Order', value: details.avgOrderValue, isCurrency: true },
                        ]}
                        breakdown={breakdowns.salesByPaymentMethod}
                        breakdownLabelKey="method"
                        transactions={transactions.sales}
                        transactionType="sales"
                        isExpanded={!!expandedSections.sales}
                        onToggle={() => toggleSection('sales')}
                        labels={labels}
                    />
                    <SourceSection
                        eyebrow={labels.purchases}
                        title={labels.purchases}
                        description={labels.costOfInventoryPurchases}
                        icon={Package}
                        color="#3b82f6"
                        kpiValue={summary.totalPurchases}
                        count={details.purchaseCount || 0}
                        metrics={[
                            { label: 'Avg Invoice', value: details.avgPurchaseValue, isCurrency: true },
                            { label: 'Suppliers', value: details.supplierCount, isCurrency: false, showPercentage: false },
                        ]}
                        breakdown={breakdowns.purchasesBySupplier} breakdownLabelKey="supplierName"
                        transactions={transactions.purchases}
                        transactionType="purchases"
                        isExpanded={!!expandedSections.purchases}
                        onToggle={() => toggleSection('purchases')}
                        labels={labels}
                    />
                    <SourceSection
                        eyebrow={labels.expenses}
                        title={labels.expenses}
                        description={labels.operatingExpenses}
                        icon={Receipt}
                        color="#ef4444"
                        kpiValue={summary.totalExpenses}
                        count={details.expenseCount || 0}
                        metrics={[{ label: 'Avg/Txn', value: details.avgExpenseValue, isCurrency: true }]}
                        breakdown={breakdowns.expensesByCategory}
                        breakdownLabelKey="category"
                        transactions={transactions.expenses}
                        transactionType="expenses"
                        isExpanded={!!expandedSections.expenses}
                        onToggle={() => toggleSection('expenses')}
                        labels={labels}
                    />
                    <SourceSection
                        eyebrow={labels.salaries}
                        title={labels.salaries}
                        description={labels.staffSalaryPayments}
                        icon={Users}
                        color="#8b5cf6"
                        kpiValue={summary.totalSalaries}
                        count={details.salaryPaymentCount || 0}
                        metrics={[
                            { label: 'Avg/Staff', value: details.avgSalaryPerStaff, isCurrency: true },
                            { label: 'Staff Count', value: details.staffCount, isCurrency: false, showPercentage: false },
                        ]}
                        breakdown={breakdowns.salariesByStaff}
                        breakdownLabelKey="staffName"
                        transactions={transactions.salaryPayments}
                        transactionType="salaryPayments"
                        isExpanded={!!expandedSections.salaries}
                        onToggle={() => toggleSection('salaries')}
                        labels={labels}
                    />
                    <SourceSection
                        eyebrow={labels.purchaseReturns}
                        title={labels.purchaseReturns}
                        description={labels.returnsSentToSuppliers}
                        icon={TrendingUp}
                        color="#06b6d4"
                        kpiValue={summary.totalPurchaseReturns}
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
                        eyebrow={labels.saleReturns}
                        title={labels.saleReturns}
                        description={labels.customerProductReturns}
                        icon={TrendingDown}
                        color="#f59e0b"
                        kpiValue={summary.totalProductReturns}
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
                        eyebrow={labels.wastage}
                        title={labels.wastage}
                        description={labels.inventoryWastageCost}
                        icon={AlertCircle}
                        color="#dc2626"
                        kpiValue={summary.totalWastage}
                        count={details.wastageCount || 0}
                        metrics={[{ label: '% of Purchases', value: details.wastagePercentOfPurchases, isCurrency: false, showPercentage: true }]}
                        transactions={transactions.wastages}
                        transactionType="wastages"
                        isExpanded={!!expandedSections.wastages}
                        onToggle={() => toggleSection('wastages')}
                        labels={labels}
                        extraBreakdown={breakdowns.wastagesByProduct && breakdowns.wastagesByProduct.length > 0 && (
                            <div className="mb-4">
                                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>{labels.byProduct}</p>
                                <div className="space-y-0">
                                    {breakdowns.wastagesByProduct.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
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
                    <SourceSection
                        eyebrow={labels.qarza || labels.qarzaReceivablePayable} title={labels.qarzaReceivablePayable} description={labels.outstandingCredit}
                        icon={HandCoins} color="#0f766e" kpiValue={qarzaNet} count={details.qarzaReceivableCount + details.qarzaPayableCount || 0}
                        metrics={[
                            { label: labels.receivable, value: summary.totalReceivable, isCurrency: true, color: '#0f766e' },
                            { label: labels.payable, value: summary.totalPayable, isCurrency: true, color: '#7c3aed' },
                        ]}
                        isExpanded={!!expandedSections.qarza} onToggle={() => toggleSection('qarza')} labels={labels}
                    />
                </div>
            </div>
        </div>
    );
}

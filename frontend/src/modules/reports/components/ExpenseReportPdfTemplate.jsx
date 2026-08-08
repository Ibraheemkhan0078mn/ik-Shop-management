import React, { useState } from "react";
import { Receipt, DollarSign, TrendingUp, BarChart3, Percent, ChevronDown, ChevronUp } from "lucide-react";

function KpiCard({ label, value, icon: Icon, color, description, isCurrency = true }) {
    return (
        <div className="card p-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                    <Icon size={20} style={{ color }} />
                </div>
                <div>
                    <p className="text-xs text-[var(--muted)] uppercase font-bold">{label}</p>
                    <p className="font-semibold text-[var(--ink)]">
                        {isCurrency ? `Rs ${value?.toLocaleString() || 0}` : (value?.toLocaleString() || value || 0)}
                    </p>
                </div>
            </div>
            {description && (
                <p className="text-xs mt-2 text-[var(--muted)]">{description}</p>
            )}
        </div>
    );
}

function BreakdownItem({ label, value, count, percentage, color }) {
    return (
        <div className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                <div>
                    <p className="text-sm font-medium text-[var(--ink)]">{label}</p>
                    <p className="text-xs text-[var(--muted)]">{count} transactions</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-sm font-bold" style={{ color }}>Rs {value?.toLocaleString() || 0}</p>
                <p className="text-xs text-[var(--muted)]">{percentage}%</p>
            </div>
        </div>
    );
}

function ExpenseTransactionRow({ expense, index }) {
    return (
        <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
            <td className="py-3 px-4 text-sm text-[var(--ink)]">{index + 1}</td>
            <td className="py-3 px-4 text-sm font-medium text-[var(--ink)]">
                Rs {expense.amount?.toLocaleString() || 0}
            </td>
            <td className="py-3 px-4 text-sm text-[var(--ink)]">{expense.type || '—'}</td>
            <td className="py-3 px-4 text-sm text-[var(--ink)]">{expense.category || '—'}</td>
            <td className="py-3 px-4 text-sm text-[var(--muted)]">{expense.notes || '—'}</td>
            <td className="py-3 px-4 text-sm text-[var(--muted)]">
                {new Date(expense.date).toLocaleDateString()}
            </td>
        </tr>
    );
}

function TransactionTable({ transactions }) {
    if (!transactions || transactions.length === 0) {
        return <p className="text-sm py-4 text-center text-[var(--muted)]">No transactions in this period.</p>;
    }
    return (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead style={{ background: 'var(--surface-muted)' }}>
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-[var(--muted)]">#</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-[var(--muted)]">Amount</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-[var(--muted)]">Type</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-[var(--muted)]">Category</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-[var(--muted)]">Notes</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-[var(--muted)]">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                        {transactions.slice(0, 50).map((expense, idx) => (
                            <tr key={idx} className="hover:bg-[var(--surface-muted)]">
                                <ExpenseTransactionRow expense={expense} index={idx} />
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {transactions.length > 50 && (
                <div className="px-4 py-2 text-xs text-center text-[var(--muted)]">
                    Showing first 50 of {transactions.length} transactions
                </div>
            )}
        </div>
    );
}

function SourceSection({ title, icon: Icon, color, kpiValue, kpiDescription, count, breakdown, breakdownLabelKey, transactions, isExpanded, onToggle }) {
    return (
        <div className="card">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-5 text-left"
            >
                <div className="flex items-center gap-3">
                    <Icon size={22} style={{ color }} />
                    <div>
                        <h3 className="text-md font-semibold text-[var(--ink)]">{title}</h3>
                        <p className="text-xs text-[var(--muted)]">{kpiDescription} • {count} items</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <p className="text-xl font-bold" style={{ color }}>Rs {kpiValue?.toLocaleString() || 0}</p>
                    {isExpanded ? <ChevronUp size={20} className="text-[var(--muted)]" /> : <ChevronDown size={20} className="text-[var(--muted)]" />}
                </div>
            </button>

            {isExpanded && (
                <div className="px-5 pb-5 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                    {breakdown && breakdown.length > 0 && (
                        <div className="mb-4">
                            <p className="text-sm font-semibold mb-2 text-[var(--ink)]">Breakdown</p>
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
                    <div>
                        <p className="text-sm font-semibold mb-2 text-[var(--ink)]">Transactions</p>
                        <TransactionTable transactions={transactions} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ExpenseReportPdfTemplate({ summary = {}, details = {}, breakdowns = {}, transactions = {}, labels = {}, selectedPeriodLabel = '' }) {
    const [expandedSections, setExpandedSections] = useState({
        categories: true,
        types: true,
    });

    const toggleSection = (key) => {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="p-6 bg-[var(--app-bg)] text-[var(--ink)] min-h-screen">
            <div className="mb-6">
                <h1 className="text-2xl font-bold font-display">{labels.expenseReport}</h1>
                <p className="text-sm text-[var(--muted)]">{labels.expenseAnalysis} · {selectedPeriodLabel}</p>
            </div>

            {/* KPI Grid Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <KpiCard 
                    label={labels.totalExpenses} 
                    value={summary.totalExpenses} 
                    icon={DollarSign} 
                    color="#ef4444" 
                    description={`${details.expenseCount || 0} ${labels.transactions}`} 
                />
                <KpiCard 
                    label={labels.averageExpense} 
                    value={summary.averageExpense} 
                    icon={BarChart3} 
                    color="#3b82f6" 
                    description={labels.perTransaction}
                />
                <KpiCard 
                    label={labels.highestExpense} 
                    value={summary.highestExpense} 
                    icon={TrendingUp} 
                    color="#f59e0b" 
                    description={labels.largestTransaction}
                />
                <KpiCard 
                    label={labels.categories} 
                    value={details.categoryCount || 0} 
                    icon={Receipt} 
                    color="#8b5cf6" 
                    description={labels.typesOfExpenses} 
                    isCurrency={false}
                />
            </div>

            {/* KPI Grid Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KpiCard 
                    label={labels.dailyAverage} 
                    value={summary.dailyAverage} 
                    icon={DollarSign} 
                    color="#10b981" 
                    description={labels.averagePerDay}
                />
                <KpiCard 
                    label={labels.lowestExpense} 
                    value={summary.lowestExpense} 
                    icon={DollarSign} 
                    color="#06b6d4" 
                    description={labels.smallestTransaction}
                />
                <KpiCard 
                    label={labels.weeklyAverage} 
                    value={summary.weeklyAverage || 0} 
                    icon={DollarSign} 
                    color="#059669" 
                    description={labels.averagePerWeek}
                />
                <KpiCard 
                    label={labels.monthlyProjection} 
                    value={summary.monthlyProjection || 0} 
                    icon={TrendingUp} 
                    color="#7c3aed" 
                    description={labels.estimatedMonthly}
                />
            </div>

            {/* Summary Card */}
            <div className="card p-6 mb-6 border-2" style={{ borderColor: '#ef4444' }}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Receipt size={22} style={{ color: '#ef4444' }} />
                            <span className="text-sm font-semibold text-[var(--muted)]">{labels.expenseSummary}</span>
                        </div>
                        <p className="text-3xl font-bold" style={{ color: '#ef4444' }}>
                            Rs {(summary.totalExpenses || 0).toLocaleString()}
                        </p>
                        <p className="text-xs mt-1 text-[var(--muted)]">
                            {labels.totalOperatingExpenses}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-[var(--muted)]">{labels.expenseCount}</p>
                        <p className="text-2xl font-bold text-[var(--ink)]">{details.expenseCount || 0}</p>
                        <p className="text-sm mt-2 text-[var(--muted)]">{labels.avgPerTransaction}</p>
                        <p className="text-lg font-bold text-[var(--ink)]">Rs {(summary.averageExpense || 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Detailed Sections */}
            <div className="space-y-4 mb-6">
                <h2 className="text-lg font-semibold text-[var(--ink)]">{labels.expenseBreakdown}</h2>

                {/* Categories Section */}
                <SourceSection
                    title={labels.expensesByCategory}
                    icon={Receipt}
                    color="#ef4444"
                    kpiValue={summary.totalExpenses}
                    kpiDescription={labels.totalExpenses}
                    count={details.categoryCount || 0}
                    breakdown={breakdowns.expensesByCategory}
                    breakdownLabelKey="category"
                    transactions={transactions.expenses}
                    isExpanded={!!expandedSections.categories}
                    onToggle={() => toggleSection('categories')}
                />

                {/* Types Section */}
                {breakdowns.expensesByType && breakdowns.expensesByType.length > 0 && (
                    <SourceSection
                        title={labels.expensesByType}
                        icon={BarChart3}
                        color="#3b82f6"
                        kpiValue={summary.totalExpenses}
                        kpiDescription={labels.totalExpenses}
                        count={details.typeCount || 0}
                        breakdown={breakdowns.expensesByType}
                        breakdownLabelKey="type"
                        isExpanded={!!expandedSections.types}
                        onToggle={() => toggleSection('types')}
                    />
                )}
            </div>

            {/* Additional Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--accent-2)]/10 flex items-center justify-center">
                            <Percent size={20} className="text-[var(--accent-2)]" />
                        </div>
                        <div>
                            <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.highestCategory}</p>
                            <p className="font-semibold text-[var(--ink)]">{summary.topCategoryPercentage || 0}%</p>
                        </div>
                    </div>
                    <p className="text-xs mt-2 text-[var(--muted)]">{labels.percentageOfTopCategory}</p>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--accent-2)]/10 flex items-center justify-center">
                            <Receipt size={20} className="text-[var(--accent-2)]" />
                        </div>
                        <div>
                            <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.topCategory}</p>
                            <p className="font-semibold text-[var(--ink)]">{summary.topCategory || 'N/A'}</p>
                        </div>
                    </div>
                    <p className="text-xs mt-2 text-[var(--muted)]">{labels.highestSpendingCategory}</p>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--accent-2)]/10 flex items-center justify-center">
                            <TrendingUp size={20} className="text-[var(--accent-2)]" />
                        </div>
                        <div>
                            <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.trend}</p>
                            <p className="font-semibold text-[var(--ink)]">
                                {summary.trend > 0 ? 'Increasing' : (summary.trend < 0 ? 'Decreasing' : 'Stable')}
                            </p>
                        </div>
                    </div>
                    <p className="text-xs mt-2 text-[var(--muted)]">{labels.comparedToPreviousPeriod}</p>
                </div>
            </div>
        </div>
    );
}

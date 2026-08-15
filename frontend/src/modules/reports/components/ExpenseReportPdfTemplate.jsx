import React from "react";
import { Receipt, DollarSign, TrendingUp, BarChart3 } from "lucide-react";

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


export default function ExpenseReportPdfTemplate({ summary = {}, details = {}, breakdowns = {}, transactions = {}, labels = {}, selectedPeriodLabel = '' }) {

    return (
        <div className="p-6 bg-[var(--app-bg)] text-[var(--ink)] min-h-screen">
            <div className="mb-6">
                <h1 className="text-2xl font-bold font-display">{labels.expenseReport}</h1>
                <p className="text-sm text-[var(--muted)]">{labels.expenseAnalysis} · {selectedPeriodLabel}</p>
            </div>

            {/* Single Card with Inline KPIs */}
            <div className="card">
                {/* KPI Cards - Inline */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--accent-2)]/10 flex items-center justify-center">
                            <DollarSign size={20} className="text-[var(--accent-2)]" />
                        </div>
                        <div>
                            <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.totalExpenses}</p>
                            <p className="font-semibold text-[var(--ink)]">
                                Rs {(summary.totalExpenses || 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <TrendingUp size={20} className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.averageExpense}</p>
                            <p className="font-semibold text-red-600">
                                Rs {(summary.averageExpense || 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <Receipt size={20} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.categories}</p>
                            <p className="font-semibold text-green-600">
                                {details.categoryCount || 0}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <BarChart3 size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.transactions}</p>
                            <p className="font-semibold text-blue-600">
                                {details.expenseCount || 0}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Detailed Sections - Flat Preview */}
                <div className="p-4 space-y-6">
                    {/* Categories Breakdown */}
                    <div>
                        <h3 className="text-md font-semibold text-[var(--ink)] mb-4">{labels.expensesByCategory}</h3>
                        {breakdowns.expensesByCategory && breakdowns.expensesByCategory.length > 0 ? (
                            <div className="space-y-2">
                                {breakdowns.expensesByCategory.map((item, idx) => (
                                    <BreakdownItem
                                        key={idx}
                                        label={item.category}
                                        value={item.total}
                                        count={item.count}
                                        percentage={item.percentage}
                                        color="#ef4444"
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-[var(--muted)]">No category data available</p>
                        )}
                    </div>

                    {/* Types Breakdown */}
                    {breakdowns.expensesByType && breakdowns.expensesByType.length > 0 && (
                        <div>
                            <h3 className="text-md font-semibold text-[var(--ink)] mb-4">{labels.expensesByType}</h3>
                            <div className="space-y-2">
                                {breakdowns.expensesByType.map((item, idx) => (
                                    <BreakdownItem
                                        key={idx}
                                        label={item.type}
                                        value={item.total}
                                        count={item.count}
                                        percentage={item.percentage}
                                        color="#3b82f6"
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Transactions Table */}
                    <div>
                        <h3 className="text-md font-semibold text-[var(--ink)] mb-4">{labels.transactions}</h3>
                        <TransactionTable transactions={transactions.expenses} />
                    </div>
                </div>
            </div>
        </div>
    );
}

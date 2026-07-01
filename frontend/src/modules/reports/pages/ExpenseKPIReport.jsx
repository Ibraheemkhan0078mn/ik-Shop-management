import React, { useState } from "react";
import { useGetExpenseKPIReportQuery } from "../services/reports.service";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import { Calendar, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, RefreshCw, Printer, Download, ChevronDown, ChevronUp } from "lucide-react";

const KPICard = ({ label, value, icon: Icon, color, description, trend }) => (
    <div className="rounded-xl border shadow-sm p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: `${color}20` }}>
                    <Icon size={20} style={{ color }} />
                </div>
                <div>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>{label}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: 'var(--ink)' }}>
                        Rs {value?.toLocaleString() || 0}
                    </p>
                </div>
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-xs ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>{Math.abs(trend)}%</span>
                </div>
            )}
        </div>
        {description && (
            <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>{description}</p>
        )}
    </div>
);

const BreakdownItem = ({ label, value, count, percentage, color }) => (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            <div>
                <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{label}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{count} transactions</p>
            </div>
        </div>
        <div className="text-right">
            <p className="text-sm font-bold" style={{ color }}>Rs {value?.toLocaleString() || 0}</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{percentage}%</p>
        </div>
    </div>
);

const ExpenseTransactionRow = ({ expense, index }) => (
    <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
        <td className="py-3 px-4 text-sm" style={{ color: 'var(--ink)' }}>{index + 1}</td>
        <td className="py-3 px-4 text-sm font-medium" style={{ color: 'var(--ink)' }}>
            Rs {expense.amount?.toLocaleString() || 0}
        </td>
        <td className="py-3 px-4 text-sm" style={{ color: 'var(--ink)' }}>{expense.type || '-'}</td>
        <td className="py-3 px-4 text-sm" style={{ color: 'var(--ink)' }}>{expense.category || '-'}</td>
        <td className="py-3 px-4 text-sm" style={{ color: 'var(--muted)' }}>{expense.notes || '-'}</td>
        <td className="py-3 px-4 text-sm" style={{ color: 'var(--muted)' }}>
            {new Date(expense.date).toLocaleDateString()}
        </td>
    </tr>
);

export default function ExpenseKPIReport() {
    const [period, setPeriod] = useState("today");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [expandedSections, setExpandedSections] = useState({});

    const filters = { period };
    if (period === "custom" && fromDate && toDate) {
        filters.fromDate = fromDate;
        filters.toDate = toDate;
    }

    const { data, isLoading, error, refetch } = useGetExpenseKPIReportQuery(filters, {
        refetchOnMountOrArgChange: true,
    });

    if (error) {
        showError(error?.data?.message || "Failed to load expense report");
    }

    const handleRefresh = () => refetch();
    const handlePrint = () => window.print();
    const handleExport = () => console.log("Export functionality to be implemented");

    const toggleSection = (key) => {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const summary = data?.data?.summary || {};
    const breakdowns = data?.data?.breakdowns || {};
    const transactions = data?.data?.transactions || [];

    return (
        <div className="p-6 min-h-screen" style={{ background: 'var(--app-bg)' }}>
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-expanded { display: block !important; }
                }
            `}</style>

            <PageHeading
                heading="Expense Report"
                subheading="Track and analyze your business expenses"
                leftActions={
                    <div onClick={handleRefresh}>
                        <ScreenTabButton lucideIcon={RefreshCw} text="Refresh" />
                    </div>
                }
                rightActions={
                    <>
                        <button onClick={handlePrint} className="p-2 rounded-lg transition-all hover:bg-[var(--surface-muted)] no-print" style={{ color: "var(--muted)" }}>
                            <Printer size={18} />
                        </button>
                        <button onClick={handleExport} className="p-2 rounded-lg transition-all hover:bg-[var(--surface-muted)] no-print" style={{ color: "var(--muted)" }}>
                            <Download size={18} />
                        </button>
                    </>
                }
            />

            {/* Date Filter */}
            <div className="rounded-xl border shadow-sm p-4 mb-6 no-print" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar size={18} style={{ color: 'var(--muted)' }} />
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2"
                            style={{ background: 'var(--surface)', color: 'var(--ink)', borderColor: 'var(--border)' }}
                        >
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>
                    {period === "custom" && (
                        <>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2"
                                style={{ background: 'var(--surface)', color: 'var(--ink)', borderColor: 'var(--border)' }}
                            />
                            <span style={{ color: 'var(--muted)' }}>to</span>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2"
                                style={{ background: 'var(--surface)', color: 'var(--ink)', borderColor: 'var(--border)' }}
                            />
                        </>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--primary)' }} />
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <KPICard
                            label="Total Expenses"
                            value={summary.totalExpenses}
                            icon={DollarSign}
                            color="#ef4444"
                            description="Total money spent in selected period"
                        />
                        <KPICard
                            label="Transaction Count"
                            value={summary.expenseCount}
                            icon={BarChart3}
                            color="#3b82f6"
                            description="Number of expense transactions"
                        />
                        <KPICard
                            label="Average Expense"
                            value={summary.averageExpense}
                            icon={PieChart}
                            color="#8b5cf6"
                            description="Average amount per transaction"
                        />
                        <KPICard
                            label="Daily Average"
                            value={summary.dailyAverage}
                            icon={TrendingUp}
                            color="#10b981"
                            description="Average daily spending"
                        />
                    </div>

                    {/* Additional KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <KPICard
                            label="Highest Expense"
                            value={summary.highestExpense}
                            icon={TrendingUp}
                            color="#f59e0b"
                            description="Largest single expense"
                        />
                        <KPICard
                            label="Lowest Expense"
                            value={summary.lowestExpense}
                            icon={TrendingDown}
                            color="#06b6d4"
                            description="Smallest single expense"
                        />
                    </div>

                    {/* Category Breakdown */}
                    {breakdowns.byCategory && breakdowns.byCategory.length > 0 && (
                        <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <div 
                                className="flex items-center justify-between cursor-pointer mb-4"
                                onClick={() => toggleSection('category')}
                            >
                                <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>
                                    Expenses by Category (Ranked)
                                </h2>
                                {expandedSections.category ? <ChevronUp size={20} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={20} style={{ color: 'var(--muted)' }} />}
                            </div>
                            {(expandedSections.category || window.matchMedia?.('print')?.matches) && (
                                <div className="space-y-2">
                                    {breakdowns.byCategory.map((item, idx) => (
                                        <BreakdownItem
                                            key={idx}
                                            label={item.category}
                                            value={item.total}
                                            count={item.count}
                                            percentage={item.percentage}
                                            color={`hsl(${idx * 45}, 70%, 50%)`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Type Breakdown */}
                    {breakdowns.byType && breakdowns.byType.length > 0 && (
                        <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <div 
                                className="flex items-center justify-between cursor-pointer mb-4"
                                onClick={() => toggleSection('type')}
                            >
                                <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>
                                    Expenses by Type
                                </h2>
                                {expandedSections.type ? <ChevronUp size={20} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={20} style={{ color: 'var(--muted)' }} />}
                            </div>
                            {(expandedSections.type || window.matchMedia?.('print')?.matches) && (
                                <div className="space-y-2">
                                    {breakdowns.byType.map((item, idx) => (
                                        <BreakdownItem
                                            key={idx}
                                            label={item.type}
                                            value={item.total}
                                            count={item.count}
                                            percentage={item.percentage}
                                            color={`hsl(${idx * 60 + 200}, 70%, 50%)`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Transaction List */}
                    {transactions.length > 0 && (
                        <div className="rounded-xl border shadow-sm p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <div 
                                className="flex items-center justify-between cursor-pointer mb-4"
                                onClick={() => toggleSection('transactions')}
                            >
                                <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>
                                    Expense Transactions ({transactions.length})
                                </h2>
                                {expandedSections.transactions ? <ChevronUp size={20} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={20} style={{ color: 'var(--muted)' }} />}
                            </div>
                            {(expandedSections.transactions || window.matchMedia?.('print')?.matches) && (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                                <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                                                    #
                                                </th>
                                                <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                                                    Amount
                                                </th>
                                                <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                                                    Type
                                                </th>
                                                <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                                                    Category
                                                </th>
                                                <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                                                    Notes
                                                </th>
                                                <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                                                    Date
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.slice(0, 50).map((expense, index) => (
                                                <ExpenseTransactionRow key={expense.id} expense={expense} index={index} />
                                            ))}
                                        </tbody>
                                    </table>
                                    {transactions.length > 50 && (
                                        <p className="text-xs mt-3 text-center" style={{ color: 'var(--muted)' }}>
                                            Showing first 50 of {transactions.length} transactions
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

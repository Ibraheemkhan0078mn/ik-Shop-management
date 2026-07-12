import React, { useState, useRef } from "react";
import { Download, RefreshCw, Receipt, DollarSign, TrendingUp, BarChart3, Percent } from "lucide-react";
import { useGetExpenseKPIReportQuery } from "../services/reports.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PdfPreviewModal from "../../../shared/components/PdfPreviewModal.jsx";
import { 
    KpiCard, 
    PeriodFilterBar, 
    LoadingSpinner, 
    SourceSection,
    SummaryCard 
} from "../components/ReportComponents.jsx";

const SECTION_KEYS = ['categories', 'types'];

export default function ExpenseKPIReport() {
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

    const { data, isLoading, error, refetch } = useGetExpenseKPIReportQuery(filters);

    if (error) {
        showError(error?.data?.message || "Failed to load expense report");
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

    const summary = data?.data?.summary || {};
    const details = data?.data?.details || {};
    const breakdowns = data?.data?.breakdowns || {};
    const transactions = data?.data?.transactions || {};

    return (
        <div className="p-6 min-h-screen" style={{ background: 'var(--app-bg)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>Expenses Report</h1>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>Track and analyze all business expenses by category and type</p>
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

            {/* Date filter */}
            <PeriodFilterBar
                period={period}
                onPeriodChange={setPeriod}
                fromDate={fromDate}
                toDate={toDate}
                onFromDateChange={setFromDate}
                onToDateChange={setToDate}
                onExpandAll={handleExpandAll}
                onCollapseAll={handleCollapseAll}
            />

            {/* Content */}
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <div ref={targetRef}>
                    {/* KPI Grid Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <KpiCard 
                            label="Total Expenses" 
                            value={summary.totalExpenses} 
                            icon={DollarSign} 
                            color="#ef4444" 
                            description={`${details.expenseCount || 0} transactions`} 
                        />
                        <KpiCard 
                            label="Average Expense" 
                            value={summary.averageExpense} 
                            icon={BarChart3} 
                            color="#3b82f6" 
                            description="Per transaction"
                        />
                        <KpiCard 
                            label="Highest Expense" 
                            value={summary.highestExpense} 
                            icon={TrendingUp} 
                            color="#f59e0b" 
                            description="Largest transaction"
                        />
                        <KpiCard 
                            label="Categories" 
                            value={details.categoryCount || 0} 
                            icon={Receipt} 
                            color="#8b5cf6" 
                            description="Types of expenses" 
                            isCurrency={false}
                        />
                    </div>

                    {/* KPI Grid Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <KpiCard 
                            label="Daily Average" 
                            value={summary.dailyAverage} 
                            icon={DollarSign} 
                            color="#10b981" 
                            description="Average per day"
                        />
                        <KpiCard 
                            label="Lowest Expense" 
                            value={summary.lowestExpense} 
                            icon={DollarSign} 
                            color="#06b6d4" 
                            description="Smallest transaction"
                        />
                        <KpiCard 
                            label="Weekly Average" 
                            value={summary.weeklyAverage || 0} 
                            icon={DollarSign} 
                            color="#059669" 
                            description="Average per week"
                        />
                        <KpiCard 
                            label="Monthly Projection" 
                            value={summary.monthlyProjection || 0} 
                            icon={TrendingUp} 
                            color="#7c3aed" 
                            description="Estimated monthly"
                        />
                    </div>

                    {/* Summary Card */}
                    <div className="rounded-xl border-2 shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: '#ef4444' }}>
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Receipt size={22} style={{ color: '#ef4444' }} />
                                    <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>EXPENSE SUMMARY</span>
                                </div>
                                <p className="text-3xl font-bold" style={{ color: '#ef4444' }}>
                                    Rs {(summary.totalExpenses || 0).toLocaleString()}
                                </p>
                                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                                    Total operating expenses for selected period
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm" style={{ color: 'var(--muted)' }}>Expense Count</p>
                                <p className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>{details.expenseCount || 0}</p>
                                <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>Avg Per Transaction</p>
                                <p className="text-lg font-bold" style={{ color: 'var(--ink)' }}>Rs {(summary.averageExpense || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Sections */}
                    <div className="space-y-4 mb-6">
                        <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>Expense Breakdown</h2>

                        {/* Categories Section */}
                        <SourceSection
                            title="Expenses by Category"
                            icon={Receipt}
                            color="#ef4444"
                            kpiValue={summary.totalExpenses}
                            kpiDescription="Total expenses"
                            count={details.categoryCount || 0}
                            breakdown={breakdowns.expensesByCategory}
                            breakdownLabelKey="category"
                            transactions={transactions.expenses}
                            transactionType="expenses"
                            isExpanded={!!expandedSections.categories}
                            onToggle={() => toggleSection('categories')}
                        />

                        {/* Types Section */}
                        {breakdowns.expensesByType && breakdowns.expensesByType.length > 0 && (
                            <SourceSection
                                title="Expenses by Type"
                                icon={BarChart3}
                                color="#3b82f6"
                                kpiValue={summary.totalExpenses}
                                kpiDescription="Total expenses by type"
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
                        <SummaryCard 
                            icon={Percent}
                            label="Highest Category %"
                            value={summary.topCategoryPercentage || 0}
                            description="Percentage of top category"
                            isCurrency={false}
                            color="var(--ink)"
                        />
                        <SummaryCard 
                            icon={Receipt}
                            label="Top Expense Category"
                            value={summary.topCategory || 'N/A'}
                            description="Highest spending category"
                            isCurrency={false}
                            color="var(--ink)"
                        />
                        <SummaryCard 
                            icon={TrendingUp}
                            label="Trend"
                            value={summary.trend > 0 ? 'Increasing' : (summary.trend < 0 ? 'Decreasing' : 'Stable')}
                            description="Compared to previous period"
                            isCurrency={false}
                            color={summary.trend > 0 ? '#ef4444' : (summary.trend < 0 ? '#10b981' : 'var(--ink)')}
                        />
                    </div>
                </div>
            )}

            {/* PDF Modal */}
            {isPdfModalOpen && (
                <PdfPreviewModal
                    title="Expenses Report"
                    contentRef={targetRef}
                    onClose={() => setIsPdfModalOpen(false)}
                />
            )}
        </div>
    );
}

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

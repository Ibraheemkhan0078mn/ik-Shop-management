import React, { useState } from "react";
import { RefreshCw, Receipt, DollarSign, TrendingUp, BarChart3, Filter } from "lucide-react";
import { useGetExpenseKPIReportQuery, useGetExpenseCategoryBreakdownQuery, useGetExpenseTransactionsQuery } from "../services/reports.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PdfModal from "../../../shared/components/PdfModal.jsx";
import ExpenseReportPdfTemplate from "../components/ExpenseReportPdfTemplate.jsx";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getReportsLabels } from "../labels/reportsLabels.js";

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
        <>
            <td className="py-3 px-4 text-sm text-[var(--ink)]">{index + 1}</td>
            <td className="py-3 px-4 text-sm font-medium text-[var(--ink)]">
                Rs {expense.amount?.toLocaleString() || 0}
            </td>
            <td className="py-3 px-4 text-sm text-[var(--ink)]">{expense.expenseCategory || '—'}</td>
            <td className="py-3 px-4 text-sm text-[var(--muted)]">{expense.notes || '—'}</td>
            <td className="py-3 px-4 text-sm text-[var(--muted)]">
                {new Date(expense.transactionDate).toLocaleDateString()}
            </td>
        </>
    );
}

function TransactionTable({ transactions, labels, total, page, limit, totalPages, onPageChange }) {
    if (!transactions || transactions.length === 0) {
        return (
            <div className="rounded-lg border p-8 text-center" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                <p className="text-sm text-[var(--muted)]">{labels.noDataFound || 'No transactions in this period.'}</p>
            </div>
        );
    }
    return (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead style={{ background: 'var(--surface-muted)' }}>
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[var(--ink)] tracking-wider border-b" style={{ borderColor: 'var(--border)' }}>#</th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[var(--ink)] tracking-wider border-b" style={{ borderColor: 'var(--border)' }}>{labels.amount || 'Amount'}</th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[var(--ink)] tracking-wider border-b" style={{ borderColor: 'var(--border)' }}>{labels.category || 'Category'}</th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[var(--ink)] tracking-wider border-b" style={{ borderColor: 'var(--border)' }}>{labels.notes || 'Notes'}</th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[var(--ink)] tracking-wider border-b" style={{ borderColor: 'var(--border)' }}>{labels.date || 'Date'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((expense, idx) => (
                            <tr key={expense._id} className="border-b hover:bg-[var(--surface-muted)] transition-colors" style={{ borderColor: 'var(--border)' }}>
                                <ExpenseTransactionRow expense={expense} index={idx} />
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div className="px-4 py-3 flex items-center justify-between border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)' }}>
                    <p className="text-xs text-[var(--muted)]">
                        Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} transactions
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onPageChange(page - 1)}
                            disabled={page === 1}
                            className="px-3 py-1.5 text-xs rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--surface)] transition-colors"
                            style={{ borderColor: 'var(--border)' }}
                        >
                            Previous
                        </button>
                        <span className="px-3 py-1.5 text-xs font-medium text-[var(--ink)]">Page {page} of {totalPages}</span>
                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={page === totalPages}
                            className="px-3 py-1.5 text-xs rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--surface)] transition-colors"
                            style={{ borderColor: 'var(--border)' }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}


export default function ExpenseReport() {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getReportsLabels(language);

    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [period, setPeriod] = useState("month");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [category, setCategory] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);

    const kpiFilters = { period };
    if (period === "custom" && fromDate && toDate) {
        kpiFilters.fromDate = fromDate;
        kpiFilters.toDate = toDate;
    }

    const breakdownFilters = { period };
    if (period === "custom" && fromDate && toDate) {
        breakdownFilters.fromDate = fromDate;
        breakdownFilters.toDate = toDate;
    }

    const transactionsFilters = { period, page: currentPage, limit: 50 };
    if (period === "custom" && fromDate && toDate) {
        transactionsFilters.fromDate = fromDate;
        transactionsFilters.toDate = toDate;
    }
    if (category && category !== 'all') {
        transactionsFilters.category = category;
    }

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const { data: kpiData, isLoading: kpiLoading, error: kpiError } = useGetExpenseKPIReportQuery(kpiFilters);
    const { data: breakdownData, isLoading: breakdownLoading, error: breakdownError } = useGetExpenseCategoryBreakdownQuery(breakdownFilters);
    const { data: transactionsData, isLoading: transactionsLoading, isFetching, error: transactionsError, refetch } = useGetExpenseTransactionsQuery(transactionsFilters);

    if (kpiError) {
        showError(kpiError?.data?.message || "Failed to load expense KPI data");
    }
    if (breakdownError) {
        showError(breakdownError?.data?.message || "Failed to load expense breakdown data");
    }
    if (transactionsError) {
        showError(transactionsError?.data?.message || "Failed to load expense data");
    }

    const handleRefresh = () => refetch();
    const showLoader = kpiLoading || breakdownLoading || transactionsLoading || isFetching;

    const summary = kpiData?.data?.summary || {};
    const breakdowns = breakdownData?.data?.breakdowns || {};
    const transactions = transactionsData?.data || [];
    const expenseCount = summary?.expenseCount || 0;
    const categoryCount = breakdowns?.expensesByCategory?.length || 0;
    const details = {
        expenseCount,
        categoryCount
    };

    return (
        <div className="p-6 min-h-screen bg-[var(--app-bg)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--ink)] font-display">{labels.expenseReport}</h1>
                    <p className="text-sm text-[var(--muted)]">{labels.expenseAnalysis}</p>
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

            {/* Filter bar */}
            <div className="card p-4 mb-6 no-print">
                <div className="flex items-center gap-2 mb-3">
                    <Filter size={16} className="text-[var(--accent-2)]" />
                    <span className="text-sm font-semibold text-[var(--ink)]">{labels.periodFilter}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">{labels.period}</label>
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="today">{labels.today}</option>
                            <option value="month">{labels.thisMonth}</option>
                            <option value="3month">{labels.last3Months}</option>
                            <option value="year">{labels.thisYear}</option>
                            <option value="custom">{labels.customRange}</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">{labels.category}</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="all">{labels.allCategories}</option>
                            <option value="Cash">Cash</option>
                            {breakdowns.expensesByCategory && breakdowns.expensesByCategory.map((cat) => (
                                cat.category !== 'Cash' && <option key={cat.category} value={cat.category}>{cat.category}</option>
                            ))}
                        </select>
                    </div>
                    {period === "custom" && (
                        <>
                            <div>
                                <label className="text-xs font-medium text-[var(--muted)] mb-1 block">{labels.fromDate}</label>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-[var(--muted)] mb-1 block">{labels.toDate}</label>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            {showLoader ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-2)]"></div>
                </div>
            ) : (
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

                        {/* Transactions Table */}
                        <div>
                            <h3 className="text-md font-semibold text-[var(--ink)] mb-4">{labels.transactions}</h3>
                            <TransactionTable 
                                transactions={transactions} 
                                labels={labels} 
                                total={transactionsData?.total || 0}
                                page={currentPage}
                                limit={50}
                                totalPages={transactionsData?.totalPages || 1}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Modal */}
            <PdfModal
                isOpen={isPdfModalOpen}
                onClose={() => setIsPdfModalOpen(false)}
                fileName={`${labels.expenseReport}.pdf`}
                labels={labels}
            >
                <ExpenseReportPdfTemplate
                    summary={kpiData?.data?.summary || {}}
                    details={breakdownData?.data?.summary || {}}
                    breakdowns={breakdownData?.data?.breakdowns || {}}
                    transactions={transactionsData || {}}
                    labels={labels}
                    selectedPeriodLabel={period === "custom" ? `${fromDate} to ${toDate}` : labels[period] || period}
                />
            </PdfModal>
        </div>
    );
}

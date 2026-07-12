import React, { useState, useRef } from "react";
import { Download, RefreshCw, Wallet, TrendingUp, DollarSign, Percent, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useGetFinancialReportQuery } from "../services/reports.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PdfPreviewModal from "../../../shared/components/PdfPreviewModal.jsx";
import { 
    KpiCard, 
    PeriodFilterBar, 
    LoadingSpinner,
    SummaryCard
} from "../components/ReportComponents.jsx";

export default function AccountsReports() {
    const targetRef = useRef(null);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [period, setPeriod] = useState("month");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const filters = { period };
    if (period === "custom" && fromDate && toDate) {
        filters.fromDate = fromDate;
        filters.toDate = toDate;
    }

    const { data, isLoading, error, refetch } = useGetFinancialReportQuery(filters);

    if (error) {
        showError(error?.data?.message || "Failed to load accounts report");
    }

    const handleRefresh = () => refetch();

    const summary = data?.data?.summary || {};
    const details = data?.data?.details || {};

    return (
        <div className="p-6 min-h-screen" style={{ background: 'var(--app-bg)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>Financial & Accounts Report</h1>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>Comprehensive financial overview including cash flow, balance sheet, and accounts analysis</p>
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
                showExpandCollapse={false}
            />

            {/* Content */}
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <div ref={targetRef}>
                    {/* Assets Section */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>Assets</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <KpiCard 
                                label="Cash on Hand" 
                                value={summary.cashOnHand} 
                                icon={Wallet} 
                                color="#10b981" 
                                description="Available cash"
                            />
                            <KpiCard 
                                label="Bank Balance" 
                                value={summary.bankBalance} 
                                icon={DollarSign} 
                                color="#2563eb" 
                                description="Deposits & savings"
                            />
                            <KpiCard 
                                label="Accounts Receivable" 
                                value={summary.accountsReceivable} 
                                icon={ArrowUpRight} 
                                color="#0f766e" 
                                description="Customer payments due"
                            />
                            <KpiCard 
                                label="Inventory Value" 
                                value={summary.inventoryValue} 
                                icon={DollarSign} 
                                color="#7c3aed" 
                                description="Current stock value"
                            />
                        </div>
                    </div>

                    {/* Liabilities Section */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>Liabilities</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <KpiCard 
                                label="Accounts Payable" 
                                value={summary.accountsPayable} 
                                icon={ArrowDownLeft} 
                                color="#dc2626" 
                                description="Supplier payments due"
                            />
                            <KpiCard 
                                label="Short-term Debt" 
                                value={summary.shortTermDebt} 
                                icon={DollarSign} 
                                color="#ef4444" 
                                description="Current liabilities"
                            />
                            <KpiCard 
                                label="Salary Payable" 
                                value={summary.salaryPayable} 
                                icon={DollarSign} 
                                color="#f59e0b" 
                                description="Employee payments due"
                            />
                            <KpiCard 
                                label="Total Liabilities" 
                                value={summary.totalLiabilities} 
                                icon={DollarSign} 
                                color="#dc2626" 
                                description="All debts & obligations"
                            />
                        </div>
                    </div>

                    {/* Equity & Net Worth Section */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>Equity & Net Worth</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <KpiCard 
                                label="Owner's Capital" 
                                value={summary.ownersCapital} 
                                icon={Wallet} 
                                color="#16a34a" 
                                description="Initial investment"
                            />
                            <KpiCard 
                                label="Retained Earnings" 
                                value={summary.retainedEarnings} 
                                icon={TrendingUp} 
                                color="#059669" 
                                description="Profits retained"
                            />
                            <KpiCard 
                                label="Current Profit" 
                                value={summary.currentProfit} 
                                icon={TrendingUp} 
                                color="#10b981" 
                                description="Period profit/loss"
                            />
                            <KpiCard 
                                label="Total Equity" 
                                value={summary.totalEquity} 
                                icon={Wallet} 
                                color="#16a34a" 
                                description="Owner's stake"
                            />
                        </div>
                    </div>

                    {/* Financial Health Card */}
                    <div className="rounded-xl border-2 shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: '#2563eb' }}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Wallet size={20} style={{ color: '#2563eb' }} />
                                    <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>TOTAL ASSETS</span>
                                </div>
                                <p className="text-2xl font-bold" style={{ color: '#2563eb' }}>
                                    Rs {(summary.totalAssets || 0).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <ArrowDownLeft size={20} style={{ color: '#dc2626' }} />
                                    <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>TOTAL LIABILITIES</span>
                                </div>
                                <p className="text-2xl font-bold" style={{ color: '#dc2626' }}>
                                    Rs {(summary.totalLiabilities || 0).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Wallet size={20} style={{ color: '#16a34a' }} />
                                    <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>NET WORTH</span>
                                </div>
                                <p className="text-2xl font-bold" style={{ color: '#16a34a' }}>
                                    Rs {(summary.netWorth || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Ratios & Indicators */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>Financial Ratios & Indicators</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <SummaryCard 
                                icon={Percent}
                                label="Current Ratio"
                                value={summary.currentRatio || 0}
                                description="Liquidity indicator"
                                isCurrency={false}
                                color="var(--ink)"
                            />
                            <SummaryCard 
                                icon={Percent}
                                label="Quick Ratio"
                                value={summary.quickRatio || 0}
                                description="Quick asset ratio"
                                isCurrency={false}
                                color="var(--ink)"
                            />
                            <SummaryCard 
                                icon={Percent}
                                label="Debt-to-Equity"
                                value={summary.debtToEquity || 0}
                                description="Leverage ratio"
                                isCurrency={false}
                                color="var(--ink)"
                            />
                            <SummaryCard 
                                icon={Percent}
                                label="ROA (Return on Assets)"
                                value={summary.roa || 0}
                                description="Asset efficiency"
                                isCurrency={false}
                                color="var(--ink)"
                            />
                            <SummaryCard 
                                icon={Percent}
                                label="ROE (Return on Equity)"
                                value={summary.roe || 0}
                                description="Shareholder returns"
                                isCurrency={false}
                                color="var(--ink)"
                            />
                            <SummaryCard 
                                icon={Percent}
                                label="Working Capital"
                                value={summary.workingCapital || 0}
                                description="Current assets - liabilities"
                                isCurrency={true}
                                color="var(--ink)"
                            />
                        </div>
                    </div>

                    {/* Cash Flow Summary */}
                    <div className="rounded-xl border shadow-sm p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>Cash Flow Summary</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                                <span style={{ color: 'var(--muted)' }}>Operating Cash Flow</span>
                                <span style={{ color: '#10b981', fontWeight: 'bold' }}>Rs {(summary.operatingCashFlow || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                                <span style={{ color: 'var(--muted)' }}>Investing Cash Flow</span>
                                <span style={{ color: summary.investingCashFlow >= 0 ? '#059669' : '#dc2626', fontWeight: 'bold' }}>Rs {(summary.investingCashFlow || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                                <span style={{ color: 'var(--muted)' }}>Financing Cash Flow</span>
                                <span style={{ color: summary.financingCashFlow >= 0 ? '#059669' : '#dc2626', fontWeight: 'bold' }}>Rs {(summary.financingCashFlow || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between pt-2" style={{ borderTop: '2px solid var(--border)' }}>
                                <span style={{ color: 'var(--ink)', fontWeight: 'bold' }}>Net Cash Change</span>
                                <span style={{ color: summary.netCashChange >= 0 ? '#10b981' : '#dc2626', fontWeight: 'bold', fontSize: '1.1em' }}>Rs {(summary.netCashChange || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Modal */}
            {isPdfModalOpen && (
                <PdfPreviewModal
                    title="Financial & Accounts Report"
                    contentRef={targetRef}
                    onClose={() => setIsPdfModalOpen(false)}
                />
            )}
        </div>
    );
}

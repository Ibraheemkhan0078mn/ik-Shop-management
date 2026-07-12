import React, { useState, useRef } from "react";
import { Download, RefreshCw, TrendingUp, TrendingDown, DollarSign, Calculator, Wallet } from "lucide-react";
import { useGetProfitLossReportQuery } from "../services/reports.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PdfPreviewModal from "../../../shared/components/PdfPreviewModal.jsx";
import { 
    KpiCard, 
    PeriodFilterBar, 
    LoadingSpinner,
    SummaryCard
} from "../components/ReportComponents.jsx";

export default function ProfitLossReport() {
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

    const { data, isLoading, error, refetch } = useGetProfitLossReportQuery(filters);

    if (error) {
        showError(error?.data?.message || "Failed to load profit/loss report");
    }

    const handleRefresh = () => refetch();

    const summary = data?.data?.summary || {};

    const isProfit = (summary.netProfit || 0) >= 0;

    return (
        <div className="p-6 min-h-screen" style={{ background: 'var(--app-bg)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>Profit & Loss Report</h1>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>Comprehensive revenue and expense analysis</p>
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
                    {/* Revenue Section */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>Revenue</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <KpiCard 
                                label="Total Sales" 
                                value={summary.totalSales} 
                                icon={DollarSign} 
                                color="#10b981" 
                                description="Gross revenue"
                            />
                            <KpiCard 
                                label="Sales Returns" 
                                value={summary.salesReturns} 
                                icon={TrendingDown} 
                                color="#dc2626" 
                                description="Deduction from revenue"
                            />
                            <KpiCard 
                                label="Purchase Returns" 
                                value={summary.purchaseReturns} 
                                icon={TrendingUp} 
                                color="#06b6d4" 
                                description="Addition to revenue"
                            />
                            <KpiCard 
                                label="Net Revenue" 
                                value={summary.netRevenue} 
                                icon={Wallet} 
                                color="#2563eb" 
                                description="After returns"
                            />
                        </div>
                    </div>

                    {/* Cost of Goods Section */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>Cost of Goods Sold</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <KpiCard 
                                label="Total Purchases" 
                                value={summary.totalPurchases} 
                                icon={DollarSign} 
                                color="#3b82f6" 
                                description="Cost of inventory"
                            />
                            <KpiCard 
                                label="Wastage Loss" 
                                value={summary.wastage} 
                                icon={TrendingDown} 
                                color="#dc2626" 
                                description="Inventory loss"
                            />
                            <KpiCard 
                                label="Gross Profit" 
                                value={summary.grossProfit} 
                                icon={TrendingUp} 
                                color="#16a34a" 
                                description={`${summary.grossMarginPercentage || 0}% margin`}
                            />
                            <KpiCard 
                                label="Gross Margin %" 
                                value={summary.grossMarginPercentage || 0} 
                                icon={Calculator} 
                                color="#16a34a" 
                                description="Profit margin"
                                isCurrency={false}
                            />
                        </div>
                    </div>

                    {/* Operating Expenses Section */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>Operating Expenses</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <KpiCard 
                                label="Staff Salaries" 
                                value={summary.salaries} 
                                icon={DollarSign} 
                                color="#8b5cf6" 
                                description="Payroll expenses"
                            />
                            <KpiCard 
                                label="Operating Expenses" 
                                value={summary.expenses} 
                                icon={DollarSign} 
                                color="#ef4444" 
                                description="Other costs"
                            />
                            <KpiCard 
                                label="Total Operating Costs" 
                                value={summary.totalOperatingCosts} 
                                icon={Calculator} 
                                color="#dc2626" 
                                description="Salaries + expenses"
                            />
                            <KpiCard 
                                label="EBITDA" 
                                value={summary.ebitda} 
                                icon={DollarSign} 
                                color={summary.ebitda >= 0 ? '#10b981' : '#dc2626'} 
                                description="Earnings before taxes"
                            />
                        </div>
                    </div>

                    {/* Main P&L Card */}
                    <div className="rounded-xl border-2 shadow-sm p-6 mb-6" style={{ 
                        background: 'var(--surface)', 
                        borderColor: isProfit ? '#10b981' : '#dc2626' 
                    }}>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        {isProfit ? (
                                            <TrendingUp size={22} style={{ color: '#10b981' }} />
                                        ) : (
                                            <TrendingDown size={22} style={{ color: '#dc2626' }} />
                                        )}
                                        <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>
                                            {isProfit ? 'NET PROFIT' : 'NET LOSS'}
                                        </span>
                                    </div>
                                    <p className="text-3xl font-bold" style={{ color: isProfit ? '#10b981' : '#dc2626' }}>
                                        Rs {Math.abs(summary.netProfit || 0).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm" style={{ color: 'var(--muted)' }}>Net Margin %</p>
                                    <p className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>{summary.netMarginPercentage || 0}%</p>
                                </div>
                            </div>

                            {/* P&L Breakdown */}
                            <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                                <p className="text-sm font-semibold mb-4" style={{ color: 'var(--ink)' }}>Calculation Breakdown</p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--muted)' }}>Total Sales</span>
                                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>Rs {(summary.totalSales || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--muted)' }}>− Cost of Goods Sold</span>
                                        <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>Rs {(summary.totalPurchases || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                                        <span style={{ color: 'var(--muted)' }}>= Gross Profit</span>
                                        <span style={{ color: '#16a34a', fontWeight: 'bold' }}>Rs {(summary.grossProfit || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--muted)' }}>− Salaries</span>
                                        <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>Rs {(summary.salaries || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--muted)' }}>− Operating Expenses</span>
                                        <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Rs {(summary.expenses || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--muted)' }}>− Wastage Loss</span>
                                        <span style={{ color: '#dc2626', fontWeight: 'bold' }}>Rs {(summary.wastage || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2" style={{ borderColor: 'var(--border)' }}>
                                        <span style={{ color: 'var(--muted)', fontWeight: 'bold' }}>= Net Profit/Loss</span>
                                        <span style={{ color: isProfit ? '#10b981' : '#dc2626', fontWeight: 'bold', fontSize: '1.1em' }}>
                                            Rs {(summary.netProfit || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <SummaryCard 
                            icon={Calculator}
                            label="Break-even Sales"
                            value={summary.breakEvenSales || 0}
                            description="Sales needed to break even"
                            isCurrency={true}
                            color="var(--ink)"
                        />
                        <SummaryCard 
                            icon={Wallet}
                            label="Operating Ratio"
                            value={summary.operatingRatio || 0}
                            description="Operating costs as % of sales"
                            isCurrency={false}
                            color="var(--ink)"
                        />
                        <SummaryCard 
                            icon={TrendingUp}
                            label="ROI %"
                            value={summary.roi || 0}
                            description="Return on investment"
                            isCurrency={false}
                            color="var(--ink)"
                        />
                    </div>
                </div>
            )}

            {/* PDF Modal */}
            {isPdfModalOpen && (
                <PdfPreviewModal
                    title="Profit & Loss Report"
                    contentRef={targetRef}
                    onClose={() => setIsPdfModalOpen(false)}
                />
            )}
        </div>
    );
}

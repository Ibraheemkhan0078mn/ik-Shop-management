import React, { useState, useRef } from "react";
import { Download, RefreshCw, ShoppingCart, TrendingUp, DollarSign, Users, Percent } from "lucide-react";
import { useGetSalesKPIReportQuery } from "../services/reports.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PdfPreviewModal from "../../../shared/components/PdfPreviewModal.jsx";
import { 
    KpiCard, 
    PeriodFilterBar, 
    LoadingSpinner, 
    SourceSection,
    SummaryCard 
} from "../components/ReportComponents.jsx";

const SECTION_KEYS = ['paymentMethods', 'customers', 'products'];

export default function SalesReports() {
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

    const { data, isLoading, error, refetch } = useGetSalesKPIReportQuery(filters);

    if (error) {
        showError(error?.data?.message || "Failed to load sales report");
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
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>Sales Report</h1>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>Complete sales analysis with payment methods and customer breakdown</p>
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
                            label="Total Sales" 
                            value={summary.totalSales} 
                            icon={ShoppingCart} 
                            color="#10b981" 
                            description={`${details.orderCount || 0} orders`} 
                        />
                        <KpiCard 
                            label="Average Order Value" 
                            value={summary.averageOrderValue} 
                            icon={DollarSign} 
                            color="#2563eb" 
                            description="Per order"
                        />
                        <KpiCard 
                            label="Gross Margin" 
                            value={summary.grossMargin} 
                            icon={TrendingUp} 
                            color="#16a34a" 
                            description={`${summary.grossMarginPercentage || 0}%`}
                        />
                        <KpiCard 
                            label="Total Customers" 
                            value={details.uniqueCustomers || 0} 
                            icon={Users} 
                            color="#8b5cf6" 
                            description="Unique customers" 
                            isCurrency={false}
                        />
                    </div>

                    {/* KPI Grid Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <KpiCard 
                            label="Cash Sales" 
                            value={summary.cashSales} 
                            icon={DollarSign} 
                            color="#059669" 
                            description="Cash on delivery"
                        />
                        <KpiCard 
                            label="Card Sales" 
                            value={summary.cardSales} 
                            icon={ShoppingCart} 
                            color="#2563eb" 
                            description="Card payments"
                        />
                        <KpiCard 
                            label="Credit Sales" 
                            value={summary.creditSales} 
                            icon={DollarSign} 
                            color="#7c3aed" 
                            description="On credit"
                        />
                        <KpiCard 
                            label="Returns" 
                            value={summary.totalReturns} 
                            icon={TrendingUp} 
                            color="#dc2626" 
                            description={`${details.returnCount || 0} returns`}
                        />
                    </div>

                    {/* Summary Card */}
                    <div className="rounded-xl border-2 shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: '#10b981' }}>
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <ShoppingCart size={22} style={{ color: '#10b981' }} />
                                    <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>SALES SUMMARY</span>
                                </div>
                                <p className="text-3xl font-bold" style={{ color: '#10b981' }}>
                                    Rs {(summary.totalSales || 0).toLocaleString()}
                                </p>
                                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                                    Total revenue from all sales
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm" style={{ color: 'var(--muted)' }}>Gross Margin %</p>
                                <p className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>{summary.grossMarginPercentage || 0}%</p>
                                <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>Orders</p>
                                <p className="text-lg font-bold" style={{ color: 'var(--ink)' }}>{details.orderCount || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Sections */}
                    <div className="space-y-4 mb-6">
                        <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>Sales Breakdown</h2>

                        {/* Payment Methods Section */}
                        <SourceSection
                            title="Payment Methods"
                            icon={DollarSign}
                            color="#10b981"
                            kpiValue={summary.totalSales}
                            kpiDescription="Total revenue by method"
                            count={details.paymentMethodCount || 0}
                            breakdown={breakdowns.salesByPaymentMethod}
                            breakdownLabelKey="method"
                            transactions={transactions.sales}
                            transactionType="sales"
                            isExpanded={!!expandedSections.paymentMethods}
                            onToggle={() => toggleSection('paymentMethods')}
                        />

                        {/* Customers Section */}
                        {breakdowns.topCustomers && breakdowns.topCustomers.length > 0 && (
                            <SourceSection
                                title="Top Customers"
                                icon={Users}
                                color="#8b5cf6"
                                kpiValue={summary.totalSales}
                                kpiDescription="Sales by customer"
                                count={details.uniqueCustomers || 0}
                                breakdown={breakdowns.topCustomers}
                                breakdownLabelKey="customerName"
                                isExpanded={!!expandedSections.customers}
                                onToggle={() => toggleSection('customers')}
                            />
                        )}

                        {/* Products Section */}
                        {breakdowns.topProducts && breakdowns.topProducts.length > 0 && (
                            <SourceSection
                                title="Top Products"
                                icon={ShoppingCart}
                                color="#2563eb"
                                kpiValue={summary.totalSales}
                                kpiDescription="Sales by product"
                                count={details.productCount || 0}
                                breakdown={breakdowns.topProducts}
                                breakdownLabelKey="productName"
                                isExpanded={!!expandedSections.products}
                                onToggle={() => toggleSection('products')}
                            />
                        )}
                    </div>

                    {/* Additional Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <SummaryCard 
                            icon={Percent}
                            label="Return Rate"
                            value={summary.returnRate || 0}
                            description="Percentage of returns"
                            isCurrency={false}
                            color="var(--ink)"
                        />
                        <SummaryCard 
                            icon={Users}
                            label="Avg Items Per Order"
                            value={summary.avgItemsPerOrder || 0}
                            description="Items in each order"
                            isCurrency={false}
                            color="var(--ink)"
                        />
                        <SummaryCard 
                            icon={TrendingUp}
                            label="Best Selling Product"
                            value={summary.topProduct || 'N/A'}
                            description="By quantity sold"
                            isCurrency={false}
                            color="var(--ink)"
                        />
                    </div>
                </div>
            )}

            {/* PDF Modal */}
            {isPdfModalOpen && (
                <PdfPreviewModal
                    title="Sales Report"
                    contentRef={targetRef}
                    onClose={() => setIsPdfModalOpen(false)}
                />
            )}
        </div>
    );
}

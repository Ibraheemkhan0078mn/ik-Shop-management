import React, { useState, useRef } from "react";
import { Download, RefreshCw, Package, DollarSign, TrendingUp, Truck, Percent, ShoppingCart } from "lucide-react";
import { useGetPurchaseKPIReportQuery } from "../services/reports.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PdfPreviewModal from "../../../shared/components/PdfPreviewModal.jsx";
import { 
    KpiCard, 
    PeriodFilterBar, 
    LoadingSpinner, 
    SourceSection,
    SummaryCard 
} from "../components/ReportComponents.jsx";

const SECTION_KEYS = ['suppliers', 'categories'];

export default function PurchasesReports() {
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

    const { data, isLoading, error, refetch } = useGetPurchaseKPIReportQuery(filters);

    if (error) {
        showError(error?.data?.message || "Failed to load purchases report");
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
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>Purchases Report</h1>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>Complete purchase analysis with supplier and category breakdown</p>
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
                            label="Total Purchases" 
                            value={summary.totalPurchases} 
                            icon={Package} 
                            color="#3b82f6" 
                            description={`${details.purchaseCount || 0} purchases`} 
                        />
                        <KpiCard 
                            label="Average Order Cost" 
                            value={summary.averageOrderCost} 
                            icon={DollarSign} 
                            color="#2563eb" 
                            description="Per purchase"
                        />
                        <KpiCard 
                            label="Total Suppliers" 
                            value={details.supplierCount || 0} 
                            icon={Truck} 
                            color="#8b5cf6" 
                            description="Unique suppliers" 
                            isCurrency={false}
                        />
                        <KpiCard 
                            label="Total Categories" 
                            value={details.categoryCount || 0} 
                            icon={ShoppingCart} 
                            color="#0891b2" 
                            description="Product categories" 
                            isCurrency={false}
                        />
                    </div>

                    {/* KPI Grid Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <KpiCard 
                            label="Most Purchased" 
                            value={summary.totalQuantity || 0} 
                            icon={ShoppingCart} 
                            color="#10b981" 
                            description="Total units" 
                            isCurrency={false}
                        />
                        <KpiCard 
                            label="Average Unit Cost" 
                            value={summary.avgUnitCost} 
                            icon={DollarSign} 
                            color="#059669" 
                            description="Per unit"
                        />
                        <KpiCard 
                            label="Purchase Returns" 
                            value={summary.totalReturns} 
                            icon={TrendingUp} 
                            color="#06b6d4" 
                            description={`${details.returnCount || 0} returns`}
                        />
                        <KpiCard 
                            label="Top Supplier" 
                            value={summary.topSupplierPurchases || 0} 
                            icon={Truck} 
                            color="#7c3aed" 
                            description="By amount"
                        />
                    </div>

                    {/* Summary Card */}
                    <div className="rounded-xl border-2 shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: '#3b82f6' }}>
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Package size={22} style={{ color: '#3b82f6' }} />
                                    <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>PURCHASES SUMMARY</span>
                                </div>
                                <p className="text-3xl font-bold" style={{ color: '#3b82f6' }}>
                                    Rs {(summary.totalPurchases || 0).toLocaleString()}
                                </p>
                                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                                    Total cost of all purchases
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm" style={{ color: 'var(--muted)' }}>Purchase Orders</p>
                                <p className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>{details.purchaseCount || 0}</p>
                                <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>Total Units</p>
                                <p className="text-lg font-bold" style={{ color: 'var(--ink)' }}>{summary.totalQuantity || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Sections */}
                    <div className="space-y-4 mb-6">
                        <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>Purchases Breakdown</h2>

                        {/* Suppliers Section */}
                        <SourceSection
                            title="Top Suppliers"
                            icon={Truck}
                            color="#3b82f6"
                            kpiValue={summary.totalPurchases}
                            kpiDescription="Purchases by supplier"
                            count={details.supplierCount || 0}
                            breakdown={breakdowns.purchasesBySupplier}
                            breakdownLabelKey="supplierName"
                            transactions={transactions.purchases}
                            transactionType="purchases"
                            isExpanded={!!expandedSections.suppliers}
                            onToggle={() => toggleSection('suppliers')}
                        />

                        {/* Categories Section */}
                        {breakdowns.purchasesByCategory && breakdowns.purchasesByCategory.length > 0 && (
                            <SourceSection
                                title="Purchases by Category"
                                icon={ShoppingCart}
                                color="#2563eb"
                                kpiValue={summary.totalPurchases}
                                kpiDescription="Purchases by category"
                                count={details.categoryCount || 0}
                                breakdown={breakdowns.purchasesByCategory}
                                breakdownLabelKey="category"
                                isExpanded={!!expandedSections.categories}
                                onToggle={() => toggleSection('categories')}
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
                            icon={DollarSign}
                            label="Avg Supplier Spend"
                            value={summary.avgSupplierSpend || 0}
                            description="Per supplier"
                            isCurrency={true}
                            color="var(--ink)"
                        />
                        <SummaryCard 
                            icon={TrendingUp}
                            label="Most Purchased Category"
                            value={summary.topCategory || 'N/A'}
                            description="By quantity"
                            isCurrency={false}
                            color="var(--ink)"
                        />
                    </div>
                </div>
            )}

            {/* PDF Modal */}
            {isPdfModalOpen && (
                <PdfPreviewModal
                    title="Purchases Report"
                    contentRef={targetRef}
                    onClose={() => setIsPdfModalOpen(false)}
                />
            )}
        </div>
    );
}

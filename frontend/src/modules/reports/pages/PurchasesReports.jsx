import React, { useState } from "react";
import { RefreshCw, Package, DollarSign, Truck, Eye, Filter, Wallet, AlertCircle, CheckCircle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useGetPurchaseReportQuery } from "../services/reports.service.js";
import { useSuppliers } from "../../suppliers/services/suppliers.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import { useNavigate } from "react-router-dom";

export default function PurchasesReports() {
    const navigate = useNavigate();

    // ---- UI state ----
    const [period, setPeriod] = useState("today");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [supplierId, setSupplierId] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("all");
    const [deliveryStatus, setDeliveryStatus] = useState("all");
    const [isRejected, setIsRejected] = useState("all");
    const [search, setSearch] = useState("");

    // ---- Build the filter object that actually gets sent to the API ----
    const filters = { period };
    if (period === "custom" && fromDate && toDate) {
        filters.fromDate = fromDate;
        filters.toDate = toDate;
    }
    if (supplierId) filters.supplierId = supplierId;
    if (paymentStatus && paymentStatus !== "all") filters.paymentStatus = paymentStatus;
    if (deliveryStatus && deliveryStatus !== "all") filters.deliveryStatus = deliveryStatus;
    if (isRejected && isRejected !== "all") filters.isRejected = isRejected;
    if (search) filters.search = search;

    const { data, isLoading, isFetching, error, refetch } = useGetPurchaseReportQuery(filters);
    const { data: suppliersData } = useSuppliers();

    if (error) {
        showError(error?.data?.message || "Failed to load purchases report");
    }

    const handleRefresh = () => refetch();

    // ---- Data pulled straight from the API response for this filter ----
    const summary = data?.summary || {};
    const purchases = data?.data || [];
    const supplierBreakdown = data?.supplierBreakdown || [];

    const showLoader = isLoading || isFetching;

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString();
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'full': return 'bg-green-100 text-green-800 border-green-300';
            case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'pending': return 'bg-red-100 text-red-800 border-red-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getDeliveryStatusColor = (status) => {
        switch (status) {
            case 'delivered': return 'bg-green-100 text-green-800 border-green-300';
            case 'ordered': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const suppliers = suppliersData?.data || [];

    return (
        <div className="p-6 min-h-screen bg-[var(--app-bg)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--ink)] font-display">Purchases Report</h1>
                    <p className="text-sm text-[var(--muted)]">
                        Purchase data for <span className="font-medium text-[var(--ink)]">{period === "custom" ? `${fromDate || "?"} → ${toDate || "?"}` : period}</span>
                    </p>
                </div>
                <button onClick={handleRefresh} className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--app-bg)] transition-colors flex items-center gap-2">
                    <RefreshCw size={16} className={showLoader ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* Filter bar */}
            <div className="card p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <Filter size={16} className="text-[var(--accent-2)]" />
                    <span className="text-sm font-semibold text-[var(--ink)]">Filters</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Period</label>
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>
                    {period === "custom" && (
                        <>
                            <div>
                                <label className="text-xs font-medium text-[var(--muted)] mb-1 block">From Date</label>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-[var(--muted)] mb-1 block">To Date</label>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                                />
                            </div>
                        </>
                    )}
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Supplier</label>
                        <select
                            value={supplierId}
                            onChange={(e) => setSupplierId(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="">All Suppliers</option>
                            {suppliers.map((supplier) => (
                                <option key={supplier._id} value={supplier._id}>
                                    {supplier.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Payment Status</label>
                        <select
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="all">All</option>
                            <option value="full">Paid</option>
                            <option value="partial">Partial</option>
                            <option value="pending">Unpaid</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Delivery Status</label>
                        <select
                            value={deliveryStatus}
                            onChange={(e) => setDeliveryStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="all">All</option>
                            <option value="received">Received</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Rejected/Return</label>
                        <select
                            value={isRejected}
                            onChange={(e) => setIsRejected(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="all">All</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                        </select>
                    </div>
                </div>
            </div>

            {showLoader ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-2)]"></div>
                </div>
            ) : (
                <div>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[var(--accent-2)]/10 flex items-center justify-center">
                                    <Package size={20} className="text-[var(--accent-2)]" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">Total Purchases</p>
                                    <p className="font-semibold text-[var(--ink)]">
                                        Rs {(summary.totalPurchases || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                    <CheckCircle size={20} className="text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">Total Paid</p>
                                    <p className="font-semibold text-[var(--ink)]">
                                        Rs {(summary.totalPaid || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                                    <AlertCircle size={20} className="text-red-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">Total Due</p>
                                    <p className="font-semibold text-[var(--ink)]">
                                        Rs {(summary.totalDue || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                    <CheckCircle2 size={20} className="text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">Total Delivered</p>
                                    <p className="font-semibold text-[var(--ink)]">
                                        {summary.totalDeliveredCount || 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                                    <XCircle size={20} className="text-red-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">Total Rejected</p>
                                    <p className="font-semibold text-[var(--ink)]">
                                        {summary.totalRejectedCount || 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                                    <Truck size={20} className="text-[var(--accent)]" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">Total Suppliers</p>
                                    <p className="font-semibold text-[var(--ink)]">
                                        {summary.totalSuppliers || 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Supplier-wise Breakdown */}
                    {supplierBreakdown.length > 0 && (
                        <div className="card p-4 mb-6">
                            <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">Supplier-wise Breakdown</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[var(--surface-muted)]">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-[var(--muted)]">Supplier</th>
                                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-[var(--muted)]">Total Amount</th>
                                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-[var(--muted)]">Paid</th>
                                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-[var(--muted)]">Due</th>
                                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-[var(--muted)]">Bills</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]">
                                        {supplierBreakdown.map((supplier) => (
                                            <tr key={supplier._id} className="hover:bg-[var(--surface-muted)]">
                                                <td className="px-4 py-2 text-sm text-[var(--ink)]">{supplier._id}</td>
                                                <td className="px-4 py-2 text-right font-semibold text-[var(--accent-2)]">Rs {supplier.totalAmount.toLocaleString()}</td>
                                                <td className="px-4 py-2 text-right text-green-600">Rs {supplier.paidAmount.toLocaleString()}</td>
                                                <td className="px-4 py-2 text-right text-red-600">Rs {supplier.dueAmount.toLocaleString()}</td>
                                                <td className="px-4 py-2 text-right text-sm text-[var(--muted)]">{supplier.billsCount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Purchases Table */}
                    <div className="card">
                        <div className="p-4 border-b border-[var(--border)]">
                            <h2 className="text-lg font-semibold text-[var(--ink)]">Purchase Transactions</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[var(--surface-muted)]">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Bill No</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Supplier</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Amount</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Paid</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Due</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">Delivery Status</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {purchases.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-8 text-center text-[var(--muted)]">
                                                No purchases found for the selected filters
                                            </td>
                                        </tr>
                                    ) : (
                                        purchases.map((purchase) => {
                                            const paidAmount = purchase.paidAmount || 0;
                                            const dueAmount = purchase.totalAmount - paidAmount;
                                            
                                            return (
                                                <tr 
                                                    key={purchase._id} 
                                                    className="hover:bg-[var(--surface-muted)] transition-colors cursor-pointer"
                                                    onClick={() => navigate(`/purchases/${purchase._id}`)}
                                                >
                                                    <td className="px-4 py-3 font-mono text-xs text-[var(--muted)]">
                                                        {purchase.invoiceNumber || "—"}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-[var(--muted)]">
                                                        {formatDate(purchase.date || purchase.createdAt)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-[var(--ink)]">
                                                        {purchase.supplierName || purchase.supplier?.name || "—"}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-[var(--accent-2)]">
                                                        Rs {(purchase.totalAmount || 0).toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-green-600 font-medium">
                                                        Rs {paidAmount.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-red-600 font-medium">
                                                        Rs {dueAmount.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getDeliveryStatusColor(purchase.status)}`}>
                                                            {purchase.status === 'delivered' ? 'Received' : purchase.status === 'ordered' ? 'Pending' : purchase.status || "—"}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => navigate(`/purchases/${purchase._id}`)}
                                                            className="p-2 hover:bg-[var(--app-bg)] rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye size={16} className="text-[var(--accent-2)]" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/*
AGENT INSTRUCTIONS — READ BEFORE CONNECTING REAL DATA
=======================================================
This component expects `useGetPurchaseKPIReportQuery(filters)` to return the report
already filtered by the given `filters` object ({ period } or { period, fromDate, toDate }).

Your job:
1. Open `reports.service.js` and check the `getPurchaseKPIReport` endpoint.
   - Make sure it passes `filters` (period / fromDate / toDate) as query params to the backend.
   - If the endpoint currently ignores filters, add them so the API actually filters
     purchases by the selected date range on the server side.

2. On the backend, make sure the purchase report handler:
   - Filters purchase records between fromDate and toDate (or the resolved range for
     period = "today" / "week" / "month" / etc).
   - Returns data in this exact shape so the UI above works with no further changes:
     {
       data: {
         summary: {
           totalPurchases, averageOrderCost, totalQuantity, avgUnitCost,
           totalReturns, topSupplierPurchases, returnRate, avgSupplierSpend, topCategory
         },
         details: {
           purchaseCount, supplierCount, categoryCount, returnCount
         },
         breakdowns: {
           purchasesBySupplier: [{ supplierName, amount, ... }],
           purchasesByCategory: [{ category, amount, ... }]
         },
         transactions: {
           purchases: [ ...raw purchase rows for the SourceSection drill-down... ]
         }
       }
     }

3. Confirm `PeriodFilterBar` supports at least: "today", "week", "month", "custom".
   For "custom", both fromDate and toDate must be required before firing the query
   (already handled in this component — filters.fromDate/toDate are only added when
   period === "custom" and both dates are set).

4. Test that changing the period dropdown or picking custom dates actually refetches
   and the KPI cards, summary card, and breakdown sections update with the new numbers.

5. Once real data is verified end-to-end (filters applied, correct numbers displayed,
   suppliers/categories breakdowns populated), DELETE THIS ENTIRE COMMENT BLOCK.
=======================================================
*/














// import React, { useState, useRef } from "react";
// import { Download, RefreshCw, Package, DollarSign, TrendingUp, Truck, Percent, ShoppingCart } from "lucide-react";
// import { useGetPurchaseKPIReportQuery } from "../services/reports.service.js";
// import { showError } from "../../../shared/utilities/toastHelpers.js";
// import PdfPreviewModal from "../../../shared/components/PdfPreviewModal.jsx";
// import { 
//     KpiCard, 
//     PeriodFilterBar, 
//     LoadingSpinner, 
//     SourceSection,
//     SummaryCard 
// } from "../components/ReportComponents.jsx";

// const SECTION_KEYS = ['suppliers', 'categories'];

// export default function PurchasesReports() {
//     const targetRef = useRef(null);
//     const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
//     const [period, setPeriod] = useState("today");
//     const [fromDate, setFromDate] = useState("");
//     const [toDate, setToDate] = useState("");
//     const [expandedSections, setExpandedSections] = useState({});

//     const filters = { period };
//     if (period === "custom" && fromDate && toDate) {
//         filters.fromDate = fromDate;
//         filters.toDate = toDate;
//     }

//     const { data, isLoading, error, refetch } = useGetPurchaseKPIReportQuery(filters);

//     if (error) {
//         showError(error?.data?.message || "Failed to load purchases report");
//     }

//     const handleRefresh = () => refetch();

//     const toggleSection = (key) => {
//         setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
//     };

//     const handleExpandAll = () => {
//         const all = {};
//         SECTION_KEYS.forEach(k => { all[k] = true; });
//         setExpandedSections(all);
//     };

//     const handleCollapseAll = () => {
//         setExpandedSections({});
//     };

//     const summary = data?.data?.summary || {};
//     const details = data?.data?.details || {};
//     const breakdowns = data?.data?.breakdowns || {};
//     const transactions = data?.data?.transactions || {};

//     return (
//         <div className="p-6 min-h-screen" style={{ background: 'var(--app-bg)' }}>
//             {/* Header */}
//             <div className="flex items-center justify-between mb-6">
//                 <div>
//                     <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>Purchases Report</h1>
//                     <p className="text-sm" style={{ color: 'var(--muted)' }}>Complete purchase analysis with supplier and category breakdown</p>
//                 </div>
//                 <div className="flex gap-2 no-print">
//                     <button
//                         onClick={handleRefresh}
//                         className="flex items-center gap-2 px-4 py-2 rounded-lg border transition"
//                         style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--ink)' }}
//                     >
//                         <RefreshCw size={16} />
//                         Refresh
//                     </button>
//                     <button
//                         onClick={() => setIsPdfModalOpen(true)}
//                         className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition"
//                         style={{ background: 'var(--accent-2)' }}
//                     >
//                         <Download size={16} />
//                         Export PDF
//                     </button>
//                 </div>
//             </div>

//             {/* Date filter */}
//             <PeriodFilterBar
//                 period={period}
//                 onPeriodChange={setPeriod}
//                 fromDate={fromDate}
//                 toDate={toDate}
//                 onFromDateChange={setFromDate}
//                 onToDateChange={setToDate}
//                 onExpandAll={handleExpandAll}
//                 onCollapseAll={handleCollapseAll}
//             />

//             {/* Content */}
//             {isLoading ? (
//                 <LoadingSpinner />
//             ) : (
//                 <div ref={targetRef}>
//                     {/* KPI Grid Row 1 */}
//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
//                         <KpiCard 
//                             label="Total Purchases" 
//                             value={summary.totalPurchases} 
//                             icon={Package} 
//                             color="#3b82f6" 
//                             description={`${details.purchaseCount || 0} purchases`} 
//                         />
//                         <KpiCard 
//                             label="Average Order Cost" 
//                             value={summary.averageOrderCost} 
//                             icon={DollarSign} 
//                             color="#2563eb" 
//                             description="Per purchase"
//                         />
//                         <KpiCard 
//                             label="Total Suppliers" 
//                             value={details.supplierCount || 0} 
//                             icon={Truck} 
//                             color="#8b5cf6" 
//                             description="Unique suppliers" 
//                             isCurrency={false}
//                         />
//                         <KpiCard 
//                             label="Total Categories" 
//                             value={details.categoryCount || 0} 
//                             icon={ShoppingCart} 
//                             color="#0891b2" 
//                             description="Product categories" 
//                             isCurrency={false}
//                         />
//                     </div>

//                     {/* KPI Grid Row 2 */}
//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//                         <KpiCard 
//                             label="Most Purchased" 
//                             value={summary.totalQuantity || 0} 
//                             icon={ShoppingCart} 
//                             color="#10b981" 
//                             description="Total units" 
//                             isCurrency={false}
//                         />
//                         <KpiCard 
//                             label="Average Unit Cost" 
//                             value={summary.avgUnitCost} 
//                             icon={DollarSign} 
//                             color="#059669" 
//                             description="Per unit"
//                         />
//                         <KpiCard 
//                             label="Purchase Returns" 
//                             value={summary.totalReturns} 
//                             icon={TrendingUp} 
//                             color="#06b6d4" 
//                             description={`${details.returnCount || 0} returns`}
//                         />
//                         <KpiCard 
//                             label="Top Supplier" 
//                             value={summary.topSupplierPurchases || 0} 
//                             icon={Truck} 
//                             color="#7c3aed" 
//                             description="By amount"
//                         />
//                     </div>

//                     {/* Summary Card */}
//                     <div className="rounded-xl border-2 shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: '#3b82f6' }}>
//                         <div className="flex items-center justify-between flex-wrap gap-4">
//                             <div>
//                                 <div className="flex items-center gap-2 mb-1">
//                                     <Package size={22} style={{ color: '#3b82f6' }} />
//                                     <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>PURCHASES SUMMARY</span>
//                                 </div>
//                                 <p className="text-3xl font-bold" style={{ color: '#3b82f6' }}>
//                                     Rs {(summary.totalPurchases || 0).toLocaleString()}
//                                 </p>
//                                 <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
//                                     Total cost of all purchases
//                                 </p>
//                             </div>
//                             <div className="text-right">
//                                 <p className="text-sm" style={{ color: 'var(--muted)' }}>Purchase Orders</p>
//                                 <p className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>{details.purchaseCount || 0}</p>
//                                 <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>Total Units</p>
//                                 <p className="text-lg font-bold" style={{ color: 'var(--ink)' }}>{summary.totalQuantity || 0}</p>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Detailed Sections */}
//                     <div className="space-y-4 mb-6">
//                         <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>Purchases Breakdown</h2>

//                         {/* Suppliers Section */}
//                         <SourceSection
//                             title="Top Suppliers"
//                             icon={Truck}
//                             color="#3b82f6"
//                             kpiValue={summary.totalPurchases}
//                             kpiDescription="Purchases by supplier"
//                             count={details.supplierCount || 0}
//                             breakdown={breakdowns.purchasesBySupplier}
//                             breakdownLabelKey="supplierName"
//                             transactions={transactions.purchases}
//                             transactionType="purchases"
//                             isExpanded={!!expandedSections.suppliers}
//                             onToggle={() => toggleSection('suppliers')}
//                         />

//                         {/* Categories Section */}
//                         {breakdowns.purchasesByCategory && breakdowns.purchasesByCategory.length > 0 && (
//                             <SourceSection
//                                 title="Purchases by Category"
//                                 icon={ShoppingCart}
//                                 color="#2563eb"
//                                 kpiValue={summary.totalPurchases}
//                                 kpiDescription="Purchases by category"
//                                 count={details.categoryCount || 0}
//                                 breakdown={breakdowns.purchasesByCategory}
//                                 breakdownLabelKey="category"
//                                 isExpanded={!!expandedSections.categories}
//                                 onToggle={() => toggleSection('categories')}
//                             />
//                         )}
//                     </div>

//                     {/* Additional Metrics Grid */}
//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                         <SummaryCard 
//                             icon={Percent}
//                             label="Return Rate"
//                             value={summary.returnRate || 0}
//                             description="Percentage of returns"
//                             isCurrency={false}
//                             color="var(--ink)"
//                         />
//                         <SummaryCard 
//                             icon={DollarSign}
//                             label="Avg Supplier Spend"
//                             value={summary.avgSupplierSpend || 0}
//                             description="Per supplier"
//                             isCurrency={true}
//                             color="var(--ink)"
//                         />
//                         <SummaryCard 
//                             icon={TrendingUp}
//                             label="Most Purchased Category"
//                             value={summary.topCategory || 'N/A'}
//                             description="By quantity"
//                             isCurrency={false}
//                             color="var(--ink)"
//                         />
//                     </div>
//                 </div>
//             )}

//             {/* PDF Modal */}
//             {isPdfModalOpen && (
//                 <PdfPreviewModal
//                     title="Purchases Report"
//                     contentRef={targetRef}
//                     onClose={() => setIsPdfModalOpen(false)}
//                 />
//             )}
//         </div>
//     );
// }

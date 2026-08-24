import React, { useState, useMemo } from "react";
import { Users, DollarSign, RefreshCw, Filter, Eye, Star, AlertCircle, X } from "lucide-react";
import { useGetCustomerReportQuery, useGetCustomerReportKPIQuery } from "../services/reports.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PdfModal from "../../../shared/components/PdfModal.jsx";
import CustomerReportPdfTemplate from "../components/CustomerReportPdfTemplate.jsx";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getReportsLabels } from "../labels/reportsLabels.js";

// Calculate date range based on period
const getDatesFromPeriod = (periodValue) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const threeMonthStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const threeMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31);
    
    switch (periodValue) {
        case "today":
            return {
                from: today.toISOString().split('T')[0],
                to: today.toISOString().split('T')[0]
            };
        case "month":
            return {
                from: monthStart.toISOString().split('T')[0],
                to: monthEnd.toISOString().split('T')[0]
            };
        case "3month":
            return {
                from: threeMonthStart.toISOString().split('T')[0],
                to: threeMonthEnd.toISOString().split('T')[0]
            };
        case "year":
            return {
                from: yearStart.toISOString().split('T')[0],
                to: yearEnd.toISOString().split('T')[0]
            };
        default:
            return {
                from: today.toISOString().split('T')[0],
                to: today.toISOString().split('T')[0]
            };
    }
};

export default function CustomerReport() {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getReportsLabels(language);
    const [period, setPeriod] = useState("month");
    const [customerType, setCustomerType] = useState("all");
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const dates = useMemo(() => getDatesFromPeriod(period), [period]);
    const filters = useMemo(() => ({ 
        fromDate: dates.from, 
        toDate: dates.to, 
        customerType, 
        search 
    }), [dates.from, dates.to, customerType, search]);
    
    const { data: reportData, isLoading, isFetching, error, refetch } = useGetCustomerReportQuery({
        ...filters,
        page: 1,
        limit: 50,
        sortBy: 'name',
        sortOrder: 'asc'
    });
    const { data: kpiData } = useGetCustomerReportKPIQuery(filters);

    if (error) {
        showError(error?.data?.message || "Failed to load customer report");
    }

    const handleRefresh = () => refetch();

    const summary = kpiData?.data?.summary || {};
    const customers = reportData?.data || [];

    const showLoader = isLoading || isFetching;

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString();
    };

    const getCustomerTypeColor = (type) => {
        return type === "regular" ? "bg-blue-100 text-blue-800 border-blue-300" : "bg-gray-100 text-gray-800 border-gray-300";
    };

    return (
        <div className="p-6 min-h-screen bg-[var(--app-bg)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--ink)] font-display">{labels.customerReport}</h1>
                    <p className="text-sm text-[var(--muted)]">
                        {labels.customerAnalytics}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleRefresh} className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--app-bg)] transition-colors flex items-center gap-2">
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
            <div className="card p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <Filter size={16} className="text-[var(--accent-2)]" />
                    <span className="text-sm font-semibold text-[var(--ink)]">{labels.filters}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">{labels.customerType}</label>
                        <select
                            value={customerType}
                            onChange={(e) => setCustomerType(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="all">{labels.allTypes}</option>
                            <option value="walkin">{labels.walkIn}</option>
                            <option value="regular">{labels.registered}</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">{labels.search}</label>
                        <input
                            type="text"
                            placeholder="Customer name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        />
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
                                    <Users size={20} className="text-[var(--accent-2)]" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.totalCustomers}</p>
                                    <p className="font-semibold text-[var(--ink)]">
                                        {summary.totalCustomers || 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                    <DollarSign size={20} className="text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.totalSales}</p>
                                    <p className="font-semibold text-[var(--ink)]">
                                        Rs {(summary.totalSales || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <DollarSign size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.avgOrderValue}</p>
                                    <p className="font-semibold text-[var(--ink)]">
                                        Rs {(summary.avgOrderValue || 0).toFixed(2)}
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
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.totalDue}</p>
                                    <p className="font-semibold text-[var(--ink)]">
                                        Rs {(summary.totalDue || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                                    <Star size={20} className="text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.topCustomer}</p>
                                    <p className="font-semibold text-[var(--ink)] text-sm truncate max-w-[150px]">
                                        {summary.topCustomer || "—"}
                                    </p>
                                    <p className="text-xs text-[var(--muted)]">
                                        Rs {(summary.topCustomerAmount || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <Users size={20} className="text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.newCustomers}</p>
                                    <p className="font-semibold text-[var(--ink)]">
                                        {summary.newCustomers || 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer Table */}
                    <div className="card">
                        <div className="p-4 border-b border-[var(--border)]">
                            <h2 className="text-lg font-semibold text-[var(--ink)]">{labels.customerReport}</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[var(--surface-muted)]">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">{labels.customer}</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">{labels.customerType}</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">{labels.phone}</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.totalOrders}</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.totalSpent}</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.avgOrderValue}</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.totalDue}</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">{labels.lastPurchase}</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">{labels.actions}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {customers.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="px-4 py-8 text-center text-[var(--muted)]">
                                                {labels.noDataFound}
                                            </td>
                                        </tr>
                                    ) : (
                                        customers.map((customer) => (
                                            <tr key={customer._id} className="hover:bg-[var(--surface-muted)] transition-colors">
                                                <td className="px-4 py-3 text-sm text-[var(--ink)] font-medium">{customer.name || '-'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getCustomerTypeColor(customer.customerType)}`}>
                                                        {customer.customerType || "walkin"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-[var(--ink)]">{customer.phone || '-'}</td>
                                                <td className="px-4 py-3 text-right text-sm text-[var(--ink)]">{customer.totalOrders || 0}</td>
                                                <td className="px-4 py-3 text-right font-semibold text-[var(--accent-2)]">Rs {(customer.totalSpent || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right text-sm text-[var(--ink)]">Rs {customer.totalOrders > 0 ? ((customer.totalSpent || 0) / customer.totalOrders).toFixed(2) : '0.00'}</td>
                                                <td className="px-4 py-3 text-right text-red-600 font-medium">Rs {(customer.dueAmount || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-[var(--muted)]">{formatDate(customer.lastOrderDate)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => setSelectedCustomer(customer)}
                                                        className="p-2 hover:bg-[var(--app-bg)] rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} className="text-[var(--accent-2)]" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Customer Detail Modal */}
            {selectedCustomer && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCustomer(null)}>
                    <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-[var(--ink)]">Customer Details</h2>
                            <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-[var(--app-bg)] rounded-lg">
                                <X size={20} className="text-[var(--muted)]" />
                            </button>
                        </div>
                        <div className="p-4">
                            {/* Basic Info */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">Basic Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-[var(--muted)]">Name</p>
                                        <p className="font-medium text-[var(--ink)]">{selectedCustomer.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--muted)]">Phone</p>
                                        <p className="font-medium text-[var(--ink)]">{selectedCustomer.phone || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--muted)]">Email</p>
                                        <p className="font-medium text-[var(--ink)]">{selectedCustomer.email || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--muted)]">Type</p>
                                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getCustomerTypeColor(selectedCustomer.customerType)}`}>
                                            {selectedCustomer.customerType || "walk-in"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">Statistics</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-3 bg-[var(--surface-muted)] rounded-lg">
                                        <p className="text-xs text-[var(--muted)]">Total Spent</p>
                                        <p className="font-semibold text-[var(--accent-2)]">Rs {(selectedCustomer.totalSpent || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 bg-[var(--surface-muted)] rounded-lg">
                                        <p className="text-xs text-[var(--muted)]">Total Orders</p>
                                        <p className="font-semibold text-[var(--ink)]">{selectedCustomer.totalOrders || 0}</p>
                                    </div>
                                    <div className="p-3 bg-[var(--surface-muted)] rounded-lg">
                                        <p className="text-xs text-[var(--muted)]">Due Amount</p>
                                        <p className="font-semibold text-red-600">Rs {(selectedCustomer.dueAmount || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Purchase History */}
                            <div>
                                <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">Purchase History</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-[var(--surface-muted)]">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-[var(--muted)]">Date</th>
                                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-[var(--muted)]">Bill No</th>
                                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-[var(--muted)]">Items</th>
                                                <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-[var(--muted)]">Amount</th>
                                                <th className="px-3 py-2 text-center text-xs font-semibold uppercase text-[var(--muted)]">Payment</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border)]">
                                            {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                                                selectedCustomer.orders.map((order) => (
                                                    <tr key={order._id}>
                                                        <td className="px-3 py-2 text-[var(--muted)]">{formatDate(order.createdAt)}</td>
                                                        <td className="px-3 py-2 text-[var(--ink)]">{order.invoiceNumber || "—"}</td>
                                                        <td className="px-3 py-2 text-[var(--ink)]">{order.items?.length || 0} items</td>
                                                        <td className="px-3 py-2 text-right font-medium text-[var(--accent-2)]">Rs {(order.totalAmount || 0).toLocaleString()}</td>
                                                        <td className="px-3 py-2 text-center">
                                                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${order.paymentMethod === 'credit' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'bg-green-100 text-green-800 border-green-300'}`}>
                                                                {order.paymentMethod || "—"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="px-3 py-4 text-center text-[var(--muted)]">No purchase history</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Modal */}
            <PdfModal
                isOpen={isPdfModalOpen}
                onClose={() => setIsPdfModalOpen(false)}
                fileName={`${labels.customerReport}.pdf`}
                labels={labels}
            >
                <CustomerReportPdfTemplate
                    summary={summary}
                    customers={customers}
                    labels={labels}
                    selectedPeriodLabel={period}
                />
            </PdfModal>
        </div>
    );
}

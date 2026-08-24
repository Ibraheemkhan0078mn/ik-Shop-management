import React, { useState, useMemo, useEffect } from "react";
import { DollarSign, ShoppingCart, RefreshCw, Filter, Eye, Package, CreditCard, AlertCircle, TrendingUp, X } from "lucide-react";
import { useGetSalesReportQuery } from "../services/reports.service.js";
import { useCustomers } from "../../customers/services/customers.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PdfModal from "../../../shared/components/PdfModal.jsx";
import SalesKPIReportPdfTemplate from "../components/SalesKPIReportPdfTemplate.jsx";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getReportsLabels } from "../labels/reportsLabels.js";

export default function SalesKPIReport() {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getReportsLabels(language);
    const [period, setPeriod] = useState("today");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [customerType, setCustomerType] = useState("all");
    const [customerId, setCustomerId] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("all");
    const [sortBy, setSortBy] = useState("amount");
    const [sortOrder, setSortOrder] = useState("desc");
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedSale, setSelectedSale] = useState(null);
    const [page, setPage] = useState(1);
    const limit = 20;

    // Calculate date range based on period
    const getDatesFromPeriod = (periodValue) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (periodValue) {
            case "today":
                return {
                    from: today.toISOString().split('T')[0],
                    to: today.toISOString().split('T')[0]
                };
            case "month":
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                return {
                    from: monthStart.toISOString().split('T')[0],
                    to: monthEnd.toISOString().split('T')[0]
                };
            case "week": {
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                return { from: weekStart.toISOString().split('T')[0], to: weekEnd.toISOString().split('T')[0] };
            }
            case "3month":
                const threeMonthStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                const threeMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                return {
                    from: threeMonthStart.toISOString().split('T')[0],
                    to: threeMonthEnd.toISOString().split('T')[0]
                };
            case "year":
                const yearStart = new Date(now.getFullYear(), 0, 1);
                const yearEnd = new Date(now.getFullYear(), 11, 31);
                return {
                    from: yearStart.toISOString().split('T')[0],
                    to: yearEnd.toISOString().split('T')[0]
                };
            case "custom":
            default:
                return { from: fromDate, to: toDate };
        }
    };

    const dates = useMemo(() => getDatesFromPeriod(period), [period, fromDate, toDate]);
    
    const filters = useMemo(() => ({ 
        fromDate: period === "custom" ? fromDate : dates.from, 
        toDate: period === "custom" ? toDate : dates.to, 
        customerType, customerId, paymentStatus, sortBy, sortOrder, search, page, limit
    }), [period, fromDate, toDate, dates.from, dates.to, customerType, customerId, paymentStatus, sortBy, sortOrder, search, page]);

    const { data, isLoading, isFetching, error, refetch } = useGetSalesReportQuery(filters);
    const { data: customersData } = useCustomers();

    if (error) {
        showError(error?.data?.message || "Failed to load sales report");
    }

    const handleRefresh = () => refetch();

    const summary = data?.summary || {};
    const sales = data?.data || [];
    const total = data?.total || 0;
    const totalPages = Math.max(1, data?.totalPages || Math.ceil(total / limit));

    const showLoader = isLoading || isFetching;

    useEffect(() => setPage(1), [period, fromDate, toDate, customerType, customerId, paymentStatus, sortBy, sortOrder, search]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString();
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'full': return 'bg-green-100 text-green-800 border-green-300';
            case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'unpaid': return 'bg-red-100 text-red-800 border-red-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getPaymentStatusLabel = (status) => {
        switch (status) {
            case 'full': return labels.paid;
            case 'partial': return labels.partial;
            case 'pending': return labels.unpaid;
            case 'unpaid': return labels.unpaid;
            default: return status;
        }
    };

    const customersList = customersData?.data || [];

    return (
        <div className="p-6 min-h-screen bg-[var(--app-bg)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--ink)] font-display">{labels.salesReport}</h1>
                    <p className="text-sm text-[var(--muted)]">
                        {labels.salesDataFor} <span className="font-medium text-[var(--ink)]">{period === "custom" ? `${fromDate || "?"} → ${toDate || "?"}` : period}</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">{labels.period}</label>
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="today">{labels.today}</option>
                            <option value="week">{labels.thisWeek}</option>
                            <option value="month">{labels.thisMonth}</option>
                            <option value="3month">{labels.last3Months}</option>
                            <option value="year">{labels.thisYear}</option>
                            <option value="custom">{labels.customRange}</option>
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
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">{labels.customer}</label>
                        <select
                            value={customerId}
                            onChange={(e) => setCustomerId(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="">{labels.allCustomers}</option>
                            {customersList.map((customer) => (
                                <option key={customer._id} value={customer._id}>
                                    {customer.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">{labels.paymentStatus}</label>
                        <select
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="all">{labels.allStatuses}</option>
                            <option value="paid">{labels.paid}</option>
                            <option value="unpaid">{labels.unpaid}</option>
                            <option value="partial">{labels.partial}</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">{labels.sortBy}</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="amount">{labels.amount}</option>
                            <option value="date">{labels.date}</option>
                            <option value="items">{labels.items}</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">{labels.sortOrder}</label>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="desc">{labels.descending}</option>
                            <option value="asc">{labels.ascending}</option>
                        </select>
                    </div>
                </div>
                <div className="mt-4">
                    <label className="text-xs font-medium text-[var(--muted)] mb-1 block">{labels.search}</label>
                    <input
                        type="text"
                        placeholder="Invoice number or customer name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                    />
                </div>
            </div>

            {showLoader ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-2)]"></div>
                </div>
            ) : (
                <div>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[var(--accent-2)]/10 flex items-center justify-center">
                                    <DollarSign size={20} className="text-[var(--accent-2)]" />
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
                                <div className="w-10 h-10 rounded-lg bg-[var(--accent-2)]/10 flex items-center justify-center">
                                    <ShoppingCart size={20} className="text-[var(--accent-2)]" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.totalOrders}</p>
                                    <p className="font-semibold text-[var(--ink)]">
                                        {summary.totalOrders || 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                    <CreditCard size={20} className="text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.totalPaid}</p>
                                    <p className="font-semibold text-green-600">
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
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.totalDue}</p>
                                    <p className="font-semibold text-red-600">
                                        Rs {(summary.totalDue || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                                    <TrendingUp size={20} className="text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.averageOrderValue}</p>
                                    <p className="font-semibold text-[var(--ink)]">
                                        Rs {(summary.averageOrderValue || 0).toFixed(0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[var(--accent-2)]/10 flex items-center justify-center">
                                    <Package size={20} className="text-[var(--accent-2)]" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.totalItemsSold}</p>
                                    <p className="font-semibold text-[var(--ink)]">
                                        {summary.totalItems || 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <CreditCard size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">Cash Collected</p>
                                    <p className="font-semibold text-[var(--ink)]">Rs {Number(summary.totalCash || 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                    <AlertCircle size={20} className="text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">Credit Collected</p>
                                    <p className="font-semibold text-[var(--ink)]">Rs {Number(summary.totalCredit || 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                    <Package size={20} className="text-slate-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">Customers</p>
                                    <p className="font-semibold text-[var(--ink)]">{summary.totalCustomers || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card p-4 mb-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-semibold text-[var(--ink)]">Payment collection</h2>
                                <p className="text-xs text-[var(--muted)]">Collected amount by payment source for the selected filters</p>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm">
                                <span className="text-[var(--ink)]"><strong className="text-blue-600">Cash</strong> Rs {Number(summary.totalCash || 0).toLocaleString()}</span>
                                <span className="text-[var(--ink)]"><strong className="text-orange-600">Credit</strong> Rs {Number(summary.totalCredit || 0).toLocaleString()}</span>
                                <span className="text-[var(--ink)]"><strong>{summary.totalPendingOrders || 0}</strong> unpaid invoices</span>
                            </div>
                        </div>
                    </div>

                    {/* Sales Table */}
                    <div className="card">
                        <div className="p-4 border-b border-[var(--border)]">
                            <h2 className="text-lg font-semibold text-[var(--ink)]">{labels.salesReport}</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[var(--surface-muted)]">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">#</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">{labels.invoiceNo}</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">{labels.date}</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">{labels.customer}</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.items}</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.total}</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.paidAmount}</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.dueAmount}</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">{labels.paymentStatus}</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">{labels.actions}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {sales.length === 0 ? (
                                        <tr>
                                            <td colSpan="10" className="px-4 py-8 text-center text-[var(--muted)]">
                                                {labels.noDataFound}
                                            </td>
                                        </tr>
                                    ) : (
                                        sales.map((sale) => (
                                            <tr key={sale._id} className="hover:bg-[var(--surface-muted)] transition-colors">
                                                <td className="px-4 py-3 font-bold text-[var(--accent-2)]">#{sale.rank}</td>
                                                <td className="px-4 py-3 text-sm text-[var(--ink)] font-medium">{sale.orderNumber || "—"}</td>
                                                <td className="px-4 py-3 text-sm text-[var(--muted)]">{formatDate(sale.createdAt)}</td>
                                                <td className="px-4 py-3 text-sm text-[var(--ink)]">{sale.customerName || "—"}</td>
                                                <td className="px-4 py-3 text-sm text-right text-[var(--ink)]">{sale.itemsCount || 0}</td>
                                                <td className="px-4 py-3 text-sm text-right font-semibold text-[var(--accent-2)]">Rs {(sale.totalAmount || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">Rs {(sale.paidAmount || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">Rs {(sale.dueAmount || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getPaymentStatusColor(sale.paymentStatus)}`}>
                                                        {getPaymentStatusLabel(sale.paymentStatus)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => setSelectedSale(sale)}
                                                        className="p-2 hover:bg-[var(--app-bg)] rounded-lg transition-colors"
                                                        title={labels.viewDetails}
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
                    <div className="px-4 py-3 flex items-center justify-between border-t border-[var(--border)] bg-[var(--surface-muted)]">
                        <span className="text-xs text-[var(--muted)]">{total ? `${(page - 1) * limit + 1}-${Math.min(page * limit, total)} of ${total} invoices` : "0 invoices"}</span>
                        <div className="flex items-center gap-2">
                            <button disabled={page === 1} onClick={() => setPage(value => value - 1)} className="px-3 py-1.5 text-xs rounded border border-[var(--border)] disabled:opacity-40">Previous</button>
                            <span className="text-xs text-[var(--muted)]">Page {page} of {totalPages}</span>
                            <button disabled={page === totalPages} onClick={() => setPage(value => value + 1)} className="px-3 py-1.5 text-xs rounded border border-[var(--border)] disabled:opacity-40">Next</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sale Detail Modal */}
            {selectedSale && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedSale(null)}>
                    <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-[var(--ink)]">Sale Details</h2>
                            <button onClick={() => setSelectedSale(null)} className="p-2 hover:bg-[var(--app-bg)] rounded-lg">
                                <X size={20} className="text-[var(--muted)]" />
                            </button>
                        </div>
                        <div className="p-4">
                            {/* Invoice Info */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">Invoice Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-[var(--muted)]">Invoice Number</p>
                                        <p className="font-medium text-[var(--ink)]">{selectedSale.orderNumber || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--muted)]">Date</p>
                                        <p className="font-medium text-[var(--ink)]">{formatDate(selectedSale.createdAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--muted)]">Customer Name</p>
                                        <p className="font-medium text-[var(--ink)]">{selectedSale.customerName || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--muted)]">Customer Type</p>
                                        <p className="font-medium capitalize text-[var(--ink)]">{selectedSale.customerType || "—"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Item-wise breakdown */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">Items</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-[var(--surface-muted)]">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-[var(--muted)]">Product</th>
                                                <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-[var(--muted)]">Qty</th>
                                                <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-[var(--muted)]">Unit Price</th>
                                                <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-[var(--muted)]">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border)]">
                                            {selectedSale.items && selectedSale.items.length > 0 ? (
                                                selectedSale.items.map((item, index) => (
                                                    <tr key={index}>
                                                        <td className="px-3 py-2 text-[var(--ink)]">{item.product?.name || "—"}</td>
                                                        <td className="px-3 py-2 text-right text-[var(--ink)]">{item.quantity || 0}</td>
                                                        <td className="px-3 py-2 text-right text-[var(--ink)]">Rs {Number(item.unitPrice || 0).toLocaleString()}</td>
                                                        <td className="px-3 py-2 text-right font-semibold text-[var(--accent-2)]">Rs {Number(item.itemTotal ?? item.lineTotal ?? 0).toLocaleString()}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="px-3 py-4 text-center text-[var(--muted)]">No items</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Payment Info */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">Payment Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-[var(--muted)]">Total Amount</p>
                                        <p className="font-semibold text-[var(--ink)]">Rs {(selectedSale.totalAmount || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--muted)]">Paid Amount</p>
                                        <p className="font-semibold text-green-600">Rs {(selectedSale.paidAmount || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--muted)]">Due Amount</p>
                                        <p className="font-semibold text-red-600">Rs {(selectedSale.dueAmount || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--muted)]">Payment Method</p>
                                        <p className="font-medium capitalize text-[var(--ink)]">{selectedSale.paymentMethod || "—"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Discount/Tax */}
                            <div>
                                <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">Discount & Tax</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-[var(--muted)]">Discount</p>
                                        <p className="font-semibold text-[var(--ink)]">Rs {(selectedSale.discountAmount || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--muted)]">Tax</p>
                                        <p className="font-semibold text-[var(--ink)]">Rs {(selectedSale.taxAmount || 0).toLocaleString()}</p>
                                    </div>
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
                fileName={`${labels.salesReport}.pdf`}
                labels={labels}
            >
                <SalesKPIReportPdfTemplate
                    summary={summary}
                    sales={sales}
                    labels={labels}
                    selectedPeriodLabel={period === "custom" ? `${fromDate} to ${toDate}` : period}
                />
            </PdfModal>
        </div>
    );
}
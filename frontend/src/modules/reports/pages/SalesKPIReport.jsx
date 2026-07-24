import React, { useState, useMemo, useEffect } from "react";
import { DollarSign, ShoppingCart, RefreshCw, Filter, Eye, Package, CreditCard, AlertCircle, TrendingUp, X } from "lucide-react";
import { useGetSalesReportQuery } from "../services/reports.service.js";
import { useCustomers } from "../../customers/services/customers.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";

export default function SalesKPIReport() {
    const [period, setPeriod] = useState("today");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [customerType, setCustomerType] = useState("all");
    const [customerId, setCustomerId] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("all");
    const [sortBy, setSortBy] = useState("amount");
    const [sortOrder, setSortOrder] = useState("desc");
    const [search, setSearch] = useState("");
    const [selectedSale, setSelectedSale] = useState(null);

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
        customerType, customerId, paymentStatus, sortBy, sortOrder, search 
    }), [period, fromDate, toDate, dates.from, dates.to, customerType, customerId, paymentStatus, sortBy, sortOrder, search]);

    const { data, isLoading, isFetching, error, refetch } = useGetSalesReportQuery(filters);
    const { data: customersData } = useCustomers();

    if (error) {
        showError(error?.data?.message || "Failed to load sales report");
    }

    const handleRefresh = () => refetch();

    const summary = data?.summary || {};
    const sales = data?.data || [];

    const showLoader = isLoading || isFetching;

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
            case 'full': return 'Paid';
            case 'partial': return 'Partial';
            case 'unpaid': return 'Unpaid';
            default: return status;
        }
    };

    const customersList = customersData?.data || [];

    return (
        <div className="p-6 min-h-screen bg-[var(--app-bg)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--ink)] font-display">Sales Report</h1>
                    <p className="text-sm text-[var(--muted)]">
                        Sales analytics and payment tracking
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
                            <option value="month">This Month</option>
                            <option value="3month">Last 3 Months</option>
                            <option value="year">This Year</option>
                            <option value="custom">Custom</option>
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
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Customer Type</label>
                        <select
                            value={customerType}
                            onChange={(e) => setCustomerType(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="all">All Types</option>
                            <option value="walk-in">Walk-in</option>
                            <option value="registered">Registered</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Customer</label>
                        <select
                            value={customerId}
                            onChange={(e) => setCustomerId(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="">All Customers</option>
                            {customersList.map((customer) => (
                                <option key={customer._id} value={customer._id}>
                                    {customer.name}
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
                            <option value="all">All Status</option>
                            <option value="paid">Paid</option>
                            <option value="unpaid">Unpaid</option>
                            <option value="partial">Partial</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Sort By</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="amount">Amount</option>
                            <option value="date">Date</option>
                            <option value="items">Items</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Order</label>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="desc">Descending</option>
                            <option value="asc">Ascending</option>
                        </select>
                    </div>
                </div>
                <div className="mt-4">
                    <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Search</label>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[var(--accent-2)]/10 flex items-center justify-center">
                                    <DollarSign size={20} className="text-[var(--accent-2)]" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">Total Sales</p>
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
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">Total Orders</p>
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
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">Total Paid</p>
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
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">Total Due</p>
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
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">Avg Order Value</p>
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
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">Total Items Sold</p>
                                    <p className="font-semibold text-[var(--ink)]">
                                        {summary.totalItems || 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sales Table */}
                    <div className="card">
                        <div className="p-4 border-b border-[var(--border)]">
                            <h2 className="text-lg font-semibold text-[var(--ink)]">Sales Rankings</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[var(--surface-muted)]">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">#</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Invoice No</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Customer</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Items</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Total Amount</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Paid</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Due</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">Payment Status</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {sales.length === 0 ? (
                                        <tr>
                                            <td colSpan="10" className="px-4 py-8 text-center text-[var(--muted)]">
                                                No sales found for the selected filters
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
                                                        <td className="px-3 py-2 text-right text-[var(--ink)]">Rs {(item.price || 0).toLocaleString()}</td>
                                                        <td className="px-3 py-2 text-right font-semibold text-[var(--accent-2)]">Rs {((item.quantity || 0) * (item.price || 0)).toLocaleString()}</td>
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
        </div>
    );
}
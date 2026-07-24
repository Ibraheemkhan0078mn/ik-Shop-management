import React, { useState } from "react";
import { Truck, DollarSign, RefreshCw, Filter, Eye, Star, AlertCircle, X } from "lucide-react";
import { useGetSupplierReportQuery } from "../services/reports.service.js";
import { useSuppliers } from "../../suppliers/services/suppliers.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";

export default function SupplierKPIReport() {
    const [period, setPeriod] = useState("today");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [supplierId, setSupplierId] = useState("");
    const [sortBy, setSortBy] = useState("totalPurchases");
    const [sortOrder, setSortOrder] = useState("desc");
    const [paymentStatus, setPaymentStatus] = useState("all");
    const [search, setSearch] = useState("");
    const [selectedSupplier, setSelectedSupplier] = useState(null);

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

    const dates = getDatesFromPeriod(period);
    const filters = { 
        fromDate: period === "custom" ? fromDate : dates.from, 
        toDate: period === "custom" ? toDate : dates.to, 
        supplierId, sortBy, sortOrder, paymentStatus, search 
    };
    
    const { data, isLoading, isFetching, error, refetch } = useGetSupplierReportQuery(filters);
    const { data: suppliersData } = useSuppliers();

    if (error) {
        showError(error?.data?.message || "Failed to load supplier report");
    }

    const handleRefresh = () => refetch();

    const summary = data?.summary || {};
    const suppliers = data?.data || [];

    const showLoader = isLoading || isFetching;

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString();
    };

    const getDeliveryStatusColor = (status) => {
        switch (status) {
            case 'delivered': return 'bg-green-100 text-green-800 border-green-300';
            case 'ordered': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const suppliersList = suppliersData?.data || [];

    return (
        <div className="p-6 min-h-screen bg-[var(--app-bg)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--ink)] font-display">Supplier Report</h1>
                    <p className="text-sm text-[var(--muted)]">
                        Supplier analytics and payment tracking
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
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Supplier</label>
                        <select
                            value={supplierId}
                            onChange={(e) => setSupplierId(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="">All Suppliers</option>
                            {suppliersList.map((supplier) => (
                                <option key={supplier._id} value={supplier._id}>
                                    {supplier.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Sort By</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="totalPurchases">Total Purchases</option>
                            <option value="dueAmount">Due Amount</option>
                            <option value="lastPurchase">Last Purchase</option>
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
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Status</label>
                        <select
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="all">All</option>
                            <option value="paid">Paid</option>
                            <option value="unpaid">Unpaid</option>
                            <option value="partial">Partial</option>
                        </select>
                    </div>
                </div>
                <div className="mt-4">
                    <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Search</label>
                    <input
                        type="text"
                        placeholder="Supplier name..."
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[var(--accent-2)]/10 flex items-center justify-center">
                                    <Truck size={20} className="text-[var(--accent-2)]" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">Total Suppliers</p>
                                    <p className="font-semibold text-[var(--ink)]">
                                        {summary.totalSuppliers || 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[var(--accent-2)]/10 flex items-center justify-center">
                                    <DollarSign size={20} className="text-[var(--accent-2)]" />
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
                                    <DollarSign size={20} className="text-green-600" />
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
                                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                                    <Star size={20} className="text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">Top Supplier</p>
                                    <p className="font-semibold text-[var(--ink)] text-sm truncate max-w-[150px]">
                                        {summary.topSupplier?.name || "—"}
                                    </p>
                                    <p className="text-xs text-[var(--muted)]">
                                        Rs {(summary.topSupplier?.amount || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Supplier Table */}
                    <div className="card">
                        <div className="p-4 border-b border-[var(--border)]">
                            <h2 className="text-lg font-semibold text-[var(--ink)]">Supplier Rankings</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[var(--surface-muted)]">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">#</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Supplier Name</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Total Purchases</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Total Paid</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Due Amount</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Last Purchase</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {suppliers.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-8 text-center text-[var(--muted)]">
                                                No suppliers found for the selected filters
                                            </td>
                                        </tr>
                                    ) : (
                                        suppliers.map((supplier) => (
                                            <tr key={supplier._id} className="hover:bg-[var(--surface-muted)] transition-colors">
                                                <td className="px-4 py-3 font-bold text-[var(--accent-2)]">#{supplier.rank}</td>
                                                <td className="px-4 py-3 text-sm text-[var(--ink)] font-medium">{supplier.name}</td>
                                                <td className="px-4 py-3 text-right font-semibold text-[var(--accent-2)]">Rs {(supplier.totalPurchases || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right text-green-600 font-medium">Rs {(supplier.totalPaid || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right text-red-600 font-medium">Rs {(supplier.totalDue || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-[var(--muted)]">{formatDate(supplier.lastPurchase)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => setSelectedSupplier(supplier)}
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

            {/* Supplier Detail Modal */}
            {selectedSupplier && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedSupplier(null)}>
                    <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-[var(--ink)]">Supplier Details</h2>
                            <button onClick={() => setSelectedSupplier(null)} className="p-2 hover:bg-[var(--app-bg)] rounded-lg">
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
                                        <p className="font-medium text-[var(--ink)]">{selectedSupplier.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--muted)]">Phone</p>
                                        <p className="font-medium text-[var(--ink)]">{selectedSupplier.phone || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--muted)]">Address</p>
                                        <p className="font-medium text-[var(--ink)]">{selectedSupplier.address || "—"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">Statistics</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-3 bg-[var(--surface-muted)] rounded-lg">
                                        <p className="text-xs text-[var(--muted)]">Total Purchases</p>
                                        <p className="font-semibold text-[var(--accent-2)]">Rs {(selectedSupplier.totalPurchases || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 bg-[var(--surface-muted)] rounded-lg">
                                        <p className="text-xs text-[var(--muted)]">Total Bills</p>
                                        <p className="font-semibold text-[var(--ink)]">{selectedSupplier.totalBills || 0}</p>
                                    </div>
                                    <div className="p-3 bg-[var(--surface-muted)] rounded-lg">
                                        <p className="text-xs text-[var(--muted)]">Outstanding Due</p>
                                        <p className="font-semibold text-red-600">Rs {(selectedSupplier.totalDue || 0).toLocaleString()}</p>
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
                                                <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-[var(--muted)]">Amount</th>
                                                <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-[var(--muted)]">Paid</th>
                                                <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-[var(--muted)]">Due</th>
                                                <th className="px-3 py-2 text-center text-xs font-semibold uppercase text-[var(--muted)]">Delivery</th>
                                                <th className="px-3 py-2 text-center text-xs font-semibold uppercase text-[var(--muted)]">Reject</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border)]">
                                            {selectedSupplier.purchases && selectedSupplier.purchases.length > 0 ? (
                                                selectedSupplier.purchases.map((purchase) => {
                                                    const paidAmount = purchase.paidAmount || 0;
                                                    const dueAmount = purchase.totalAmount - paidAmount;
                                                    const isRejected = purchase.status === 'rejected';
                                                    
                                                    return (
                                                        <tr key={purchase._id}>
                                                            <td className="px-3 py-2 text-[var(--muted)]">{formatDate(purchase.createdAt)}</td>
                                                            <td className="px-3 py-2 text-[var(--ink)]">{purchase.invoiceNumber || "—"}</td>
                                                            <td className="px-3 py-2 text-right font-medium text-[var(--accent-2)]">Rs {(purchase.totalAmount || 0).toLocaleString()}</td>
                                                            <td className="px-3 py-2 text-right text-green-600">Rs {paidAmount.toLocaleString()}</td>
                                                            <td className="px-3 py-2 text-right text-red-600">Rs {dueAmount.toLocaleString()}</td>
                                                            <td className="px-3 py-2 text-center">
                                                                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getDeliveryStatusColor(purchase.status)}`}>
                                                                    {purchase.status === 'delivered' ? 'Received' : purchase.status === 'ordered' ? 'Pending' : purchase.status || "—"}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-2 text-center">
                                                                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${isRejected ? 'bg-red-100 text-red-800 border-red-300' : 'bg-green-100 text-green-800 border-green-300'}`}>
                                                                    {isRejected ? 'Yes' : 'No'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan="7" className="px-3 py-4 text-center text-[var(--muted)]">No purchase history</td>
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
        </div>
    );
}
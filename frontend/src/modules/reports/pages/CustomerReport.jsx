import React, { useState, useMemo } from "react";
import { Users, DollarSign, RefreshCw, Filter, Eye, Star, AlertCircle, X } from "lucide-react";
import { useGetCustomerReportQuery, useGetCustomerReportKPIQuery } from "../services/reports.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PdfModal from "../../../shared/components/PdfModal.jsx";
import CustomerReportPdfTemplate from "../components/CustomerReportPdfTemplate.jsx";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getReportsLabels } from "../labels/reportsLabels.js";

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
            return { from: today.toISOString().split('T')[0], to: today.toISOString().split('T')[0] };
        case "month":
            return { from: monthStart.toISOString().split('T')[0], to: monthEnd.toISOString().split('T')[0] };
        case "3month":
            return { from: threeMonthStart.toISOString().split('T')[0], to: threeMonthEnd.toISOString().split('T')[0] };
        case "year":
            return { from: yearStart.toISOString().split('T')[0], to: yearEnd.toISOString().split('T')[0] };
        default:
            return { from: today.toISOString().split('T')[0], to: today.toISOString().split('T')[0] };
    }
};

function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || "";
    const second = parts.length > 1 ? parts[1][0] : "";
    return (first + second).toUpperCase();
}

function Avatar({ name, size = 8, textSize = "text-xs" }) {
    return (
        <div
            className={`w-${size} h-${size} rounded-full flex items-center justify-center ${textSize} font-bold shrink-0`}
            style={{ background: 'var(--accent-2)17', color: 'var(--accent-2)' }}
        >
            {getInitials(name)}
        </div>
    );
}

function KpiCard({ label, value, icon: Icon, color, sub }) {
    return (
        <div className="rounded-2xl border p-4 transition-shadow hover:shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}17` }}>
                    <Icon size={18} style={{ color }} />
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wide truncate" style={{ color: 'var(--muted)' }}>{label}</p>
                    <p className="text-sm font-bold tabular-nums truncate" style={{ color: 'var(--ink)' }}>{value}</p>
                    {sub && <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{sub}</p>}
                </div>
            </div>
        </div>
    );
}

function TypeBadge({ type }) {
    const isRegular = type === "regular";
    return (
        <span
            className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border"
            style={{
                background: isRegular ? '#3b82f617' : 'var(--surface-muted)',
                color: isRegular ? '#3b82f6' : 'var(--muted)',
                borderColor: isRegular ? '#3b82f640' : 'var(--border)'
            }}
        >
            {type || "walkin"}
        </span>
    );
}

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

    return (
        <div className="p-6 min-h-screen" style={{ background: 'var(--app-bg)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--ink)' }}>{labels.customerReport}</h1>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>{labels.customerAnalytics}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleRefresh} className="px-4 py-2 rounded-xl border transition-colors flex items-center gap-2" style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--ink)' }}>
                        <RefreshCw size={16} className={showLoader ? "animate-spin" : ""} style={{ color: 'var(--accent-2)' }} />
                        {labels.refresh}
                    </button>
                    <button onClick={() => setIsPdfModalOpen(true)} className="px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90 flex items-center gap-2" style={{ background: 'var(--accent-2)' }}>
                        {labels.exportPdf}
                    </button>
                </div>
            </div>

            {/* Filter bar */}
            <div className="rounded-2xl border p-4 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 mb-3">
                    <Filter size={16} style={{ color: 'var(--accent-2)' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{labels.filters}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>{labels.period}</label>
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2"
                            style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }}
                        >
                            <option value="today">{labels.today}</option>
                            <option value="month">{labels.thisMonth}</option>
                            <option value="3month">{labels.last3Months}</option>
                            <option value="year">{labels.thisYear}</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>{labels.customerType}</label>
                        <select
                            value={customerType}
                            onChange={(e) => setCustomerType(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2"
                            style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }}
                        >
                            <option value="all">{labels.allTypes}</option>
                            <option value="walkin">{labels.walkIn}</option>
                            <option value="regular">{labels.registered}</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>{labels.search}</label>
                        <input
                            type="text"
                            placeholder="Customer name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2"
                            style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }}
                        />
                    </div>
                </div>
            </div>

            {showLoader ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-2)' }}></div>
                </div>
            ) : (
                <div>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
                        <KpiCard label={labels.totalCustomers} value={summary.totalCustomers || 0} icon={Users} color="var(--accent-2)" />
                        <KpiCard label={labels.totalSales} value={`Rs ${(summary.totalSales || 0).toLocaleString()}`} icon={DollarSign} color="#10b981" />
                        <KpiCard label={labels.avgOrderValue} value={`Rs ${(summary.avgOrderValue || 0).toFixed(2)}`} icon={DollarSign} color="#3b82f6" />
                        <KpiCard label={labels.totalDue} value={`Rs ${(summary.totalDue || 0).toLocaleString()}`} icon={AlertCircle} color="#dc2626" />
                        <KpiCard
                            label={labels.topCustomer}
                            value={summary.topCustomer || "—"}
                            sub={`Rs ${(summary.topCustomerAmount || 0).toLocaleString()}`}
                            icon={Star}
                            color="#f59e0b"
                        />
                        <KpiCard label={labels.newCustomers} value={summary.newCustomers || 0} icon={Users} color="#8b5cf6" />
                    </div>

                    {/* Customer Table */}
                    <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                            <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>{labels.customerReport}</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead style={{ background: 'var(--surface-muted)' }}>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.customer}</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.customerType}</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.phone}</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.totalOrders}</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.totalSpent}</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.avgOrderValue}</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.totalDue}</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.lastPurchase}</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.actions}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                    {customers.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="px-4 py-8 text-center" style={{ color: 'var(--muted)' }}>{labels.noDataFound}</td>
                                        </tr>
                                    ) : (
                                        customers.map((customer) => (
                                            <tr key={customer._id} className="transition-colors" style={{ background: 'transparent' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-muted)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                                <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--ink)' }}>
                                                    <div className="flex items-center gap-2.5">
                                                        <Avatar name={customer.name} />
                                                        <span>{customer.name || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3"><TypeBadge type={customer.customerType} /></td>
                                                <td className="px-4 py-3 text-sm" style={{ color: 'var(--ink)' }}>{customer.phone || '-'}</td>
                                                <td className="px-4 py-3 text-right text-sm tabular-nums" style={{ color: 'var(--ink)' }}>{customer.totalOrders || 0}</td>
                                                <td className="px-4 py-3 text-right font-semibold tabular-nums" style={{ color: 'var(--accent-2)' }}>Rs {(customer.totalSpent || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right text-sm tabular-nums" style={{ color: 'var(--ink)' }}>Rs {customer.totalOrders > 0 ? ((customer.totalSpent || 0) / customer.totalOrders).toFixed(2) : '0.00'}</td>
                                                <td className="px-4 py-3 text-right font-medium tabular-nums" style={{ color: '#dc2626' }}>Rs {(customer.dueAmount || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm" style={{ color: 'var(--muted)' }}>{formatDate(customer.lastOrderDate)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => setSelectedCustomer(customer)}
                                                        className="p-2 rounded-lg transition-colors"
                                                        style={{ background: 'transparent' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--app-bg)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} style={{ color: 'var(--accent-2)' }} />
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
                    <div className="rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                            <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>Customer Details</h2>
                            <button onClick={() => setSelectedCustomer(null)} className="p-2 rounded-lg transition-colors"
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--app-bg)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                <X size={20} style={{ color: 'var(--muted)' }} />
                            </button>
                        </div>
                        <div className="p-5">
                            {/* Basic Info */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>Basic Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 col-span-2">
                                        <Avatar name={selectedCustomer.name} size={12} textSize="text-sm" />
                                        <div>
                                            <p className="text-xs" style={{ color: 'var(--muted)' }}>Name</p>
                                            <p className="font-medium" style={{ color: 'var(--ink)' }}>{selectedCustomer.name}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>Phone</p>
                                        <p className="font-medium" style={{ color: 'var(--ink)' }}>{selectedCustomer.phone || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>Email</p>
                                        <p className="font-medium" style={{ color: 'var(--ink)' }}>{selectedCustomer.email || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>Type</p>
                                        <TypeBadge type={selectedCustomer.customerType} />
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>Statistics</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="p-3 rounded-xl" style={{ background: 'var(--surface-muted)' }}>
                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>Total Spent</p>
                                        <p className="font-semibold tabular-nums" style={{ color: 'var(--accent-2)' }}>Rs {(selectedCustomer.totalSpent || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 rounded-xl" style={{ background: 'var(--surface-muted)' }}>
                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>Total Orders</p>
                                        <p className="font-semibold tabular-nums" style={{ color: 'var(--ink)' }}>{selectedCustomer.totalOrders || 0}</p>
                                    </div>
                                    <div className="p-3 rounded-xl" style={{ background: 'var(--surface-muted)' }}>
                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>Due Amount</p>
                                        <p className="font-semibold tabular-nums" style={{ color: '#dc2626' }}>Rs {(selectedCustomer.dueAmount || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Purchase History */}
                            <div>
                                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>Purchase History</h3>
                                <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                                    <table className="w-full text-sm">
                                        <thead style={{ background: 'var(--surface-muted)' }}>
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Date</th>
                                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Bill No</th>
                                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Items</th>
                                                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Amount</th>
                                                <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Payment</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                            {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                                                selectedCustomer.orders.map((order) => (
                                                    <tr key={order._id}>
                                                        <td className="px-3 py-2" style={{ color: 'var(--muted)' }}>{formatDate(order.createdAt)}</td>
                                                        <td className="px-3 py-2" style={{ color: 'var(--ink)' }}>{order.invoiceNumber || "—"}</td>
                                                        <td className="px-3 py-2" style={{ color: 'var(--ink)' }}>{order.items?.length || 0} items</td>
                                                        <td className="px-3 py-2 text-right font-medium tabular-nums" style={{ color: 'var(--accent-2)' }}>Rs {(order.totalAmount || 0).toLocaleString()}</td>
                                                        <td className="px-3 py-2 text-center">
                                                            <span
                                                                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border"
                                                                style={order.paymentMethod === 'credit'
                                                                    ? { background: '#f59e0b17', color: '#f59e0b', borderColor: '#f59e0b40' }
                                                                    : { background: '#10b98117', color: '#10b981', borderColor: '#10b98140' }}
                                                            >
                                                                {order.paymentMethod || "—"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="px-3 py-4 text-center" style={{ color: 'var(--muted)' }}>No purchase history</td>
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
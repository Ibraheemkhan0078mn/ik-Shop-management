import React from "react";
import { Users, DollarSign, Star, AlertCircle } from "lucide-react";

function KpiCard({ label, value, icon: Icon, color, isCurrency = true, subValue }) {
    return (
        <div className="card p-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                    <Icon size={20} style={{ color }} />
                </div>
                <div>
                    <p className="text-xs text-[var(--muted)] uppercase font-bold">{label}</p>
                    <p className="font-semibold text-[var(--ink)]">
                        {isCurrency ? `Rs ${value?.toLocaleString() || 0}` : (value?.toLocaleString() || value || 0)}
                    </p>
                    {subValue && (
                        <p className="text-xs text-[var(--muted)]">
                            Rs {subValue?.toLocaleString() || 0}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function CustomerReportPdfTemplate({ summary = {}, customers = [], labels = {}, selectedPeriodLabel = '' }) {
    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString();
    };

    const getCustomerTypeColor = (type) => {
        return type === "regular" ? "bg-blue-100 text-blue-800 border-blue-300" : "bg-gray-100 text-gray-800 border-gray-300";
    };

    return (
        <div className="p-6 bg-[var(--app-bg)] text-[var(--ink)] min-h-screen">
            <div className="mb-6">
                <h1 className="text-2xl font-bold font-display">{labels.customerReport}</h1>
                <p className="text-sm text-[var(--muted)]">{labels.customerAnalytics} · {selectedPeriodLabel}</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <KpiCard
                    label={labels.totalCustomers}
                    value={summary.totalCustomers}
                    icon={Users}
                    color="#3b82f6"
                    isCurrency={false}
                />
                <KpiCard
                    label={labels.walkIn}
                    value={summary.totalSalesWalkIn}
                    icon={DollarSign}
                    color="#6b7280"
                />
                <KpiCard
                    label={labels.registered}
                    value={summary.totalSalesRegistered}
                    icon={DollarSign}
                    color="#3b82f6"
                />
                <KpiCard
                    label={labels.totalDue}
                    value={summary.totalDue}
                    icon={AlertCircle}
                    color="#ef4444"
                />
                <KpiCard
                    label={labels.topCustomer}
                    value={summary.topCustomer?.name}
                    icon={Star}
                    color="#f59e0b"
                    isCurrency={false}
                    subValue={summary.topCustomer?.amount}
                />
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
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">#</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">{labels.customer}</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">{labels.customerType}</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.totalOrders}</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.totalSpent}</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.dueAmount}</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">{labels.lastPurchase}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {customers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center text-[var(--muted)]">
                                        {labels.noDataFound}
                                    </td>
                                </tr>
                            ) : (
                                customers.slice(0, 50).map((customer) => (
                                    <tr key={customer._id} className="hover:bg-[var(--surface-muted)] transition-colors">
                                        <td className="px-4 py-3 font-bold text-[var(--accent-2)]">#{customer.rank}</td>
                                        <td className="px-4 py-3 text-sm text-[var(--ink)] font-medium">{customer.name}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getCustomerTypeColor(customer.customerType)}`}>
                                                {customer.customerType || "walkin"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm text-[var(--ink)]">{customer.totalOrders || 0}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-[var(--accent-2)]">Rs {(customer.totalSpent || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-red-600 font-medium">Rs {(customer.dueAmount || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-sm text-[var(--muted)]">{formatDate(customer.lastPurchase)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {customers.length > 50 && (
                    <div className="px-4 py-2 text-xs text-center text-[var(--muted)]">
                        Showing first 50 of {customers.length} customers
                    </div>
                )}
            </div>
        </div>
    );
}

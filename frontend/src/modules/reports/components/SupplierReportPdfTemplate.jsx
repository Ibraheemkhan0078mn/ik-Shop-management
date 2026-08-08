import React from "react";
import { Truck, DollarSign, Star, AlertCircle } from "lucide-react";

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

export default function SupplierReportPdfTemplate({ summary = {}, suppliers = [], labels = {}, selectedPeriodLabel = '' }) {
    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString();
    };

    return (
        <div className="p-6 bg-[var(--app-bg)] text-[var(--ink)] min-h-screen">
            <div className="mb-6">
                <h1 className="text-2xl font-bold font-display">{labels.supplierReport}</h1>
                <p className="text-sm text-[var(--muted)]">{labels.supplierAnalytics} · {selectedPeriodLabel}</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <KpiCard
                    label={labels.totalSuppliers}
                    value={summary.totalSuppliers}
                    icon={Truck}
                    color="#3b82f6"
                    isCurrency={false}
                />
                <KpiCard
                    label={labels.totalPurchases}
                    value={summary.totalPurchases}
                    icon={DollarSign}
                    color="#3b82f6"
                />
                <KpiCard
                    label={labels.totalPaid}
                    value={summary.totalPaid}
                    icon={DollarSign}
                    color="#22c55e"
                />
                <KpiCard
                    label={labels.totalDue}
                    value={summary.totalDue}
                    icon={AlertCircle}
                    color="#ef4444"
                />
                <KpiCard
                    label={labels.topSupplier}
                    value={summary.topSupplier?.name}
                    icon={Star}
                    color="#eab308"
                    isCurrency={false}
                    subValue={summary.topSupplier?.amount}
                />
            </div>

            {/* Supplier Table */}
            <div className="card">
                <div className="p-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-semibold text-[var(--ink)]">{labels.supplierReport}</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[var(--surface-muted)]">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">#</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">{labels.supplier}</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.totalPurchases}</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.totalPaid}</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.dueAmount}</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">{labels.lastPurchase}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {suppliers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-[var(--muted)]">
                                        {labels.noDataFound}
                                    </td>
                                </tr>
                            ) : (
                                suppliers.slice(0, 50).map((supplier) => (
                                    <tr key={supplier._id} className="hover:bg-[var(--surface-muted)] transition-colors">
                                        <td className="px-4 py-3 font-bold text-[var(--accent-2)]">#{supplier.rank}</td>
                                        <td className="px-4 py-3 text-sm text-[var(--ink)] font-medium">{supplier.name}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-[var(--accent-2)]">Rs {(supplier.totalPurchases || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-green-600 font-medium">Rs {(supplier.totalPaid || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-red-600 font-medium">Rs {(supplier.totalDue || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-sm text-[var(--muted)]">{formatDate(supplier.lastPurchase)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {suppliers.length > 50 && (
                    <div className="px-4 py-2 text-xs text-center text-[var(--muted)]">
                        Showing first 50 of {suppliers.length} suppliers
                    </div>
                )}
            </div>
        </div>
    );
}

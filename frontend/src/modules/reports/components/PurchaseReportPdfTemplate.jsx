import React from "react";
import { Package, DollarSign, Truck, CheckCircle, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

function KpiCard({ label, value, icon: Icon, color, isCurrency = true }) {
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
                </div>
            </div>
        </div>
    );
}

export default function PurchaseReportPdfTemplate({ summary = {}, supplierBreakdown = [], purchases = [], labels = {}, selectedPeriodLabel = '' }) {
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

    return (
        <div className="p-6 bg-[var(--app-bg)] text-[var(--ink)] min-h-screen">
            <div className="mb-6">
                <h1 className="text-2xl font-bold font-display">{labels.purchaseReport}</h1>
                <p className="text-sm text-[var(--muted)]">{labels.purchaseDataFor} · {selectedPeriodLabel}</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                <KpiCard
                    label={labels.totalPurchases}
                    value={summary.totalPurchases}
                    icon={Package}
                    color="#3b82f6"
                />
                <KpiCard
                    label={labels.totalPaid}
                    value={summary.totalPaid}
                    icon={CheckCircle}
                    color="#10b981"
                />
                <KpiCard
                    label={labels.totalDue}
                    value={summary.totalDue}
                    icon={AlertCircle}
                    color="#ef4444"
                />
                <KpiCard
                    label={labels.delivered}
                    value={summary.totalDeliveredCount}
                    icon={CheckCircle2}
                    color="#10b981"
                    isCurrency={false}
                />
                <KpiCard
                    label={labels.rejected}
                    value={summary.totalRejectedCount}
                    icon={XCircle}
                    color="#ef4444"
                    isCurrency={false}
                />
                <KpiCard
                    label={labels.totalSuppliers}
                    value={summary.totalSuppliers}
                    icon={Truck}
                    color="#8b5cf6"
                    isCurrency={false}
                />
            </div>

            {/* Supplier-wise Breakdown */}
            {supplierBreakdown.length > 0 && (
                <div className="card p-4 mb-6">
                    <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">{labels.topSupplier}</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[var(--surface-muted)]">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-[var(--muted)]">{labels.supplier}</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.total}</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.paidAmount}</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.dueAmount}</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.totalBills}</th>
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
                    <h2 className="text-lg font-semibold text-[var(--ink)]">{labels.purchaseDetails}</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[var(--surface-muted)]">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">{labels.invoiceNo}</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">{labels.date}</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">{labels.supplier}</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.amount}</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.paidAmount}</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.dueAmount}</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">{labels.deliveryStatus}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {purchases.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center text-[var(--muted)]">
                                        {labels.noDataFound}
                                    </td>
                                </tr>
                            ) : (
                                purchases.slice(0, 50).map((purchase) => {
                                    const paidAmount = purchase.paidAmount || 0;
                                    const dueAmount = purchase.totalAmount - paidAmount;
                                    
                                    return (
                                        <tr key={purchase._id} className="hover:bg-[var(--surface-muted)]">
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
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                {purchases.length > 50 && (
                    <div className="px-4 py-2 text-xs text-center text-[var(--muted)]">
                        Showing first 50 of {purchases.length} purchases
                    </div>
                )}
            </div>
        </div>
    );
}

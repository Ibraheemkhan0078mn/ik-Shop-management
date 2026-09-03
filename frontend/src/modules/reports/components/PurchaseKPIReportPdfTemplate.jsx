import React from "react";
import { DollarSign, TrendingUp, Package, RefreshCw, Truck, AlertCircle } from "lucide-react";

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

export default function PurchaseKPIReportPdfTemplate({ summary = {}, breakdowns = {}, labels = {}, selectedPeriodLabel = '' }) {
    return (
        <div className="p-6 bg-[var(--app-bg)] text-[var(--ink)] min-h-screen">
            <div className="mb-6">
                <h1 className="text-2xl font-bold font-display">Purchase Report (KPI)</h1>
                <p className="text-sm text-[var(--muted)]">Purchase performance overview · {selectedPeriodLabel}</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <KpiCard
                    label="Total Purchased"
                    value={summary.totalAmountPurchased}
                    icon={DollarSign}
                    color="#3b82f6"
                />
                <KpiCard
                    label="Purchase Orders"
                    value={summary.totalPurchaseOrders}
                    icon={Package}
                    color="#3b82f6"
                    isCurrency={false}
                />
                <KpiCard
                    label="Items Received"
                    value={summary.totalItemsReceived}
                    icon={Truck}
                    color="#10b981"
                    isCurrency={false}
                />
                <KpiCard
                    label="Outstanding"
                    value={summary.totalUnpaid}
                    icon={AlertCircle}
                    color="#ef4444"
                />
                <KpiCard
                    label="Avg Order Value"
                    value={summary.averageOrderValue}
                    icon={DollarSign}
                    color="#8b5cf6"
                />
                <KpiCard
                    label="Total Returns"
                    value={summary.totalPurchaseReturns}
                    icon={RefreshCw}
                    color="#06b6d4"
                />
            </div>

            {/* Purchases by Supplier */}
            <div className="card mb-6">
                <div className="p-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-semibold text-[var(--ink)]">Purchases by Supplier</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[var(--surface-muted)]">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Supplier</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Total Amount</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Order Count</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Total Items</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Outstanding</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">%</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {breakdowns.bySupplier && breakdowns.bySupplier.length > 0 ? (
                                breakdowns.bySupplier.map((supplier, idx) => (
                                    <tr key={idx} className="hover:bg-[var(--surface-muted)] transition-colors">
                                        <td className="px-4 py-3 text-sm text-[var(--ink)] font-medium">{supplier.supplierName || "—"}</td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-[var(--accent-2)]">Rs {(supplier.totalAmount || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-sm text-right text-[var(--ink)]">{supplier.orderCount || 0}</td>
                                        <td className="px-4 py-3 text-sm text-right text-[var(--ink)]">{supplier.totalItems || 0}</td>
                                        <td className="px-4 py-3 text-sm text-right font-medium text-red-600">Rs {(supplier.outstandingPayable || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-sm text-right text-[var(--muted)]">{supplier.percentage}%</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-[var(--muted)]">
                                        No supplier data available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Purchase Returns by Supplier */}
            <div className="card">
                <div className="p-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-semibold text-[var(--ink)]">Purchase Returns by Supplier</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[var(--surface-muted)]">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Supplier</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Total Refund</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Return Count</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">%</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {breakdowns.purchaseReturnsBySupplier && breakdowns.purchaseReturnsBySupplier.length > 0 ? (
                                breakdowns.purchaseReturnsBySupplier.map((supplier, idx) => (
                                    <tr key={idx} className="hover:bg-[var(--surface-muted)] transition-colors">
                                        <td className="px-4 py-3 text-sm text-[var(--ink)] font-medium">{supplier.supplierName || "—"}</td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-[var(--accent-2)]">Rs {(supplier.total || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-sm text-right text-[var(--ink)]">{supplier.count || 0}</td>
                                        <td className="px-4 py-3 text-sm text-right text-[var(--muted)]">{supplier.percentage}%</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-4 py-8 text-center text-[var(--muted)]">
                                        No return data available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

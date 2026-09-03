import React from "react";
import { DollarSign, TrendingUp, Package, RefreshCw } from "lucide-react";

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

export default function SalesKPIReportPdfTemplate({ summary = {}, sales = [], labels = {}, selectedPeriodLabel = '' }) {
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
            case 'unpaid': return labels.unpaid;
            default: return status;
        }
    };

    return (
        <div className="p-6 bg-[var(--app-bg)] text-[var(--ink)] min-h-screen">
            <div className="mb-6">
                <h1 className="text-2xl font-bold font-display">{labels.salesReport}</h1>
                <p className="text-sm text-[var(--muted)]">{labels.salesDataFor} · {selectedPeriodLabel}</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <KpiCard
                    label="Net Sales"
                    value={summary.netSales ?? summary.totalSales}
                    icon={DollarSign}
                    color="#3b82f6"
                />
                <KpiCard
                    label="Net Profit"
                    value={summary.netProfit ?? summary.grossProfit}
                    icon={TrendingUp}
                    color="#10b981"
                />
                <KpiCard
                    label="Returns"
                    value={summary.totalReturnRefunds}
                    icon={RefreshCw}
                    color="#ef4444"
                />
                <KpiCard
                    label="Net COGS"
                    value={summary.netCOGS ?? summary.totalCostOfGoodsSold}
                    icon={Package}
                    color="#3b82f6"
                />
                <KpiCard
                    label="Orders"
                    value={summary.salesCount}
                    icon={TrendingUp}
                    color="#f59e0b"
                    isCurrency={false}
                />
                <KpiCard
                    label="Net Margin"
                    value={`${summary.netMarginPercentage ?? summary.grossMarginPercentage ?? 0}%`}
                    icon={Package}
                    color="#3b82f6"
                    isCurrency={false}
                />
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
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Gross Sales</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Returns</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Net Sales</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Net Profit</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">Return Docs</th>
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
                                sales.slice(0, 50).map((sale) => (
                                    <tr key={sale.id || sale._id} className="hover:bg-[var(--surface-muted)] transition-colors">
                                        <td className="px-4 py-3 font-bold text-[var(--accent-2)]">#{sale.orderNumber || "—"}</td>
                                        <td className="px-4 py-3 text-sm text-[var(--ink)] font-medium">{sale.orderNumber || "—"}</td>
                                        <td className="px-4 py-3 text-sm text-[var(--muted)]">{formatDate(sale.date || sale.createdAt)}</td>
                                        <td className="px-4 py-3 text-sm text-[var(--ink)]">{sale.customerName || "—"}</td>
                                        <td className="px-4 py-3 text-sm text-right text-[var(--ink)]">{sale.items?.length || sale.itemsCount || 0}</td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-[var(--accent-2)]">Rs {(sale.grossSales || sale.amount || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">Rs {(sale.returnRefunds || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-[var(--accent-2)]">Rs {(sale.netSales || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">Rs {(sale.netProfit || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-center">
                                            {sale.returns?.length || 0}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {sales.length > 50 && (
                    <div className="px-4 py-2 text-xs text-center text-[var(--muted)]">
                        Showing first 50 of {sales.length} sales
                    </div>
                )}
            </div>
        </div>
    );
}

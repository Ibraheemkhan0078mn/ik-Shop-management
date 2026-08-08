import React from "react";
import { Package, AlertTriangle, TrendingUp, Clock, Box, RotateCcw, Zap } from "lucide-react";

function KpiCard({ label, value, icon: Icon, color }) {
    return (
        <div className="card p-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                    <Icon size={20} style={{ color }} />
                </div>
                <div>
                    <p className="text-xs text-[var(--muted)] uppercase font-bold">{label}</p>
                    <p className="font-semibold text-[var(--ink)]">{value || 0}</p>
                </div>
            </div>
        </div>
    );
}

export default function InventoryReportPdfTemplate({ reportData = {}, labels = {}, selectedPeriodLabel = '' }) {
    const formatDate = (date) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString();
    };

    const TAG_LABELS = {
        dead_stock: { label: labels.deadStock, emoji: '🔴', color: 'bg-red-100 text-red-800 border-red-300' },
        low_stock: { label: labels.lowStock, emoji: '🟡', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
        fast_selling: { label: labels.fastSelling, emoji: '🟢', color: 'bg-green-100 text-green-800 border-green-300' },
        overstock: { label: labels.overstock, emoji: '🔵', color: 'bg-blue-100 text-blue-800 border-blue-300' },
        expired: { label: labels.expired, emoji: '⚫', color: 'bg-gray-100 text-gray-800 border-gray-300' },
        near_expiry: { label: labels.nearExpiry, emoji: '🟠', color: 'bg-orange-100 text-orange-800 border-orange-300' },
        high_return: { label: labels.highReturn, emoji: '🔴', color: 'bg-red-100 text-red-800 border-red-300' },
    };

    const summary = reportData?.summary || {};
    const products = reportData?.data || [];

    return (
        <div className="p-6 bg-[var(--app-bg)] text-[var(--ink)] min-h-screen">
            <div className="mb-6">
                <h1 className="text-2xl font-bold font-display">{labels.inventoryReport}</h1>
                <p className="text-sm text-[var(--muted)]">{labels.inventoryAnalysis} · {selectedPeriodLabel}</p>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
                    <KpiCard
                        label="Total"
                        value={summary.totalProducts}
                        icon={Package}
                        color="#3b82f6"
                    />
                    <KpiCard
                        label="Dead Stock"
                        value={summary.deadStockCount}
                        icon={AlertTriangle}
                        color="#ef4444"
                    />
                    <KpiCard
                        label="Expired"
                        value={summary.expiredCount}
                        icon={Clock}
                        color="#6b7280"
                    />
                    <KpiCard
                        label="Low Stock"
                        value={summary.lowStockCount}
                        icon={AlertTriangle}
                        color="#eab308"
                    />
                    <KpiCard
                        label="Fast Selling"
                        value={summary.fastSellingCount}
                        icon={TrendingUp}
                        color="#22c55e"
                    />
                    <KpiCard
                        label="Overstock"
                        value={summary.overstockCount}
                        icon={Box}
                        color="#3b82f6"
                    />
                    <KpiCard
                        label="High Return"
                        value={summary.highReturnCount}
                        icon={RotateCcw}
                        color="#ef4444"
                    />
                    <KpiCard
                        label="Near Expiry"
                        value={summary.nearExpiryCount}
                        icon={Zap}
                        color="#f97316"
                    />
                </div>
            )}

            {/* Report Table */}
            <div className="card">
                <div className="p-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-semibold text-[var(--ink)]">Inventory Details</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[var(--surface-muted)]">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Tag</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Product Name</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Code</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Category</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Stock</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Min</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Max</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Purchased</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Sold</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Returned</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Wasted</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Expiry</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Sales Rank</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Return Rank</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan="14" className="px-4 py-8 text-center text-[var(--muted)]">No inventory data found</td>
                                </tr>
                            ) : (
                                products.slice(0, 50).map((product) => (
                                    <tr key={product._id} className="hover:bg-[var(--surface-muted)] transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {product.tag && TAG_LABELS[product.tag] && (
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${TAG_LABELS[product.tag].color}`}>
                                                    <span>{TAG_LABELS[product.tag].emoji}</span>
                                                    {TAG_LABELS[product.tag].label}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[var(--ink)]">{product.name}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--muted)]">{product.code || '—'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--muted)]">{product.category?.name || '—'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">{product.currentStock}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--muted)]">{product.minStockLevel || '—'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--muted)]">{product.maxStockLevel || '—'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">{product.totalPurchased}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">{product.totalSold}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">{product.totalReturned}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">{product.totalWasted}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--muted)]">{formatDate(product.expiryDate)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--accent-2)] font-bold">#{product.salesRank}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--accent-2)] font-bold">#{product.returnRank}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {products.length > 50 && (
                    <div className="px-4 py-2 text-xs text-center text-[var(--muted)]">
                        Showing first 50 of {products.length} products
                    </div>
                )}
            </div>
        </div>
    );
}

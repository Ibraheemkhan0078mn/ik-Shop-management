import React from "react";

function KpiCard({ label, value, color }) {
    return (
        <div style={{ 
            padding: '1rem',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                    width: '2.5rem', 
                    height: '2.5rem', 
                    borderRadius: '0.5rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: `${color}20`
                }}>
                    <span style={{ fontSize: '1.25rem', color }}>📦</span>
                </div>
                <div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', margin: 0 }}>{label}</p>
                    <p style={{ fontWeight: '600', color: '#1f2937', margin: '0.25rem 0 0 0' }}>{value || 0}</p>
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
        dead_stock: { label: labels.deadStock, emoji: '🔴', color: '#fee2e2', textColor: '#991b1b', borderColor: '#fca5a5' },
        low_stock: { label: labels.lowStock, emoji: '🟡', color: '#fef9c3', textColor: '#854d0e', borderColor: '#fde047' },
        fast_selling: { label: labels.fastSelling, emoji: '🟢', color: '#dcfce7', textColor: '#166534', borderColor: '#86efac' },
        overstock: { label: labels.overstock, emoji: '🔵', color: '#dbeafe', textColor: '#1e40af', borderColor: '#93c5fd' },
        expired: { label: labels.expired, emoji: '⚫', color: '#f3f4f6', textColor: '#374151', borderColor: '#d1d5db' },
        near_expiry: { label: labels.nearExpiry, emoji: '🟠', color: '#fed7aa', textColor: '#9a3412', borderColor: '#fdba74' },
        high_return: { label: labels.highReturn, emoji: '🔴', color: '#fee2e2', textColor: '#991b1b', borderColor: '#fca5a5' },
    };

    const summary = reportData?.summary || {};
    const products = reportData?.data || [];

    return (
        <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', color: '#1f2937', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{labels.inventoryReport}</h1>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>{labels.inventoryAnalysis} · {selectedPeriodLabel}</p>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    <KpiCard
                        label="Total"
                        value={summary.totalProducts}
                        color="#3b82f6"
                    />
                    <KpiCard
                        label="Dead Stock"
                        value={summary.deadStockCount}
                        color="#ef4444"
                    />
                    <KpiCard
                        label="Expired"
                        value={summary.expiredCount}
                        color="#6b7280"
                    />
                    <KpiCard
                        label="Low Stock"
                        value={summary.lowStockCount}
                        color="#eab308"
                    />
                    <KpiCard
                        label="Fast Selling"
                        value={summary.fastSellingCount}
                        color="#22c55e"
                    />
                    <KpiCard
                        label="Overstock"
                        value={summary.overstockCount}
                        color="#3b82f6"
                    />
                    <KpiCard
                        label="High Return"
                        value={summary.highReturnCount}
                        color="#ef4444"
                    />
                    <KpiCard
                        label="Near Expiry"
                        value={summary.nearExpiryCount}
                        color="#f97316"
                    />
                </div>
            )}

            {/* Report Table */}
            <div style={{ 
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>Inventory Details</h2>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%' }}>
                        <thead style={{ backgroundColor: '#f3f4f6' }}>
                            <tr>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Tag</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Product Name</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Code</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Category</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Stock</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Min</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Max</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Purchased</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Sold</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Returned</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Wasted</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Expiry</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Sales Rank</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Return Rank</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan="14" style={{ padding: '2rem 1rem', textAlign: 'center', color: '#6b7280' }}>No inventory data found</td>
                                </tr>
                            ) : (
                                products.slice(0, 50).map((product) => (
                                    <tr key={product._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                                            {product.tag && TAG_LABELS[product.tag] && (
                                                <span style={{ 
                                                    display: 'inline-flex', 
                                                    alignItems: 'center', 
                                                    gap: '0.25rem', 
                                                    padding: '0.25rem 0.5rem', 
                                                    fontSize: '0.75rem', 
                                                    fontWeight: '500', 
                                                    borderRadius: '9999px', 
                                                    border: `1px solid ${TAG_LABELS[product.tag].borderColor}`,
                                                    backgroundColor: TAG_LABELS[product.tag].color,
                                                    color: TAG_LABELS[product.tag].textColor
                                                }}>
                                                    <span>{TAG_LABELS[product.tag].emoji}</span>
                                                    {TAG_LABELS[product.tag].label}
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>{product.name}</td>
                                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280' }}>{product.code || '—'}</td>
                                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280' }}>{product.category?.name || '—'}</td>
                                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', fontSize: '0.875rem', textAlign: 'right', color: '#1f2937' }}>{product.currentStock}</td>
                                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', fontSize: '0.875rem', textAlign: 'right', color: '#6b7280' }}>{product.minStock || '—'}</td>
                                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', fontSize: '0.875rem', textAlign: 'right', color: '#6b7280' }}>{product.maxStock || '—'}</td>
                                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', fontSize: '0.875rem', textAlign: 'right', color: '#6b7280' }}>{product.totalPurchased || 0}</td>
                                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', fontSize: '0.875rem', textAlign: 'right', color: '#6b7280' }}>{product.totalSold || 0}</td>
                                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', fontSize: '0.875rem', textAlign: 'right', color: '#6b7280' }}>{product.totalReturned || 0}</td>
                                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', fontSize: '0.875rem', textAlign: 'right', color: '#6b7280' }}>{product.totalWasted || 0}</td>
                                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280' }}>{formatDate(product.expiryDate)}</td>
                                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', fontSize: '0.875rem', textAlign: 'right', color: '#6b7280' }}>{product.salesRank || '—'}</td>
                                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', fontSize: '0.875rem', textAlign: 'right', color: '#6b7280' }}>{product.returnRank || '—'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {products.length > 50 && (
                    <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', textAlign: 'center', color: '#6b7280' }}>
                        Showing first 50 of {products.length} products
                    </div>
                )}
            </div>
        </div>
    );
}

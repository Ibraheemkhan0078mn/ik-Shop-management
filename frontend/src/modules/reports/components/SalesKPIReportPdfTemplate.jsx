import React from "react";

function KpiCard({ label, value, color, isCurrency = true }) {
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
                    <span style={{ fontSize: '1.25rem', color }}>{isCurrency ? 'Rs' : '#'}</span>
                </div>
                <div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', margin: 0 }}>{label}</p>
                    <p style={{ fontWeight: '600', color: '#1f2937', margin: '0.25rem 0 0 0' }}>
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

    return (
        <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', color: '#1f2937', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{labels.salesReport}</h1>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>{labels.salesDataFor} · {selectedPeriodLabel}</p>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KpiCard
                    label="Net Sales"
                    value={summary.netSales ?? summary.totalSales}
                    color="#3b82f6"
                />
                <KpiCard
                    label="Net Profit"
                    value={summary.netProfit ?? summary.grossProfit}
                    color="#10b981"
                />
                <KpiCard
                    label="Returns"
                    value={summary.totalReturnRefunds}
                    color="#ef4444"
                />
                <KpiCard
                    label="Net COGS"
                    value={summary.netCOGS ?? summary.totalCostOfGoodsSold}
                    color="#3b82f6"
                />
                <KpiCard
                    label="Orders"
                    value={summary.salesCount}
                    color="#f59e0b"
                    isCurrency={false}
                />
                <KpiCard
                    label="Net Margin"
                    value={`${summary.netMarginPercentage ?? summary.grossMarginPercentage ?? 0}%`}
                    color="#3b82f6"
                    isCurrency={false}
                />
            </div>

            {/* Sales Table */}
            <div style={{ 
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>{labels.salesReport}</h2>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%' }}>
                        <thead style={{ backgroundColor: '#f3f4f6' }}>
                            <tr>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>#</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.invoiceNo}</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.date}</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.customer}</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.items}</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Gross Sales</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Returns</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Net Sales</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Net Profit</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Return Docs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.length === 0 ? (
                                <tr>
                                    <td colSpan="10" style={{ padding: '2rem 1rem', textAlign: 'center', color: '#6b7280' }}>
                                        {labels.noDataFound}
                                    </td>
                                </tr>
                            ) : (
                                sales.slice(0, 50).map((sale) => (
                                    <tr key={sale.id || sale._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#0f766e' }}>#{sale.orderNumber || "—"}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>{sale.orderNumber || "—"}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>{formatDate(sale.date || sale.createdAt)}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#1f2937' }}>{sale.customerName || "—"}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right', color: '#1f2937' }}>{sale.items?.length || sale.itemsCount || 0}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right', fontWeight: '600', color: '#0f766e' }}>Rs {(sale.grossSales || sale.amount || 0).toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right', fontWeight: '500', color: '#dc2626' }}>Rs {(sale.returnRefunds || 0).toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right', fontWeight: '600', color: '#0f766e' }}>Rs {(sale.netSales || 0).toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right', fontWeight: '600', color: '#16a34a' }}>Rs {(sale.netProfit || 0).toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                            {sale.returns?.length || 0}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {sales.length > 50 && (
                    <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', textAlign: 'center', color: '#6b7280' }}>
                        Showing first 50 of {sales.length} sales
                    </div>
                )}
            </div>
        </div>
    );
}

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

export default function PurchaseKPIReportPdfTemplate({ summary = {}, breakdowns = {}, selectedPeriodLabel = '' }) {
    return (
        <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', color: '#1f2937', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Purchase Report (KPI)</h1>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>Purchase performance overview · {selectedPeriodLabel}</p>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KpiCard
                    label="Total Purchased"
                    value={summary.totalPurchases}
                    color="#3b82f6"
                />
                <KpiCard
                    label="Purchase Orders"
                    value={summary.totalBills}
                    color="#3b82f6"
                    isCurrency={false}
                />
                <KpiCard
                    label="Total Returns"
                    value={summary.totalPurchaseReturns}
                    color="#06b6d4"
                />
                <KpiCard
                    label="Net Amount Spent"
                    value={summary.netPurchased}
                    color="#10b981"
                />
            </div>

            {/* Purchases by Supplier */}
            <div style={{ 
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                marginBottom: '1.5rem'
            }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>Purchases by Supplier</h2>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%' }}>
                        <thead style={{ backgroundColor: '#f3f4f6' }}>
                            <tr>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Supplier</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Total Amount</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Order Count</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Total Items</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Outstanding</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {breakdowns.bySupplier && breakdowns.bySupplier.length > 0 ? (
                                breakdowns.bySupplier.map((supplier, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>{supplier.supplierName || "—"}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right', fontWeight: '600', color: '#0f766e' }}>Rs {(supplier.totalAmount || 0).toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right', color: '#1f2937' }}>{supplier.orderCount || 0}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right', color: '#1f2937' }}>{supplier.totalItems || 0}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right', fontWeight: '500', color: '#dc2626' }}>Rs {(supplier.outstandingPayable || 0).toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right', color: '#6b7280' }}>{supplier.percentage}%</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ padding: '2rem 1rem', textAlign: 'center', color: '#6b7280' }}>
                                        No supplier data available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Purchase Returns by Supplier */}
            <div style={{ 
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>Purchase Returns by Supplier</h2>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%' }}>
                        <thead style={{ backgroundColor: '#f3f4f6' }}>
                            <tr>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Supplier</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Total Refund</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Return Count</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {breakdowns.purchaseReturnsBySupplier && breakdowns.purchaseReturnsBySupplier.length > 0 ? (
                                breakdowns.purchaseReturnsBySupplier.map((supplier, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>{supplier.supplierName || "—"}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right', fontWeight: '600', color: '#0f766e' }}>Rs {(supplier.total || 0).toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right', color: '#1f2937' }}>{supplier.count || 0}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right', color: '#6b7280' }}>{supplier.percentage}%</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ padding: '2rem 1rem', textAlign: 'center', color: '#6b7280' }}>
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

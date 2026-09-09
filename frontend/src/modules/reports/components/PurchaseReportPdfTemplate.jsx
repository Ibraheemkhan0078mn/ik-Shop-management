import React from "react";

function KpiCard({ label, value, color, isCurrency = true }) {
    return (
        <div style={{ 
            borderRadius: '0.75rem',
            border: '1px solid #e5e7eb',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            padding: '1rem'
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
                    <p style={{ fontWeight: '600', color: '#111827', margin: '0.25rem 0 0 0' }}>
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
            case 'delivered': return { backgroundColor: '#dcfce7', color: '#166534', borderColor: '#86efac' };
            case 'ordered': return { backgroundColor: '#fef9c3', color: '#854d0e', borderColor: '#fde047' };
            case 'rejected': return { backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' };
            default: return { backgroundColor: '#f3f4f6', color: '#374151', borderColor: '#d1d5db' };
        }
    };

    return (
        <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', color: '#111827', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{labels.purchaseReport}</h1>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>{labels.purchaseDataFor} · {selectedPeriodLabel}</p>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KpiCard
                    label={labels.totalPurchases}
                    value={summary.totalPurchases}
                    color="#3b82f6"
                />
                <KpiCard
                    label={labels.totalPaid}
                    value={summary.totalPaid}
                    color="#10b981"
                />
                <KpiCard
                    label={labels.totalDue}
                    value={summary.totalDue}
                    color="#ef4444"
                />
                <KpiCard
                    label={labels.delivered}
                    value={summary.totalDeliveredCount}
                    color="#10b981"
                    isCurrency={false}
                />
                <KpiCard
                    label={labels.rejected}
                    value={summary.totalRejectedCount}
                    color="#ef4444"
                    isCurrency={false}
                />
                <KpiCard
                    label={labels.totalSuppliers}
                    value={summary.totalSuppliers}
                    color="#8b5cf6"
                    isCurrency={false}
                />
            </div>

            {/* Supplier-wise Breakdown */}
            {supplierBreakdown.length > 0 && (
                <div style={{ 
                    borderRadius: '0.75rem',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem', margin: 0 }}>{labels.topSupplier}</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%' }}>
                            <thead style={{ backgroundColor: '#f3f4f6' }}>
                                <tr>
                                    <th style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.supplier}</th>
                                    <th style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.total}</th>
                                    <th style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.paidAmount}</th>
                                    <th style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.dueAmount}</th>
                                    <th style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.totalBills}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {supplierBreakdown.map((supplier) => (
                                    <tr key={supplier._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{supplier._id}</td>
                                        <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontWeight: '600', color: '#0d9488' }}>Rs {supplier.totalAmount.toLocaleString()}</td>
                                        <td style={{ padding: '0.5rem 1rem', textAlign: 'right', color: '#16a34a' }}>Rs {supplier.paidAmount.toLocaleString()}</td>
                                        <td style={{ padding: '0.5rem 1rem', textAlign: 'right', color: '#dc2626' }}>Rs {supplier.dueAmount.toLocaleString()}</td>
                                        <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.875rem', color: '#6b7280' }}>{supplier.billsCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Purchases Table */}
            <div style={{ 
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>{labels.purchaseDetails}</h2>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%' }}>
                        <thead style={{ backgroundColor: '#f3f4f6' }}>
                            <tr>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.invoiceNo}</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.date}</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.supplier}</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.amount}</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.paidAmount}</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.dueAmount}</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.deliveryStatus}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ padding: '2rem 1rem', textAlign: 'center', color: '#6b7280' }}>
                                        {labels.noDataFound}
                                    </td>
                                </tr>
                            ) : (
                                purchases.slice(0, 50).map((purchase) => {
                                    const paidAmount = purchase.paidAmount || 0;
                                    const dueAmount = purchase.totalAmount - paidAmount;
                                    
                                    return (
                                        <tr key={purchase._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                            <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#6b7280' }}>
                                                {purchase.invoiceNumber || "—"}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                                {formatDate(purchase.date || purchase.createdAt)}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{purchase.supplierName || "—"}</td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right', fontWeight: '600', color: '#111827' }}>Rs {(purchase.totalAmount || 0).toLocaleString()}</td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right', color: '#16a34a' }}>Rs {paidAmount.toLocaleString()}</td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right', color: '#dc2626' }}>Rs {dueAmount.toLocaleString()}</td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '500',
                                                    borderRadius: '9999px',
                                                    ...getDeliveryStatusColor(purchase.deliveryStatus)
                                                }}>
                                                    {purchase.deliveryStatus || "—"}
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
                    <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', textAlign: 'center', color: '#6b7280' }}>
                        Showing first 50 of {purchases.length} purchases
                    </div>
                )}
            </div>
        </div>
    );
}

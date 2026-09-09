import React from "react";

function KpiCard({ label, value, color, isCurrency = true, subValue }) {
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
                    {subValue && (
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
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

    return (
        <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', color: '#1f2937', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{labels.customerReport}</h1>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>{labels.customerAnalytics} · {selectedPeriodLabel}</p>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KpiCard
                    label={labels.totalCustomers}
                    value={summary.totalCustomers}
                    color="#3b82f6"
                    isCurrency={false}
                />
                <KpiCard
                    label={labels.walkIn}
                    value={summary.totalSalesWalkIn}
                    color="#6b7280"
                />
                <KpiCard
                    label={labels.registered}
                    value={summary.totalSalesRegistered}
                    color="#3b82f6"
                />
                <KpiCard
                    label={labels.totalDue}
                    value={summary.totalDue}
                    color="#ef4444"
                />
                <KpiCard
                    label={labels.topCustomer}
                    value={summary.topCustomer?.name}
                    color="#f59e0b"
                    isCurrency={false}
                    subValue={summary.topCustomer?.amount}
                />
            </div>

            {/* Customer Table */}
            <div style={{ 
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>{labels.customerReport}</h2>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%' }}>
                        <thead style={{ backgroundColor: '#f3f4f6' }}>
                            <tr>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>#</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.customer}</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.totalOrders}</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.totalSpent}</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.dueAmount}</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.lastPurchase}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '2rem 1rem', textAlign: 'center', color: '#6b7280' }}>
                                        {labels.noDataFound}
                                    </td>
                                </tr>
                            ) : (
                                customers.slice(0, 50).map((customer) => (
                                    <tr key={customer._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#0f766e' }}>#{customer.rank}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>{customer.name}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right', color: '#1f2937' }}>{customer.totalOrders || 0}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right', fontWeight: '600', color: '#0f766e' }}>Rs {(customer.totalSpent || 0).toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right', fontWeight: '500', color: '#dc2626' }}>Rs {(customer.dueAmount || 0).toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>{formatDate(customer.lastPurchase)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {customers.length > 50 && (
                    <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', textAlign: 'center', color: '#6b7280' }}>
                        Showing first 50 of {customers.length} customers
                    </div>
                )}
            </div>
        </div>
    );
}

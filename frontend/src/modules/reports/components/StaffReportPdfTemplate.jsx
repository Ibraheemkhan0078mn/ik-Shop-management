import React from "react";

function KpiCard({ label, description, value, color, isCurrency = true }) {
    return (
        <div
            style={{
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                padding: '1.25rem',
                backgroundColor: '#ffffff'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>{label}</p>
                    {description && (
                        <p style={{ fontSize: '0.75rem', marginTop: '0.125rem', lineHeight: 1.25, color: '#6b7280' }}>{description}</p>
                    )}
                </div>
                <div
                    style={{
                        flexShrink: 0,
                        borderRadius: '0.5rem',
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: `${color}1A`
                    }}
                >
                    <span style={{ fontSize: '1.125rem', color }}>{isCurrency ? 'Rs' : '#'}</span>
                </div>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                {isCurrency ? `Rs ${value?.toLocaleString() || 0}` : (value?.toLocaleString() || 0)}
            </p>
        </div>
    );
}

export default function StaffReportPdfTemplate({ summary = {}, details = {}, staffMetrics = [], labels = {}, selectedPeriodLabel = '' }) {
    return (
        <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', color: '#1f2937', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{labels.staffReport}</h1>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>{labels.staffAnalysis} · {selectedPeriodLabel}</p>
            </div>

            {/* KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KpiCard 
                    label={labels.totalStaff} 
                    value={details.totalStaff || 0} 
                    color="#8b5cf6" 
                    description={labels.activeStaffMembers} 
                    isCurrency={false}
                />
                <KpiCard 
                    label={labels.totalSalariesPaid} 
                    value={summary.totalSalaryPaid || 0} 
                    color="#10b981" 
                    description={labels.salaryExpenses}
                />
                <KpiCard 
                    label={labels.commissionEarnings}
                    value={summary.totalCommissionEarnings || 0}
                    color="#8b5cf6"
                    description={labels.commissionRate}
                />
                <KpiCard
                    label={labels.averageSalary} 
                    value={summary.averageSalaryPaid || 0} 
                    color="#2563eb" 
                    description={labels.perEmployee}
                />
                <KpiCard 
                    label={labels.totalExpectedSalary} 
                    value={summary.totalExpectedSalary || 0} 
                    color="#3b82f6" 
                    description={labels.totalEarnings}
                />
                <KpiCard 
                    label={labels.remainingSalary} 
                    value={summary.totalRemaining || 0} 
                    color="#f59e0b" 
                    description={labels.unpaidSalaries}
                />
                <KpiCard
                    label={labels.totalSales}
                    value={summary.totalSales || 0}
                    color="#10b981"
                    description={labels.totalRevenue}
                />
                <KpiCard 
                    label={labels.totalOrders} 
                    value={summary.totalOrders || 0} 
                    color="#8b5cf6" 
                    description={labels.ordersHandled} 
                    isCurrency={false}
                />
            </div>

            {/* Summary Card */}
            <div style={{ 
                borderRadius: '0.75rem',
                border: '2px solid #8b5cf6',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                backgroundColor: '#ffffff'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '1.375rem', color: '#8b5cf6' }}>👥</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>{labels.payrollSummary}</span>
                        </div>
                        <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#8b5cf6', margin: 0 }}>
                            Rs {(summary.totalSalaryPaid || 0).toLocaleString()}
                        </p>
                        <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#6b7280', margin: 0 }}>
                            {labels.totalSalaryExpenses}
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>{labels.staffCount}</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{details.totalStaff || 0}</p>
                        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: '#6b7280', margin: 0 }}>{labels.avgSalary}</p>
                        <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Rs {(summary.averageSalaryPaid || 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Staff Performance Section */}
            {staffMetrics && staffMetrics.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>{labels.staffPerformance}</h2>

                    <div style={{ 
                        borderRadius: '0.75rem',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        backgroundColor: '#ffffff'
                    }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%' }}>
                                <thead style={{ backgroundColor: '#f3f4f6' }}>
                                    <tr>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.staffName}</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.orders}</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.sales}</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Rate</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Commission</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.totalCommission}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staffMetrics.map((staff, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>{staff.fullName || staff.name}</td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right', color: '#1f2937' }}>{staff.totalOrders || 0}</td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right', fontWeight: '600', color: '#0f766e' }}>Rs {(staff.totalSales || 0).toLocaleString()}</td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right', color: '#1f2937' }}>{staff.commissionRate || 0}%</td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right', fontWeight: '600', color: '#8b5cf6' }}>Rs {(staff.totalCommission || 0).toLocaleString()}</td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right', fontWeight: '600', color: '#8b5cf6' }}>Rs {(staff.totalCommission || 0).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

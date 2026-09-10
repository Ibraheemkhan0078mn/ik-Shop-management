import React from "react";

function KpiCard({ label, value, color, isCurrency = true, valueColor }) {
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
                    <p style={{ fontWeight: '600', color: valueColor || '#1f2937', margin: '0.25rem 0 0 0' }}>
                        {isCurrency ? `Rs ${value?.toLocaleString() || 0}` : (value?.toLocaleString() || value || 0)}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function CreditsDebitsReportPdfTemplate({ reportData = {}, labels = {}, selectedPeriodLabel = '' }) {
    const getBalanceDisplay = (accountData) => {
        const remaining = accountData.remainingBalance || 0;
        const status = accountData.accountStatus;

        if (remaining === 0 || status === 'cleared') {
            return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: '500', borderRadius: '9999px', border: '1px solid #86efac', backgroundColor: '#dcfce7', color: '#166534' }}>Balanced</span>;
        } else if (remaining > 0) {
            return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: '500', borderRadius: '9999px', border: '1px solid #fca5a5', backgroundColor: '#fee2e2', color: '#991b1b' }}>To Give ({remaining.toLocaleString()})</span>;
        } else {
            return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: '500', borderRadius: '9999px', border: '1px solid #86efac', backgroundColor: '#dcfce7', color: '#166534' }}>To Receive ({Math.abs(remaining).toLocaleString()})</span>;
        }
    };

    const kpi = reportData?.kpi || {};
    const accounts = reportData?.accounts || [];

    return (
        <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', color: '#1f2937', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{labels.creditsDebitsReport}</h1>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>{labels.creditsDebitsAnalysis} · {selectedPeriodLabel}</p>
            </div>

            {/* KPI Cards */}
            {reportData && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    <KpiCard
                        label={labels.totalAccounts}
                        value={kpi.totalAccounts}
                        color="#3b82f6"
                        isCurrency={false}
                    />
                    <KpiCard
                        label={labels.iOwe}
                        value={kpi.totalDebitOnOthers}
                        color="#ef4444"
                        valueColor="#dc2626"
                    />
                    <KpiCard
                        label={labels.owedToMe}
                        value={kpi.totalDebitOnMe}
                        color="#22c55e"
                        valueColor="#16a34a"
                    />
                    <KpiCard
                        label={labels.netBalance}
                        value={kpi.finalAmount}
                        color="#eab308"
                        valueColor={(kpi.finalAmount || 0) >= 0 ? '#16a34a' : '#dc2626'}
                    />
                </div>
            )}

            {/* Accounts Table */}
            {reportData && accounts && accounts.length > 0 ? (
                <div style={{ 
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>{labels.creditAccounts}</h2>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%' }}>
                            <thead style={{ backgroundColor: '#f3f4f6' }}>
                                <tr>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.account}</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.type}</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.totalToPay}</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.totalPaid}</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{labels.statusAndBalance}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.slice(0, 50).map((accountData, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div>
                                                <p style={{ fontWeight: '500', color: '#1f2937', margin: 0 }}>{accountData.account.name}</p>
                                                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>{accountData.account.phoneNo || "—"}</p>
                                                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>{accountData.transactionCount || 0} payment{accountData.transactionCount === 1 ? "" : "s"} in period</p>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textTransform: 'capitalize', color: '#1f2937' }}>{accountData.account.type}</td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '500', color: '#dc2626' }}>Rs {(accountData.totalToPay || 0).toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '500', color: '#16a34a' }}>Rs {(accountData.totalPaid || 0).toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                            {getBalanceDisplay(accountData)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {accounts.length > 50 && (
                        <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', textAlign: 'center', color: '#6b7280' }}>
                            Showing first 50 of {accounts.length} accounts
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ padding: '3rem', textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: '0.5rem', backgroundColor: '#ffffff' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#6b7280' }}>💰</div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#1f2937', marginBottom: '0.5rem', margin: 0 }}>{labels.noAccountsFound}</h3>
                    <p style={{ color: '#6b7280', margin: 0 }}>{labels.tryAdjustingFilters}</p>
                </div>
            )}
        </div>
    );
}

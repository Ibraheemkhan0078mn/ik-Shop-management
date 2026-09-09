import React from "react";

function BreakdownItem({ label, value, count, percentage, color }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '0.75rem', height: '0.75rem', borderRadius: '50%', backgroundColor: color }} />
                <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937', margin: 0 }}>{label}</p>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>{count} transactions</p>
                </div>
            </div>
            <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 'bold', color, margin: 0 }}>Rs {value?.toLocaleString() || 0}</p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>{percentage}%</p>
            </div>
        </div>
    );
}

function ExpenseTransactionRow({ expense, index }) {
    return (
        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#1f2937' }}>{index + 1}</td>
            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                Rs {expense.amount?.toLocaleString() || 0}
            </td>
            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#1f2937' }}>{expense.type || '—'}</td>
            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#1f2937' }}>{expense.category || '—'}</td>
            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>{expense.notes || '—'}</td>
            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                {new Date(expense.date).toLocaleDateString()}
            </td>
        </tr>
    );
}

function TransactionTable({ transactions }) {
    if (!transactions || transactions.length === 0) {
        return <p style={{ fontSize: '0.875rem', padding: '1rem 0', textAlign: 'center', color: '#6b7280' }}>No transactions in this period.</p>;
    }
    return (
        <div style={{ borderRadius: '0.5rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%' }}>
                    <thead style={{ backgroundColor: '#f3f4f6' }}>
                        <tr>
                            <th style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>#</th>
                            <th style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Amount</th>
                            <th style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Type</th>
                            <th style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Category</th>
                            <th style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Notes</th>
                            <th style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.slice(0, 50).map((expense, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <ExpenseTransactionRow expense={expense} index={idx} />
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {transactions.length > 50 && (
                <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', textAlign: 'center', color: '#6b7280' }}>
                    Showing first 50 of {transactions.length} transactions
                </div>
            )}
        </div>
    );
}


export default function ExpenseReportPdfTemplate({ summary = {}, details = {}, breakdowns = {}, transactions = {}, labels = {}, selectedPeriodLabel = '' }) {

    return (
        <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', color: '#1f2937', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{labels.expenseReport}</h1>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>{labels.expenseAnalysis} · {selectedPeriodLabel}</p>
            </div>

            {/* Single Card with Inline KPIs */}
            <div style={{ 
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}>
                {/* KPI Cards - Inline */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', backgroundColor: 'rgba(15,118,110,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '1.25rem', color: '#0f766e' }}>Rs</span>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', margin: 0 }}>{labels.totalExpenses}</p>
                            <p style={{ fontWeight: '600', color: '#1f2937', margin: '0.25rem 0 0 0' }}>
                                Rs {(summary.totalExpenses || 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '1.25rem', color: '#dc2626' }}>Rs</span>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', margin: 0 }}>{labels.averageExpense}</p>
                            <p style={{ fontWeight: '600', color: '#dc2626', margin: '0.25rem 0 0 0' }}>
                                Rs {(summary.averageExpense || 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '1.25rem', color: '#16a34a' }}>📋</span>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', margin: 0 }}>{labels.categories}</p>
                            <p style={{ fontWeight: '600', color: '#16a34a', margin: '0.25rem 0 0 0' }}>
                                {details.categoryCount || 0}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '1.25rem', color: '#2563eb' }}>📊</span>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', margin: 0 }}>{labels.transactions}</p>
                            <p style={{ fontWeight: '600', color: '#2563eb', margin: '0.25rem 0 0 0' }}>
                                {details.expenseCount || 0}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Detailed Sections - Flat Preview */}
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Categories Breakdown */}
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem', margin: 0 }}>{labels.expensesByCategory}</h3>
                        {breakdowns.expensesByCategory && breakdowns.expensesByCategory.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {breakdowns.expensesByCategory.map((item, idx) => (
                                    <BreakdownItem
                                        key={idx}
                                        label={item.category}
                                        value={item.total}
                                        count={item.count}
                                        percentage={item.percentage}
                                        color="#ef4444"
                                    />
                                ))}
                            </div>
                        ) : (
                            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>No category data available</p>
                        )}
                    </div>

                    {/* Transaction Table */}
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem', margin: 0 }}>{labels.recentTransactions}</h3>
                        <TransactionTable transactions={transactions.recent || []} />
                    </div>
                </div>
            </div>
        </div>
    );
}

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

function renderTransactionRow(transaction, type) {
    switch (type) {
        case 'sales':
            return (
                <>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#1f2937' }}>{transaction.orderNumber}</td>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#1f2937' }}>{transaction.customerName || 'N/A'}</td>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', textTransform: 'capitalize', color: '#1f2937' }}>{transaction.paymentMethod}</td>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '500', textAlign: 'right', color: '#10b981' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', textAlign: 'right', color: '#6b7280' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        case 'purchases':
            return (
                <>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#1f2937' }}>{transaction.invoiceNumber}</td>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#1f2937' }}>{transaction.supplierName || 'N/A'}</td>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '500', textAlign: 'right', color: '#3b82f6' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', textAlign: 'right', color: '#6b7280' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        case 'expenses':
            return (
                <>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#1f2937' }}>{transaction.title}</td>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', textTransform: 'capitalize', color: '#1f2937' }}>{transaction.category}</td>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>{transaction.description || '-'}</td>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '500', textAlign: 'right', color: '#ef4444' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', textAlign: 'right', color: '#6b7280' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        case 'wastages':
            return (
                <>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#1f2937' }}>{transaction.productName}</td>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', textAlign: 'right', color: '#1f2937' }}>{transaction.quantity}</td>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', textAlign: 'right', color: '#1f2937' }}>Rs {transaction.costPrice?.toLocaleString() || 0}</td>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '500', textAlign: 'right', color: '#dc2626' }}>Rs {transaction.totalLoss?.toLocaleString() || 0}</td>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', textAlign: 'right', color: '#6b7280' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        case 'purchaseReturns':
            return (
                <>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#1f2937' }}>{transaction.returnNumber}</td>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#1f2937' }}>{transaction.supplierName || 'N/A'}</td>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '500', textAlign: 'right', color: '#06b6d4' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', textAlign: 'right', color: '#6b7280' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        case 'productReturns':
            return (
                <>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#1f2937' }}>{transaction.returnNumber}</td>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#1f2937' }}>{transaction.customerName || 'N/A'}</td>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '500', textAlign: 'right', color: '#f59e0b' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', textAlign: 'right', color: '#6b7280' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        case 'salaryPayments':
            return (
                <>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#1f2937' }}>{transaction.staffName}</td>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '500', textAlign: 'right', color: '#8b5cf6' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', textAlign: 'right', color: '#6b7280' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                </>
            );
        default:
            return null;
    }
}

function getTableHeaders(type, labels) {
    switch (type) {
        case 'sales': return [labels.orderNumber, labels.customer, labels.paymentMethod, labels.amount, labels.date];
        case 'purchases': return [labels.invoiceNumber, labels.supplier, labels.amount, labels.date];
        case 'expenses': return [labels.title, labels.category, labels.description, labels.amount, labels.date];
        case 'wastages': return [labels.product, labels.quantity, labels.costPrice, labels.totalLoss, labels.date];
        case 'purchaseReturns': return [labels.returnNumber, labels.supplier, labels.amount, labels.date];
        case 'productReturns': return [labels.returnNumber, labels.customer, labels.amount, labels.date];
        case 'salaryPayments': return [labels.staffName, labels.amount, labels.date];
        default: return [];
    }
}

function TransactionTable({ transactions, type, labels }) {
    if (!transactions || transactions.length === 0) {
        return <p style={{ fontSize: '0.875rem', padding: '1rem 0', textAlign: 'center', color: '#6b7280' }}>{labels.noTransactionsInPeriod}</p>;
    }

    return (
        <div style={{ borderRadius: '0.5rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%' }}>
                    <thead style={{ backgroundColor: '#f3f4f6' }}>
                        <tr>
                            {getTableHeaders(type, labels).map((header, idx) => (
                                <th key={idx} style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.slice(0, 50).map((transaction, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                {renderTransactionRow(transaction, type)}
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

export default function MainBusinessReportPdfTemplate({ reportData = {}, labels = {}, selectedPeriodLabel = '' }) {
    const summary = reportData?.summary || {};
    const transactions = reportData?.transactions || {};

    return (
        <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', color: '#1f2937', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{labels.mainBusinessReport}</h1>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>{labels.businessOverview} · {selectedPeriodLabel}</p>
            </div>

            {/* KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KpiCard 
                    label={labels.totalRevenue} 
                    value={summary.totalRevenue} 
                    color="#10b981" 
                    description={labels.totalSalesIncome}
                />
                <KpiCard 
                    label={labels.totalExpenses} 
                    value={summary.totalExpenses} 
                    color="#ef4444" 
                    description={labels.totalBusinessCosts}
                />
                <KpiCard 
                    label={labels.netProfit} 
                    value={summary.netProfit} 
                    color="#3b82f6" 
                    description={labels.finalProfitAfterExpenses}
                />
                <KpiCard 
                    label={labels.profitMargin} 
                    value={`${summary.profitMargin || 0}%`} 
                    color="#f59e0b" 
                    isCurrency={false}
                    description={labels.profitPercentage}
                />
            </div>

            {/* Sales Section */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>{labels.salesBreakdown}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', backgroundColor: '#ffffff' }}>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', margin: 0 }}>{labels.grossSales}</p>
                        <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: '0.25rem 0 0 0' }}>Rs {(summary.grossSales || 0).toLocaleString()}</p>
                    </div>
                    <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', backgroundColor: '#ffffff' }}>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', margin: 0 }}>{labels.returnsRefunds}</p>
                        <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626', margin: '0.25rem 0 0 0' }}>Rs {(summary.returnsRefunds || 0).toLocaleString()}</p>
                    </div>
                </div>
                <TransactionTable transactions={transactions.sales || []} type="sales" labels={labels} />
            </div>

            {/* Purchases Section */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>{labels.purchasesBreakdown}</h3>
                <TransactionTable transactions={transactions.purchases || []} type="purchases" labels={labels} />
            </div>

            {/* Expenses Section */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>{labels.expensesBreakdown}</h3>
                <TransactionTable transactions={transactions.expenses || []} type="expenses" labels={labels} />
            </div>
        </div>
    );
}

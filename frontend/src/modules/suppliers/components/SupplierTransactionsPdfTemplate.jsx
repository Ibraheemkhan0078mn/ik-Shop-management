import React from "react";

const formatAmount = (value) => `Rs ${(Number(value) || 0).toLocaleString()}`;
const formatDate = (value) => value ? new Date(value).toLocaleString() : "—";

export default function SupplierTransactionsPdfTemplate({ supplier = {}, transactions = [], summary = {}, source = "all", entityLabel = "Supplier" }) {
    const sourceLabel = source === "all" ? "All Transactions" : source === "purchaseReturn" ? "Purchase Returns" : source === "purchase" ? "Purchases" : "Manual Transactions";
    const totalIn = transactions.reduce((total, item) => total + (item.creditType === "cashin" ? Number(item.amount) || 0 : 0), 0);
    const totalOut = transactions.reduce((total, item) => total + (item.creditType !== "cashin" ? Number(item.amount) || 0 : 0), 0);

    return (
        <div style={{ minHeight: '100vh', padding: '2.5rem', fontFamily: 'Arial, sans-serif', color: '#1f2937', backgroundColor: '#ffffff', fontSize: '0.8125rem', lineHeight: 1.4 }}>
            <div style={{ marginBottom: '1.5rem', borderBottom: '2px solid #d1d5db', paddingBottom: '1rem', textAlign: 'center' }}>
                <div style={{ marginBottom: '0.5rem', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
                    <span style={{ fontSize: '1.875rem', fontWeight: '800', letterSpacing: '2px', color: '#111827' }}>LOGIN</span>
                    <span style={{ marginTop: '0.25rem', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.3em', color: '#6b7280' }}>LARAIB</span>
                </div>
                <h1 style={{ marginTop: '0.5rem', fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>{entityLabel} Credits &amp; Debits</h1>
                <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>{sourceLabel}</p>
            </div>

            <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                <div style={{ borderRadius: '0.5rem', border: '1px solid #d1d5db', padding: '1rem', backgroundColor: '#f9fafb' }}>
                    <p style={{ marginBottom: '0.75rem', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', margin: 0 }}>{entityLabel} Information</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #d1d5db', padding: '0.5rem 0.75rem' }}><span style={{ color: '#6b7280' }}>Name</span><strong>{supplier.name || "—"}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #d1d5db', padding: '0.5rem 0.75rem' }}><span style={{ color: '#6b7280' }}>Phone</span><strong>{supplier.phoneNo || "—"}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #d1d5db', padding: '0.5rem 0.75rem' }}><span style={{ color: '#6b7280' }}>Address</span><strong>{supplier.address || "—"}</strong></div>
                    </div>
                </div>
                <div style={{ borderRadius: '0.5rem', border: '1px solid #d1d5db', padding: '1rem', backgroundColor: '#f9fafb' }}>
                    <p style={{ marginBottom: '0.75rem', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', margin: 0 }}>Account Summary</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #d1d5db', padding: '0.5rem 0.75rem' }}><span style={{ color: '#6b7280' }}>Cash In</span><strong style={{ color: '#15803d' }}>{formatAmount(summary.cashIn)}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #d1d5db', padding: '0.5rem 0.75rem' }}><span style={{ color: '#6b7280' }}>Cash Out</span><strong style={{ color: '#dc2626' }}>{formatAmount(summary.cashOut)}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #d1d5db', padding: '0.5rem 0.75rem' }}><span style={{ color: '#6b7280' }}>Current Balance</span><strong>{formatAmount(summary.overall)}</strong></div>
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: '600' }}>
                <span>Filtered Transactions: {transactions.length}</span>
                <span style={{ color: '#15803d' }}>In: {formatAmount(totalIn)} <span style={{ marginLeft: '0.75rem', color: '#dc2626' }}>Out: {formatAmount(totalOut)}</span></span>
            </div>

            <table style={{ marginBottom: '1.5rem', width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                    <tr style={{ backgroundColor: '#111827', color: '#ffffff' }}>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>#</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Date</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Type</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Source</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Payment Method</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Details</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((item, index) => {
                        const isCashIn = item.creditType === "cashin";
                        return <tr key={item._id || index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '0.5rem 0.75rem' }}>{index + 1}</td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>{formatDate(item.transactionDate || item.date)}</td>
                            <td style={{ padding: '0.5rem 0.75rem', fontWeight: '600', textTransform: 'uppercase', color: isCashIn ? '#15803d' : '#dc2626' }}>{isCashIn ? "Credit" : "Debit"}</td>
                            <td style={{ padding: '0.5rem 0.75rem', textTransform: 'capitalize' }}>{item.sourceType === "purchaseReturn" ? "Purchase Return" : item.sourceType || "—"}</td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>{item.paymentMethodName || item.paymentMethod?.name || "—"}</td>
                            <td style={{ padding: '0.5rem 0.75rem', color: '#4b5563' }}>{item.notes || item.note || item.reference || "—"}</td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 'bold', color: isCashIn ? '#15803d' : '#dc2626' }}>{formatAmount(item.amount)}</td>
                        </tr>;
                    })}
                    {!transactions.length && <tr><td colSpan="7" style={{ padding: '2rem 0.75rem', textAlign: 'center', color: '#6b7280' }}>No transactions found for this filter.</td></tr>}
                </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #d1d5db', paddingTop: '0.75rem', fontSize: '0.75rem', color: '#6b7280' }}>
                <span style={{ margin: 0 }}>This is a computer generated document.</span>
                <span style={{ margin: 0 }}>Print Time: {new Date().toLocaleString()}</span>
            </div>
        </div>
    );
}

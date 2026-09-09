import React from "react";

export default function OrderReturnPaymentPdfTemplate({ payment = {}, orderReturn = {}, labels = {} }) {
    const transactionDate = new Date(payment.transactionDate || payment.paymentDate || payment.date).toLocaleString();
    const returnDate = new Date(orderReturn?.returnDate ?? orderReturn?.createdAt).toLocaleDateString();

    const totalRefundAmount = orderReturn?.totalRefundAmount || 0;
    const refundedAmount = orderReturn?.refundedAmount || 0;
    const remainingAmount = totalRefundAmount - refundedAmount;

    return (
        <div style={{ padding: '2.5rem', backgroundColor: '#ffffff', minHeight: '100vh', color: '#1f2937', fontFamily: 'Arial, sans-serif' }}>
            {/* Company Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1, marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.875rem', fontWeight: '800', letterSpacing: '2px', color: '#111827' }}>LOGIN</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.3em', color: '#6b7280', marginTop: '0.25rem' }}>LARAIB</span>
                </div>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', color: '#111827', marginBottom: '1.5rem' }}>
                Afrasiab Mobile Accesories
            </h2>
            <p style={{ textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', marginTop: '-1rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {labels.refundReceipt || "Refund Receipt"}
            </p>

            {/* Customer / Return Meta Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1.5rem' }}>
                <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem' }}>Customer:</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#111827', textTransform: 'uppercase' }}>{orderReturn?.customerName || "—"}</p>
                    <p style={{ fontSize: '0.75rem', color: '#4b5563' }}>Return Date: {returnDate}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '15rem' }}>
                    <div style={{ border: '1px solid #d1d5db', padding: '0.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span style={{ fontWeight: '600' }}>Return #: {orderReturn?.returnNumber || "—"}</span>
                        <span style={{ fontWeight: '600' }}>Date: {transactionDate}</span>
                    </div>
                    <div style={{ border: '1px solid #d1d5db', padding: '0.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span style={{ fontWeight: '600' }}>Refund ID:</span>
                        <span style={{ fontWeight: '600' }}>{payment._id || "—"}</span>
                    </div>
                </div>
            </div>

            {/* Refund Details Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem', fontSize: '0.875rem' }}>
                <thead>
                    <tr style={{ backgroundColor: '#111827', color: '#ffffff' }}>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: '600' }}>Method</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: '600' }}>Reference</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: '600' }}>Notes</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.5rem 0.75rem', textTransform: 'capitalize' }}>
                            {payment.method === 'cash' ? (payment.paymentMethodName || 'Cash') :
                             payment.method === 'credit' ? `Credit (${payment.creditAccount?.name || 'Account'})` :
                             payment.method === 'hybrid' ? 'Hybrid' :
                             payment.method || "—"}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                            {payment.creditAccount?.name || payment.paymentMethodName || "—"}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{payment.notes || "—"}</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>{(payment.amount || 0).toLocaleString()}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#f3f4f6', fontWeight: 'bold' }}>
                        <td style={{ padding: '0.5rem 0.75rem' }} colSpan={3}>Total Refunded</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{(payment.amount || 0).toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>

            {/* Return Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ border: '1px solid #d1d5db', padding: '0.75rem', fontSize: '0.875rem', minWidth: '16.25rem' }}>
                    <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Return Summary:</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                        <span>Total Refund Amount</span>
                        <span>{totalRefundAmount.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                        <span>This Refund</span>
                        <span>{(payment.amount || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontWeight: 'bold', borderTop: '1px solid #d1d5db', marginTop: '0.25rem', paddingTop: '0.25rem' }}>
                        <span>Pending Refund</span>
                        <span>{remainingAmount.toLocaleString()}</span>
                    </div>
                </div>

                <div style={{ border: '1px solid #d1d5db', minWidth: '16.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '1rem', backgroundColor: 'rgba(15,118,110,0.06)' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#0f766e' }}>Amount Refunded</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem', color: '#0f766e' }}>Rs {(payment.amount || 0).toLocaleString()}</p>
                </div>
            </div>

            {/* Sign-off Bar */}
            <div style={{ border: '1px solid #d1d5db', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', fontSize: '0.875rem' }}>
                    <div style={{ width: '50%', textAlign: 'center', padding: '0.75rem', borderRight: '1px solid #d1d5db' }}>
                        <p>Prepared By</p>
                        <p style={{ fontWeight: '600', marginTop: '0.25rem' }}>SyedSoft</p>
                    </div>
                    <div style={{ width: '50%', textAlign: 'center', padding: '0.75rem' }}>
                        <p>Approved By</p>
                        <p style={{ fontWeight: '600', marginTop: '0.25rem' }}>Afrasiab Mobile Accesories</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.75rem', color: '#6b7280' }}>
                <p style={{ fontStyle: 'italic', maxWidth: '70%', margin: 0 }}>{labels.footerNote || "This is a computer generated document, does not required any signature"}</p>
                <p style={{ margin: 0 }}>Print Time: {new Date().toLocaleString()}</p>
            </div>
        </div>
    );
}

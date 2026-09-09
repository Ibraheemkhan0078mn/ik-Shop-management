import React from "react";

export default function OrderReturnPdfTemplate({ orderReturn = {}, refunds = [], labels = {} }) {
    const date = new Date(orderReturn?.returnDate ?? orderReturn?.createdAt).toLocaleDateString();
    const totalRefundAmount = orderReturn?.totalRefundAmount || 0;
    const refundedAmount = orderReturn?.refundedAmount || 0;
    const remainingAmount = totalRefundAmount - refundedAmount;
    const totalQty = (orderReturn?.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0);
    const totalCut = (orderReturn?.items || []).reduce((sum, it) => sum + (it.cut || 0), 0);

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
                {labels.orderReturnDetails || "Order Return"}
            </p>

            {/* Customer / Return Meta Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1.5rem' }}>
                <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem' }}>Customer:</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#111827', textTransform: 'uppercase' }}>{orderReturn?.customerName || "—"}</p>
                    {orderReturn?.referenceOrderNumber && (
                        <p style={{ fontSize: '0.75rem', color: '#4b5563' }}>Order #: {orderReturn.referenceOrderNumber}</p>
                    )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '15rem' }}>
                    <div style={{ border: '1px solid #d1d5db', padding: '0.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span style={{ fontWeight: '600' }}>Return #: {orderReturn?.returnNumber || "—"}</span>
                        <span style={{ fontWeight: '600' }}>Date: {date}</span>
                    </div>
                    <div style={{ border: '1px solid #d1d5db', padding: '0.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span style={{ fontWeight: '600' }}>Status:</span>
                        <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{orderReturn?.returnStatus || "—"}</span>
                    </div>
                </div>
            </div>

            {orderReturn?.notes && (
                <p style={{ fontSize: '0.875rem', color: '#4b5563', fontStyle: 'italic', marginBottom: '1.5rem' }}>{orderReturn.notes}</p>
            )}

            {/* Returned Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem', fontSize: '0.875rem' }}>
                <thead>
                    <tr style={{ backgroundColor: '#111827', color: '#ffffff' }}>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: '600' }}>#</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: '600' }}>Item &amp; Description</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>Qty</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>Original Price</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>Cut</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>Refund Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {(orderReturn?.items || []).map((item, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '0.5rem 0.75rem' }}>{index + 1}</td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                                {item.productName || "—"}
                                {item.returnReason && <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'capitalize' }}> ({item.returnReason})</span>}
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{item.quantity || 0}</td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{(item.originalPrice || 0).toLocaleString()}</td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#dc2626' }}>-{(item.cut || 0).toLocaleString()}</td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>{(item.refundAmount || 0).toLocaleString()}</td>
                        </tr>
                    ))}
                    <tr style={{ backgroundColor: '#f3f4f6', fontWeight: 'bold' }}>
                        <td style={{ padding: '0.5rem 0.75rem' }} colSpan={2}>Sub Total</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{totalQty}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}></td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#dc2626' }}>-{totalCut.toLocaleString()}</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{totalRefundAmount.toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>

            {/* Refund Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ border: '1px solid #d1d5db', padding: '0.75rem', fontSize: '0.875rem', minWidth: '16.25rem' }}>
                    <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Refund Summary:</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                        <span>Total Refund Amount</span>
                        <span>{totalRefundAmount.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                        <span>Refunded Amount</span>
                        <span>{refundedAmount.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontWeight: 'bold', borderTop: '1px solid #d1d5db', marginTop: '0.25rem', paddingTop: '0.25rem' }}>
                        <span>Remaining Amount</span>
                        <span>{remainingAmount.toLocaleString()}</span>
                    </div>
                </div>

                <div style={{ border: '1px solid #d1d5db', minWidth: '16.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                        <span>Items</span>
                        <span>{orderReturn?.items?.length || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                        <span>Total Quantity</span>
                        <span>{totalQty}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', fontWeight: 'bold' }}>
                        <span>Total Refund</span>
                        <span>{totalRefundAmount.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Refunds Table */}
            {refunds.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: '600', borderBottom: '1px solid #d1d5db' }}>Date</th>
                            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: '600', borderBottom: '1px solid #d1d5db' }}>Method</th>
                            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600', borderBottom: '1px solid #d1d5db' }}>Amount</th>
                            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600', borderBottom: '1px solid #d1d5db' }}>Cash</th>
                            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600', borderBottom: '1px solid #d1d5db' }}>Credit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {refunds.map((refund, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '0.5rem 0.75rem' }}>{new Date(refund.transactionDate || refund.refundDate || refund.date).toLocaleDateString()}</td>
                                <td style={{ padding: '0.5rem 0.75rem', textTransform: 'capitalize' }}>
                                    {refund.method === "credit" ? `Credit (${refund.creditAccount?.name || "Account"})` : refund.method || "—"}
                                </td>
                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>{(refund.amount || 0).toLocaleString()}</td>
                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{(refund.cashAmount || 0).toLocaleString()}</td>
                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{(refund.creditAmount || 0).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

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

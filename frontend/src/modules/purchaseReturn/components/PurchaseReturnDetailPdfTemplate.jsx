import React from "react";

const parseLocalDateValue = (value) => {
    if (!value) return null;

    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatPdfDate = (value) => {
    const parsed = parseLocalDateValue(value);
    if (!parsed) return "—";

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

export default function PurchaseReturnDetailPdfTemplate({ purchaseReturn = {}, payments = [], labels = {} }) {
    const date = formatPdfDate(purchaseReturn?.returnDate ?? purchaseReturn?.createdAt);

    const totalQty = (purchaseReturn?.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0);
    const totalRefunded = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalCuts = (purchaseReturn?.items || []).reduce((sum, it) => sum + (Number(it.cut) || 0), 0);
    const totalRefundAmount = purchaseReturn?.totalRefundAmount || 0;

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
                {labels.purchaseReturnDetails || "Purchase Return"}
            </p>

            {/* Supplier / Return Meta Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1.5rem' }}>
                <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem' }}>Returned To:</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#111827', textTransform: 'uppercase' }}>{purchaseReturn?.supplierName || purchaseReturn?.supplier?.name || "—"}</p>
                    {purchaseReturn?.reason && (
                        <p style={{ fontSize: '0.75rem', color: '#4b5563', textTransform: 'capitalize' }}>Reason: {purchaseReturn.reason.replace(/_/g, " ")}</p>
                    )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '15rem' }}>
                    <div style={{ border: '1px solid #d1d5db', padding: '0.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span style={{ fontWeight: '600' }}>Return #: {purchaseReturn?.returnNumber || "—"}</span>
                        <span style={{ fontWeight: '600' }}>Date: {date}</span>
                    </div>
                    <div style={{ border: '1px solid #d1d5db', padding: '0.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span style={{ fontWeight: '600' }}>Status:</span>
                        <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{purchaseReturn?.status || "—"}</span>
                    </div>
                </div>
            </div>

            {purchaseReturn?.notes && (
                <p style={{ fontSize: '0.875rem', color: '#4b5563', fontStyle: 'italic', marginBottom: '1.5rem' }}>{purchaseReturn.notes}</p>
            )}

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem', fontSize: '0.875rem' }}>
                <thead>
                    <tr style={{ backgroundColor: '#111827', color: '#ffffff' }}>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: '600' }}>#</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: '600' }}>Item</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>Qty</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>Unit Costing</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>Cut Amount</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>Refund Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {(purchaseReturn?.items || []).map((item, index) => {
                        const rawPrice = Number(item.costPrice || item.purchasePrice) || 0;
                        const quantity = Number(item.quantity) || 0;
                        const cutAmount = Number(item.cut) || 0;

                        // Use stored costing if available (set by CRUD form)
                        const costing = item.costing;
                        const unitCosting = (costing && typeof costing.totalCostingAmount === 'number')
                            ? costing.totalCostingAmount
                            : rawPrice;
                        const itemTotal = unitCosting * quantity;
                        const refundAmount = itemTotal - cutAmount;

                        return (
                            <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '0.5rem 0.75rem' }}>{index + 1}</td>
                                <td style={{ padding: '0.5rem 0.75rem' }}>
                                    {item.productName || item.product?.name || "—"}
                                    {item.batchNumber && <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block' }}>Batch: {item.batchNumber}</span>}
                                </td>
                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{quantity}</td>
                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Rs {unitCosting.toFixed(2)}</td>
                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#dc2626' }}>Rs {cutAmount.toFixed(2)}</td>
                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600', color: '#111827' }}>Rs {refundAmount.toFixed(2)}</td>
                            </tr>
                        );
                    })}
                    <tr style={{ backgroundColor: '#f3f4f6', fontWeight: 'bold' }}>
                        <td style={{ padding: '0.5rem 0.75rem' }} colSpan={2}>Sub Total</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{totalQty}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}></td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#dc2626' }}>Rs {totalCuts.toFixed(2)}</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#111827' }}>Rs {totalRefundAmount.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            {/* Refund Summary */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ padding: '1rem', backgroundColor: 'rgba(15,118,110,0.08)', border: '1px solid rgba(15,118,110,0.25)', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: '600' }}>Grand total refunds</span>
                        <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#111827' }}>Rs {totalRefundAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                        <span style={{ fontWeight: '600' }}>Total cuts</span>
                        <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#dc2626' }}>Rs {totalCuts.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Refund Payments Table */}
            {payments.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: '600', borderBottom: '1px solid #d1d5db' }}>Date</th>
                            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: '600', borderBottom: '1px solid #d1d5db' }}>Method</th>
                            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600', borderBottom: '1px solid #d1d5db' }}>Amount</th>
                            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: '600', borderBottom: '1px solid #d1d5db' }}>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map((payment, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '0.5rem 0.75rem' }}>{formatPdfDate(payment.transactionDate || payment.paymentDate || payment.date)}</td>
                                <td style={{ padding: '0.5rem 0.75rem', textTransform: 'capitalize' }}>
                                    {payment.method === 'cash' ? (payment.paymentMethodName || 'Cash') :
                                     payment.method === 'credit' ? `Credit (${payment.creditAccount?.name || 'Account'})` :
                                     payment.method || "—"}
                                </td>
                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600', color: '#dc2626' }}>Rs {(payment.amount || 0).toLocaleString()}</td>
                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{payment.notes || "—"}</td>
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

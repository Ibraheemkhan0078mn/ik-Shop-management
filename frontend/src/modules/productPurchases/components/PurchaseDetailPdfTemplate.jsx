import React from "react";

export default function PurchaseDetailPdfTemplate({ purchase = {}, payments = [], labels = {}, company = {} }) {
    const date = new Date(purchase?.purchaseDate ?? purchase?.date ?? purchase?.createdAt).toLocaleDateString();

    const totalPaid = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    const remainingAmount = (purchase?.totalAmount ?? 0) - totalPaid;

    const subtotalAfterItems = (purchase?.items || []).reduce((sum, it) => {
        const price = it.costPrice || it.price || it.perItemPrice || 0;
        const quantity = it.quantity || 0;
        const baseTotal = quantity * price;
        const discountAmount = it.discountType === "percentage" ? (baseTotal * (it.discount || 0)) / 100 : (it.discount || 0);
        const afterDiscount = baseTotal - discountAmount;
        const taxAmount = it.taxType === "percentage" ? (afterDiscount * (it.tax || 0)) / 100 : (it.tax || 0);
        return sum + (afterDiscount + taxAmount);
    }, 0);

    const totalQty = (purchase?.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0);
    const totalDiscount = (purchase?.items || []).reduce((sum, it) => {
        const price = it.costPrice || it.price || it.perItemPrice || 0;
        const quantity = it.quantity || 0;
        const baseTotal = quantity * price;
        return sum + (it.discountType === "percentage" ? (baseTotal * (it.discount || 0)) / 100 : (it.discount || 0));
    }, 0);
    const totalItemTax = (purchase?.items || []).reduce((sum, it) => {
        const price = it.costPrice || it.price || it.perItemPrice || 0;
        const quantity = it.quantity || 0;
        const baseTotal = quantity * price;
        const discountAmount = it.discountType === "percentage" ? (baseTotal * (it.discount || 0)) / 100 : (it.discount || 0);
        const afterDiscount = baseTotal - discountAmount;
        return sum + (it.taxType === "percentage" ? (afterDiscount * (it.tax || 0)) / 100 : (it.tax || 0));
    }, 0);

    // Bill-level discount, tax (GST) and shipping — applied on top of the items subtotal
    const billDiscount = purchase?.discountType === "percentage"
        ? (subtotalAfterItems * (purchase?.discount || 0)) / 100
        : (purchase?.discount || 0);
    const afterBillDiscount = subtotalAfterItems - billDiscount;
    const billTax = purchase?.gstType === "fixed"
        ? (purchase?.gst || 0)
        : (afterBillDiscount * (purchase?.gst || 0)) / 100;
    const shippingCost = purchase?.shippingCost || 0;

    const formatDiscount = (value, type) => (type === "percentage" ? `${value || 0}%` : (value || 0).toLocaleString());
    const formatTax = (value, type) => (type === "fixed" ? `Rs ${(value || 0).toLocaleString()} (fixed)` : `${value || 0}%`);

    return (
        <div style={{ padding: '2.5rem', backgroundColor: '#ffffff', minHeight: '100vh', color: '#1f2937', fontFamily: 'Arial, sans-serif' }}>
            {/* Company Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1, marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.875rem', fontWeight: '800', letterSpacing: '2px', color: '#111827' }}>LOGIN</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.3em', color: '#6b7280', marginTop: '0.25rem' }}>LARAIB</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>{company?.address || "—"}</p>
                {company?.registrationNo && <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{company.registrationNo}</p>}
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', color: '#111827', marginBottom: '1.5rem' }}>
                Afrasiab Mobile Accesories
            </h2>

            {/* Bill To / Invoice Meta Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1.5rem' }}>
                <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem' }}>Purchased From:</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#111827', textTransform: 'uppercase' }}>{purchase?.supplier?.name || "—"}</p>
                    {purchase?.supplier?.code && <p style={{ fontSize: '0.75rem', color: '#4b5563' }}>Supplier Code: {purchase.supplier.code}</p>}
                    {purchase?.supplier?.phone && <p style={{ fontSize: '0.75rem', color: '#4b5563' }}>{purchase.supplier.phone}</p>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '15rem' }}>
                    <div style={{ border: '1px solid #d1d5db', padding: '0.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span style={{ fontWeight: '600' }}>Invoice #: {purchase?.invoiceNumber || purchase?.purchaseNumber || "—"}</span>
                        <span style={{ fontWeight: '600' }}>Date: {date}</span>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem', fontSize: '0.875rem' }}>
                <thead>
                    <tr style={{ backgroundColor: '#111827', color: '#ffffff' }}>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: '600' }}>#</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: '600' }}>Item &amp; Description</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: '600' }}>Category</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>Qty</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>Price</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>Disc</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>Tax</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>Net Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {(purchase?.items || []).map((item, index) => {
                        const price = item.costPrice || item.price || item.perItemPrice || 0;
                        const quantity = item.quantity || 0;
                        const baseTotal = quantity * price;
                        const discountAmount = item.discountType === "percentage" ? (baseTotal * (item.discount || 0)) / 100 : (item.discount || 0);
                        const taxAmount = item.taxType === "percentage" ? ((baseTotal - discountAmount) * (item.tax || 0)) / 100 : (item.tax || 0);
                        const netAmount = baseTotal - discountAmount + taxAmount;

                        return (
                            <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '0.5rem 0.75rem' }}>{index + 1}</td>
                                <td style={{ padding: '0.5rem 0.75rem' }}>{item.name || item.product?.name || item.productName || "—"}</td>
                                <td style={{ padding: '0.5rem 0.75rem' }}>{item.category || item.product?.category || "—"}</td>
                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{quantity}</td>
                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{price.toLocaleString()}</td>
                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#dc2626' }}>
                                    {formatDiscount(item.discount, item.discountType)}
                                    <span style={{ display: 'block', fontSize: '0.625rem', color: '#9ca3af' }}>-{discountAmount.toLocaleString()}</span>
                                </td>
                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#15803d' }}>
                                    {formatTax(item.tax, item.taxType)}
                                    <span style={{ display: 'block', fontSize: '0.625rem', color: '#9ca3af' }}>+{taxAmount.toLocaleString()}</span>
                                </td>
                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>{netAmount.toLocaleString()}</td>
                            </tr>
                        );
                    })}
                    <tr style={{ backgroundColor: '#f3f4f6', fontWeight: 'bold' }}>
                        <td style={{ padding: '0.5rem 0.75rem' }} colSpan={3}>Sub Total</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{totalQty}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}></td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{totalDiscount.toLocaleString()}</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{totalItemTax.toLocaleString()}</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{subtotalAfterItems.toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>

            {/* Payment Summary / Totals Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ border: '1px solid #d1d5db', padding: '0.75rem', fontSize: '0.875rem', minWidth: '16.25rem' }}>
                    <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Payment Summary:</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                        <span>Total Amount</span>
                        <span>{(purchase?.totalAmount ?? 0).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                        <span>Total Paid</span>
                        <span>{totalPaid.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontWeight: 'bold', borderTop: '1px solid #d1d5db', marginTop: '0.25rem', paddingTop: '0.25rem' }}>
                        <span>Remaining Balance</span>
                        <span>{remainingAmount.toLocaleString()}</span>
                    </div>
                </div>

                <div style={{ border: '1px solid #d1d5db', minWidth: '17.5rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                        <span>Subtotal</span>
                        <span>{subtotalAfterItems.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderBottom: '1px solid #e5e7eb', color: '#dc2626' }}>
                        <span>Discount</span>
                        <span>-{billDiscount.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderBottom: '1px solid #e5e7eb', color: '#15803d' }}>
                        <span>GST</span>
                        <span>+{billTax.toLocaleString()}</span>
                    </div>
                    {shippingCost > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                            <span>Shipping</span>
                            <span>+{shippingCost.toLocaleString()}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', fontWeight: 'bold' }}>
                        <span>Total Amount</span>
                        <span>{(purchase?.totalAmount ?? 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Payment Transactions Section */}
            {payments && payments.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1f2937' }}>Payment Transactions</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f3f4f6' }}>
                                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: '600', borderBottom: '1px solid #d1d5db' }}>Date</th>
                                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: '600', borderBottom: '1px solid #d1d5db' }}>Method</th>
                                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: '600', borderBottom: '1px solid #d1d5db' }}>Reference</th>
                                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600', borderBottom: '1px solid #d1d5db' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '0.5rem 0.75rem' }}>{new Date(payment.transactionDate || payment.paymentDate).toLocaleDateString()}</td>
                                    <td style={{ padding: '0.5rem 0.75rem', textTransform: 'capitalize' }}>
                                        {payment.method === 'cash' ? (payment.paymentMethodName || 'Cash') :
                                         payment.method === 'credit' ? `Credit (${payment.creditAccount?.name || 'Account'})` :
                                         payment.method || "—"}
                                    </td>
                                    <td style={{ padding: '0.5rem 0.75rem' }}>{payment.creditAccount?.name || payment.paymentMethodName || "—"}</td>
                                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>{(payment.amount || 0).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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

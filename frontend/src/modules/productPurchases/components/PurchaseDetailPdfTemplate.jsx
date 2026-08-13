import React from "react";

export default function PurchaseDetailPdfTemplate({ purchase = {}, payments = [], labels = {} }) {
    const date = new Date(purchase?.purchaseDate ?? purchase?.date ?? purchase?.createdAt).toLocaleDateString();
    
    const totalPaid = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    const remainingAmount = (purchase?.totalAmount ?? 0) - totalPaid;
    const paymentStatusText = remainingAmount <= 0 ? 'full' : totalPaid > 0 ? 'partial' : 'pending';

    return (
        <div className="p-6 bg-white min-h-screen">
            {/* Header */}
            <div className="mb-6 pb-4 border-b-2 border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">{labels.purchaseDetails || "Purchase Details"}</h1>
                <p className="text-sm text-gray-500">{purchase?.purchaseNumber || purchase?.invoiceNumber || "—"} · {date}</p>
            </div>

            {/* Purchase Info Row */}
            <div className="mb-6">
                <div className="flex flex-wrap justify-between gap-4 mb-4">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Invoice Number</p>
                        <p className="text-base font-semibold text-gray-900">{purchase?.invoiceNumber || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Supplier</p>
                        <p className="text-base font-semibold text-gray-900">{purchase?.supplier?.name || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Date</p>
                        <p className="text-base font-semibold text-gray-900">{date}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Status</p>
                        <p className="text-base font-semibold text-gray-900 capitalize">{purchase?.status || "—"}</p>
                    </div>
                </div>
                {purchase?.notes && (
                    <p className="text-sm text-gray-600 italic mt-4">{purchase.notes}</p>
                )}
            </div>

            <div className="border-b border-gray-200 my-6"></div>

            {/* Payment KPI Row */}
            <div className="mb-6">
                <div className="flex flex-wrap justify-between gap-4">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total Amount</p>
                        <p className="text-2xl font-bold text-green-600">Rs {(purchase?.totalAmount ?? 0).toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total Paid</p>
                        <p className="text-2xl font-bold text-blue-600">Rs {totalPaid.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Remaining</p>
                        <p className="text-2xl font-bold text-orange-600">Rs {remainingAmount.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Payment Status</p>
                        <p className="text-2xl font-bold text-gray-900 capitalize">{paymentStatusText}</p>
                    </div>
                </div>
            </div>

            <div className="border-b border-gray-200 my-6"></div>

            {/* Items Table */}
            <div className="mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-3">
                    Items ({purchase?.items?.length || 0})
                </h3>
                <table className="w-full border border-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600 border-b">Product</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold uppercase text-gray-600 border-b">Qty</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">Cost Price</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">Discount</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">Tax</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchase?.items?.map((item, index) => {
                            const price = item.costPrice || item.price || item.perItemPrice || 0;
                            const quantity = item.quantity || 0;
                            const baseTotal = quantity * price;
                            const discountAmount = item.discountType === 'percentage' 
                                ? baseTotal * (item.discount || 0) / 100 
                                : (item.discount || 0);
                            const taxAmount = item.taxType === 'percentage'
                                ? (baseTotal - discountAmount) * (item.tax || 0) / 100
                                : (item.tax || 0);
                            const subtotal = baseTotal - discountAmount + taxAmount;
                            
                            return (
                                <tr key={index} className="border-b">
                                    <td className="px-4 py-2">
                                        <p className="font-medium text-gray-900">{item.name || item.product?.name || item.productName || "—"}</p>
                                        {item.product?.productCode && <p className="text-xs text-gray-500">{item.product.productCode}</p>}
                                    </td>
                                    <td className="px-4 py-2 text-center font-medium text-gray-900">{quantity}</td>
                                    <td className="px-4 py-2 text-right font-medium text-gray-900">Rs {price.toLocaleString()}</td>
                                    <td className="px-4 py-2 text-right font-medium text-red-600">
                                        {item.discountType === 'percentage' ? `${item.discount || 0}%` : `Rs ${(item.discount || 0).toLocaleString()}`}
                                    </td>
                                    <td className="px-4 py-2 text-right font-medium text-green-600">
                                        {item.taxType === 'percentage' ? `${item.tax || 0}%` : `Rs ${(item.tax || 0).toLocaleString()}`}
                                    </td>
                                    <td className="px-4 py-2 text-right font-semibold text-gray-900">Rs {subtotal.toLocaleString()}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="border-b border-gray-200 my-6"></div>

            {/* Summary Section */}
            <div className="mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-3">
                    Summary
                </h3>
                {(() => {
                    const subtotalAfterItems = (purchase?.items || []).reduce((sum, it) => {
                        const price = it.costPrice || it.price || it.perItemPrice || 0;
                        const quantity = it.quantity || 0;
                        const baseTotal = quantity * price;
                        const discountAmount = it.discountType === 'percentage'
                            ? baseTotal * (it.discount || 0) / 100
                            : (it.discount || 0);
                        const afterDiscount = baseTotal - discountAmount;
                        const taxAmount = it.taxType === 'percentage'
                            ? afterDiscount * (it.tax || 0) / 100
                            : (it.tax || 0);
                        return sum + (afterDiscount + taxAmount);
                    }, 0);
                    
                    const billDiscount = purchase.discountType === "percentage"
                        ? (subtotalAfterItems * (purchase.discount || 0)) / 100
                        : (purchase.discount || 0);
                    const afterBillDiscount = subtotalAfterItems - billDiscount;
                    const billTax = purchase.gstType === "fixed"
                        ? (purchase.gst || 0)
                        : (afterBillDiscount * (purchase.gst || 0)) / 100;
                    const afterBillTax = afterBillDiscount + billTax;
                    const shipping = purchase.shippingCost || 0;
                    const total = afterBillTax + shipping;
                    
                    return (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 border border-gray-200 rounded-lg">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Subtotal</p>
                                <div className="text-sm space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">Items Subtotal:</span>
                                        <span className="font-mono text-gray-900">Rs {subtotalAfterItems.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border border-gray-200 rounded-lg">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Discount (Bill)</p>
                                <div className="text-sm space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">Discount:</span>
                                        <span className="font-mono text-gray-900">{(purchase.discount || 0).toFixed(2)} {purchase.discountType === "fixed" ? "fixed" : "%"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">Discount Amount:</span>
                                        <span className="font-mono text-red-600">-Rs {billDiscount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold pt-1 border-t border-gray-200">
                                        <span className="text-gray-900">After Discount:</span>
                                        <span className="font-mono text-gray-900">Rs {afterBillDiscount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border border-gray-200 rounded-lg">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Tax/GST (Bill)</p>
                                <div className="text-sm space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">After Discount Value:</span>
                                        <span className="font-mono text-gray-900">Rs {afterBillDiscount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">Tax:</span>
                                        <span className="font-mono text-gray-900">{(purchase.gst || 0).toFixed(2)} {purchase.gstType === "fixed" ? "fixed" : "%"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">Tax Amount:</span>
                                        <span className="font-mono text-green-600">+Rs {billTax.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold pt-1 border-t border-gray-200">
                                        <span className="text-gray-900">After Tax:</span>
                                        <span className="font-mono text-gray-900">Rs {afterBillTax.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border border-gray-200 rounded-lg">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Shipping</p>
                                <div className="text-sm space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">After Tax Value:</span>
                                        <span className="font-mono text-gray-900">Rs {afterBillTax.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">Shipping Cost:</span>
                                        <span className="font-mono text-green-600">+Rs {shipping.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold pt-1 border-t border-gray-200">
                                        <span className="text-gray-900">After Shipping:</span>
                                        <span className="font-mono text-gray-900">Rs {total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Final Total Card */}
            <div className="mb-6 p-4 rounded-lg" style={{ background: "rgba(15,118,110,0.08)", border: "1px solid rgba(15,118,110,0.25)" }}>
                <p className="text-xs font-bold mb-2" style={{ color: "#0f766e" }}>Total</p>
                <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                        <span className="text-gray-700">After Bill Discount:</span>
                        <span className="font-mono text-gray-900">Rs {((purchase?.totalAmount || 0) - (purchase?.shippingCost || 0) - (purchase.gstType === "fixed" ? (purchase.gst || 0) : 0)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-700">Tax Amount:</span>
                        <span className="font-mono text-gray-900">Rs {(purchase.gstType === "fixed" ? (purchase.gst || 0) : 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-700">Shipping Cost:</span>
                        <span className="font-mono text-gray-900">Rs {(purchase.shippingCost || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300">
                        <span style={{ color: "#0f766e" }}>Grand Total:</span>
                        <span className="font-mono text-xl" style={{ color: "#0f766e" }}>Rs {(purchase?.totalAmount || 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="border-b border-gray-200 my-6"></div>

            {/* Payments Table */}
            <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-3">
                    Payments ({payments.length})
                </h3>
                {payments.length > 0 ? (
                    <>
                        <table className="w-full border border-gray-200 mb-6">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600 border-b">Date</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600 border-b">Method</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">Amount</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600 border-b">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="px-4 py-2 text-sm text-gray-900">{new Date(payment.transactionDate || payment.paymentDate).toLocaleDateString()}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                            {payment.method === 'cash' ? (payment.paymentMethodName || 'Cash') :
                                             payment.method === 'credit' ? `Credit (${payment.creditAccount?.name || 'Account'})` :
                                             payment.method || "—"}
                                        </td>
                                        <td className="px-4 py-2 text-right font-semibold text-green-600">Rs {(payment.amount || 0).toLocaleString()}</td>
                                        <td className="px-4 py-2 text-sm text-gray-500">{payment.notes || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Detailed Payment Information */}
                        <div className="space-y-4">
                            {payments.map((payment, index) => (
                                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Payment #{index + 1} - Detailed Information</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Payment Details</p>
                                            <div className="text-sm space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-700">Payment ID:</span>
                                                    <span className="font-mono text-gray-900">{payment._id || "—"}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-700">Transaction Date:</span>
                                                    <span className="font-mono text-gray-900">{new Date(payment.transactionDate || payment.paymentDate).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-700">Payment Method:</span>
                                                    <span className="font-mono text-gray-900 capitalize">{payment.method || "—"}</span>
                                                </div>
                                                {payment.creditAccount && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-700">Credit Account:</span>
                                                        <span className="font-mono text-gray-900">{payment.creditAccount.name || "—"}</span>
                                                    </div>
                                                )}
                                                {payment.paymentMethodName && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-700">Payment Method Name:</span>
                                                        <span className="font-mono text-gray-900">{payment.paymentMethodName}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Amount Information</p>
                                            <div className="text-sm space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-700">Amount:</span>
                                                    <span className="font-mono font-semibold text-green-600">Rs {(payment.amount || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-700">Notes:</span>
                                                    <span className="font-mono text-gray-900">{payment.notes || "—"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-gray-500 py-4 text-center">No payments recorded yet</p>
                )}
            </div>
        </div>
    );
}

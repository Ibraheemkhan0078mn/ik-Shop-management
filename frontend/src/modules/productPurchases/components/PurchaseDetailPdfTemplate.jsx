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

            {/* Payments Table */}
            <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-3">
                    Payments ({payments.length})
                </h3>
                {payments.length > 0 ? (
                    <table className="w-full border border-gray-200">
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
                ) : (
                    <p className="text-sm text-gray-500 py-4 text-center">No payments recorded yet</p>
                )}
            </div>
        </div>
    );
}

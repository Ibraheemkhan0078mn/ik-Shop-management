import React from "react";

export default function OrderDetailsPdfTemplate({ order = {}, payments = [], labels = {} }) {
    const totalPaid = order?.paid ?? 0;
    const remainingAmount = order?.remainingAmount ?? 0;

    return (
        <div className="p-6 bg-white min-h-screen">
            {/* Header */}
            <div className="mb-6 pb-4 border-b-2 border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">{labels.orderDetails || "Order Details"}</h1>
                <p className="text-sm text-gray-500">{order?.orderNumber || "—"} · Created {new Date(order?.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            </div>

            {/* Status row */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                        order?.status === "completed" ? "bg-green-100 text-green-700" :
                        order?.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        order?.status === "cancelled" ? "bg-red-100 text-red-700" :
                        "bg-blue-100 text-blue-700"
                    }`}>
                        {order?.status || "Unknown"}
                    </span>
                    {order?.isPosOrder && (
                        <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-100 text-purple-700">
                            POS Order
                        </span>
                    )}
                </div>
            </div>

            <div className="border-b border-gray-200 my-6" />

            {/* Order Details */}
            <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Order Details</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Order ID</p>
                        <p className="text-sm font-semibold text-gray-900">{order?._id || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Customer Name</p>
                        <p className="text-sm font-semibold text-gray-900">{order?.customerName || "Walk-in Customer"}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Customer Type</p>
                        <p className="text-sm font-semibold text-gray-900 capitalize">{order?.customerType || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Customer ID</p>
                        <p className="text-sm font-semibold text-gray-900">{order?.customerId || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Served By</p>
                        <p className="text-sm font-semibold text-gray-900">{order?.waiter || "Not specified"}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Order Type</p>
                        <p className="text-sm font-semibold text-gray-900 capitalize">{order?.orderType || "Retail"}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Staff ID</p>
                        <p className="text-sm font-semibold text-gray-900">{order?.staffId || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Last Updated</p>
                        <p className="text-sm font-semibold text-gray-900">
                            {order?.updatedAt ? new Date(order.updatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : "—"}
                        </p>
                    </div>
                </div>
                {order?.note && (
                    <p className="text-sm text-gray-500 mt-4 italic">{order.note}</p>
                )}
            </div>

            <div className="border-b border-gray-200 my-6" />

            {/* Financial Details */}
            <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Financial Details</p>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Subtotal</p>
                        <p className="text-sm font-semibold text-gray-900">Rs {(order?.subtotal ?? 0).toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Tax</p>
                        <p className="text-sm font-semibold text-gray-900">Rs {(order?.totalTaxAmount ?? 0).toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Discount</p>
                        <p className="text-sm font-semibold text-red-600">Rs {(order?.discountAmount ?? 0).toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Paid</p>
                        <p className="text-sm font-semibold text-green-600">Rs {totalPaid.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Remaining</p>
                        <p className="text-sm font-semibold text-orange-600">Rs {remainingAmount.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Total Amount</p>
                        <p className="text-sm font-semibold text-teal-600">Rs {(order?.totalAmount ?? 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="border-b border-gray-200 my-6" />

            {/* Items Table */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Items ({order?.items?.length || 0})
                    </p>
                </div>
                <table className="w-full border border-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600 border-b">Product</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold uppercase text-gray-600 border-b">Portion</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold uppercase text-gray-600 border-b">Qty</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">Unit Price</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">Tax</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">Discount</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order?.items?.map((item, index) => {
                            const lineTotal = (item.unitPrice || 0) * (item.quantity || 0);
                            const totalTax = (item.taxAmount || 0) * (item.quantity || 0);
                            const totalDiscount = item.discountAmount || 0;
                            const finalTotal = lineTotal - totalDiscount + totalTax;
                            return (
                                <React.Fragment key={index}>
                                    <tr className="border-b">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900">{item.name || "—"}</p>
                                            {item.batchNumber && <p className="text-xs text-gray-500">Batch: {item.batchNumber}</p>}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-900 capitalize">
                                                {item.portionType || "full"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-900">{item.quantity || 0}</td>
                                        <td className="px-4 py-3 text-right text-gray-900">Rs {(item.unitPrice || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-gray-900">
                                            <div className="text-xs">
                                                <span className="text-gray-500">{item.taxPercent || 0}%</span>
                                                {item.taxAmount > 0 && <span className="ml-1">({totalTax.toFixed(2)})</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-red-600">
                                            <div className="text-xs">
                                                <span>{item.discountPercent || 0}%</span>
                                                {item.discountAmount > 0 && <span className="ml-1">({totalDiscount.toFixed(2)})</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-teal-600">Rs {finalTotal.toLocaleString()}</td>
                                    </tr>
                                    <tr className="border-b bg-gray-50">
                                        <td colSpan="7" className="px-4 py-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                                                    <p className="text-xs font-semibold text-gray-600 mb-2">Item Details</p>
                                                    <div className="text-xs space-y-1">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-700">Product ID:</span>
                                                            <span className="font-mono text-gray-900">{item.product || "—"}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-700">Original Price:</span>
                                                            <span className="font-mono text-gray-900">Rs {(item.originalPrice || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-700">Batch ID:</span>
                                                            <span className="font-mono text-gray-900">{item.batchId || "—"}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-700">Batch Number:</span>
                                                            <span className="font-mono text-gray-900">{item.batchNumber || "—"}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                                                    <p className="text-xs font-semibold text-gray-600 mb-2">Price Calculation</p>
                                                    <div className="text-xs space-y-1">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-700">Unit Price:</span>
                                                            <span className="font-mono text-gray-900">Rs {(item.unitPrice || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-700">Quantity:</span>
                                                            <span className="font-mono text-gray-900">{item.quantity || 0}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-700">Line Total:</span>
                                                            <span className="font-mono text-gray-900">Rs {lineTotal.toLocaleString()}</span>
                                                        </div>
                                                        <div className="h-px bg-gray-200 my-1"></div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-700">Tax ({item.taxPercent || 0}%):</span>
                                                            <span className="font-mono text-green-600">Rs {totalTax.toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-700">Discount ({item.discountPercent || 0}%):</span>
                                                            <span className="font-mono text-red-600">-Rs {totalDiscount.toFixed(2)}</span>
                                                        </div>
                                                        <div className="h-px bg-gray-200 my-1"></div>
                                                        <div className="flex justify-between font-semibold">
                                                            <span className="text-gray-900">Final Total:</span>
                                                            <span className="font-mono text-teal-700">Rs {finalTotal.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="border-b border-gray-200 my-6" />

            {/* Payment Details */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Payments ({payments.length})
                    </p>
                </div>
                {payments.length > 0 ? (
                    <>
                        <table className="w-full border border-gray-200 mb-6">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600 border-b">Date</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600 border-b">Method</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">Amount</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {new Date(payment.transactionDate || payment.paymentDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                                payment.method === 'cash' ? 'bg-green-100 text-green-800' :
                                                payment.method === 'credit' ? 'bg-blue-100 text-blue-800' :
                                                'bg-purple-100 text-purple-800'
                                            }`}>
                                                {payment.method === 'cash' ? (payment.paymentMethodName || 'Cash') :
                                                 payment.method === 'credit' ? `Credit (${payment.creditAccount?.name || 'Account'})` :
                                                 payment.method || "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-teal-600">Rs {(payment.amount || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-gray-500">{payment.notes || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Detailed Payment Information */}
                        <div className="space-y-4">
                            {payments.map((payment, index) => (
                                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Payment #{index + 1} - Detailed Information</h4>
                                    <div className="p-3 rounded-lg bg-white border border-gray-200 mb-4">
                                        <p className="text-xs font-semibold text-gray-600 mb-2">Payment Items</p>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="border-b border-gray-200">
                                                        <th className="px-3 py-2 text-left text-gray-600 font-medium">Product</th>
                                                        <th className="px-3 py-2 text-center text-gray-600 font-medium">Portion</th>
                                                        <th className="px-3 py-2 text-center text-gray-600 font-medium">Qty</th>
                                                        <th className="px-3 py-2 text-right text-gray-600 font-medium">Unit Price</th>
                                                        <th className="px-3 py-2 text-right text-gray-600 font-medium">Tax</th>
                                                        <th className="px-3 py-2 text-right text-gray-600 font-medium">Discount</th>
                                                        <th className="px-3 py-2 text-right text-gray-600 font-medium">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {order?.items?.map((item, itemIndex) => {
                                                        const lineTotal = (item.unitPrice || 0) * (item.quantity || 0);
                                                        const totalTax = (item.taxAmount || 0) * (item.quantity || 0);
                                                        const totalDiscount = item.discountAmount || 0;
                                                        const finalTotal = lineTotal - totalDiscount + totalTax;
                                                        return (
                                                            <tr key={itemIndex} className="border-b border-gray-200">
                                                                <td className="px-3 py-2 text-gray-900">{item.name || "—"}</td>
                                                                <td className="px-3 py-2 text-center capitalize text-gray-900">{item.portionType || "full"}</td>
                                                                <td className="px-3 py-2 text-center text-gray-900">{item.quantity || 0}</td>
                                                                <td className="px-3 py-2 text-right text-gray-900">Rs {(item.unitPrice || 0).toLocaleString()}</td>
                                                                <td className="px-3 py-2 text-right text-gray-900">
                                                                    <div className="text-xs">
                                                                        <span className="text-gray-500">{item.taxPercent || 0}%</span>
                                                                        {item.taxAmount > 0 && <span className="ml-1">({totalTax.toFixed(2)})</span>}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-2 text-right text-red-600">
                                                                    <div className="text-xs">
                                                                        <span>{item.discountPercent || 0}%</span>
                                                                        {item.discountAmount > 0 && <span className="ml-1">({totalDiscount.toFixed(2)})</span>}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-2 text-right font-semibold text-teal-600">Rs {finalTotal.toLocaleString()}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
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
                                                    <span className="text-gray-700">Cash Amount:</span>
                                                    <span className="font-mono text-gray-900">Rs {(payment.cashAmount || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-700">Credit Amount:</span>
                                                    <span className="font-mono text-gray-900">Rs {(payment.creditAmount || 0).toLocaleString()}</span>
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
                    <p className="text-sm text-gray-500 py-6 text-center">No payments recorded yet</p>
                )}
            </div>
        </div>
    );
}

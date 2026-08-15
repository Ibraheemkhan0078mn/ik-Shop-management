import React from "react";

export default function OrderReturnPdfTemplate({ orderReturn = {}, refunds = [], labels = {} }) {
    const date = new Date(orderReturn?.returnDate ?? orderReturn?.createdAt).toLocaleDateString();
    const totalRefundAmount = orderReturn?.totalRefundAmount || 0;
    const refundedAmount = orderReturn?.refundedAmount || 0;
    const remainingAmount = totalRefundAmount - refundedAmount;

    return (
        <div className="p-6 bg-white min-h-screen">
            {/* Header */}
            <div className="mb-6 pb-4 border-b-2 border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">{labels.orderReturnDetails || "Order Return Details"}</h1>
                <p className="text-sm text-gray-500">{orderReturn?.returnNumber || "—"} · {date}</p>
            </div>

            {/* Status row */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                        orderReturn?.returnStatus === "completed" ? "bg-green-100 text-green-700" :
                        orderReturn?.returnStatus === "approved" ? "bg-teal-100 text-teal-700" :
                        orderReturn?.returnStatus === "rejected" ? "bg-red-100 text-red-700" :
                        orderReturn?.returnStatus === "pending" ? "bg-yellow-100 text-yellow-700" :
                        "bg-blue-100 text-blue-700"
                    }`}>
                        {orderReturn?.returnStatus || "Unknown"}
                    </span>
                </div>
            </div>

            <div className="border-b border-gray-200 my-6" />

            {/* Return Information */}
            <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Return Information</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Return Number</p>
                        <p className="text-sm font-semibold text-gray-900">{orderReturn?.returnNumber || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Order Number</p>
                        <p className="text-sm font-semibold text-gray-900">{orderReturn?.referenceOrderNumber || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Customer Name</p>
                        <p className="text-sm font-semibold text-gray-900">{orderReturn?.customerName || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Return Date</p>
                        <p className="text-sm font-semibold text-gray-900">{date}</p>
                    </div>
                </div>
                {orderReturn?.notes && (
                    <p className="text-sm text-gray-500 mt-4 italic">{orderReturn.notes}</p>
                )}
            </div>

            <div className="border-b border-gray-200 my-6" />

            {/* Financial Details */}
            <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Financial Details</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Total Refund Amount</p>
                        <p className="text-sm font-semibold text-gray-900">Rs {totalRefundAmount.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Refunded Amount</p>
                        <p className="text-sm font-semibold text-teal-600">Rs {refundedAmount.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Remaining Amount</p>
                        <p className="text-sm font-semibold text-orange-600">Rs {remainingAmount.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="border-b border-gray-200 my-6" />

            {/* Returned Items */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Returned Items ({orderReturn?.items?.length || 0})
                    </p>
                </div>
                <table className="w-full border border-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600 border-b">Product</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold uppercase text-gray-600 border-b">Qty</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">Original Price</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">Cut</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">Refund Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orderReturn?.items?.map((item, index) => (
                            <React.Fragment key={index}>
                                <tr className="border-b">
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-gray-900">{item.productName || "—"}</p>
                                        {item.productId && <p className="text-xs text-gray-500">ID: {item.productId}</p>}
                                    </td>
                                    <td className="px-4 py-3 text-center text-gray-900">{item.quantity || 0}</td>
                                    <td className="px-4 py-3 text-right text-gray-900">Rs {(item.originalPrice || 0).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-gray-900">Rs {(item.cut || 0).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-teal-600">Rs {(item.refundAmount || 0).toLocaleString()}</td>
                                </tr>
                                <tr className="border-b bg-gray-50">
                                    <td colSpan="5" className="px-4 py-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-3 bg-white border border-gray-200 rounded-lg">
                                                <p className="text-xs font-semibold text-gray-600 mb-2">Item Details</p>
                                                <div className="text-xs space-y-1">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-700">Product ID:</span>
                                                        <span className="font-mono text-gray-900">{item.productId || "—"}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-700">Return Reason:</span>
                                                        <span className="font-mono text-gray-900 capitalize">{item.returnReason || "—"}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-700">Quantity:</span>
                                                        <span className="font-mono text-gray-900">{item.quantity || 0}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-700">Original Price:</span>
                                                        <span className="font-mono text-gray-900">Rs {(item.originalPrice || 0).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-white border border-gray-200 rounded-lg">
                                                <p className="text-xs font-semibold text-gray-600 mb-2">Refund Calculation</p>
                                                <div className="text-xs space-y-1">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-700">Original Price:</span>
                                                        <span className="font-mono text-gray-900">Rs {(item.originalPrice || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-700">Quantity:</span>
                                                        <span className="font-mono text-gray-900">{item.quantity || 0}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-700">Line Total:</span>
                                                        <span className="font-mono text-gray-900">Rs {((item.originalPrice || 0) * (item.quantity || 0)).toLocaleString()}</span>
                                                    </div>
                                                    <div className="h-px bg-gray-200 my-1"></div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-700">Cut Amount:</span>
                                                        <span className="font-mono text-red-600">-Rs {(item.cut || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="h-px bg-gray-200 my-1"></div>
                                                    <div className="flex justify-between font-semibold">
                                                        <span className="text-gray-900">Refund Amount:</span>
                                                        <span className="font-mono text-teal-700">Rs {(item.refundAmount || 0).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </React.Fragment>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                        <tr>
                            <td colSpan="4" className="px-4 py-2 text-right font-bold text-gray-900">Total Refund:</td>
                            <td className="px-4 py-2 text-right font-bold text-teal-600 text-lg">Rs {totalRefundAmount.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="border-b border-gray-200 my-6" />

            {/* Refund Details */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Refunds ({refunds.length})
                    </p>
                </div>
                {refunds.length > 0 ? (
                    <>
                        <table className="w-full border border-gray-200 mb-6">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600 border-b">Date</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600 border-b">Method</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">Amount</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">Cash</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">Credit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {refunds.map((refund, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {new Date(refund.transactionDate || refund.refundDate || refund.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                                refund.method === 'cash' ? 'bg-green-100 text-green-800' :
                                                refund.method === 'credit' ? 'bg-blue-100 text-blue-800' :
                                                refund.method === 'hybrid' ? 'bg-purple-100 text-purple-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {refund.method === 'cash' ? (refund.paymentMethodName || 'Cash') :
                                                 refund.method === 'credit' ? `Credit (${refund.creditAccount?.name || 'Account'})` :
                                                 refund.method === 'hybrid' ? 'Hybrid' :
                                                 refund.method || "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-teal-600">Rs {(refund.amount || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-gray-900">Rs {(refund.cashAmount || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-gray-900">Rs {(refund.creditAmount || 0).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Detailed Refund Information */}
                        <div className="space-y-4">
                            {refunds.map((refund, index) => (
                                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Refund #{index + 1} - Detailed Information</h4>
                                    <div className="p-3 rounded-lg bg-white border border-gray-200 mb-4">
                                        <p className="text-xs font-semibold text-gray-600 mb-2">Refunded Items</p>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="border-b border-gray-200">
                                                        <th className="px-3 py-2 text-left text-gray-600 font-medium">Product</th>
                                                        <th className="px-3 py-2 text-center text-gray-600 font-medium">Qty</th>
                                                        <th className="px-3 py-2 text-right text-gray-600 font-medium">Original Price</th>
                                                        <th className="px-3 py-2 text-right text-gray-600 font-medium">Cut</th>
                                                        <th className="px-3 py-2 text-right text-gray-600 font-medium">Refund Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {orderReturn?.items?.map((item, itemIndex) => (
                                                        <tr key={itemIndex} className="border-b border-gray-200">
                                                            <td className="px-3 py-2 text-gray-900">{item.productName}</td>
                                                            <td className="px-3 py-2 text-center text-gray-900">{item.quantity}</td>
                                                            <td className="px-3 py-2 text-right text-gray-900">Rs {(item.originalPrice || 0).toLocaleString()}</td>
                                                            <td className="px-3 py-2 text-right text-gray-900">Rs {(item.cut || 0).toLocaleString()}</td>
                                                            <td className="px-3 py-2 text-right font-semibold text-teal-600">Rs {(item.refundAmount || 0).toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Refund Details</p>
                                            <div className="text-sm space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-700">Refund ID:</span>
                                                    <span className="font-mono text-gray-900">{refund._id || "—"}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-700">Transaction Date:</span>
                                                    <span className="font-mono text-gray-900">{new Date(refund.transactionDate || refund.refundDate || refund.date).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-700">Refund Method:</span>
                                                    <span className="font-mono text-gray-900 capitalize">{refund.method || "—"}</span>
                                                </div>
                                                {refund.creditAccount && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-700">Credit Account:</span>
                                                        <span className="font-mono text-gray-900">{refund.creditAccount.name || "—"}</span>
                                                    </div>
                                                )}
                                                {refund.paymentMethodName && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-700">Payment Method Name:</span>
                                                        <span className="font-mono text-gray-900">{refund.paymentMethodName}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Amount Information</p>
                                            <div className="text-sm space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-700">Amount:</span>
                                                    <span className="font-mono font-semibold text-green-600">Rs {(refund.amount || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-700">Cash Amount:</span>
                                                    <span className="font-mono text-gray-900">Rs {(refund.cashAmount || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-700">Credit Amount:</span>
                                                    <span className="font-mono text-gray-900">Rs {(refund.creditAmount || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-700">Notes:</span>
                                                    <span className="font-mono text-gray-900">{refund.notes || "—"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-gray-500 py-6 text-center">No refunds recorded yet</p>
                )}
            </div>
        </div>
    );
}

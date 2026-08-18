import React from "react";

export default function OrderReturnPdfTemplate({ orderReturn = {}, refunds = [], labels = {} }) {
    const date = new Date(orderReturn?.returnDate ?? orderReturn?.createdAt).toLocaleDateString();
    const totalRefundAmount = orderReturn?.totalRefundAmount || 0;
    const refundedAmount = orderReturn?.refundedAmount || 0;
    const remainingAmount = totalRefundAmount - refundedAmount;
    const totalQty = (orderReturn?.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0);
    const totalCut = (orderReturn?.items || []).reduce((sum, it) => sum + (it.cut || 0), 0);

    return (
        <div className="p-10 bg-white min-h-screen text-gray-800" style={{ fontFamily: "Arial, sans-serif" }}>
            {/* Company Header */}
            <div className="text-center mb-6">
                <div className="inline-flex flex-col items-center leading-none mb-2">
                    <span className="text-3xl font-extrabold tracking-wide text-gray-900" style={{ letterSpacing: "2px" }}>LOGIN</span>
                    <span className="text-xs font-semibold tracking-[0.3em] text-gray-500 mt-1">LARAIB</span>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
                Afrasiab Mobile Accesories
            </h2>
            <p className="text-center text-sm font-semibold text-gray-500 -mt-4 mb-6 uppercase tracking-wide">
                {labels.orderReturnDetails || "Order Return"}
            </p>

            {/* Customer / Return Meta Row */}
            <div className="flex justify-between items-start mb-6 gap-6">
                <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Customer:</p>
                    <p className="text-sm font-bold text-gray-900 uppercase">{orderReturn?.customerName || "—"}</p>
                    {orderReturn?.referenceOrderNumber && (
                        <p className="text-xs text-gray-600">Order #: {orderReturn.referenceOrderNumber}</p>
                    )}
                </div>
                <div className="flex flex-col gap-2 min-w-[240px]">
                    <div className="border border-gray-300 px-3 py-2 flex justify-between text-sm">
                        <span className="font-semibold">Return #: {orderReturn?.returnNumber || "—"}</span>
                        <span className="font-semibold">Date: {date}</span>
                    </div>
                    <div className="border border-gray-300 px-3 py-2 flex justify-between text-sm">
                        <span className="font-semibold">Status:</span>
                        <span className="font-semibold capitalize">{orderReturn?.returnStatus || "—"}</span>
                    </div>
                </div>
            </div>

            {orderReturn?.notes && (
                <p className="text-sm text-gray-600 italic mb-6">{orderReturn.notes}</p>
            )}

            {/* Returned Items Table */}
            <table className="w-full border-collapse mb-4 text-sm">
                <thead>
                    <tr className="bg-gray-900 text-white">
                        <th className="px-3 py-2 text-left font-semibold">#</th>
                        <th className="px-3 py-2 text-left font-semibold">Item &amp; Description</th>
                        <th className="px-3 py-2 text-right font-semibold">Qty</th>
                        <th className="px-3 py-2 text-right font-semibold">Original Price</th>
                        <th className="px-3 py-2 text-right font-semibold">Cut</th>
                        <th className="px-3 py-2 text-right font-semibold">Refund Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {(orderReturn?.items || []).map((item, index) => (
                        <tr key={index} className="border-b border-gray-200">
                            <td className="px-3 py-2">{index + 1}</td>
                            <td className="px-3 py-2">
                                {item.productName || "—"}
                                {item.returnReason && <span className="text-xs text-gray-500 capitalize"> ({item.returnReason})</span>}
                            </td>
                            <td className="px-3 py-2 text-right">{item.quantity || 0}</td>
                            <td className="px-3 py-2 text-right">{(item.originalPrice || 0).toLocaleString()}</td>
                            <td className="px-3 py-2 text-right text-red-600">-{(item.cut || 0).toLocaleString()}</td>
                            <td className="px-3 py-2 text-right font-semibold">{(item.refundAmount || 0).toLocaleString()}</td>
                        </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold">
                        <td className="px-3 py-2" colSpan={2}>Sub Total</td>
                        <td className="px-3 py-2 text-right">{totalQty}</td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2 text-right text-red-600">-{totalCut.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right">{totalRefundAmount.toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>

            {/* Refund Summary */}
            <div className="flex justify-between gap-6 mb-6">
                <div className="border border-gray-300 p-3 text-sm min-w-[260px]">
                    <p className="font-semibold mb-2">Refund Summary:</p>
                    <div className="flex justify-between py-1">
                        <span>Total Refund Amount</span>
                        <span>{totalRefundAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span>Refunded Amount</span>
                        <span>{refundedAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 font-bold border-t border-gray-300 mt-1 pt-1">
                        <span>Remaining Amount</span>
                        <span>{remainingAmount.toLocaleString()}</span>
                    </div>
                </div>

                <div className="border border-gray-300 min-w-[260px]">
                    <div className="flex justify-between px-3 py-2 border-b border-gray-200">
                        <span>Items</span>
                        <span>{orderReturn?.items?.length || 0}</span>
                    </div>
                    <div className="flex justify-between px-3 py-2 border-b border-gray-200">
                        <span>Total Quantity</span>
                        <span>{totalQty}</span>
                    </div>
                    <div className="flex justify-between px-3 py-2 font-bold">
                        <span>Total Refund</span>
                        <span>{totalRefundAmount.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Refunds Table */}
            {refunds.length > 0 && (
                <table className="w-full border-collapse mb-6 text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-3 py-2 text-left font-semibold border-b border-gray-300">Date</th>
                            <th className="px-3 py-2 text-left font-semibold border-b border-gray-300">Method</th>
                            <th className="px-3 py-2 text-right font-semibold border-b border-gray-300">Amount</th>
                            <th className="px-3 py-2 text-right font-semibold border-b border-gray-300">Cash</th>
                            <th className="px-3 py-2 text-right font-semibold border-b border-gray-300">Credit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {refunds.map((refund, index) => (
                            <tr key={index} className="border-b border-gray-200">
                                <td className="px-3 py-2">{new Date(refund.transactionDate || refund.refundDate || refund.date).toLocaleDateString()}</td>
                                <td className="px-3 py-2 capitalize">
                                    {refund.method === "credit" ? `Credit (${refund.creditAccount?.name || "Account"})` : refund.method || "—"}
                                </td>
                                <td className="px-3 py-2 text-right font-semibold">{(refund.amount || 0).toLocaleString()}</td>
                                <td className="px-3 py-2 text-right">{(refund.cashAmount || 0).toLocaleString()}</td>
                                <td className="px-3 py-2 text-right">{(refund.creditAmount || 0).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Sign-off Bar */}
            <div className="border border-gray-300 mb-4">
                <div className="flex text-sm">
                    <div className="w-1/2 text-center py-3 border-r border-gray-300">
                        <p>Prepared By</p>
                        <p className="font-semibold mt-1">SyedSoft</p>
                    </div>
                    <div className="w-1/2 text-center py-3">
                        <p>Approved By</p>
                        <p className="font-semibold mt-1">Afrasiab Mobile Accesories</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-start text-xs text-gray-500">
                <p className="italic max-w-[70%]">{labels.footerNote || "This is a computer generated document, does not required any signature"}</p>
                <p>Print Time: {new Date().toLocaleString()}</p>
            </div>
        </div>
    );
}
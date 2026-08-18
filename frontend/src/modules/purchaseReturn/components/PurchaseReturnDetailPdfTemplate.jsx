import React from "react";

export default function PurchaseReturnDetailPdfTemplate({ purchaseReturn = {}, payments = [], labels = {} }) {
    const date = new Date(purchaseReturn?.returnDate ?? purchaseReturn?.createdAt).toLocaleDateString();

    const totalQty = (purchaseReturn?.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0);
    const totalRefunded = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

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
                {labels.purchaseReturnDetails || "Purchase Return"}
            </p>

            {/* Supplier / Return Meta Row */}
            <div className="flex justify-between items-start mb-6 gap-6">
                <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Returned To:</p>
                    <p className="text-sm font-bold text-gray-900 uppercase">{purchaseReturn?.supplierName || purchaseReturn?.supplier?.name || "—"}</p>
                    {purchaseReturn?.reason && (
                        <p className="text-xs text-gray-600 capitalize">Reason: {purchaseReturn.reason.replace(/_/g, " ")}</p>
                    )}
                </div>
                <div className="flex flex-col gap-2 min-w-[240px]">
                    <div className="border border-gray-300 px-3 py-2 flex justify-between text-sm">
                        <span className="font-semibold">Return #: {purchaseReturn?.returnNumber || "—"}</span>
                        <span className="font-semibold">Date: {date}</span>
                    </div>
                    <div className="border border-gray-300 px-3 py-2 flex justify-between text-sm">
                        <span className="font-semibold">Status:</span>
                        <span className="font-semibold capitalize">{purchaseReturn?.status || "—"}</span>
                    </div>
                </div>
            </div>

            {purchaseReturn?.notes && (
                <p className="text-sm text-gray-600 italic mb-6">{purchaseReturn.notes}</p>
            )}

            {/* Items Table */}
            <table className="w-full border-collapse mb-4 text-sm">
                <thead>
                    <tr className="bg-gray-900 text-white">
                        <th className="px-3 py-2 text-left font-semibold">#</th>
                        <th className="px-3 py-2 text-left font-semibold">Item &amp; Description</th>
                        <th className="px-3 py-2 text-right font-semibold">Qty</th>
                        <th className="px-3 py-2 text-right font-semibold">Cost Price</th>
                        <th className="px-3 py-2 text-right font-semibold">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {(purchaseReturn?.items || []).map((item, index) => (
                        <tr key={index} className="border-b border-gray-200">
                            <td className="px-3 py-2">{index + 1}</td>
                            <td className="px-3 py-2">
                                {item.productName || item.product?.name || "—"}
                                {item.variant && <span className="text-xs text-gray-500"> ({item.variant})</span>}
                            </td>
                            <td className="px-3 py-2 text-right">{item.quantity || 0}</td>
                            <td className="px-3 py-2 text-right">{(item.costPrice || 0).toLocaleString()}</td>
                            <td className="px-3 py-2 text-right font-semibold text-red-600">
                                {((item.quantity || 0) * (item.costPrice || 0)).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold">
                        <td className="px-3 py-2" colSpan={2}>Sub Total</td>
                        <td className="px-3 py-2 text-right">{totalQty}</td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2 text-right text-red-600">{(purchaseReturn?.totalAmount ?? 0).toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>

            {/* Refund Summary */}
            <div className="flex justify-between gap-6 mb-6">
                <div className="border border-gray-300 p-3 text-sm min-w-[260px]">
                    <p className="font-semibold mb-2">Refund Summary:</p>
                    <div className="flex justify-between py-1">
                        <span>Return Amount</span>
                        <span>{(purchaseReturn?.totalAmount ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span>Total Refunded</span>
                        <span>{totalRefunded.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 font-bold border-t border-gray-300 mt-1 pt-1">
                        <span>Pending Refund</span>
                        <span>{((purchaseReturn?.totalAmount ?? 0) - totalRefunded).toLocaleString()}</span>
                    </div>
                </div>

                <div className="border border-gray-300 min-w-[260px]">
                    <div className="flex justify-between px-3 py-2 border-b border-gray-200">
                        <span>Items</span>
                        <span>{purchaseReturn?.items?.length || 0}</span>
                    </div>
                    <div className="flex justify-between px-3 py-2 border-b border-gray-200">
                        <span>Total Quantity</span>
                        <span>{totalQty}</span>
                    </div>
                    <div className="flex justify-between px-3 py-2 font-bold text-red-600">
                        <span>Total Amount</span>
                        <span>{(purchaseReturn?.totalAmount ?? 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Refund Payments Table */}
            {payments.length > 0 && (
                <table className="w-full border-collapse mb-6 text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-3 py-2 text-left font-semibold border-b border-gray-300">Date</th>
                            <th className="px-3 py-2 text-left font-semibold border-b border-gray-300">Method</th>
                            <th className="px-3 py-2 text-right font-semibold border-b border-gray-300">Amount</th>
                            <th className="px-3 py-2 text-left font-semibold border-b border-gray-300">Credit Account</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map((payment, index) => (
                            <tr key={index} className="border-b border-gray-200">
                                <td className="px-3 py-2">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                <td className="px-3 py-2 capitalize">{payment.paymentMethod || "—"}</td>
                                <td className="px-3 py-2 text-right font-semibold">{(payment.amount || 0).toLocaleString()}</td>
                                <td className="px-3 py-2">{payment.creditAccount?.name || "—"}</td>
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
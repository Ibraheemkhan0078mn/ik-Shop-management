import React from "react";

export default function OrderReturnPaymentPdfTemplate({ payment = {}, orderReturn = {}, labels = {} }) {
    const transactionDate = new Date(payment.transactionDate || payment.paymentDate || payment.date).toLocaleString();
    const returnDate = new Date(orderReturn?.returnDate ?? orderReturn?.createdAt).toLocaleDateString();

    const totalRefundAmount = orderReturn?.totalRefundAmount || 0;
    const refundedAmount = orderReturn?.refundedAmount || 0;
    const remainingAmount = totalRefundAmount - refundedAmount;

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
                {labels.refundReceipt || "Refund Receipt"}
            </p>

            {/* Customer / Return Meta Row */}
            <div className="flex justify-between items-start mb-6 gap-6">
                <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Customer:</p>
                    <p className="text-sm font-bold text-gray-900 uppercase">{orderReturn?.customerName || "—"}</p>
                    <p className="text-xs text-gray-600">Return Date: {returnDate}</p>
                </div>
                <div className="flex flex-col gap-2 min-w-[240px]">
                    <div className="border border-gray-300 px-3 py-2 flex justify-between text-sm">
                        <span className="font-semibold">Return #: {orderReturn?.returnNumber || "—"}</span>
                        <span className="font-semibold">Date: {transactionDate}</span>
                    </div>
                    <div className="border border-gray-300 px-3 py-2 flex justify-between text-sm">
                        <span className="font-semibold">Refund ID:</span>
                        <span className="font-semibold">{payment._id || "—"}</span>
                    </div>
                </div>
            </div>

            {/* Refund Details Table */}
            <table className="w-full border-collapse mb-4 text-sm">
                <thead>
                    <tr className="bg-gray-900 text-white">
                        <th className="px-3 py-2 text-left font-semibold">Method</th>
                        <th className="px-3 py-2 text-left font-semibold">Reference</th>
                        <th className="px-3 py-2 text-left font-semibold">Notes</th>
                        <th className="px-3 py-2 text-right font-semibold">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="border-b border-gray-200">
                        <td className="px-3 py-2 capitalize">
                            {payment.method === 'cash' ? (payment.paymentMethodName || 'Cash') :
                             payment.method === 'credit' ? `Credit (${payment.creditAccount?.name || 'Account'})` :
                             payment.method === 'hybrid' ? 'Hybrid' :
                             payment.method || "—"}
                        </td>
                        <td className="px-3 py-2">
                            {payment.creditAccount?.name || payment.paymentMethodName || "—"}
                        </td>
                        <td className="px-3 py-2">{payment.notes || "—"}</td>
                        <td className="px-3 py-2 text-right font-semibold">{(payment.amount || 0).toLocaleString()}</td>
                    </tr>
                    <tr className="bg-gray-100 font-bold">
                        <td className="px-3 py-2" colSpan={3}>Total Refunded</td>
                        <td className="px-3 py-2 text-right">{(payment.amount || 0).toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>

            {/* Return Summary */}
            <div className="flex justify-between gap-6 mb-6">
                <div className="border border-gray-300 p-3 text-sm min-w-[260px]">
                    <p className="font-semibold mb-2">Return Summary:</p>
                    <div className="flex justify-between py-1">
                        <span>Total Refund Amount</span>
                        <span>{totalRefundAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span>This Refund</span>
                        <span>{(payment.amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 font-bold border-t border-gray-300 mt-1 pt-1">
                        <span>Pending Refund</span>
                        <span>{remainingAmount.toLocaleString()}</span>
                    </div>
                </div>

                <div className="border border-gray-300 min-w-[260px] flex flex-col justify-center items-center p-4" style={{ background: "rgba(15,118,110,0.06)" }}>
                    <p className="text-xs font-bold uppercase" style={{ color: "#0f766e" }}>Amount Refunded</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: "#0f766e" }}>Rs {(payment.amount || 0).toLocaleString()}</p>
                </div>
            </div>

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

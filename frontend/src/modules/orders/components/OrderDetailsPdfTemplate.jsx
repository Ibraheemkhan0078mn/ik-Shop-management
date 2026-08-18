import React from "react";

export default function OrderDetailsPdfTemplate({ order = {}, payments = [], labels = {} }) {
    const totalPaid = order?.paid ?? 0;
    const remainingAmount = order?.remainingAmount ?? 0;
    const date = order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—";

    const totalQty = (order?.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0);
    const totalItemDiscount = (order?.items || []).reduce((sum, it) => sum + (it.discountAmount || 0), 0);
    const totalItemTax = (order?.items || []).reduce((sum, it) => sum + ((it.taxAmount || 0) * (it.quantity || 0)), 0);

    const formatPercent = (value) => `${value || 0}%`;

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

            {/* Customer / Order Meta Row */}
            <div className="flex justify-between items-start mb-6 gap-6">
                <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Customer:</p>
                    <p className="text-sm font-bold text-gray-900 uppercase">{order?.customerName || "Walk-in Customer"}</p>
                    {order?.customerType && <p className="text-xs text-gray-600 capitalize">Type: {order.customerType}</p>}
                    {order?.customerId && <p className="text-xs text-gray-600">Customer ID: {order.customerId}</p>}
                </div>
                <div className="flex flex-col gap-2 min-w-[240px]">
                    <div className="border border-gray-300 px-3 py-2 flex justify-between text-sm">
                        <span className="font-semibold">Order #: {order?.orderNumber || "—"}</span>
                        <span className="font-semibold">Date: {date}</span>
                    </div>
                    <div className="border border-gray-300 px-3 py-2 flex justify-between text-sm">
                        <span className="font-semibold">Status:</span>
                        <span className="font-semibold capitalize">{order?.status || "—"}</span>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full border-collapse mb-4 text-sm">
                <thead>
                    <tr className="bg-gray-900 text-white">
                        <th className="px-3 py-2 text-left font-semibold">#</th>
                        <th className="px-3 py-2 text-left font-semibold">Item &amp; Description</th>
                        <th className="px-3 py-2 text-right font-semibold">Qty</th>
                        <th className="px-3 py-2 text-right font-semibold">Unit Price</th>
                        <th className="px-3 py-2 text-right font-semibold">Disc</th>
                        <th className="px-3 py-2 text-right font-semibold">Tax</th>
                        <th className="px-3 py-2 text-right font-semibold">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {(order?.items || []).map((item, index) => {
                        const lineTotal = (item.unitPrice || 0) * (item.quantity || 0);
                        const itemTax = (item.taxAmount || 0) * (item.quantity || 0);
                        const itemDiscount = item.discountAmount || 0;
                        const finalTotal = lineTotal - itemDiscount + itemTax;

                        return (
                            <tr key={index} className="border-b border-gray-200">
                                <td className="px-3 py-2">{index + 1}</td>
                                <td className="px-3 py-2">
                                    {item.name || "—"}
                                    {item.portionType && <span className="text-xs text-gray-500 capitalize"> ({item.portionType})</span>}
                                </td>
                                <td className="px-3 py-2 text-right">{item.quantity || 0}</td>
                                <td className="px-3 py-2 text-right">{(item.unitPrice || 0).toLocaleString()}</td>
                                <td className="px-3 py-2 text-right text-red-600">
                                    {formatPercent(item.discountPercent)}
                                    <span className="block text-[10px] text-gray-400">-{itemDiscount.toLocaleString()}</span>
                                </td>
                                <td className="px-3 py-2 text-right text-green-700">
                                    {formatPercent(item.taxPercent)}
                                    <span className="block text-[10px] text-gray-400">+{itemTax.toLocaleString()}</span>
                                </td>
                                <td className="px-3 py-2 text-right font-semibold">{finalTotal.toLocaleString()}</td>
                            </tr>
                        );
                    })}
                    <tr className="bg-gray-100 font-bold">
                        <td className="px-3 py-2" colSpan={2}>Sub Total</td>
                        <td className="px-3 py-2 text-right">{totalQty}</td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2 text-right">{totalItemDiscount.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right">{totalItemTax.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right">{(order?.subtotal ?? 0).toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>

            {/* Payment Summary / Totals Row */}
            <div className="flex justify-between gap-6 mb-6">
                <div className="border border-gray-300 p-3 text-sm min-w-[260px]">
                    <p className="font-semibold mb-2">Payment Summary:</p>
                    <div className="flex justify-between py-1">
                        <span>Total Amount</span>
                        <span>{(order?.totalAmount ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span>Total Paid</span>
                        <span>{totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 font-bold border-t border-gray-300 mt-1 pt-1">
                        <span>Remaining Balance</span>
                        <span>{remainingAmount.toLocaleString()}</span>
                    </div>
                </div>

                <div className="border border-gray-300 min-w-[280px] text-sm">
                    <div className="flex justify-between px-3 py-2 border-b border-gray-200">
                        <span>Subtotal</span>
                        <span>{(order?.subtotal ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between px-3 py-2 border-b border-gray-200 text-red-600">
                        <span>Discount</span>
                        <span>-{(order?.discountAmount ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between px-3 py-2 border-b border-gray-200 text-green-700">
                        <span>Tax</span>
                        <span>+{(order?.totalTaxAmount ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between px-3 py-2 font-bold">
                        <span>Total Amount</span>
                        <span>{(order?.totalAmount ?? 0).toLocaleString()}</span>
                    </div>
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
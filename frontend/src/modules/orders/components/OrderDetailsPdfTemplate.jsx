import React from "react";

export default function OrderDetailsPdfTemplate({ order = {}, payments = [], labels = {}, showCustomerKPI = false, qarzaSummary = null }) {
    const totalPaid = order?.paid ?? 0;
    const remainingAmount = order?.remainingAmount ?? 0;
    const date = order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—";

    const totalQty = (order?.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0);
    const totalItemDiscount = (order?.items || []).reduce((sum, it) => sum + (it.discountAmount || 0), 0);
    const totalItemTax = (order?.items || []).reduce((sum, it) => sum + ((it.taxAmount || 0) * (it.quantity || 0)), 0);

    const formatPercent = (value) => `${value || 0}%`;

    return (
        <div className="p-10 bg-white min-h-screen text-gray-800" style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#ffffff", color: "#1f2937" }}>
            {/* Company Header */}
            <div className="text-center mb-6">
                <div className="inline-flex flex-col items-center leading-none mb-2">
                    <span className="text-3xl font-extrabold tracking-wide" style={{ letterSpacing: "2px", color: "#111827" }}>LOGIN</span>
                    <span className="text-xs font-semibold tracking-[0.3em] text-gray-500 mt-1" style={{ color: "#6b7280" }}>LARAIB</span>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-center mb-6" style={{ color: "#111827" }}>
                Afrasiab Mobile Accesories
            </h2>

            {/* Customer / Order Meta Row */}
            <div className="flex justify-between items-start mb-6 gap-6">
                <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: "#6b7280" }}>Customer:</p>
                    <p className="text-sm font-bold uppercase" style={{ color: "#111827" }}>{order?.customerName || "Walk-in Customer"}</p>
                    {order?.customerType && <p className="text-xs capitalize" style={{ color: "#4b5563" }}>Type: {order.customerType}</p>}
                    {order?.customerId && <p className="text-xs" style={{ color: "#4b5563" }}>Customer ID: {order.customerId}</p>}
                    {order?.customerData?.phoneNo && <p className="text-xs" style={{ color: "#4b5563" }}>Phone: {order.customerData.phoneNo}</p>}
                    {order?.customerData?.address && <p className="text-xs" style={{ color: "#4b5563" }}>Address: {order.customerData.address}</p>}
                    {order?.staffData && <p className="text-xs" style={{ color: "#4b5563" }}>Staff: {order.staffData.fullName}</p>}
                </div>
                <div className="flex flex-col gap-2 min-w-[240px]">
                    <div className="border px-3 py-2 flex justify-between text-sm" style={{ borderColor: "#d1d5db" }}>
                        <span className="font-semibold">Order #: {order?.orderNumber || "—"}</span>
                        <span className="font-semibold">Date: {date}</span>
                    </div>
                    <div className="border px-3 py-2 flex justify-between text-sm" style={{ borderColor: "#d1d5db" }}>
                        <span className="font-semibold">Status:</span>
                        <span className="font-semibold capitalize">{order?.status || "—"}</span>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full border-collapse mb-4 text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: "#111827", color: "#ffffff" }}>
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
                            <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                                <td className="px-3 py-2">{index + 1}</td>
                                <td className="px-3 py-2">
                                    {item.name || "—"}
                                    {item.portionType && <span className="text-xs capitalize" style={{ color: "#6b7280" }}> ({item.portionType})</span>}
                                </td>
                                <td className="px-3 py-2 text-right">{item.quantity || 0}</td>
                                <td className="px-3 py-2 text-right">{(item.unitPrice || 0).toLocaleString()}</td>
                                <td className="px-3 py-2 text-right" style={{ color: "#dc2626" }}>
                                    {formatPercent(item.discountPercent)}
                                    <span className="block text-[10px]" style={{ color: "#9ca3af" }}>-{itemDiscount.toLocaleString()}</span>
                                </td>
                                <td className="px-3 py-2 text-right" style={{ color: "#15803d" }}>
                                    {formatPercent(item.taxPercent)}
                                    <span className="block text-[10px]" style={{ color: "#9ca3af" }}>+{itemTax.toLocaleString()}</span>
                                </td>
                                <td className="px-3 py-2 text-right font-semibold">{finalTotal.toLocaleString()}</td>
                            </tr>
                        );
                    })}
                    <tr className="font-bold" style={{ backgroundColor: "#f3f4f6" }}>
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
                <div className="border p-3 text-sm min-w-[260px]" style={{ borderColor: "#d1d5db" }}>
                    <p className="font-semibold mb-2">Payment Summary:</p>
                    <div className="flex justify-between py-1">
                        <span>Total Amount</span>
                        <span>{(order?.totalAmount ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span>Total Paid</span>
                        <span>{totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 font-bold border-t mt-1 pt-1" style={{ borderColor: "#d1d5db" }}>
                        <span>Remaining Balance</span>
                        <span>{remainingAmount.toLocaleString()}</span>
                    </div>
                </div>

                <div className="border min-w-[280px] text-sm" style={{ borderColor: "#d1d5db" }}>
                    <div className="flex justify-between px-3 py-2 border-b" style={{ borderColor: "#e5e7eb" }}>
                        <span>Subtotal</span>
                        <span>{(order?.subtotal ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between px-3 py-2 border-b" style={{ borderColor: "#e5e7eb", color: "#dc2626" }}>
                        <span>Discount</span>
                        <span>-{(order?.discountAmount ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between px-3 py-2 border-b" style={{ borderColor: "#e5e7eb", color: "#15803d" }}>
                        <span>Tax</span>
                        <span>+{(order?.totalTaxAmount ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between px-3 py-2 font-bold">
                        <span>Total Amount</span>
                        <span>{(order?.totalAmount ?? 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Payment Transactions Section */}
            {payments && payments.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3" style={{ color: "#111827" }}>Payment Transactions</h3>
                    <table className="w-full border-collapse text-sm" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: "#f3f4f6" }}>
                                <th className="px-3 py-2 text-left font-semibold border-b" style={{ borderColor: "#d1d5db" }}>Date</th>
                                <th className="px-3 py-2 text-left font-semibold border-b" style={{ borderColor: "#d1d5db" }}>Method</th>
                                <th className="px-3 py-2 text-right font-semibold border-b" style={{ borderColor: "#d1d5db" }}>Amount</th>
                                <th className="px-3 py-2 text-right font-semibold border-b" style={{ borderColor: "#d1d5db" }}>Cash</th>
                                <th className="px-3 py-2 text-right font-semibold border-b" style={{ borderColor: "#d1d5db" }}>Credit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment, index) => (
                                <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                                    <td className="px-3 py-2">{new Date(payment.transactionDate || payment.paymentDate || payment.date).toLocaleDateString()}</td>
                                    <td className="px-3 py-2 capitalize">
                                        {payment.method === "credit" ? `Credit (${payment.creditAccount?.name || "Account"})` : payment.method || "—"}
                                    </td>
                                    <td className="px-3 py-2 text-right font-semibold">{(payment.amount || 0).toLocaleString()}</td>
                                    <td className="px-3 py-2 text-right">{(payment.cashAmount || 0).toLocaleString()}</td>
                                    <td className="px-3 py-2 text-right">{(payment.creditAmount || 0).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Qarza Summary */}
            {showCustomerKPI && qarzaSummary && (
                <div className="border p-4 mb-6" style={{ borderColor: "#d1d5db", backgroundColor: "#f9fafb" }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: "#111827" }}>Customer Account Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs uppercase font-bold mb-1" style={{ color: "#6b7280" }}>Total To Pay</p>
                            <p className="text-lg font-bold" style={{ color: "#dc2626" }}>Rs {(qarzaSummary.totalToPay || 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase font-bold mb-1" style={{ color: "#6b7280" }}>Total Paid</p>
                            <p className="text-lg font-bold" style={{ color: "#16a34a" }}>Rs {(qarzaSummary.totalPaid || 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase font-bold mb-1" style={{ color: "#6b7280" }}>Remaining Balance</p>
                            <p className="text-lg font-bold" style={{ color: "#0f766e" }}>Rs {(qarzaSummary.remainingBalance || 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase font-bold mb-1" style={{ color: "#6b7280" }}>Account Status</p>
                            <p className="text-lg font-bold capitalize" style={{ color: "#111827" }}>{qarzaSummary.accountStatus || "—"}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Sign-off Bar */}
            <div className="border mb-4" style={{ borderColor: "#d1d5db" }}>
                <div className="flex text-sm">
                    <div className="w-1/2 text-center py-3 border-r" style={{ borderColor: "#d1d5db" }}>
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
            <div className="flex justify-between items-start text-xs" style={{ color: "#6b7280" }}>
                <p className="italic max-w-[70%]">{labels.footerNote || "This is a computer generated document, does not required any signature"}</p>
                <p>Print Time: {new Date().toLocaleString()}</p>
            </div>
        </div>
    );
}
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
        <div className="p-10 bg-white min-h-screen text-gray-800" style={{ fontFamily: "Arial, sans-serif" }}>
            {/* Company Header */}
            <div className="text-center mb-6">
                <div className="inline-flex flex-col items-center leading-none mb-2">
                    <span className="text-3xl font-extrabold tracking-wide text-gray-900" style={{ letterSpacing: "2px" }}>LOGIN</span>
                    <span className="text-xs font-semibold tracking-[0.3em] text-gray-500 mt-1">LARAIB</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{company?.address || "—"}</p>
                {company?.registrationNo && <p className="text-xs text-gray-500">{company.registrationNo}</p>}
            </div>

            <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
                Afrasiab Mobile Accesories
            </h2>

            {/* Bill To / Invoice Meta Row */}
            <div className="flex justify-between items-start mb-6 gap-6">
                <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Purchased From:</p>
                    <p className="text-sm font-bold text-gray-900 uppercase">{purchase?.supplier?.name || "—"}</p>
                    {purchase?.supplier?.code && <p className="text-xs text-gray-600">Supplier Code: {purchase.supplier.code}</p>}
                    {purchase?.supplier?.phone && <p className="text-xs text-gray-600">{purchase.supplier.phone}</p>}
                </div>
                <div className="flex flex-col gap-2 min-w-[240px]">
                    <div className="border border-gray-300 px-3 py-2 flex justify-between text-sm">
                        <span className="font-semibold">Invoice #: {purchase?.invoiceNumber || purchase?.purchaseNumber || "—"}</span>
                        <span className="font-semibold">Date: {date}</span>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full border-collapse mb-4 text-sm">
                <thead>
                    <tr className="bg-gray-900 text-white">
                        <th className="px-3 py-2 text-left font-semibold">#</th>
                        <th className="px-3 py-2 text-left font-semibold">Item &amp; Description</th>
                        <th className="px-3 py-2 text-left font-semibold">Category</th>
                        <th className="px-3 py-2 text-right font-semibold">Qty</th>
                        <th className="px-3 py-2 text-right font-semibold">Price</th>
                        <th className="px-3 py-2 text-right font-semibold">Disc</th>
                        <th className="px-3 py-2 text-right font-semibold">Tax</th>
                        <th className="px-3 py-2 text-right font-semibold">Net Amount</th>
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
                            <tr key={index} className="border-b border-gray-200">
                                <td className="px-3 py-2">{index + 1}</td>
                                <td className="px-3 py-2">{item.name || item.product?.name || item.productName || "—"}</td>
                                <td className="px-3 py-2">{item.category || item.product?.category || "—"}</td>
                                <td className="px-3 py-2 text-right">{quantity}</td>
                                <td className="px-3 py-2 text-right">{price.toLocaleString()}</td>
                                <td className="px-3 py-2 text-right text-red-600">
                                    {formatDiscount(item.discount, item.discountType)}
                                    <span className="block text-[10px] text-gray-400">-{discountAmount.toLocaleString()}</span>
                                </td>
                                <td className="px-3 py-2 text-right text-green-700">
                                    {formatTax(item.tax, item.taxType)}
                                    <span className="block text-[10px] text-gray-400">+{taxAmount.toLocaleString()}</span>
                                </td>
                                <td className="px-3 py-2 text-right font-semibold">{netAmount.toLocaleString()}</td>
                            </tr>
                        );
                    })}
                    <tr className="bg-gray-100 font-bold">
                        <td className="px-3 py-2" colSpan={3}>Sub Total</td>
                        <td className="px-3 py-2 text-right">{totalQty}</td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2 text-right">{totalDiscount.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right">{totalItemTax.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right">{subtotalAfterItems.toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>

            {/* Payment Summary / Totals Row */}
            <div className="flex justify-between gap-6 mb-6">
                <div className="border border-gray-300 p-3 text-sm min-w-[260px]">
                    <p className="font-semibold mb-2">Payment Summary:</p>
                    <div className="flex justify-between py-1">
                        <span>Total Amount</span>
                        <span>{(purchase?.totalAmount ?? 0).toLocaleString()}</span>
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
                        <span>Items Gross Amount</span>
                        <span>{subtotalAfterItems.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between px-3 py-2 border-b border-gray-200 text-red-600">
                        <span>Item-level Discount (incl. above)</span>
                        <span>-{totalDiscount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between px-3 py-2 border-b border-gray-200 text-green-700">
                        <span>Item-level Tax (incl. above)</span>
                        <span>+{totalItemTax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between px-3 py-2 border-b border-gray-200 text-red-600">
                        <span>Bill Discount ({purchase?.discountType === "fixed" ? "fixed" : `${purchase?.discount || 0}%`})</span>
                        <span>-{billDiscount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between px-3 py-2 border-b border-gray-200 text-green-700">
                        <span>Bill Tax / GST ({purchase?.gstType === "fixed" ? "fixed" : `${purchase?.gst || 0}%`})</span>
                        <span>+{billTax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between px-3 py-2 border-b border-gray-200">
                        <span>Shipping</span>
                        <span>+{shippingCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between px-3 py-2 font-bold">
                        <span>Net Amount</span>
                        <span>{(purchase?.totalAmount ?? 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Sign-off Bar */}
            <div className="border border-gray-300 mb-4">
                <div className="bg-gray-100 text-center font-semibold py-2 text-sm">{company?.department || labels.signOffLabel || "—"}</div>
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
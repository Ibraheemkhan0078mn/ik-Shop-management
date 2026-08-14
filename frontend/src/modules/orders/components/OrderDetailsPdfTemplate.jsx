import React from "react";
import { Package, DollarSign, FileText, CreditCard } from "lucide-react";

export default function OrderDetailsPdfTemplate({ order = {}, payments = [], labels = {} }) {
    const PAYMENT_METHODS = {
        cash: { label: "Cash" },
        online: { label: "Online" },
        credit: { label: "Credit Card" },
        hybrid: { label: "Multiple" },
        free: { label: "Free" },
    };

    return (
        <div className="p-6 bg-white min-h-screen">
            {/* Header */}
            <div className="mb-6 pb-4 border-b-2 border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">{labels.orderDetails || "Order Details"}</h1>
                <p className="text-sm text-gray-500">{order?.orderNumber || "—"}</p>
            </div>

            {/* Financial Summary */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <DollarSign size={18} />
                    Financial Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-2">
                        <p className="text-xs text-gray-500 uppercase font-bold">Subtotal</p>
                        <p className="font-semibold text-gray-900 mt-1">Rs {(order?.subtotal ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center p-2">
                        <p className="text-xs text-gray-500 uppercase font-bold">Tax</p>
                        <p className="font-semibold text-gray-900 mt-1">Rs {(order?.totalTaxAmount ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center p-2">
                        <p className="text-xs text-gray-500 uppercase font-bold">Discount</p>
                        <p className="font-semibold text-red-600 mt-1">Rs {(order?.discountAmount ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center p-2">
                        <p className="text-xs text-gray-500 uppercase font-bold">Cash Received</p>
                        <p className="font-semibold text-gray-900 mt-1">Rs {(order?.cashReceived ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                        <p className="text-xs text-gray-500 uppercase font-bold">Total Amount</p>
                        <p className="font-bold text-green-600 text-lg mt-1">Rs {(order?.totalAmount ?? 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Order Information */}
            <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText size={18} />
                    Order Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">Order Number</label>
                        <p className="font-semibold text-gray-900 mt-1">{order?.orderNumber || "—"}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">Customer Name</label>
                        <p className="font-semibold text-gray-900 mt-1">{order?.customerName || "Walk-in Customer"}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">Customer Type</label>
                        <p className="font-semibold text-gray-900 mt-1 capitalize">{order?.customerType || "—"}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">Order Date & Time</label>
                        <p className="font-semibold text-gray-900 mt-1">
                            {new Date(order?.createdAt).toLocaleString('en-US', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                            })}
                        </p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">Served By</label>
                        <p className="font-semibold text-gray-900 mt-1">{order?.waiter || "Not specified"}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">Order Type</label>
                        <p className="font-semibold text-gray-900 mt-1 capitalize">{order?.orderType || "Retail"}</p>
                    </div>
                    {order?.note && (
                        <div className="md:col-span-3">
                            <label className="text-xs text-gray-500 uppercase font-bold">Notes</label>
                            <p className="text-gray-900 mt-1">{order.note}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Package size={18} />
                    Items in Order
                </h3>
                <table className="w-full border border-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600 border-b">Product</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold uppercase text-gray-600 border-b">Portion</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold uppercase text-gray-600 border-b">Quantity</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">Unit Price</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">Tax</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">Discount</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">Item Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order?.items?.map((item, index) => (
                            <tr key={index} className="border-b">
                                <td className="px-4 py-2">
                                    <p className="font-medium text-gray-900">{item.name || "—"}</p>
                                    {item.batchNumber && <p className="text-xs text-gray-500">Batch: {item.batchNumber}</p>}
                                </td>
                                <td className="px-4 py-2 text-center capitalize text-gray-900">{item.portionType || "full"}</td>
                                <td className="px-4 py-2 text-center font-medium text-gray-900">{item.quantity || 0}</td>
                                <td className="px-4 py-2 text-right font-medium text-gray-900">Rs {(item.unitPrice || 0).toLocaleString()}</td>
                                <td className="px-4 py-2 text-right font-medium text-gray-900">
                                    <div className="text-xs">
                                        <span className="text-gray-500">{item.taxPercent || 0}%</span>
                                        {item.taxAmount > 0 && (
                                            <span className="ml-1">({(item.taxAmount * item.quantity).toFixed(2)})</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-2 text-right font-medium text-red-600">
                                    <div className="text-xs">
                                        <span>{item.discountPercent || 0}%</span>
                                        {item.discountAmount > 0 && (
                                            <span className="ml-1">({item.discountAmount.toFixed(2)})</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-2 text-right font-semibold text-green-600">Rs {((item.unitPrice || 0) * (item.quantity || 0) - (item.discountAmount || 0) + (item.taxAmount || 0) * (item.quantity || 0)).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Payment Details */}
            {payments && payments.length > 0 ? (
                <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <CreditCard size={18} />
                        Payment Details
                    </h3>
                    {payments.map((payment, index) => (
                        <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg last:mb-0">
                            <div className="grid grid-cols-4 gap-4 mb-3 pb-3 border-b border-gray-200">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Date</label>
                                    <p className="text-sm text-gray-900 mt-1">{new Date(payment.transactionDate || payment.paymentDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Method</label>
                                    <p className="text-sm text-gray-900 mt-1 capitalize">{payment.method || "—"}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Amount</label>
                                    <p className="text-sm font-bold text-gray-900 mt-1">Rs {(payment.amount || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Payment Method</label>
                                    <p className="text-sm text-gray-900 mt-1">{payment.paymentMethodName || "—"}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Payment Items</p>
                                <table className="w-full border border-gray-200 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-1 text-left text-xs font-semibold uppercase text-gray-600 border-b">Product</th>
                                            <th className="px-3 py-1 text-center text-xs font-semibold uppercase text-gray-600 border-b">Portion</th>
                                            <th className="px-3 py-1 text-center text-xs font-semibold uppercase text-gray-600 border-b">Qty</th>
                                            <th className="px-3 py-1 text-right text-xs font-semibold uppercase text-gray-600 border-b">Unit Price</th>
                                            <th className="px-3 py-1 text-right text-xs font-semibold uppercase text-gray-600 border-b">Tax</th>
                                            <th className="px-3 py-1 text-right text-xs font-semibold uppercase text-gray-600 border-b">Discount</th>
                                            <th className="px-3 py-1 text-right text-xs font-semibold uppercase text-gray-600 border-b">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order?.items?.map((item, itemIndex) => {
                                            const lineTotal = (item.unitPrice || 0) * (item.quantity || 0);
                                            const totalTax = (item.taxAmount || 0) * (item.quantity || 0);
                                            const totalDiscount = item.discountAmount || 0;
                                            const finalTotal = lineTotal - totalDiscount + totalTax;
                                            return (
                                                <tr key={itemIndex} className="border-b">
                                                    <td className="px-3 py-1 text-gray-900">{item.name || "—"}</td>
                                                    <td className="px-3 py-1 text-center capitalize text-gray-900">{item.portionType || "full"}</td>
                                                    <td className="px-3 py-1 text-center text-gray-900">{item.quantity || 0}</td>
                                                    <td className="px-3 py-1 text-right text-gray-900">Rs {(item.unitPrice || 0).toLocaleString()}</td>
                                                    <td className="px-3 py-1 text-right text-gray-900">
                                                        <div className="text-xs">
                                                            <span className="text-gray-500">{item.taxPercent || 0}%</span>
                                                            {item.taxAmount > 0 && <span className="ml-1">({totalTax.toFixed(2)})</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-1 text-right text-red-600">
                                                        <div className="text-xs">
                                                            <span>{item.discountPercent || 0}%</span>
                                                            {item.discountAmount > 0 && <span className="ml-1">({totalDiscount.toFixed(2)})</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-1 text-right font-semibold text-green-600">Rs {finalTotal.toLocaleString()}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <CreditCard size={18} />
                        Payment Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Payment Method</label>
                            <p className="font-semibold text-gray-900 mt-1">{PAYMENT_METHODS[order?.paymentMethod]?.label || order?.paymentMethod || "—"}</p>
                        </div>
                        {order?.paymentMethodName && (
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Payment Method Name</label>
                                <p className="font-semibold text-gray-900 mt-1">{order.paymentMethodName}</p>
                            </div>
                        )}
                        {order?.paymentMethod === "cash" && (
                            <>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Cash Received</label>
                                    <p className="font-semibold text-gray-900 mt-1">Rs {(order?.cashReceived ?? 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Change Returned</label>
                                    <p className="font-semibold text-green-600 mt-1">Rs {(order?.change ?? 0).toLocaleString()}</p>
                                </div>
                            </>
                        )}
                        {order?.paymentMethod === "online" && (
                            <>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Platform</label>
                                    <p className="font-semibold text-gray-900 mt-1 capitalize">{order?.onlinePlatform || "—"}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Online Amount</label>
                                    <p className="font-semibold text-gray-900 mt-1">Rs {(order?.onlineAmount ?? 0).toLocaleString()}</p>
                                </div>
                            </>
                        )}
                        {order?.paymentMethod === "credit" && (
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Qarza Account</label>
                                <p className="font-semibold text-gray-900 mt-1">{order?.qarzaAccount?.name || "—"}</p>
                            </div>
                        )}
                        {order?.paymentMethod === "hybrid" && (
                            <>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Cash Portion</label>
                                    <p className="font-semibold text-gray-900 mt-1">Rs {(order?.hybridCash ?? 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Qarza Portion</label>
                                    <p className="font-semibold text-gray-900 mt-1">Rs {(order?.hybridQarza ?? 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Qarza Account</label>
                                    <p className="font-semibold text-gray-900 mt-1">{order?.hybridQarzaAccount?.name || "—"}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

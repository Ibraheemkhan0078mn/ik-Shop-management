import React from "react";
import { Package, DollarSign, FileText, Calendar } from "lucide-react";

export default function OrderReturnPdfTemplate({ orderReturn = {}, refunds = [], labels = {} }) {
    const date = new Date(orderReturn?.returnDate ?? orderReturn?.createdAt).toLocaleDateString();
    const totalRefundAmount = orderReturn?.items?.reduce((sum, item) => sum + (item.refundAmount || 0), 0) || 0;

    return (
        <div className="p-6 bg-white min-h-screen">
            {/* Header */}
            <div className="mb-6 pb-4 border-b-2 border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">{labels.orderReturnDetails || "Order Return Details"}</h1>
                <p className="text-sm text-gray-500">{orderReturn?.returnNumber || "—"}</p>
            </div>

            {/* Summary Cards */}
            <div className="mb-6 grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar size={18} className="text-blue-600" />
                        <p className="text-xs text-gray-500 uppercase font-bold">{labels.date || "Date"}</p>
                    </div>
                    <p className="font-semibold text-gray-900">{date}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Package size={18} className="text-orange-600" />
                        <p className="text-xs text-gray-500 uppercase font-bold">{labels.totalItems || "Total Items"}</p>
                    </div>
                    <p className="font-semibold text-gray-900">{orderReturn?.items?.length || 0} items</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={18} className="text-red-600" />
                        <p className="text-xs text-gray-500 uppercase font-bold">{labels.totalRefund || "Total Refund"}</p>
                    </div>
                    <p className="font-semibold text-red-600">Rs {totalRefundAmount.toLocaleString()}</p>
                </div>
            </div>

            {/* Return Information */}
            <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText size={18} />
                    {labels.returnInformation || "Return Information"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">{labels.returnNumber || "Return #"}</label>
                        <p className="font-semibold text-gray-900 mt-1">{orderReturn?.returnNumber || "—"}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">{labels.orderNumber || "Order #"}</label>
                        <p className="font-semibold text-gray-900 mt-1">{orderReturn?.referenceOrderNumber || "—"}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">{labels.customerName || "Customer"}</label>
                        <p className="font-semibold text-gray-900 mt-1">{orderReturn?.customerName || "—"}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">{labels.status || "Status"}</label>
                        <p className="font-semibold text-gray-900 mt-1 capitalize">{orderReturn?.returnStatus || "—"}</p>
                    </div>
                    {orderReturn?.notes && (
                        <div className="md:col-span-2">
                            <label className="text-xs text-gray-500 uppercase font-bold">{labels.notes || "Notes"}</label>
                            <p className="text-gray-900 mt-1">{orderReturn.notes}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Package size={18} />
                    {labels.returnedItems || "Returned Items"}
                </h3>
                <table className="w-full border border-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600 border-b">{labels.productName || "Product"}</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold uppercase text-gray-600 border-b">{labels.quantity || "Quantity"}</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">{labels.originalPrice || "Original Price"}</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600 border-b">{labels.reason || "Reason"}</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">{labels.refundAmount || "Refund Amount"}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orderReturn?.items?.map((item, index) => (
                            <tr key={index} className="border-b">
                                <td className="px-4 py-2">
                                    <p className="font-medium text-gray-900">{item.productName || "—"}</p>
                                </td>
                                <td className="px-4 py-2 text-center font-medium text-gray-900">{item.quantity || 0}</td>
                                <td className="px-4 py-2 text-right font-medium text-gray-900">Rs {(item.originalPrice || 0).toLocaleString()}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 capitalize">{item.returnReason || "—"}</td>
                                <td className="px-4 py-2 text-right font-semibold text-red-600">Rs {(item.refundAmount || 0).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                        <tr>
                            <td colSpan="4" className="px-4 py-2 text-right font-bold text-gray-900">{labels.totalRefund || "Total Refund"}:</td>
                            <td className="px-4 py-2 text-right font-bold text-red-600 text-lg">Rs {totalRefundAmount.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Refund Details */}
            {refunds.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <DollarSign size={18} />
                        {labels.refundDetails || "Refund Details"}
                    </h3>
                    {refunds.map((refund, index) => (
                        <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
                            <div className="grid grid-cols-4 gap-4 mb-3 pb-3 border-b border-gray-200">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">{labels.date || "Date"}</label>
                                    <p className="text-sm text-gray-900 mt-1">{new Date(refund.refundDate || refund.transactionDate || refund.date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">{labels.method || "Method"}</label>
                                    <p className="text-sm text-gray-900 mt-1 capitalize">{refund.refundMethod || refund.method || "—"}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">{labels.amount || "Amount"}</label>
                                    <p className="text-sm font-bold text-gray-900 mt-1">Rs {(refund.amount || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">{labels.creditAccount || "Credit Account"}</label>
                                    <p className="text-sm text-gray-900 mt-1">{refund.creditAccount?.name || "—"}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Refunded Items</p>
                                <table className="w-full border border-gray-200 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-1 text-left text-xs font-semibold uppercase text-gray-600 border-b">{labels.productName || "Product"}</th>
                                            <th className="px-3 py-1 text-center text-xs font-semibold uppercase text-gray-600 border-b">{labels.quantity || "Qty"}</th>
                                            <th className="px-3 py-1 text-right text-xs font-semibold uppercase text-gray-600 border-b">{labels.originalPrice || "Original Price"}</th>
                                            <th className="px-3 py-1 text-right text-xs font-semibold uppercase text-gray-600 border-b">{labels.cut || "Cut"}</th>
                                            <th className="px-3 py-1 text-right text-xs font-semibold uppercase text-gray-600 border-b">{labels.refundAmount || "Refund Amount"}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orderReturn?.items?.map((item, itemIndex) => (
                                            <tr key={itemIndex} className="border-b">
                                                <td className="px-3 py-1 text-gray-900">{item.productName}</td>
                                                <td className="px-3 py-1 text-center text-gray-900">{item.quantity}</td>
                                                <td className="px-3 py-1 text-right text-gray-900">Rs {(item.originalPrice || 0).toLocaleString()}</td>
                                                <td className="px-3 py-1 text-right text-gray-900">Rs {(item.cut || 0).toLocaleString()}</td>
                                                <td className="px-3 py-1 text-right font-semibold text-red-600">Rs {(item.refundAmount || 0).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

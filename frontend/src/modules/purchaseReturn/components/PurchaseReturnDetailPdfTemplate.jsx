import React from "react";
import { Package, DollarSign, FileText, Calendar } from "lucide-react";

export default function PurchaseReturnDetailPdfTemplate({ purchaseReturn = {}, payments = [], labels = {} }) {
    const date = new Date(purchaseReturn?.returnDate ?? purchaseReturn?.createdAt).toLocaleDateString();

    return (
        <div className="p-6 bg-white min-h-screen">
            {/* Header */}
            <div className="mb-6 pb-4 border-b-2 border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">{labels.purchaseReturnDetails || "Purchase Return Details"}</h1>
                <p className="text-sm text-gray-500">{purchaseReturn?.returnNumber || "—"}</p>
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
                    <p className="font-semibold text-gray-900">{purchaseReturn?.items?.length || 0} items</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={18} className="text-red-600" />
                        <p className="text-xs text-gray-500 uppercase font-bold">{labels.totalAmount || "Total Amount"}</p>
                    </div>
                    <p className="font-semibold text-red-600">Rs {(purchaseReturn?.totalAmount ?? 0).toLocaleString()}</p>
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
                        <p className="font-semibold text-gray-900 mt-1">{purchaseReturn?.returnNumber || "—"}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">{labels.supplier || "Supplier"}</label>
                        <p className="font-semibold text-gray-900 mt-1">{purchaseReturn?.supplierName || purchaseReturn?.supplier?.name || "—"}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">{labels.returnDate || "Return Date"}</label>
                        <p className="font-semibold text-gray-900 mt-1">{date}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">{labels.reason || "Reason"}</label>
                        <p className="font-semibold text-gray-900 mt-1 capitalize">{purchaseReturn?.reason?.replace(/_/g, " ") || "—"}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">{labels.status || "Status"}</label>
                        <p className="font-semibold text-gray-900 mt-1 capitalize">{purchaseReturn?.status || "—"}</p>
                    </div>
                    {purchaseReturn?.notes && (
                        <div className="md:col-span-2">
                            <label className="text-xs text-gray-500 uppercase font-bold">{labels.notes || "Notes"}</label>
                            <p className="text-gray-900 mt-1">{purchaseReturn.notes}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Package size={18} />
                    {labels.items || "Items"}
                </h3>
                <table className="w-full border border-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600 border-b">{labels.productName || "Product"}</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold uppercase text-gray-600 border-b">{labels.quantity || "Quantity"}</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">{labels.costPrice || "Cost Price"}</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">{labels.subtotal || "Subtotal"}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchaseReturn?.items?.map((item, index) => (
                            <tr key={index} className="border-b">
                                <td className="px-4 py-2">
                                    <p className="font-medium text-gray-900">{item.productName || item.product?.name || "—"}</p>
                                    {item.variant && <p className="text-xs text-gray-500">{item.variant}</p>}
                                </td>
                                <td className="px-4 py-2 text-center font-medium text-gray-900">{item.quantity || 0}</td>
                                <td className="px-4 py-2 text-right font-medium text-gray-900">Rs {(item.costPrice || 0).toLocaleString()}</td>
                                <td className="px-4 py-2 text-right font-semibold text-red-600">Rs {((item.quantity || 0) * (item.costPrice || 0)).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                        <tr>
                            <td colSpan="3" className="px-4 py-2 text-right font-bold text-gray-900">{labels.totalAmount || "Total Amount"}:</td>
                            <td className="px-4 py-2 text-right font-bold text-red-600 text-lg">Rs {(purchaseReturn?.totalAmount ?? 0).toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Refund Details */}
            {payments.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <DollarSign size={18} />
                        {labels.refundDetails || "Refund Details"}
                    </h3>
                    <table className="w-full border border-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600 border-b">{labels.date || "Date"}</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600 border-b">{labels.method || "Method"}</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">{labels.amount || "Amount"}</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600 border-b">{labels.creditAccount || "Credit Account"}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment, index) => (
                                <tr key={index} className="border-b">
                                    <td className="px-4 py-2 text-sm text-gray-900">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900 capitalize">{payment.paymentMethod}</td>
                                    <td className="px-4 py-2 text-right font-bold text-gray-900">Rs {(payment.amount || 0).toLocaleString()}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900">{payment.creditAccount?.name || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

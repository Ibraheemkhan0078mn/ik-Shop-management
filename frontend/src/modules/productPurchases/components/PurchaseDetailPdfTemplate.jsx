import React from "react";
import { Package, DollarSign, FileText } from "lucide-react";

export default function PurchaseDetailPdfTemplate({ purchase = {}, payments = [], labels = {} }) {
    const date = new Date(purchase?.purchaseDate ?? purchase?.date ?? purchase?.createdAt).toLocaleDateString();
    
    const totalPaid = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    const remainingAmount = (purchase?.totalAmount ?? 0) - totalPaid;

    return (
        <div className="p-6 bg-white min-h-screen">
            {/* Header */}
            <div className="mb-6 pb-4 border-b-2 border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">{labels.purchaseDetails || "Purchase Details"}</h1>
                <p className="text-sm text-gray-500">{purchase?.purchaseNumber || purchase?.invoiceNumber || "—"}</p>
            </div>

            {/* Summary Section */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <DollarSign size={18} />
                    {labels.summary || "Summary"}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center p-2">
                        <p className="text-xs text-gray-500 uppercase font-bold">{labels.subtotal || "Subtotal"}</p>
                        <p className="font-semibold text-gray-900 mt-1">Rs {(purchase?.subtotal ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center p-2">
                        <p className="text-xs text-gray-500 uppercase font-bold">{labels.totalDiscount || "Discount"}</p>
                        <p className="font-semibold text-red-600 mt-1">Rs {(purchase?.discount ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center p-2">
                        <p className="text-xs text-gray-500 uppercase font-bold">{labels.totalTax || "Tax"}</p>
                        <p className="font-semibold text-green-600 mt-1">Rs {(purchase?.gst ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center p-2">
                        <p className="text-xs text-gray-500 uppercase font-bold">{labels.totalAmount || "Total"}</p>
                        <p className="font-bold text-green-600 text-lg mt-1">Rs {(purchase?.totalAmount ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center p-2">
                        <p className="text-xs text-gray-500 uppercase font-bold">{labels.amountPaid || "Paid"}</p>
                        <p className="font-semibold text-gray-900 mt-1">Rs {totalPaid.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-2">
                        <p className="text-xs text-gray-500 uppercase font-bold">{labels.remainingAmount || "Remaining"}</p>
                        <p className="font-bold text-red-600 text-lg mt-1">Rs {remainingAmount.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Purchase Information */}
            <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText size={18} />
                    {labels.purchaseInformation || "Purchase Information"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">{labels.purchaseNumber || "Purchase #"}</label>
                        <p className="font-semibold text-gray-900 mt-1">{purchase?.purchaseNumber || purchase?.invoiceNumber || "—"}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">{labels.supplier || "Supplier"}</label>
                        <p className="font-semibold text-gray-900 mt-1">{purchase?.supplier?.name || purchase?.supplierName || "—"}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">{labels.purchaseDate || "Purchase Date"}</label>
                        <p className="font-semibold text-gray-900 mt-1">{date}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">{labels.status || "Status"}</label>
                        <p className="font-semibold text-gray-900 mt-1 capitalize">{purchase?.status || "—"}</p>
                    </div>
                    {purchase?.notes && (
                        <div className="md:col-span-2">
                            <label className="text-xs text-gray-500 uppercase font-bold">{labels.notes || "Notes"}</label>
                            <p className="text-gray-900 mt-1">{purchase.notes}</p>
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
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">{labels.discount || "Discount"}</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">{labels.tax || "Tax"}</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">{labels.subtotal || "Subtotal"}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchase?.items?.map((item, index) => {
                            const price = item.price || item.costPrice || item.perItemPrice || 0;
                            const quantity = item.quantity || 0;
                            const baseTotal = quantity * price;
                            const discountAmount = item.discountType === 'percentage' 
                                ? baseTotal * (item.discount || 0) / 100 
                                : (item.discount || 0);
                            const taxAmount = item.taxType === 'percentage'
                                ? (baseTotal - discountAmount) * (item.tax || 0) / 100
                                : (item.tax || 0);
                            const subtotal = baseTotal - discountAmount + taxAmount;
                            
                            return (
                                <tr key={index} className="border-b">
                                    <td className="px-4 py-2">
                                        <p className="font-medium text-gray-900">{item.name || item.product?.name || item.productName || "—"}</p>
                                        {item.variant && <p className="text-xs text-gray-500">{item.variant}</p>}
                                    </td>
                                    <td className="px-4 py-2 text-center font-medium text-gray-900">{quantity}</td>
                                    <td className="px-4 py-2 text-right font-medium text-gray-900">Rs {price.toLocaleString()}</td>
                                    <td className="px-4 py-2 text-right font-medium text-red-600">
                                        {item.discountType === 'percentage' ? `${item.discount || 0}%` : `Rs ${(item.discount || 0).toLocaleString()}`}
                                    </td>
                                    <td className="px-4 py-2 text-right font-medium text-green-600">
                                        {item.taxType === 'percentage' ? `${item.tax || 0}%` : `Rs ${(item.tax || 0).toLocaleString()}`}
                                    </td>
                                    <td className="px-4 py-2 text-right font-semibold text-gray-900">Rs {subtotal.toLocaleString()}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Payments Table */}
            {payments.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <DollarSign size={18} />
                        {labels.payments || "Payments"}
                    </h3>
                    <table className="w-full border border-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600 border-b">{labels.date || "Date"}</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600 border-b">{labels.method || "Method"}</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">{labels.amount || "Amount"}</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600 border-b">{labels.notes || "Notes"}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment, index) => (
                                <tr key={index} className="border-b">
                                    <td className="px-4 py-2 text-sm text-gray-900">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900 capitalize">{payment.paymentMethodName || payment.paymentMethod || "—"}</td>
                                    <td className="px-4 py-2 text-right font-semibold text-green-600">Rs {(payment.amount || 0).toLocaleString()}</td>
                                    <td className="px-4 py-2 text-sm text-gray-500">{payment.notes || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

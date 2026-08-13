import React from "react";

export default function PaymentPdfTemplate({ payment = {}, purchase = {}, labels = {} }) {
    const transactionDate = new Date(payment.transactionDate || payment.paymentDate).toLocaleString();
    const purchaseDate = new Date(purchase?.purchaseDate ?? purchase?.date ?? purchase?.createdAt).toLocaleDateString();
    
    return (
        <div className="p-6 bg-white min-h-screen">
            {/* Header */}
            <div className="mb-6 pb-4 border-b-2 border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">{labels.paymentReceipt || "Payment Receipt"}</h1>
                <p className="text-sm text-gray-500">Payment ID: {payment._id || "—"}</p>
            </div>

            {/* Invoice Info */}
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-3">
                    Payment For
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Invoice Number</p>
                        <p className="text-base font-semibold text-gray-900">{purchase?.invoiceNumber || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Supplier</p>
                        <p className="text-base font-semibold text-gray-900">{purchase?.supplier?.name || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Purchase Date</p>
                        <p className="text-base font-semibold text-gray-900">{purchaseDate}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Purchase Total</p>
                        <p className="text-base font-semibold text-gray-900">Rs {(purchase?.totalAmount ?? 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="border-b border-gray-200 my-6"></div>

            {/* Payment Details */}
            <div className="mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-3">
                    Payment Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Payment Information</p>
                        <div className="text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-700">Payment ID:</span>
                                <span className="font-mono text-gray-900">{payment._id || "—"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-700">Transaction Date:</span>
                                <span className="font-mono text-gray-900">{transactionDate}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-700">Payment Method:</span>
                                <span className="font-mono text-gray-900 capitalize">{payment.method || "—"}</span>
                            </div>
                            {payment.creditAccount && (
                                <div className="flex justify-between">
                                    <span className="text-gray-700">Credit Account:</span>
                                    <span className="font-mono text-gray-900">{payment.creditAccount.name || "—"}</span>
                                </div>
                            )}
                            {payment.paymentMethodName && (
                                <div className="flex justify-between">
                                    <span className="text-gray-700">Payment Method Name:</span>
                                    <span className="font-mono text-gray-900">{payment.paymentMethodName}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Amount</p>
                        <div className="text-sm space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-700">Payment Amount:</span>
                                <span className="font-mono font-bold text-2xl text-green-600">Rs {(payment.amount || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-700">Notes:</span>
                                <span className="font-mono text-gray-900">{payment.notes || "—"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
                <p>Generated on {new Date().toLocaleString()}</p>
                <p className="mt-1">Payment Receipt for Invoice {purchase?.invoiceNumber || purchase?.purchaseNumber || "—"}</p>
            </div>
        </div>
    );
}

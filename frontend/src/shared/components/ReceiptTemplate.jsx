import React, { useRef } from 'react';
import { generatePdfFromElement } from '../services/pdfEngine.service.js';

export default function ReceiptTemplate({ 
    invoiceNumber, 
    date, 
    customerName, 
    items, 
    summary,
    payments,
    type = 'purchase' // purchase, purchase-return, order, order-return
}) {
    const receiptRef = useRef(null);

    const handlePrint = async () => {
        if (receiptRef.current) {
            try {
                await generatePdfFromElement(receiptRef.current, {
                    fileName: `${type}-${invoiceNumber}.pdf`,
                    scale: 3,
                    backgroundColor: "#ffffff",
                    multiPage: true,
                    download: true
                });
            } catch (error) {
                console.error("PDF generation failed:", error);
            }
        }
    };

    const getTypeLabel = () => {
        switch(type) {
            case 'purchase': return 'PURCHASE INVOICE';
            case 'purchase-return': return 'PURCHASE RETURN';
            case 'order': return 'SALES INVOICE';
            case 'order-return': return 'SALES RETURN';
            default: return 'INVOICE';
        }
    };

    const getAmountLabel = () => {
        switch(type) {
            case 'purchase':
            case 'order':
                return 'Total';
            case 'purchase-return':
            case 'order-return':
                return 'Total Refund';
            default:
                return 'Total';
        }
    };

    return (
        <div className="space-y-4">
            <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                Print Receipt
            </button>
            
            <div ref={receiptRef} className="bg-white p-8 max-w-2xl mx-auto shadow-lg">
                {/* Header */}
                <div className="text-center mb-8 border-b-2 border-gray-300 pb-4">
                    <h1 className="text-2xl font-bold text-gray-800">{getTypeLabel()}</h1>
                    <p className="text-gray-600 mt-1">Invoice #: {invoiceNumber}</p>
                    <p className="text-gray-600">Date: {date}</p>
                </div>

                {/* Customer/Supplier Info */}
                {customerName && (
                    <div className="mb-6">
                        <p className="text-sm text-gray-500 uppercase font-semibold">
                            {type.includes('purchase') ? 'Supplier' : 'Customer'}
                        </p>
                        <p className="text-lg font-medium text-gray-800">{customerName}</p>
                    </div>
                )}

                {/* Items Table */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">Items</h2>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Item</th>
                                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">Qty</th>
                                <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-700">Price</th>
                                <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-700">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items?.map((item, index) => (
                                <tr key={index}>
                                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">
                                        {item.productName || item.name || item.product?.name}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-center text-sm text-gray-600">
                                        {item.quantity}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-right text-sm text-gray-600">
                                        Rs {(item.price || item.costPrice || item.unitPrice || item.originalPrice)?.toLocaleString()}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-800">
                                        Rs {((item.price || item.costPrice || item.unitPrice || item.originalPrice) * item.quantity)?.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary */}
                {summary && (
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-3">Summary</h2>
                        <div className="space-y-2">
                            {summary.subtotal !== undefined && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="text-gray-800">Rs {summary.subtotal?.toLocaleString()}</span>
                                </div>
                            )}
                            {summary.discount !== undefined && summary.discount > 0 && (
                                <div className="flex justify-between text-sm text-red-600">
                                    <span>Discount:</span>
                                    <span>- Rs {summary.discount?.toLocaleString()}</span>
                                </div>
                            )}
                            {summary.gst !== undefined && summary.gst > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">GST:</span>
                                    <span className="text-gray-800">+ Rs {summary.gst?.toLocaleString()}</span>
                                </div>
                            )}
                            {summary.shippingCost !== undefined && summary.shippingCost > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Shipping:</span>
                                    <span className="text-gray-800">+ Rs {summary.shippingCost?.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold border-t-2 border-gray-300 pt-2 mt-2">
                                <span className="text-gray-800">{getAmountLabel()}:</span>
                                <span className="text-gray-800">Rs {summary.totalAmount?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payments */}
                {payments && payments.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-3">
                            {type.includes('return') ? 'Refunds' : 'Payments'}
                        </h2>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Date</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Method</th>
                                    <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-700">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment, index) => (
                                    <tr key={index}>
                                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">
                                            {new Date(payment.paymentDate || payment.refundDate).toLocaleDateString()}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600 capitalize">
                                            {payment.paymentMethod || payment.refundMethod}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-800">
                                            Rs {payment.amount?.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-8 pt-4 border-t-2 border-gray-300 text-center text-sm text-gray-500">
                    <p>Thank you for your business!</p>
                    <p className="mt-1">Generated on {new Date().toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
}

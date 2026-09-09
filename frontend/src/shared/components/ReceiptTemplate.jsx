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
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
            >
                Print Receipt
            </button>
            
            <div ref={receiptRef} className="bg-white p-8 max-w-2xl mx-auto shadow-lg" style={{ fontFamily: 'Arial, sans-serif', backgroundColor: "#ffffff", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
                {/* Header */}
                <div className="text-center mb-8 pb-4" style={{ borderBottom: '2px solid #d1d5db' }}>
                    <h1 className="text-2xl font-bold" style={{ color: '#1f2937' }}>{getTypeLabel()}</h1>
                    <p className="mt-1" style={{ color: '#4b5563' }}>Invoice #: {invoiceNumber}</p>
                    <p style={{ color: '#4b5563' }}>Date: {date}</p>
                </div>

                {/* Customer/Supplier Info */}
                {customerName && (
                    <div className="mb-6">
                        <p className="text-sm uppercase font-semibold" style={{ color: '#6b7280' }}>
                            {type.includes('purchase') ? 'Supplier' : 'Customer'}
                        </p>
                        <p className="text-lg font-medium" style={{ color: '#1f2937' }}>{customerName}</p>
                    </div>
                )}

                {/* Items Table */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3" style={{ color: '#1f2937' }}>Items</h2>
                    <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f3f4f6' }}>
                                <th className="px-4 py-2 text-left text-sm font-semibold" style={{ border: '1px solid #d1d5db', color: '#374151' }}>Item</th>
                                <th className="px-4 py-2 text-center text-sm font-semibold" style={{ border: '1px solid #d1d5db', color: '#374151' }}>Qty</th>
                                <th className="px-4 py-2 text-right text-sm font-semibold" style={{ border: '1px solid #d1d5db', color: '#374151' }}>Price</th>
                                <th className="px-4 py-2 text-right text-sm font-semibold" style={{ border: '1px solid #d1d5db', color: '#374151' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items?.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-2 text-sm" style={{ border: '1px solid #d1d5db', color: '#4b5563' }}>
                                        {item.productName || item.name || item.product?.name}
                                    </td>
                                    <td className="px-4 py-2 text-center text-sm" style={{ border: '1px solid #d1d5db', color: '#4b5563' }}>
                                        {item.quantity}
                                    </td>
                                    <td className="px-4 py-2 text-right text-sm" style={{ border: '1px solid #d1d5db', color: '#4b5563' }}>
                                        Rs {(item.price || item.costPrice || item.unitPrice || item.originalPrice)?.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-2 text-right text-sm font-semibold" style={{ border: '1px solid #d1d5db', color: '#1f2937' }}>
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
                        <h2 className="text-lg font-semibold mb-3" style={{ color: '#1f2937' }}>Summary</h2>
                        <div className="space-y-2">
                            {summary.subtotal !== undefined && (
                                <div className="flex justify-between text-sm">
                                    <span style={{ color: '#4b5563' }}>Subtotal:</span>
                                    <span style={{ color: '#1f2937' }}>Rs {summary.subtotal?.toLocaleString()}</span>
                                </div>
                            )}
                            {summary.discount !== undefined && summary.discount > 0 && (
                                <div className="flex justify-between text-sm" style={{ color: '#dc2626' }}>
                                    <span>Discount:</span>
                                    <span>- Rs {summary.discount?.toLocaleString()}</span>
                                </div>
                            )}
                            {summary.gst !== undefined && summary.gst > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span style={{ color: '#4b5563' }}>GST:</span>
                                    <span style={{ color: '#1f2937' }}>+ Rs {summary.gst?.toLocaleString()}</span>
                                </div>
                            )}
                            {summary.shippingCost !== undefined && summary.shippingCost > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span style={{ color: '#4b5563' }}>Shipping:</span>
                                    <span style={{ color: '#1f2937' }}>+ Rs {summary.shippingCost?.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold pt-2 mt-2" style={{ borderTop: '2px solid #d1d5db' }}>
                                <span style={{ color: '#1f2937' }}>{getAmountLabel()}:</span>
                                <span style={{ color: '#1f2937' }}>Rs {summary.totalAmount?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payments */}
                {payments && payments.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-3" style={{ color: '#1f2937' }}>
                            {type.includes('return') ? 'Refunds' : 'Payments'}
                        </h2>
                        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f3f4f6' }}>
                                    <th className="px-4 py-2 text-left text-sm font-semibold" style={{ border: '1px solid #d1d5db', color: '#374151' }}>Date</th>
                                    <th className="px-4 py-2 text-left text-sm font-semibold" style={{ border: '1px solid #d1d5db', color: '#374151' }}>Method</th>
                                    <th className="px-4 py-2 text-right text-sm font-semibold" style={{ border: '1px solid #d1d5db', color: '#374151' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2 text-sm" style={{ border: '1px solid #d1d5db', color: '#4b5563' }}>
                                            {new Date(payment.date || payment.paymentDate || payment.transactionDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-2 text-sm" style={{ border: '1px solid #d1d5db', color: '#4b5563' }}>
                                            {payment.method || payment.paymentMethod || '—'}
                                        </td>
                                        <td className="px-4 py-2 text-right text-sm font-semibold" style={{ border: '1px solid #d1d5db', color: '#1f2937' }}>
                                            Rs {(payment.amount || 0).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer */}
                <div className="text-center text-xs" style={{ color: '#6b7280', marginTop: '2rem' }}>
                    <p>Generated on {new Date().toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
}
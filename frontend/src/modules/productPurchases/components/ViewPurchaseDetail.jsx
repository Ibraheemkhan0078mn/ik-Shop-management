import React, { useState, useEffect } from "react";
import { X, FileText, Calendar, Package, DollarSign, Receipt, Hash, Truck, Trash2, Edit2 } from "lucide-react";
import { useGetPurchasePayments } from "../services/purchases.service.js";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import PurchasePaymentModal from "./PurchasePaymentModal.jsx";

export default function ViewPurchaseDetail({ purchase, onClose, language = "en" }) {
    if (!purchase) return null;

    const formattedDate = new Date(purchase.date || purchase.createdAt).toLocaleDateString();
    const { data: payments, refetch: refetchPayments, isLoading: paymentsLoading } = useGetPurchasePayments(purchase._id);
    const [editingPayment, setEditingPayment] = useState(null);

    // Handle both data structures: payments.data or payments directly
    const paymentsList = Array.isArray(payments) ? payments : (payments?.data || []);

    // Debug: log payments to see what we're getting
    console.log('Payments data:', payments);
    console.log('Payments list:', paymentsList);

    const handleDeletePayment = async (paymentId) => {
        if (!window.confirm("Are you sure you want to delete this payment?")) return;
        
        try {
            const response = await fetch(`http://localhost:5001/api/purchases/payments/${paymentId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await response.json();
            if (data.success) {
                showSuccess("Payment deleted successfully");
                refetchPayments();
            } else {
                showError(data.message || "Failed to delete payment");
            }
        } catch (error) {
            showError("Failed to delete payment");
        }
    };

    const handleEditPayment = (payment) => {
        setEditingPayment(payment);
    };

    const handlePaymentSuccess = () => {
        setEditingPayment(null);
        refetchPayments();
    };

    return (
        <>
            {editingPayment && (
                <PurchasePaymentModal
                    purchase={purchase}
                    payment={editingPayment}
                    onClose={() => setEditingPayment(null)}
                    onSuccess={handlePaymentSuccess}
                />
            )}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-(--surface) w-full max-w-5xl rounded-3xl shadow-2xl border border-(--border) overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="bg-(--surface-muted) px-6 py-5 border-b border-(--border) flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-(--accent-2)/10 rounded-2xl text-(--accent-2)">
                            <Receipt size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-(--ink) flex items-center gap-2">
                                {language === "en" ? "Purchase Details" : "خریداری کی تفصیلات"}
                                {purchase.invoiceNumber && (
                                    <span className="text-sm font-medium px-2 py-0.5 bg-(--surface) border border-(--border) rounded-lg text-(--muted)">
                                        #{purchase.invoiceNumber}
                                    </span>
                                )}
                            </h2>
                            <p className="text-sm text-(--muted) flex items-center gap-1 mt-1">
                                <Calendar size={14} /> {formattedDate}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-(--surface) border border-transparent hover:border-(--border) rounded-full transition-all"
                        title={language === "en" ? "Close" : "بند کریں"}
                    >
                        <X className="w-5 h-5 text-(--muted)" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Top Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Supplier Info */}
                        <div className="p-5 rounded-2xl border border-(--border) bg-(--surface)">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-(--muted) mb-4 flex items-center gap-2">
                                <Package size={16} />
                                {language === "en" ? "Supplier Information" : "سپلائر کی معلومات"}
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-(--muted)">{language === "en" ? "Name:" : "نام:"}</span>
                                    <span className="font-semibold text-(--ink)">{purchase.supplier?.name || "Unknown"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-(--muted)">{language === "en" ? "Notes:" : "نوٹس:"}</span>
                                    <span className="text-(--ink) text-right max-w-[200px] truncate">{purchase.notes || "—"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Financial Summary */}
                        <div className="p-5 rounded-2xl border border-(--border) bg-linear-to-br from-[#f8efe4] to-[#efe4d2]">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-(--ink) mb-4 flex items-center gap-2">
                                <DollarSign size={16} />
                                {language === "en" ? "Financial Summary" : "مالیاتی خلاصہ"}
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-(--ink)">
                                    <span>{language === "en" ? "Subtotal:" : "ذیلی کل:"}</span>
                                    <span className="font-medium">{purchase.subtotal?.toLocaleString() || 0} Rs</span>
                                </div>
                                <div className="flex justify-between text-rose-600">
                                    <span>{language === "en" ? "Discount:" : "رعایت:"}</span>
                                    <span>-{purchase.discount?.toLocaleString() || 0} {purchase.discountType === 'percentage' ? '%' : 'Rs'}</span>
                                </div>
                                <div className="flex justify-between text-(--ink)">
                                    <span>{language === "en" ? "GST:" : "ٹیکس:"}</span>
                                    <span>+{purchase.gst?.toLocaleString() || 0} %</span>
                                </div>
                                <div className="flex justify-between text-(--ink)">
                                    <span>{language === "en" ? "Shipping:" : "شپنگ:"}</span>
                                    <span>+{purchase.shippingCost?.toLocaleString() || 0} Rs</span>
                                </div>
                                <div className="border-t border-[#e2d5c3] pt-2 mt-2 flex justify-between items-center">
                                    <span className="font-bold text-(--ink)">{language === "en" ? "Net Total:" : "کل رقم:"}</span>
                                    <span className="text-xl font-black text-(--accent-2)">
                                        {purchase.totalAmount?.toLocaleString() || 0} Rs
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="border border-(--border) rounded-2xl overflow-hidden bg-(--surface)">
                        <div className="px-5 py-4 border-b border-(--border) bg-(--surface-muted)">
                            <h3 className="text-base font-semibold text-(--ink) flex items-center gap-2">
                                <Hash size={18} className="text-(--accent-2)" />
                                {language === "en" ? "Purchased Items" : "خریدی گئی اشیاء"}
                                <span className="ml-auto text-xs bg-(--surface) px-2 py-1 rounded-lg border border-(--border) text-(--muted)">
                                    {purchase.items?.length || 0} {language === "en" ? "items" : "آئٹمز"}
                                </span>
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-(--surface) border-b border-(--border) text-(--muted) uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">{language === "en" ? "Product" : "مصنوعات"}</th>
                                        <th className="px-5 py-3 font-semibold text-center">Batch</th>
                                        <th className="px-5 py-3 font-semibold text-center">Qty</th>
                                        <th className="px-5 py-3 font-semibold text-right">Price/Unit</th>
                                        <th className="px-5 py-3 font-semibold text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-(--border)">
                                    {purchase.items?.length > 0 ? (
                                        purchase.items.map((it, index) => (
                                            <tr key={it._id || index} className="hover:bg-(--surface-muted)/50 transition-colors">
                                                <td className="px-5 py-4">
                                                    <p className="font-medium text-(--ink)">{it.product?.name || "Unknown Product"}</p>
                                                    {it.product?.productCode && (
                                                        <p className="text-xs text-(--muted)">Code: {it.product.productCode}</p>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <span className="font-mono text-xs bg-(--surface-muted) border border-(--border) px-2 py-1 rounded-md text-(--muted)">
                                                        {it.batch?.batchNumber || "—"}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-center font-medium text-(--ink)">
                                                    {it.quantity}
                                                </td>
                                                <td className="px-5 py-4 text-right text-(--muted)">
                                                    {it.price?.toLocaleString()} Rs
                                                </td>
                                                <td className="px-5 py-4 text-right font-bold text-(--ink)">
                                                    {(it.price * it.quantity)?.toLocaleString()} Rs
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-5 py-8 text-center text-(--muted)">
                                                {language === "en" ? "No items recorded in this purchase." : "اس خریداری میں کوئی اشیاء ریکارڈ نہیں کی گئیں۔"}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Payment Details Section */}
                    <div className="border border-(--border) rounded-2xl overflow-hidden bg-(--surface)">
                        <div className="px-5 py-4 border-b border-(--border) bg-(--surface-muted)">
                            <h3 className="text-base font-semibold text-(--ink) flex items-center gap-2">
                                <DollarSign size={18} className="text-(--accent-2)" />
                                {language === "en" ? "Payment Details" : "ادائیگی کی تفصیلات"}
                                <span className="ml-auto text-xs bg-(--surface) px-2 py-1 rounded-lg border border-(--border) text-(--muted)">
                                    {paymentsLoading ? "Loading..." : `${paymentsList?.length || 0} ${language === "en" ? "payments" : "ادائیگیاں"}`}
                                </span>
                            </h3>
                        </div>

                        {paymentsLoading ? (
                            <div className="px-5 py-8 text-center text-(--muted)">
                                Loading payments...
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-(--surface) border-b border-(--border) text-(--muted) uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">{language === "en" ? "Date" : "تاریخ"}</th>
                                        <th className="px-5 py-3 font-semibold">{language === "en" ? "Method" : "طریقہ"}</th>
                                        <th className="px-5 py-3 font-semibold text-right">{language === "en" ? "Amount" : "رقم"}</th>
                                        <th className="px-5 py-3 font-semibold">{language === "en" ? "Credit Account" : "کریڈٹ اکاؤنٹ"}</th>
                                        <th className="px-5 py-3 font-semibold text-center">{language === "en" ? "Actions" : "ایکشنز"}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-(--border)">
                                    {paymentsList?.length > 0 ? (
                                        paymentsList.map((payment) => (
                                            <tr key={payment._id} className="hover:bg-(--surface-muted)/50 transition-colors">
                                                <td className="px-5 py-4">
                                                    <p className="font-medium text-(--ink)">
                                                        {new Date(payment.paymentDate).toLocaleDateString()}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                                        payment.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' :
                                                        payment.paymentMethod === 'credit' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-purple-100 text-purple-800'
                                                    }`}>
                                                        {payment.paymentMethod}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right font-bold text-(--ink)">
                                                    {payment.amount?.toLocaleString()} Rs
                                                    {payment.cashAmount > 0 && <span className="text-xs text-(--muted) block">Cash: {payment.cashAmount?.toLocaleString()}</span>}
                                                    {payment.creditAmount > 0 && <span className="text-xs text-(--muted) block">Credit: {payment.creditAmount?.toLocaleString()}</span>}
                                                </td>
                                                <td className="px-5 py-4">
                                                    {payment.creditAccount?.name || "—"}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEditPayment(payment)}
                                                            className="p-2 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors"
                                                            title={language === "en" ? "Edit Payment" : "ادائیگی ایڈٹ کریں"}
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePayment(payment._id)}
                                                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                                            title={language === "en" ? "Delete Payment" : "ادائیگی حذف کریں"}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-5 py-8 text-center text-(--muted)">
                                                {language === "en" ? "No payments recorded for this purchase." : "اس خریداری کے لیے کوئی ادائیگی ریکارڈ نہیں کی گئی۔"}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
        </>
    );
}
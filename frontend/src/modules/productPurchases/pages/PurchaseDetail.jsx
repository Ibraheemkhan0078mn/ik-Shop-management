import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Package, DollarSign, FileText, Edit, Trash2, Plus, Download } from "lucide-react";
import { usePurchase, useGetPurchasePayments, useDeletePurchasePayment } from "../services/purchases.service.js";
import { getPurchaseLabels } from "../labels/purchaseLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import PurchasePaymentModal from "../components/PurchasePaymentModal.jsx";
import PurchaseDetailPdfTemplate from "../components/PurchaseDetailPdfTemplate.jsx";
import PdfModal from "../../../shared/components/PdfModal.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import { usePermissionGuard } from "../../../shared/hooks/usePermissionGuard.js";
import ConfirmDialog from "../../../shared/components/ConfirmationDialog.jsx";

const STATUS_STYLE = {
    ordered: { background: "rgba(180,83,9,0.1)", color: "#d97706", text: "Ordered" },
    delivered: { background: "rgba(15,118,110,0.1)", color: "var(--accent-2)", text: "Delivered" },
    rejected: { background: "rgba(220,38,38,0.1)", color: "#dc2626", text: "Rejected" },
    pending: { background: "rgba(180,83,9,0.1)", color: "#d97706", text: "Pending" },
};

export default function PurchaseDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);
    const [showPdfModal, setShowPdfModal] = useState(false);
    
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getPurchaseLabels(language);
    const { hasPermission } = usePermissionGuard();
    
    const { data: purchaseData, isLoading, refetch: refetchPurchase } = usePurchase(id);
    const { data: paymentsData, refetch: refetchPayments } = useGetPurchasePayments(id);
    const [deletePayment] = useDeletePurchasePayment();
    
    const purchase = purchaseData?.data || purchaseData;
    const payments = paymentsData?.data || paymentsData || [];

    if (isLoading) {
        return <div className="p-6 text-center">{labels.loading || "Loading..."}</div>;
    }

    if (!purchase) {
        return <div className="p-6 text-center">Purchase not found</div>;
    }

    const status = purchase?.status ?? "ordered";
    const statusStyle = STATUS_STYLE[status] ?? STATUS_STYLE.ordered;
    const date = new Date(purchase?.purchaseDate ?? purchase?.date ?? purchase?.createdAt).toLocaleDateString();
    
    // Calculate paid amount from payments data
    const totalPaid = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    const remainingAmount = (purchase?.totalAmount ?? 0) - totalPaid;

    const handleEditPayment = (payment) => {
        setEditingPayment(payment);
        setShowPaymentModal(true);
    };

    const handleDeletePayment = async (paymentId) => {
        try {
            await deletePayment({ paymentId, purchaseId: id }).unwrap();
            showSuccess("Payment deleted successfully");
            refetchPurchase();
            refetchPayments();
        } catch (error) {
            showError(error?.data?.message || "Failed to delete payment");
        }
    };

    const handlePaymentSuccess = () => {
        setShowPaymentModal(false);
        setEditingPayment(null);
        refetchPurchase();
        refetchPayments();
    };

    const canEditPayments = hasPermission('purchases:edit');
    const canDeletePayments = hasPermission('purchases:delete');

    return (
        <>
            <div className="p-6 bg-[var(--app-bg)] min-h-screen">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate("/purchases")}
                        className="p-2 hover:bg-[var(--hover)] rounded-lg transition-all"
                    >
                        <ArrowLeft size={20} className="text-[var(--ink)]" />
                    </button>
                    <div className="flex-1 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-[var(--ink)] font-display">
                                {labels.purchaseDetails || "Purchase Details"}
                            </h1>
                            <p className="text-sm text-[var(--muted)] mt-1">
                                {purchase?.purchaseNumber || purchase?.invoiceNumber || "—"}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowPdfModal(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-2)] text-white rounded-xl hover:bg-[var(--accent-2)]/90 transition-all shadow-lg shadow-[var(--accent-2)]/20"
                            >
                                <Download size={16} />
                                {labels.exportDetails || "Export Details"}
                            </button>
                            <span 
                                className="px-4 py-2 rounded-xl text-sm font-semibold shadow-sm"
                                style={{ background: statusStyle.background, color: statusStyle.color }}
                            >
                                {statusStyle.text}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Summary Section */}
                <div className="card p-6 mb-6 shadow-lg border border-[var(--border)]">
                    <h3 className="text-lg font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
                        <DollarSign size={20} className="text-[var(--accent-2)]" />
                        {labels.summary || "Summary"}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="bg-gradient-to-br from-[var(--surface-muted)] to-[var(--surface)] p-4 rounded-xl text-center border border-[var(--border)]">
                            <p className="text-xs text-[var(--muted)] uppercase font-bold tracking-wider">{labels.subtotal || "Subtotal"}</p>
                            <p className="font-bold text-[var(--ink)] text-lg mt-2">Rs {(purchase?.subtotal ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-xl text-center border border-red-200 dark:border-red-800">
                            <p className="text-xs text-red-600 dark:text-red-400 uppercase font-bold tracking-wider">{labels.totalDiscount || "Discount"}</p>
                            <p className="font-bold text-red-600 text-lg mt-2">Rs {(purchase?.discount ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl text-center border border-green-200 dark:border-green-800">
                            <p className="text-xs text-green-600 dark:text-green-400 uppercase font-bold tracking-wider">{labels.totalTax || "Tax"}</p>
                            <p className="font-bold text-green-600 text-lg mt-2">Rs {(purchase?.gst ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-gradient-to-br from-[var(--accent-2)] to-[var(--accent-2)]/80 p-4 rounded-xl text-center shadow-lg shadow-[var(--accent-2)]/30">
                            <p className="text-xs text-white/80 uppercase font-bold tracking-wider">{labels.totalAmount || "Total"}</p>
                            <p className="font-bold text-white text-xl mt-2">Rs {(purchase?.totalAmount ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl text-center border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider">{labels.amountPaid || "Paid"}</p>
                            <p className="font-bold text-blue-600 text-lg mt-2">Rs {totalPaid.toLocaleString()}</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-xl text-center border border-orange-200 dark:border-orange-800">
                            <p className="text-xs text-orange-600 dark:text-orange-400 uppercase font-bold tracking-wider">{labels.remainingAmount || "Remaining"}</p>
                            <p className="font-bold text-orange-600 text-lg mt-2">Rs {remainingAmount.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Purchase Information Section */}
                <div className="card p-6 mb-6 shadow-lg border border-[var(--border)]">
                    <h3 className="text-lg font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
                        <FileText size={20} className="text-[var(--accent-2)]" />
                        {labels.purchaseInformation || "Purchase Information"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[var(--surface-muted)] p-4 rounded-xl border border-[var(--border)]">
                            <label className="text-xs text-[var(--muted)] uppercase font-bold tracking-wider">
                                {labels.purchaseNumber || "Purchase #"}
                            </label>
                            <p className="font-semibold text-[var(--ink)] mt-2 text-lg">
                                {purchase?.purchaseNumber || purchase?.invoiceNumber || "—"}
                            </p>
                        </div>
                        <div className="bg-[var(--surface-muted)] p-4 rounded-xl border border-[var(--border)]">
                            <label className="text-xs text-[var(--muted)] uppercase font-bold tracking-wider">
                                {labels.supplier || "Supplier"}
                            </label>
                            <p className="font-semibold text-[var(--ink)] mt-2 text-lg">
                                {purchase?.supplier?.name || purchase?.supplierName || "—"}
                            </p>
                        </div>
                        <div className="bg-[var(--surface-muted)] p-4 rounded-xl border border-[var(--border)]">
                            <label className="text-xs text-[var(--muted)] uppercase font-bold tracking-wider">
                                {labels.purchaseDate || "Purchase Date"}
                            </label>
                            <p className="font-semibold text-[var(--ink)] mt-2 text-lg">{date}</p>
                        </div>
                        <div className="bg-[var(--surface-muted)] p-4 rounded-xl border border-[var(--border)]">
                            <label className="text-xs text-[var(--muted)] uppercase font-bold tracking-wider">
                                {labels.status || "Status"}
                            </label>
                            <p className="font-semibold mt-2">
                                <span 
                                    className="px-4 py-2 rounded-xl text-sm font-semibold shadow-sm"
                                    style={{ background: statusStyle.background, color: statusStyle.color }}
                                >
                                    {statusStyle.text}
                                </span>
                            </p>
                        </div>
                        {purchase?.notes && (
                            <div className="md:col-span-2 bg-[var(--surface-muted)] p-4 rounded-xl border border-[var(--border)]">
                                <label className="text-xs text-[var(--muted)] uppercase font-bold tracking-wider">
                                    {labels.notes || "Notes"}
                                </label>
                                <p className="text-[var(--ink)] mt-2">{purchase.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Items Section */}
                <div className="card p-6 mb-6 shadow-lg border border-[var(--border)]">
                    <h3 className="text-lg font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
                        <Package size={20} className="text-[var(--accent-2)]" />
                        {labels.items || "Items"}
                        <span className="ml-auto text-xs bg-[var(--accent-2)]/10 text-[var(--accent-2)] px-3 py-1 rounded-full font-semibold">
                            {purchase?.items?.length || 0} items
                        </span>
                    </h3>
                    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                        <table className="w-full">
                            <thead style={{ background: "var(--surface-muted)" }}>
                                <tr>
                                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase text-[var(--muted)] tracking-wider">
                                        {labels.productName || "Product"}
                                    </th>
                                    <th className="px-4 py-4 text-center text-xs font-semibold uppercase text-[var(--muted)] tracking-wider">
                                        {labels.quantity || "Quantity"}
                                    </th>
                                    <th className="px-4 py-4 text-right text-xs font-semibold uppercase text-[var(--muted)] tracking-wider">
                                        {labels.costPrice || "Cost Price"}
                                    </th>
                                    <th className="px-4 py-4 text-right text-xs font-semibold uppercase text-[var(--muted)] tracking-wider">
                                        {labels.discount || "Discount"}
                                    </th>
                                    <th className="px-4 py-4 text-right text-xs font-semibold uppercase text-[var(--muted)] tracking-wider">
                                        {labels.tax || "Tax"}
                                    </th>
                                    <th className="px-4 py-4 text-right text-xs font-semibold uppercase text-[var(--muted)] tracking-wider">
                                        {labels.subtotal || "Subtotal"}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
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
                                        <tr key={index} className="hover:bg-[var(--surface-muted)] transition-all">
                                            <td className="px-4 py-4">
                                                <p className="font-semibold text-[var(--ink)]">
                                                    {item.name || item.product?.name || item.productName || "—"}
                                                </p>
                                                {item.variant && (
                                                    <p className="text-xs text-[var(--muted)] mt-1">{item.variant}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-center font-semibold text-[var(--ink)]">
                                                <span className="bg-[var(--surface-muted)] px-3 py-1 rounded-lg">{quantity}</span>
                                            </td>
                                            <td className="px-4 py-4 text-right font-semibold text-[var(--ink)]">
                                                Rs {price.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-4 text-right font-semibold text-red-600">
                                                {item.discountType === 'percentage' ? `${item.discount || 0}%` : `Rs ${(item.discount || 0).toLocaleString()}`}
                                                <span className="text-xs text-[var(--muted)] block"> ({discountAmount.toLocaleString()})</span>
                                            </td>
                                            <td className="px-4 py-4 text-right font-semibold text-green-600">
                                                {item.taxType === 'percentage' ? `${item.tax || 0}%` : `Rs ${(item.tax || 0).toLocaleString()}`}
                                                <span className="text-xs text-[var(--muted)] block"> ({taxAmount.toLocaleString()})</span>
                                            </td>
                                            <td className="px-4 py-4 text-right font-bold text-[var(--accent-2)] text-lg">
                                                Rs {subtotal.toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payments Section */}
                <div className="card p-6 shadow-lg border border-[var(--border)]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-[var(--ink)] flex items-center gap-2">
                            <DollarSign size={20} className="text-[var(--accent-2)]" />
                            {labels.payments || "Payments"}
                            <span className="ml-auto text-xs bg-[var(--surface-muted)] text-[var(--muted)] px-3 py-1 rounded-full font-semibold">
                                {payments.length} payments
                            </span>
                        </h3>
                        {hasPermission('purchases:create') && remainingAmount > 0 && (
                            <button
                                onClick={() => {
                                    setEditingPayment(null);
                                    setShowPaymentModal(true);
                                }}
                                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-2)] text-white rounded-xl hover:bg-[var(--accent-2)]/90 transition-all shadow-lg shadow-[var(--accent-2)]/20"
                            >
                                <Plus size={16} />
                                {labels.addPayment || "Add Payment"}
                            </button>
                        )}
                    </div>

                    {payments.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                            <table className="w-full">
                                <thead style={{ background: "var(--surface-muted)" }}>
                                    <tr>
                                        <th className="px-4 py-4 text-left text-xs font-semibold uppercase text-[var(--muted)] tracking-wider">
                                            {labels.date || "Date"}
                                        </th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold uppercase text-[var(--muted)] tracking-wider">
                                            {labels.method || "Method"}
                                        </th>
                                        <th className="px-4 py-4 text-right text-xs font-semibold uppercase text-[var(--muted)] tracking-wider">
                                            {labels.amount || "Amount"}
                                        </th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold uppercase text-[var(--muted)] tracking-wider">
                                            {labels.notes || "Notes"}
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-semibold uppercase text-[var(--muted)] tracking-wider">
                                            {labels.actions || "Actions"}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                                    {payments.map((payment, index) => (
                                        <tr key={index} className="hover:bg-[var(--surface-muted)] transition-all">
                                            <td className="px-4 py-4 text-sm text-[var(--ink)] font-medium">
                                                {new Date(payment.paymentDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                                                    payment.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' :
                                                    payment.paymentMethod === 'credit' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-purple-100 text-purple-800'
                                                }`}>
                                                    {payment.paymentMethodName || payment.paymentMethod || "—"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right font-bold text-[var(--accent-2)] text-lg">
                                                Rs {(payment.amount || 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-[var(--muted)]">
                                                {payment.notes || "—"}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {canEditPayments && (
                                                        <button
                                                            onClick={() => handleEditPayment(payment)}
                                                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-all"
                                                            title="Edit payment"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                    )}
                                                    {canDeletePayments && (
                                                        <ConfirmDialog
                                                            onConfirm={() => handleDeletePayment(payment._id)}
                                                            message="Are you sure you want to delete this payment?"
                                                        >
                                                            <button
                                                                className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-all"
                                                                title="Delete payment"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </ConfirmDialog>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center bg-[var(--surface-muted)] rounded-xl border border-dashed border-[var(--border)]">
                            <DollarSign size={48} className="text-[var(--muted)] mx-auto mb-4" />
                            <p className="text-sm text-[var(--muted)] font-medium">
                                {labels.noPayments || "No payments recorded yet"}
                            </p>
                        </div>
                    )}
                </div>
            </div>
            {showPaymentModal && (
                <PurchasePaymentModal
                    purchase={purchase}
                    payment={editingPayment}
                    onClose={() => {
                        setShowPaymentModal(false);
                        setEditingPayment(null);
                    }}
                    onSuccess={handlePaymentSuccess}
                />
            )}
            {showPdfModal && (
                <PdfModal
                    isOpen={showPdfModal}
                    onClose={() => setShowPdfModal(false)}
                    fileName={`Purchase-${purchase?.purchaseNumber || purchase?.invoiceNumber || 'details'}.pdf`}
                    labels={labels}
                >
                    <PurchaseDetailPdfTemplate purchase={purchase} payments={payments} labels={labels} />
                </PdfModal>
            )}
        </>
    );
}

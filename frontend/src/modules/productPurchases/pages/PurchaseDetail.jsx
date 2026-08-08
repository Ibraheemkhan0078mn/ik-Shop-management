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
                        className="p-2 hover:bg-[var(--hover)] rounded-md transition-all"
                    >
                        <ArrowLeft size={20} className="text-[var(--ink)]" />
                    </button>
                    <div className="flex-1 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--ink)] font-display">
                                {labels.purchaseDetails || "Purchase Details"}
                            </h1>
                            <p className="text-sm text-[var(--muted)]">
                                {purchase?.purchaseNumber || purchase?.invoiceNumber || "—"}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowPdfModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-2)] text-white rounded-lg hover:bg-[var(--accent-2)]/90 transition-all"
                            >
                                <Download size={16} />
                                {labels.exportDetails || "Export Details"}
                            </button>
                            <span 
                                className="px-4 py-2 rounded-lg text-sm font-semibold"
                                style={{ background: statusStyle.background, color: statusStyle.color }}
                            >
                                {statusStyle.text}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Summary Section */}
                <div className="card p-6 mb-6">
                    <h3 className="text-lg font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
                        <DollarSign size={20} />
                        {labels.summary || "Summary"}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <div className="text-center">
                            <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.subtotal || "Subtotal"}</p>
                            <p className="font-semibold text-[var(--ink)] mt-1">Rs {(purchase?.subtotal ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.totalDiscount || "Discount"}</p>
                            <p className="font-semibold text-red-600 mt-1">Rs {(purchase?.discount ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.totalTax || "Tax"}</p>
                            <p className="font-semibold text-green-600 mt-1">Rs {(purchase?.gst ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.totalAmount || "Total"}</p>
                            <p className="font-bold text-green-600 text-lg mt-1">Rs {(purchase?.totalAmount ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.amountPaid || "Paid"}</p>
                            <p className="font-semibold text-[var(--ink)] mt-1">Rs {totalPaid.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.remainingAmount || "Remaining"}</p>
                            <p className="font-bold text-red-600 text-lg mt-1">Rs {remainingAmount.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Purchase Information Section */}
                <div className="card p-6 mb-6">
                    <h3 className="text-lg font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
                        <FileText size={20} />
                        {labels.purchaseInformation || "Purchase Information"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs text-[var(--muted)] uppercase font-bold">
                                {labels.purchaseNumber || "Purchase #"}
                            </label>
                            <p className="font-semibold text-[var(--ink)] mt-1">
                                {purchase?.purchaseNumber || purchase?.invoiceNumber || "—"}
                            </p>
                        </div>
                        <div>
                            <label className="text-xs text-[var(--muted)] uppercase font-bold">
                                {labels.supplier || "Supplier"}
                            </label>
                            <p className="font-semibold text-[var(--ink)] mt-1">
                                {purchase?.supplier?.name || purchase?.supplierName || "—"}
                            </p>
                        </div>
                        <div>
                            <label className="text-xs text-[var(--muted)] uppercase font-bold">
                                {labels.purchaseDate || "Purchase Date"}
                            </label>
                            <p className="font-semibold text-[var(--ink)] mt-1">{date}</p>
                        </div>
                        <div>
                            <label className="text-xs text-[var(--muted)] uppercase font-bold">
                                {labels.status || "Status"}
                            </label>
                            <p className="font-semibold text-[var(--ink)] mt-1">
                                <span 
                                    className="px-3 py-1 rounded-lg text-xs font-semibold"
                                    style={{ background: statusStyle.background, color: statusStyle.color }}
                                >
                                    {statusStyle.text}
                                </span>
                            </p>
                        </div>
                        {purchase?.notes && (
                            <div className="md:col-span-2">
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">
                                    {labels.notes || "Notes"}
                                </label>
                                <p className="text-[var(--ink)] mt-1">{purchase.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Items Section */}
                <div className="card p-6 mb-6">
                    <h3 className="text-lg font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
                        <Package size={20} />
                        {labels.items || "Items"}
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead style={{ background: "var(--surface-muted)" }}>
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">
                                        {labels.productName || "Product"}
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">
                                        {labels.quantity || "Quantity"}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">
                                        {labels.costPrice || "Cost Price"}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">
                                        {labels.discount || "Discount"}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">
                                        {labels.tax || "Tax"}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">
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
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-[var(--ink)]">
                                                    {item.name || item.product?.name || item.productName || "—"}
                                                </p>
                                                {item.variant && (
                                                    <p className="text-xs text-[var(--muted)]">{item.variant}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center font-medium text-[var(--ink)]">
                                                {quantity}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-[var(--ink)]">
                                                Rs {price.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-red-600">
                                                {item.discountType === 'percentage' ? `${item.discount || 0}%` : `Rs ${(item.discount || 0).toLocaleString()}`}
                                                <span className="text-xs text-[var(--muted)]"> ({discountAmount.toLocaleString()})</span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-green-600">
                                                {item.taxType === 'percentage' ? `${item.tax || 0}%` : `Rs ${(item.tax || 0).toLocaleString()}`}
                                                <span className="text-xs text-[var(--muted)]"> ({taxAmount.toLocaleString()})</span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-[var(--ink)]">
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
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-[var(--ink)] flex items-center gap-2">
                            <DollarSign size={20} />
                            {labels.payments || "Payments"}
                        </h3>
                        {hasPermission('purchases:create') && (
                            <button
                                onClick={() => {
                                    setEditingPayment(null);
                                    setShowPaymentModal(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-2)] text-white rounded-lg hover:bg-[var(--accent-2)]/90 transition-all"
                            >
                                <Plus size={16} />
                                {labels.addPayment || "Add Payment"}
                            </button>
                        )}
                    </div>

                    {payments.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead style={{ background: "var(--surface-muted)" }}>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">
                                            {labels.date || "Date"}
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">
                                            {labels.method || "Method"}
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">
                                            {labels.amount || "Amount"}
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">
                                            {labels.notes || "Notes"}
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">
                                            {labels.actions || "Actions"}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                                    {payments.map((payment, index) => (
                                        <tr key={index} className="hover:bg-[var(--surface-muted)] transition-all">
                                            <td className="px-4 py-3 text-sm text-[var(--ink)]">
                                                {new Date(payment.paymentDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-[var(--ink)] capitalize">
                                                {payment.paymentMethodName || payment.paymentMethod || "—"}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-[var(--accent-2)]">
                                                Rs {(payment.amount || 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-[var(--muted)]">
                                                {payment.notes || "—"}
                                            </td>
                                            <td className="px-4 py-3 text-center">
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
                        <div className="p-12 text-center">
                            <p className="text-sm text-[var(--muted)]">
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

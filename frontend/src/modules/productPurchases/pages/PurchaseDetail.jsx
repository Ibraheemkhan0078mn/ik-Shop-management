import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, Plus, Download, RefreshCw, Eye, EyeOff } from "lucide-react";
import { usePurchase, useGetPurchasePayments, useDeletePurchasePayment, useGetPurchasePaymentStatus, useRecalculatePurchasePaidAmount } from "../services/purchases.service.js";
import { getPurchaseLabels } from "../labels/purchaseLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import PurchasePaymentModal from "../components/PurchasePaymentModal.jsx";
import PurchaseDetailPdfTemplate from "../components/PurchaseDetailPdfTemplate.jsx";
import PaymentPdfTemplate from "../components/PaymentPdfTemplate.jsx";
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
    const [showPaymentPdfModal, setShowPaymentPdfModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [expandedItems, setExpandedItems] = useState({});
    const [expandedPayments, setExpandedPayments] = useState({});

    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getPurchaseLabels(language);
    const { hasPermission } = usePermissionGuard();

    const { data: purchaseData, isLoading, refetch: refetchPurchase } = usePurchase(id);
    const { data: paymentsData, refetch: refetchPayments } = useGetPurchasePayments(id);
    const { data: paymentStatusData, refetch: refetchPaymentStatus } = useGetPurchasePaymentStatus(id);
    const [deletePayment] = useDeletePurchasePayment();
    const [recalculatePurchasePaidAmount] = useRecalculatePurchasePaidAmount();

    const purchase = purchaseData?.data || purchaseData;
    const payments = paymentsData?.data || paymentsData || [];
    const paymentStatus = paymentStatusData?.data || paymentStatusData || {};

    if (isLoading) {
        return <div className="p-6 text-center">{labels.loading || "Loading..."}</div>;
    }

    if (!purchase) {
        return <div className="p-6 text-center">Purchase not found</div>;
    }

    const status = purchase?.status ?? "ordered";
    const statusStyle = STATUS_STYLE[status] ?? STATUS_STYLE.ordered;
    const date = new Date(purchase?.purchaseDate ?? purchase?.date ?? purchase?.createdAt).toLocaleDateString();

    const totalPaid = paymentStatus.totalPaid || 0;
    const remainingAmount = (purchase?.totalAmount ?? 0) - (purchase?.paidAmount ?? 0);
    const paymentStatusText = paymentStatus.paymentStatus || 'pending';
    const totalCash = paymentStatus.totalCash || 0;
    const totalCredit = paymentStatus.totalCredit || 0;

    const handleEditPayment = (payment) => {
        setEditingPayment(payment);
        setShowPaymentModal(true);
    };

    const handleDeletePayment = async (paymentId) => {
        try {
            await deletePayment({ paymentId, purchaseId: id }).unwrap();
            await recalculatePurchasePaidAmount(id).unwrap();
            showSuccess("Payment deleted successfully");
            refetchPurchase();
            refetchPayments();
            refetchPaymentStatus();
        } catch (error) {
            showError(error?.data?.message || "Failed to delete payment");
        }
    };

    const handlePaymentSuccess = async () => {
        setShowPaymentModal(false);
        setEditingPayment(null);
        await recalculatePurchasePaidAmount(id).unwrap();
        refetchPurchase();
        refetchPayments();
        refetchPaymentStatus();
    };

    const handleRecalculate = async () => {
        try {
            await recalculatePurchasePaidAmount(id).unwrap();
            showSuccess("Purchase payment recalculated successfully");
        } catch (error) {
            showError(error?.data?.message || "Failed to recalculate payment");
        }
    };

    const handlePaymentPdf = (payment) => {
        setSelectedPayment(payment);
        setShowPaymentPdfModal(true);
    };

    const canEditPayments = hasPermission('purchases.update');
    const canDeletePayments = hasPermission('purchases.delete');

    return (
        <>
            <div className="min-h-screen bg-[var(--app-bg)]">
                <div className="max-w-5xl mx-auto px-6 py-8">

                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 -ml-2 hover:bg-[var(--hover)] rounded-lg transition-all"
                            >
                                <ArrowLeft size={20} className="text-[var(--ink)]" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-[var(--ink)] font-display leading-tight">
                                    {labels.purchaseDetails || "Purchase Details"}
                                </h1>
                                <p className="text-sm text-[var(--muted)]">
                                    {purchase?.purchaseNumber || purchase?.invoiceNumber || "—"} · {date}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {hasPermission('purchases.update') && (
                                <button
                                    onClick={handleRecalculate}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--hover)] rounded-lg transition-all"
                                    title="Recalculate Payment"
                                >
                                    <RefreshCw size={15} />
                                    Recalculate
                                </button>
                            )}
                            <button
                                onClick={() => setShowPdfModal(true)}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--accent-2)] text-white rounded-lg hover:bg-[var(--accent-2)]/90 transition-all shadow-sm"
                            >
                                <Download size={15} />
                                {labels.exportDetails || "Export"}
                            </button>
                        </div>
                    </div>

                    {/* Paper sheet - Invoice-style layout */}
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm px-8 py-8">

                        {/* Company Header */}
                        <div className="text-center mb-6">
                            <div className="inline-flex flex-col items-center leading-none mb-2">
                                <span className="text-3xl font-extrabold tracking-wide text-[var(--ink)]" style={{ letterSpacing: "2px" }}>LOGIN</span>
                                <span className="text-xs font-semibold tracking-[0.3em] text-[var(--muted)] mt-1">LARAIB</span>
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-center text-[var(--ink)] mb-6">
                            Afrasiab Mobile Accesories
                        </h2>

                        {/* Bill To / Invoice Meta Row */}
                        <div className="flex justify-between items-start mb-6 gap-6">
                            <div>
                                <p className="text-xs font-semibold text-[var(--muted)] mb-1">Purchased From:</p>
                                <p className="text-sm font-bold text-[var(--ink)] uppercase">{purchase?.supplier?.name || "—"}</p>
                                {purchase?.supplier?.code && <p className="text-xs text-[var(--muted)]">Supplier Code: {purchase.supplier.code}</p>}
                                {purchase?.supplier?.phone && <p className="text-xs text-[var(--muted)]">{purchase.supplier.phone}</p>}
                            </div>
                            <div className="flex flex-col gap-2 min-w-[240px]">
                                <div className="border border-[var(--border)] px-3 py-2 flex justify-between text-sm" style={{ background: "var(--surface-muted)" }}>
                                    <span className="font-semibold text-[var(--ink)]">Invoice #: {purchase?.invoiceNumber || purchase?.purchaseNumber || "—"}</span>
                                    <span className="font-semibold text-[var(--ink)]">Date: {date}</span>
                                </div>
                                <div className="border border-[var(--border)] px-3 py-2 flex justify-between text-sm" style={{ background: "var(--surface-muted)" }}>
                                    <span className="font-semibold text-[var(--ink)]">Status:</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                        status === "delivered" ? "bg-green-100 text-green-700" :
                                        status === "ordered" ? "bg-yellow-100 text-yellow-700" :
                                        status === "rejected" ? "bg-red-100 text-red-700" :
                                        "bg-blue-100 text-blue-700"
                                    }`}>{statusStyle.text}</span>
                                </div>
                            </div>
                        </div>

                        {purchase?.notes && (
                            <p className="text-sm text-[var(--muted)] mb-6 italic">
                                {purchase.notes}
                            </p>
                        )}

                        {/* Items Table - Invoice style */}
                        <table className="w-full border-collapse mb-4 text-sm">
                            <thead>
                                <tr className="text-[var(--ink)]" style={{ background: "var(--accent-2)" }}>
                                    <th className="px-3 py-2 text-left font-semibold text-white">#</th>
                                    <th className="px-3 py-2 text-left font-semibold text-white">Item &amp; Description</th>
                                    <th className="px-3 py-2 text-left font-semibold text-white">Category</th>
                                    <th className="px-3 py-2 text-right font-semibold text-white">Qty</th>
                                    <th className="px-3 py-2 text-right font-semibold text-white">Price</th>
                                    <th className="px-3 py-2 text-right font-semibold text-white">Disc</th>
                                    <th className="px-3 py-2 text-right font-semibold text-white">Tax</th>
                                    <th className="px-3 py-2 text-right font-semibold text-white">Net Amount</th>
                                    <th className="px-3 py-2 text-center font-semibold text-white">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchase?.items?.map((item, index) => {
                                    const price = item.costPrice || item.price || item.perItemPrice || 0;
                                    const quantity = item.quantity || 0;
                                    const baseTotal = quantity * price;
                                    const discountAmount = item.discountType === 'percentage'
                                        ? baseTotal * (item.discount || 0) / 100
                                        : (item.discount || 0);
                                    const taxAmount = item.taxType === 'percentage'
                                        ? (baseTotal - discountAmount) * (item.tax || 0) / 100
                                        : (item.tax || 0);
                                    const subtotal = baseTotal - discountAmount + taxAmount;

                                    const isExpanded = expandedItems[index];

                                    return (
                                        <React.Fragment key={index}>
                                            <tr className="border-b border-[var(--border)]">
                                                <td className="px-3 py-2 text-[var(--ink)]">{index + 1}</td>
                                                <td className="px-3 py-2 text-[var(--ink)]">
                                                    {item.name || item.product?.name || item.productName || "—"}
                                                    {item.product?.productCode && <span className="text-xs text-[var(--muted)] block">{item.product.productCode}</span>}
                                                </td>
                                                <td className="px-3 py-2 text-[var(--ink)]">{item.category || item.product?.category || "—"}</td>
                                                <td className="px-3 py-2 text-right text-[var(--ink)]">{quantity}</td>
                                                <td className="px-3 py-2 text-right text-[var(--ink)]">{price.toLocaleString()}</td>
                                                <td className="px-3 py-2 text-right text-red-600">
                                                    {item.discountType === 'percentage' ? `${item.discount || 0}%` : `Rs ${(item.discount || 0).toLocaleString()}`}
                                                </td>
                                                <td className="px-3 py-2 text-right text-green-700">
                                                    {item.taxType === 'percentage' ? `${item.tax || 0}%` : `Rs ${(item.tax || 0).toLocaleString()}`}
                                                </td>
                                                <td className="px-3 py-2 text-right font-semibold text-[var(--accent-2)]">{subtotal.toLocaleString()}</td>
                                                <td className="px-3 py-2 text-center">
                                                    <button
                                                        onClick={() => setExpandedItems(prev => ({ ...prev, [index]: !prev[index] }))}
                                                        className="p-1 rounded hover:bg-[var(--surface-muted)] transition"
                                                        style={{ color: "var(--muted)" }}
                                                        title={isExpanded ? "Hide calculations" : "Show calculations"}
                                                    >
                                                        {isExpanded ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan="9" className="px-2 sm:px-3 py-4" style={{ background: "var(--surface-muted)" }}>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            {/* Total Price Calculation */}
                                                            <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                                <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Total Price Calculation</p>
                                                                <div className="text-xs space-y-1">
                                                                    <div className="flex justify-between">
                                                                        <span style={{ color: "var(--ink)" }}>Quantity:</span>
                                                                        <span className="font-mono" style={{ color: "var(--ink)" }}>{quantity}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span style={{ color: "var(--ink)" }}>Cost Price:</span>
                                                                        <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {price.toFixed(2)}</span>
                                                                    </div>
                                                                    <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                                        <span style={{ color: "var(--accent-2)" }}>Base Total:</span>
                                                                        <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {baseTotal.toFixed(2)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Discount Calculation */}
                                                            <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                                <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Discount Calculation</p>
                                                                <div className="text-xs space-y-1">
                                                                    <div className="flex justify-between">
                                                                        <span style={{ color: "var(--ink)" }}>Discount:</span>
                                                                        <span className="font-mono" style={{ color: "var(--ink)" }}>{item.discountType === 'percentage' ? `${item.discount || 0}%` : `Rs ${(item.discount || 0).toFixed(2)}`}</span>
                                                                    </div>
                                                                    <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                                        <span style={{ color: "var(--accent-2)" }}>Discount Amount:</span>
                                                                        <span className="font-mono text-red-600" style={{ color: "var(--accent-2)" }}>-Rs {discountAmount.toFixed(2)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Tax Calculation */}
                                                            <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                                <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Tax Calculation (on After Discount)</p>
                                                                <div className="text-xs space-y-1">
                                                                    <div className="flex justify-between">
                                                                        <span style={{ color: "var(--ink)" }}>After Discount Value:</span>
                                                                        <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {(baseTotal - discountAmount).toFixed(2)}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span style={{ color: "var(--ink)" }}>Tax:</span>
                                                                        <span className="font-mono" style={{ color: "var(--ink)" }}>{item.taxType === 'percentage' ? `${item.tax || 0}%` : `Rs ${(item.tax || 0).toFixed(2)}`}</span>
                                                                    </div>
                                                                    <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                                        <span style={{ color: "var(--accent-2)" }}>Tax Amount:</span>
                                                                        <span className="font-mono text-green-600" style={{ color: "var(--accent-2)" }}>+Rs {taxAmount.toFixed(2)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Final Subtotal:</span>
                                                                <span className="text-lg font-bold font-mono" style={{ color: "var(--accent-2)" }}>Rs {subtotal.toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Payment KPI row */}
                        <div className="flex flex-wrap items-start justify-between gap-6 mb-6">
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Total Amount</p>
                                <p className="text-2xl font-bold text-[var(--accent-2)]">Rs {(purchase?.totalAmount ?? 0).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Total Paid</p>
                                <p className="text-2xl font-bold text-blue-600">Rs {totalPaid.toLocaleString()}</p>
                                <p className="text-xs text-[var(--muted)] mt-0.5">Cash Rs {totalCash.toLocaleString()} · Credit Rs {totalCredit.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Remaining</p>
                                <p className="text-2xl font-bold text-orange-600">Rs {remainingAmount.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Payment Status</p>
                                <p className="text-2xl font-bold text-[var(--ink)] capitalize">{paymentStatusText}</p>
                            </div>
                        </div>

                        {/* Summary Section */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
                                Summary
                            </h3>
                        </div>
                        
                        {/* Calculate summary values */}
                        {(() => {
                            const subtotalAfterItems = (purchase?.items || []).reduce((sum, it) => {
                                const price = it.costPrice || it.price || it.perItemPrice || 0;
                                const quantity = it.quantity || 0;
                                const baseTotal = quantity * price;
                                const discountAmount = it.discountType === 'percentage'
                                    ? baseTotal * (it.discount || 0) / 100
                                    : (it.discount || 0);
                                const afterDiscount = baseTotal - discountAmount;
                                const taxAmount = it.taxType === 'percentage'
                                    ? afterDiscount * (it.tax || 0) / 100
                                    : (it.tax || 0);
                                return sum + (afterDiscount + taxAmount);
                            }, 0);
                            
                            const billDiscount = purchase.discountType === "percentage"
                                ? (subtotalAfterItems * (purchase.discount || 0)) / 100
                                : (purchase.discount || 0);
                            const afterBillDiscount = subtotalAfterItems - billDiscount;
                            const billTax = purchase.gstType === "fixed"
                                ? (purchase.gst || 0)
                                : (afterBillDiscount * (purchase.gst || 0)) / 100;
                            const afterBillTax = afterBillDiscount + billTax;
                            const shipping = purchase.shippingCost || 0;
                            const total = afterBillTax + shipping;
                            
                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Subtotal Card */}
                                    <div className="p-4 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                        <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Subtotal</p>
                                        <div className="text-xs space-y-1">
                                            <div className="flex justify-between">
                                                <span style={{ color: "var(--ink)" }}>Items Subtotal:</span>
                                                <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {subtotalAfterItems.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                <span style={{ color: "var(--accent-2)" }}>Subtotal:</span>
                                                <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {subtotalAfterItems.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bill Discount Card */}
                                    <div className="p-4 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                        <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Discount (Bill)</p>
                                        <div className="text-xs space-y-1">
                                            <div className="flex justify-between">
                                                <span style={{ color: "var(--ink)" }}>Discount:</span>
                                                <span className="font-mono" style={{ color: "var(--ink)" }}>{(purchase.discount || 0).toFixed(2)} {purchase.discountType === "fixed" ? "fixed" : "%"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span style={{ color: "var(--ink)" }}>Discount Amount:</span>
                                                <span className="font-mono" style={{ color: "#dc2626" }}>-Rs {billDiscount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                <span style={{ color: "var(--accent-2)" }}>After Discount:</span>
                                                <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {afterBillDiscount.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bill Tax Card */}
                                    <div className="p-4 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                        <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Tax/GST (Bill)</p>
                                        <div className="text-xs space-y-1">
                                            <div className="flex justify-between">
                                                <span style={{ color: "var(--ink)" }}>After Discount Value:</span>
                                                <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {afterBillDiscount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span style={{ color: "var(--ink)" }}>Tax:</span>
                                                <span className="font-mono" style={{ color: "var(--ink)" }}>{(purchase.gst || 0).toFixed(2)} {purchase.gstType === "fixed" ? "fixed" : "%"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span style={{ color: "var(--ink)" }}>Tax Amount:</span>
                                                <span className="font-mono" style={{ color: "#16a34a" }}>+Rs {billTax.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                <span style={{ color: "var(--accent-2)" }}>After Tax:</span>
                                                <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {afterBillTax.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shipping Card */}
                                    <div className="p-4 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                        <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Shipping</p>
                                        <div className="text-xs space-y-1">
                                            <div className="flex justify-between">
                                                <span style={{ color: "var(--ink)" }}>After Tax Value:</span>
                                                <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {afterBillTax.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span style={{ color: "var(--ink)" }}>Shipping Cost:</span>
                                                <span className="font-mono" style={{ color: "#16a34a" }}>+Rs {shipping.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                <span style={{ color: "var(--accent-2)" }}>After Shipping:</span>
                                                <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Final Total Card */}
                        <div className="mt-4 p-4 rounded-lg" style={{ background: "rgba(15,118,110,0.08)", border: "1px solid rgba(15,118,110,0.25)" }}>
                            <p className="text-xs font-semibold mb-2" style={{ color: "var(--accent-2)" }}>Total</p>
                            <div className="text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span style={{ color: "var(--ink)" }}>After Bill Discount:</span>
                                    <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {((purchase?.totalAmount || 0) - (purchase?.shippingCost || 0) - (purchase.gstType === "fixed" ? (purchase.gst || 0) : 0)).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: "var(--ink)" }}>Tax Amount:</span>
                                    <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {(purchase.gstType === "fixed" ? (purchase.gst || 0) : 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: "var(--ink)" }}>Shipping Cost:</span>
                                    <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {(purchase.shippingCost || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                                    <span style={{ color: "var(--accent-2)" }}>Grand Total:</span>
                                    <span className="font-mono text-xl" style={{ color: "var(--accent-2)" }}>Rs {(purchase?.totalAmount || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-[var(--border)] my-10" />

                        {/* Payments */}
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
                                Payments ({paymentStatus.transactionCount || payments.length})
                            </h3>
                            {hasPermission('purchases.create') && paymentStatusText !== 'full' && (
                                <button
                                    onClick={() => {
                                        setEditingPayment(null);
                                        setShowPaymentModal(true);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--accent-2)] text-white rounded-lg hover:bg-[var(--accent-2)]/90 transition-all"
                                >
                                    <Plus size={15} />
                                    Add Payment
                                </button>
                            )}
                        </div>

                        {payments.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-[var(--border)]">
                                            <th className="py-2 text-left text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Date</th>
                                            <th className="py-2 text-left text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Method</th>
                                            <th className="py-2 text-right text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Amount</th>
                                            <th className="py-2 text-center text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Notes</th>
                                            <th className="py-2 text-center text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]">
                                        {payments.map((payment, index) => {
                                            const isPaymentExpanded = expandedPayments[index];
                                            return (
                                                <React.Fragment key={index}>
                                                    <tr>
                                                        <td className="py-3 text-sm text-[var(--ink)]">
                                                            {new Date(payment.transactionDate || payment.paymentDate).toLocaleDateString()}
                                                        </td>
                                                        <td className="py-3">
                                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                                                payment.method === 'cash' ? 'bg-green-100 text-green-800' :
                                                                payment.method === 'credit' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-purple-100 text-purple-800'
                                                            }`}>
                                                                {payment.method === 'cash' ? (payment.paymentMethodName || 'Cash') :
                                                                 payment.method === 'credit' ? `Credit (${payment.creditAccount?.name || 'Account'})` :
                                                                 payment.method || "—"}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-right font-semibold text-[var(--accent-2)]">Rs {(payment.amount || 0).toLocaleString()}</td>
                                                        <td className="py-3 text-sm text-center text-[var(--muted)]">{payment.notes || "—"}</td>
                                                        <td className="py-3">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button
                                                                    onClick={() => handlePaymentPdf(payment)}
                                                                    className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-lg"
                                                                    title="Download payment PDF"
                                                                >
                                                                    <Download size={15} />
                                                                </button>
                                                                <button
                                                                    onClick={() => setExpandedPayments(prev => ({ ...prev, [index]: !prev[index] }))}
                                                                    className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-lg"
                                                                    title={isPaymentExpanded ? "Hide details" : "Show details"}
                                                                >
                                                                    {isPaymentExpanded ? <EyeOff size={15} /> : <Eye size={15} />}
                                                                </button>
                                                                {canEditPayments && (
                                                                    <button
                                                                        onClick={() => handleEditPayment(payment)}
                                                                        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg"
                                                                        title="Edit payment"
                                                                    >
                                                                        <Edit size={15} />
                                                                    </button>
                                                                )}
                                                                {canDeletePayments && (
                                                                    <ConfirmDialog
                                                                        onConfirm={() => handleDeletePayment(payment._id)}
                                                                        message="Are you sure you want to delete this payment?"
                                                                    >
                                                                        <button
                                                                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg"
                                                                            title="Delete payment"
                                                                        >
                                                                            <Trash2 size={15} />
                                                                        </button>
                                                                    </ConfirmDialog>
                                                                )}
                                                    </div>
                                                </td>
                                            </tr>
                                            {isPaymentExpanded && (
                                                <tr>
                                                    <td colSpan="5" className="px-2 sm:px-3 py-4" style={{ background: "var(--surface-muted)" }}>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                                <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Payment Details</p>
                                                                <div className="text-xs space-y-1">
                                                                    <div className="flex justify-between">
                                                                        <span style={{ color: "var(--ink)" }}>Payment ID:</span>
                                                                        <span className="font-mono" style={{ color: "var(--ink)" }}>{payment._id || "—"}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span style={{ color: "var(--ink)" }}>Transaction Date:</span>
                                                                        <span className="font-mono" style={{ color: "var(--ink)" }}>{new Date(payment.transactionDate || payment.paymentDate).toLocaleString()}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span style={{ color: "var(--ink)" }}>Payment Method:</span>
                                                                        <span className="font-mono" style={{ color: "var(--ink)" }}>{payment.method || "—"}</span>
                                                                    </div>
                                                                    {payment.creditAccount && (
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Credit Account:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>{payment.creditAccount.name || "—"}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                                <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Amount Information</p>
                                                                <div className="text-xs space-y-1">
                                                                    <div className="flex justify-between">
                                                                        <span style={{ color: "var(--ink)" }}>Amount:</span>
                                                                        <span className="font-mono font-semibold" style={{ color: "var(--accent-2)" }}>Rs {(payment.amount || 0).toLocaleString()}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span style={{ color: "var(--ink)" }}>Notes:</span>
                                                                        <span className="font-mono" style={{ color: "var(--ink)" }}>{payment.notes || "—"}</span>
                                                                    </div>
                                                                    {payment.paymentMethodName && (
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Payment Method Name:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>{payment.paymentMethodName}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-[var(--muted)] py-6 text-center">No payments recorded yet</p>
                        )}

                        {/* Sign-off Bar */}
                        <div className="border border-[var(--border)] mt-6 mb-4">
                            <div className="flex text-sm">
                                <div className="w-1/2 text-center py-3 border-r border-[var(--border)]">
                                    <p>Prepared By</p>
                                    <p className="font-semibold mt-1 text-[var(--ink)]">SyedSoft</p>
                                </div>
                                <div className="w-1/2 text-center py-3">
                                    <p>Approved By</p>
                                    <p className="font-semibold mt-1 text-[var(--ink)]">Afrasiab Mobile Accesories</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-between items-start text-xs text-[var(--muted)]">
                            <p className="italic max-w-[70%]">This is a computer generated document, does not required any signature</p>
                            <p>Print Time: {new Date().toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {showPaymentModal && (
                <PurchasePaymentModal
                    purchase={purchase}
                    payment={editingPayment}
                    paymentStatus={paymentStatus}
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
            {showPaymentPdfModal && selectedPayment && (
                <PdfModal
                    isOpen={showPaymentPdfModal}
                    onClose={() => {
                        setShowPaymentPdfModal(false);
                        setSelectedPayment(null);
                    }}
                    fileName={`Payment-${selectedPayment._id || 'receipt'}.pdf`}
                    labels={labels}
                >
                    <PaymentPdfTemplate payment={selectedPayment} purchase={purchase} labels={labels} />
                </PdfModal>
            )}
        </>
    );
}

// import React, { useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { ArrowLeft, Edit, Trash2, Plus, Download, RefreshCw } from "lucide-react";
// import { usePurchase, useGetPurchasePayments, useDeletePurchasePayment, useGetPurchasePaymentStatus, useRecalculatePurchasePaidAmount } from "../services/purchases.service.js";
// import { getPurchaseLabels } from "../labels/purchaseLabels.js";
// import { useSettings } from "../../settings/hooks/useSettings.js";
// import PurchasePaymentModal from "../components/PurchasePaymentModal.jsx";
// import PurchaseDetailPdfTemplate from "../components/PurchaseDetailPdfTemplate.jsx";
// import PdfModal from "../../../shared/components/PdfModal.jsx";
// import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
// import { usePermissionGuard } from "../../../shared/hooks/usePermissionGuard.js";
// import ConfirmDialog from "../../../shared/components/ConfirmationDialog.jsx";

// const STATUS_STYLE = {
//     ordered: { background: "rgba(180,83,9,0.1)", color: "#d97706", text: "Ordered" },
//     delivered: { background: "rgba(15,118,110,0.1)", color: "var(--accent-2)", text: "Delivered" },
//     rejected: { background: "rgba(220,38,38,0.1)", color: "#dc2626", text: "Rejected" },
//     pending: { background: "rgba(180,83,9,0.1)", color: "#d97706", text: "Pending" },
// };

// export default function PurchaseDetail() {
//     const navigate = useNavigate();
//     const { id } = useParams();
//     const [showPaymentModal, setShowPaymentModal] = useState(false);
//     const [editingPayment, setEditingPayment] = useState(null);
//     const [showPdfModal, setShowPdfModal] = useState(false);
    
//     const { settings } = useSettings();
//     const language = settings?.language || "en";
//     const labels = getPurchaseLabels(language);
//     const { hasPermission } = usePermissionGuard();
    
//     const { data: purchaseData, isLoading, refetch: refetchPurchase } = usePurchase(id);
//     const { data: paymentsData, refetch: refetchPayments } = useGetPurchasePayments(id);
//     const { data: paymentStatusData, refetch: refetchPaymentStatus } = useGetPurchasePaymentStatus(id);
//     const [deletePayment] = useDeletePurchasePayment();
//     const [recalculatePurchasePaidAmount] = useRecalculatePurchasePaidAmount();
    
//     const purchase = purchaseData?.data || purchaseData;
//     const payments = paymentsData?.data || paymentsData || [];
//     const paymentStatus = paymentStatusData?.data || paymentStatusData || {};

//     if (isLoading) {
//         return <div className="p-6 text-center">{labels.loading || "Loading..."}</div>;
//     }

//     if (!purchase) {
//         return <div className="p-6 text-center">Purchase not found</div>;
//     }

//     const status = purchase?.status ?? "ordered";
//     const statusStyle = STATUS_STYLE[status] ?? STATUS_STYLE.ordered;
//     const date = new Date(purchase?.purchaseDate ?? purchase?.date ?? purchase?.createdAt).toLocaleDateString();
    
//     // Use live payment status from API
//     const totalPaid = paymentStatus.totalPaid || 0;
//     const remainingAmount = paymentStatus.remainingAmount || (purchase?.totalAmount ?? 0);
//     const paymentStatusText = paymentStatus.paymentStatus || 'pending';
//     const totalCash = paymentStatus.totalCash || 0;
//     const totalCredit = paymentStatus.totalCredit || 0;

//     const handleEditPayment = (payment) => {
//         setEditingPayment(payment);
//         setShowPaymentModal(true);
//     };

//     const handleDeletePayment = async (paymentId) => {
//         try {
//             await deletePayment({ paymentId, purchaseId: id }).unwrap();
//             showSuccess("Payment deleted successfully");
//             refetchPurchase();
//             refetchPayments();
//         } catch (error) {
//             showError(error?.data?.message || "Failed to delete payment");
//         }
//     };

//     const handlePaymentSuccess = () => {
//         setShowPaymentModal(false);
//         setEditingPayment(null);
//         refetchPurchase();
//         refetchPayments();
//         refetchPaymentStatus();
//     };

//     const handleRecalculate = async () => {
//         try {
//             await recalculatePurchasePaidAmount(id).unwrap();
//             showSuccess("Purchase payment recalculated successfully");
//         } catch (error) {
//             showError(error?.data?.message || "Failed to recalculate payment");
//         }
//     };

//     const canEditPayments = hasPermission('purchases:edit');
//     const canDeletePayments = hasPermission('purchases:delete');

//     return (
//         <>
//             <div className="p-6 bg-[var(--app-bg)] min-h-screen">
//                 {/* Header */}
//                 <div className="flex items-center gap-4 mb-6">
//                     <button
//                         onClick={() => navigate("/purchases")}
//                         className="p-2 hover:bg-[var(--hover)] rounded-lg transition-all"
//                     >
//                         <ArrowLeft size={20} className="text-[var(--ink)]" />
//                     </button>
//                     <div className="flex-1 flex items-center justify-between">
//                         <div>
//                             <h1 className="text-3xl font-bold text-[var(--ink)] font-display">
//                                 {labels.purchaseDetails || "Purchase Details"}
//                             </h1>
//                             <p className="text-sm text-[var(--muted)] mt-1">
//                                 {purchase?.purchaseNumber || purchase?.invoiceNumber || "—"}
//                             </p>
//                         </div>
//                         <div className="flex items-center gap-3">
//                             {hasPermission('purchases:edit') && (
//                                 <button
//                                     onClick={handleRecalculate}
//                                     className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all border border-blue-200"
//                                     title="Recalculate Payment"
//                                 >
//                                     <RefreshCw size={16} />
//                                     Recalculate
//                                 </button>
//                             )}
//                             <button
//                                 onClick={() => setShowPdfModal(true)}
//                                 className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-2)] text-white rounded-xl hover:bg-[var(--accent-2)]/90 transition-all shadow-lg shadow-[var(--accent-2)]/20"
//                             >
//                                 <Download size={16} />
//                                 {labels.exportDetails || "Export Details"}
//                             </button>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Purchase Information */}
//                 <div className="mb-8">
//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//                         <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
//                             <p className="text-xs text-[var(--muted)] uppercase font-semibold tracking-wider mb-1">Invoice Number</p>
//                             <p className="text-lg font-bold text-[var(--ink)]">{purchase?.invoiceNumber || "—"}</p>
//                         </div>
//                         <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
//                             <p className="text-xs text-[var(--muted)] uppercase font-semibold tracking-wider mb-1">Supplier</p>
//                             <p className="text-lg font-bold text-[var(--ink)]">{purchase?.supplier?.name || "—"}</p>
//                         </div>
//                         <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
//                             <p className="text-xs text-[var(--muted)] uppercase font-semibold tracking-wider mb-1">Date</p>
//                             <p className="text-lg font-bold text-[var(--ink)]">{date}</p>
//                         </div>
//                         <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
//                             <p className="text-xs text-[var(--muted)] uppercase font-semibold tracking-wider mb-1">Status</p>
//                             <p className="text-lg font-bold">
//                                 <span 
//                                     className="px-3 py-1 rounded-lg text-sm font-semibold"
//                                     style={{ background: statusStyle.background, color: statusStyle.color }}
//                                 >
//                                     {statusStyle.text}
//                                 </span>
//                             </p>
//                         </div>
//                     </div>
//                     {purchase?.notes && (
//                         <div className="mt-4 p-4 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
//                             <p className="text-xs text-[var(--muted)] uppercase font-semibold tracking-wider mb-1">Notes</p>
//                             <p className="text-[var(--ink)]">{purchase.notes}</p>
//                         </div>
//                     )}
//                 </div>

//                 {/* Payment KPI */}
//                 <div className="mb-8">
//                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                         <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
//                             <p className="text-xs text-[var(--muted)] uppercase font-semibold tracking-wider mb-1">Total Amount</p>
//                             <p className="text-2xl font-bold text-[var(--accent-2)]">Rs {(purchase?.totalAmount ?? 0).toLocaleString()}</p>
//                         </div>
//                         <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
//                             <p className="text-xs text-[var(--muted)] uppercase font-semibold tracking-wider mb-1">Total Paid</p>
//                             <p className="text-2xl font-bold text-blue-600">Rs {totalPaid.toLocaleString()}</p>
//                             <p className="text-xs text-[var(--muted)] mt-1">Cash: Rs {totalCash.toLocaleString()} | Credit: Rs {totalCredit.toLocaleString()}</p>
//                         </div>
//                         <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
//                             <p className="text-xs text-[var(--muted)] uppercase font-semibold tracking-wider mb-1">Remaining</p>
//                             <p className="text-2xl font-bold text-orange-600">Rs {remainingAmount.toLocaleString()}</p>
//                         </div>
//                         <div className={`p-4 bg-[var(--surface)] rounded-lg border border-[var(--border)] ${
//                             paymentStatusText === 'full' ? 'border-green-300' :
//                             paymentStatusText === 'partial' ? 'border-yellow-300' :
//                             'border-gray-300'
//                         }`}>
//                             <p className="text-xs text-[var(--muted)] uppercase font-semibold tracking-wider mb-1">Payment Status</p>
//                             <p className="text-2xl font-bold capitalize">{paymentStatusText}</p>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Items Table */}
//                 <div className="mb-8">
//                     <div className="flex items-center justify-between mb-4">
//                         <h3 className="text-lg font-bold text-[var(--ink)]">Items ({purchase?.items?.length || 0})</h3>
//                     </div>
//                     <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
//                         <table className="w-full">
//                             <thead className="bg-[var(--surface-muted)]">
//                                 <tr>
//                                     <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)] tracking-wider">Product</th>
//                                     <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)] tracking-wider">Quantity</th>
//                                     <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)] tracking-wider">Cost Price</th>
//                                     <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)] tracking-wider">Discount</th>
//                                     <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)] tracking-wider">Tax</th>
//                                     <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)] tracking-wider">Subtotal</th>
//                                 </tr>
//                             </thead>
//                             <tbody className="divide-y divide-[var(--border)]">
//                                 {purchase?.items?.map((item, index) => {
//                                     const price = item.price || item.costPrice || item.perItemPrice || 0;
//                                     const quantity = item.quantity || 0;
//                                     const baseTotal = quantity * price;
//                                     const discountAmount = item.discountType === 'percentage' 
//                                         ? baseTotal * (item.discount || 0) / 100 
//                                         : (item.discount || 0);
//                                     const taxAmount = item.taxType === 'percentage'
//                                         ? (baseTotal - discountAmount) * (item.tax || 0) / 100
//                                         : (item.tax || 0);
//                                     const subtotal = baseTotal - discountAmount + taxAmount;
                                    
//                                     return (
//                                         <tr key={index} className="hover:bg-[var(--surface-muted)]">
//                                             <td className="px-4 py-3">
//                                                 <p className="font-semibold text-[var(--ink)]">
//                                                     {item.name || item.product?.name || item.productName || "—"}
//                                                 </p>
//                                                 {item.product?.productCode && (
//                                                     <p className="text-xs text-[var(--muted)]">{item.product.productCode}</p>
//                                                 )}
//                                             </td>
//                                             <td className="px-4 py-3 text-center font-semibold text-[var(--ink)]">{quantity}</td>
//                                             <td className="px-4 py-3 text-right font-semibold text-[var(--ink)]">Rs {price.toLocaleString()}</td>
//                                             <td className="px-4 py-3 text-right font-semibold text-red-600">
//                                                 {item.discountType === 'percentage' ? `${item.discount || 0}%` : `Rs ${(item.discount || 0).toLocaleString()}`}
//                                             </td>
//                                             <td className="px-4 py-3 text-right font-semibold text-green-600">
//                                                 {item.taxType === 'percentage' ? `${item.tax || 0}%` : `Rs ${(item.tax || 0).toLocaleString()}`}
//                                             </td>
//                                             <td className="px-4 py-3 text-right font-bold text-[var(--accent-2)]">Rs {subtotal.toLocaleString()}</td>
//                                         </tr>
//                                     );
//                                 })}
//                             </tbody>
//                         </table>
//                     </div>
//                 </div>

//                 {/* Payments Table */}
//                 <div>
//                     <div className="flex items-center justify-between mb-4">
//                         <h3 className="text-lg font-bold text-[var(--ink)]">Payments ({paymentStatus.transactionCount || payments.length})</h3>
//                         {hasPermission('purchases:create') && remainingAmount > 0 && (
//                             <button
//                                 onClick={() => {
//                                     setEditingPayment(null);
//                                     setShowPaymentModal(true);
//                                 }}
//                                 className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-2)] text-white rounded-lg hover:bg-[var(--accent-2)]/90 transition-all"
//                             >
//                                 <Plus size={16} />
//                                 Add Payment
//                             </button>
//                         )}
//                     </div>
//                     {payments.length > 0 ? (
//                         <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
//                             <table className="w-full">
//                                 <thead className="bg-[var(--surface-muted)]">
//                                     <tr>
//                                         <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)] tracking-wider">Date</th>
//                                         <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)] tracking-wider">Method</th>
//                                         <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)] tracking-wider">Amount</th>
//                                         <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)] tracking-wider">Notes</th>
//                                         <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)] tracking-wider">Actions</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody className="divide-y divide-[var(--border)]">
//                                     {payments.map((payment, index) => (
//                                         <tr key={index} className="hover:bg-[var(--surface-muted)]">
//                                             <td className="px-4 py-3 text-sm text-[var(--ink)] font-medium">
//                                                 {new Date(payment.transactionDate || payment.paymentDate).toLocaleDateString()}
//                                             </td>
//                                             <td className="px-4 py-3">
//                                                 <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
//                                                     payment.method === 'cash' ? 'bg-green-100 text-green-800' :
//                                                     payment.method === 'credit' ? 'bg-blue-100 text-blue-800' :
//                                                     'bg-purple-100 text-purple-800'
//                                                 }`}>
//                                                     {payment.method === 'cash' ? (payment.paymentMethodName || 'Cash') :
//                                                      payment.method === 'credit' ? `Credit (${payment.creditAccount?.name || 'Account'})` :
//                                                      payment.method || "—"}
//                                                 </span>
//                                             </td>
//                                             <td className="px-4 py-3 text-right font-bold text-[var(--accent-2)]">Rs {(payment.amount || 0).toLocaleString()}</td>
//                                             <td className="px-4 py-3 text-sm text-[var(--muted)]">{payment.notes || "—"}</td>
//                                             <td className="px-4 py-3 text-center">
//                                                 <div className="flex items-center justify-center gap-2">
//                                                     {canEditPayments && (
//                                                         <button
//                                                             onClick={() => handleEditPayment(payment)}
//                                                             className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"
//                                                             title="Edit payment"
//                                                         >
//                                                             <Edit size={16} />
//                                                         </button>
//                                                     )}
//                                                     {canDeletePayments && (
//                                                         <ConfirmDialog
//                                                             onConfirm={() => handleDeletePayment(payment._id)}
//                                                             message="Are you sure you want to delete this payment?"
//                                                         >
//                                                             <button
//                                                                 className="p-2 hover:bg-red-50 text-red-600 rounded-lg"
//                                                                 title="Delete payment"
//                                                             >
//                                                                 <Trash2 size={16} />
//                                                             </button>
//                                                         </ConfirmDialog>
//                                                     )}
//                                                 </div>
//                                             </td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         </div>
//                     ) : (
//                         <div className="p-8 text-center bg-[var(--surface-muted)] rounded-lg border border-dashed border-[var(--border)]">
//                             <p className="text-sm text-[var(--muted)]">No payments recorded yet</p>
//                         </div>
//                     )}
//                 </div>
//             </div>
//             {showPaymentModal && (
//                 <PurchasePaymentModal
//                     purchase={purchase}
//                     payment={editingPayment}
//                     paymentStatus={paymentStatus}
//                     onClose={() => {
//                         setShowPaymentModal(false);
//                         setEditingPayment(null);
//                     }}
//                     onSuccess={handlePaymentSuccess}
//                 />
//             )}
//             {showPdfModal && (
//                 <PdfModal
//                     isOpen={showPdfModal}
//                     onClose={() => setShowPdfModal(false)}
//                     fileName={`Purchase-${purchase?.purchaseNumber || purchase?.invoiceNumber || 'details'}.pdf`}
//                     labels={labels}
//                 >
//                     <PurchaseDetailPdfTemplate purchase={purchase} payments={payments} labels={labels} />
//                 </PdfModal>
//             )}
//         </>
//     );
// }

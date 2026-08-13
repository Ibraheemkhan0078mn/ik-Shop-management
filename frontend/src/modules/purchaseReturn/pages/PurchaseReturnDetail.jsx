import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Eye, EyeOff, RefreshCw, Trash2, Plus } from "lucide-react";
import { getPurchaseReturnLabels } from "../labels/purchaseReturnLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getPurchaseReturnByIdApi } from "../api/purchaseReturnApi.js";
import { useGetPurchaseReturnPaymentsQuery, useDeletePurchaseReturnPaymentMutation, useRecalculatePurchaseReturnMutation } from "../services/purchaseReturn.service.js";
import PurchaseReturnDetailPdfTemplate from "../components/PurchaseReturnDetailPdfTemplate.jsx";
import PurchaseReturnPaymentModal from "../components/PurchaseReturnPaymentModal.jsx";
import PdfModal from "../../../shared/components/PdfModal.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import ConfirmDialog from "../../../shared/components/ConfirmationDialog.jsx";

const STATUS_STYLE = {
    draft: { background: "rgba(107,114,128,0.1)", color: "#6b7280", text: "Draft" },
    pending: { background: "rgba(180,83,9,0.1)", color: "#d97706", text: "Pending" },
    approved: { background: "rgba(15,118,110,0.1)", color: "var(--accent-2)", text: "Approved" },
    rejected: { background: "rgba(220,38,38,0.1)", color: "#dc2626", text: "Rejected" },
};

export default function PurchaseReturnDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [expandedItems, setExpandedItems] = useState({});
    const [expandedPayments, setExpandedPayments] = useState({});
    const [purchaseReturn, setPurchaseReturn] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getPurchaseReturnLabels(language);

    // Transaction/Refund hooks
    const { data: paymentsData, refetch: refetchPayments } = useGetPurchaseReturnPaymentsQuery(id);
    const [deletePayment] = useDeletePurchaseReturnPaymentMutation();
    const [recalculatePurchaseReturn] = useRecalculatePurchaseReturnMutation();

    const payments = paymentsData?.data || paymentsData || [];

    // Calculate payment status
    const totalRefundAmount = purchaseReturn?.totalRefundAmount || 0;
    const refundedAmount = purchaseReturn?.refundedAmount || 0;
    const remainingAmount = totalRefundAmount - refundedAmount;
    const refundStatus = purchaseReturn?.refundStatus || 'pending';

    const handleDeletePayment = async (paymentId) => {
        try {
            await deletePayment({ id, paymentId }).unwrap();
            showSuccess("Refund deleted successfully");
            refetchPayments();
        } catch (error) {
            showError(error?.data?.message || "Failed to delete refund");
        }
    };

    const handleRecalculate = async () => {
        try {
            await recalculatePurchaseReturn(id).unwrap();
            showSuccess("Purchase return recalculated successfully");
            refetchPayments();
            // Refetch purchase return to get updated refunded amount
            const result = await getPurchaseReturnByIdApi(id);
            setPurchaseReturn(result.data);
        } catch (error) {
            showError(error?.data?.message || "Failed to recalculate");
        }
    };

    const handlePaymentSuccess = async () => {
        setShowPaymentModal(false);
        refetchPayments();
        // Refetch purchase return to get updated refunded amount
        const result = await getPurchaseReturnByIdApi(id);
        setPurchaseReturn(result.data);
    };

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await getPurchaseReturnByIdApi(id);
                setPurchaseReturn(result.data);
            } catch (error) {
                console.error("Error fetching purchase return:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (isLoading) {
        return <div className="p-6 text-center">{labels.loading || "Loading..."}</div>;
    }

    if (!purchaseReturn) {
        return <div className="p-6 text-center">Purchase Return not found</div>;
    }

    const status = purchaseReturn?.status ?? "draft";
    const statusStyle = STATUS_STYLE[status] ?? STATUS_STYLE.draft;
    const date = new Date(purchaseReturn?.returnDate ?? purchaseReturn?.createdAt).toLocaleDateString();

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
                                    {labels.purchaseReturnDetails || "Purchase Return Details"}
                                </h1>
                                <p className="text-sm text-[var(--muted)]">
                                    {purchaseReturn.purchaseReturnNumber || purchaseReturn.returnNumber || "—"} · {date}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRecalculate}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--hover)] rounded-lg transition-all"
                                title="Recalculate Refund"
                            >
                                <RefreshCw size={15} />
                                Recalculate
                            </button>
                            <button
                                onClick={() => setShowPdfModal(true)}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--accent-2)] text-white rounded-lg hover:bg-[var(--accent-2)]/90 transition-all shadow-sm"
                            >
                                <Download size={15} />
                                {labels.exportDetails || "Export"}
                            </button>
                        </div>
                    </div>

                    {/* Paper sheet */}
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm px-8 py-8">

                        {/* Return info row */}
                        <div className="flex flex-wrap items-start justify-between gap-6">
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Return Number</p>
                                <p className="text-base font-semibold text-[var(--ink)]">{purchaseReturn.purchaseReturnNumber || purchaseReturn.returnNumber || "—"}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Supplier</p>
                                <p className="text-base font-semibold text-[var(--ink)]">{purchaseReturn.supplierName || purchaseReturn.supplier?.name || "—"}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Date</p>
                                <p className="text-base font-semibold text-[var(--ink)]">{date}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Status</p>
                                <span
                                    className="inline-block px-3 py-1 rounded-lg text-sm font-semibold"
                                    style={{ background: statusStyle.background, color: statusStyle.color }}
                                >
                                    {statusStyle.text}
                                </span>
                            </div>
                        </div>

                        {purchaseReturn?.reason && (
                            <p className="text-sm text-[var(--muted)] mt-6 italic">
                                Reason: {purchaseReturn.reason.replace(/_/g, " ")}
                            </p>
                        )}

                        {purchaseReturn?.notes && (
                            <p className="text-sm text-[var(--muted)] mt-2 italic">
                                Notes: {purchaseReturn.notes}
                            </p>
                        )}

                        <div className="h-px bg-[var(--border)] my-8" />

                        {/* Refund KPI row */}
                        <div className="flex flex-wrap items-start justify-between gap-6">
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Total Refund Amount</p>
                                <p className="text-2xl font-bold text-red-600">Rs {totalRefundAmount.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Total Refunded</p>
                                <p className="text-2xl font-bold text-blue-600">Rs {refundedAmount.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Remaining</p>
                                <p className="text-2xl font-bold text-orange-600">Rs {remainingAmount.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Refund Status</p>
                                <p className="text-2xl font-bold text-[var(--ink)] capitalize">{refundStatus}</p>
                            </div>
                        </div>

                        <div className="h-px bg-[var(--border)] my-7" />

                        {/* Items */}
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
                                Items ({purchaseReturn?.items?.length || 0})
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[var(--border)]">
                                        <th className="py-2 text-left text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Product</th>
                                        <th className="py-2 text-center text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Return Qty</th>
                                        <th className="py-2 text-right text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Cost Price</th>
                                        <th className="py-2 text-right text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Cut Amount</th>
                                        <th className="py-2 text-right text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Refund Amount</th>
                                        <th className="py-2 text-center text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {purchaseReturn?.items?.map((item, index) => {
                                        const price = item.costPrice || item.purchasePrice || 0;
                                        const quantity = item.quantity || 0;
                                        const cutAmount = item.cut || 0;
                                        const refundAmount = (quantity * price) - cutAmount;

                                        const isExpanded = expandedItems[index];

                                        return (
                                            <React.Fragment key={index}>
                                                <tr>
                                                    <td className="py-3">
                                                        <p className="font-medium text-[var(--ink)]">
                                                            {item.productName || item.product?.name || "—"}
                                                        </p>
                                                        {item.product?.productCode && (
                                                            <p className="text-xs text-[var(--muted)]">{item.product.productCode}</p>
                                                        )}
                                                        {item.batchNumber && (
                                                            <p className="text-xs text-[var(--muted)]">Batch: {item.batchNumber}</p>
                                                        )}
                                                    </td>
                                                    <td className="py-3 text-center text-[var(--ink)]">{quantity}</td>
                                                    <td className="py-3 text-right text-[var(--ink)]">Rs {price.toLocaleString()}</td>
                                                    <td className="py-3 text-right text-red-600">Rs {cutAmount.toLocaleString()}</td>
                                                    <td className="py-3 text-right font-semibold text-red-600">Rs {refundAmount.toLocaleString()}</td>
                                                    <td className="py-3 text-center">
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
                                                        <td colSpan="6" className="px-2 sm:px-3 py-4" style={{ background: "var(--surface-muted)" }}>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                {/* Total Price Calculation */}
                                                                <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Refund Calculation</p>
                                                                    <div className="text-xs space-y-1">
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Return Quantity:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>{quantity}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Cost Price:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {price.toFixed(2)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                                            <span style={{ color: "var(--accent-2)" }}>Base Total:</span>
                                                                            <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {(quantity * price).toFixed(2)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Cut Calculation */}
                                                                <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Cut Amount</p>
                                                                    <div className="text-xs space-y-1">
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Cut Amount:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {cutAmount.toFixed(2)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                                            <span style={{ color: "var(--accent-2)" }}>After Cut:</span>
                                                                            <span className="font-mono text-red-600" style={{ color: "var(--accent-2)" }}>-Rs {cutAmount.toFixed(2)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Final Refund */}
                                                                <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Final Refund</p>
                                                                    <div className="text-xs space-y-1">
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Base Total:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {(quantity * price).toFixed(2)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Cut Amount:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {cutAmount.toFixed(2)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                                            <span style={{ color: "var(--accent-2)" }}>Refund Amount:</span>
                                                                            <span className="font-mono text-red-600" style={{ color: "var(--accent-2)" }}>Rs {refundAmount.toFixed(2)}</span>
                                                                        </div>
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

                        <div className="h-px bg-[var(--border)] my-10" />

                        {/* Summary Section */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
                                Summary
                            </h3>
                        </div>
                        
                        {/* Calculate summary values */}
                        {(() => {
                            const totalBaseAmount = (purchaseReturn?.items || []).reduce((sum, it) => {
                                const price = it.costPrice || it.purchasePrice || 0;
                                const quantity = it.quantity || 0;
                                return sum + (quantity * price);
                            }, 0);
                            
                            const totalCutAmount = (purchaseReturn?.items || []).reduce((sum, it) => {
                                return sum + (it.cut || 0);
                            }, 0);
                            
                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Base Amount Card */}
                                    <div className="p-4 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                        <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Base Amount</p>
                                        <div className="text-xs space-y-1">
                                            <div className="flex justify-between">
                                                <span style={{ color: "var(--ink)" }}>Items Base Total:</span>
                                                <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {totalBaseAmount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                <span style={{ color: "var(--accent-2)" }}>Base Amount:</span>
                                                <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {totalBaseAmount.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cut Amount Card */}
                                    <div className="p-4 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                        <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Total Cut Amount</p>
                                        <div className="text-xs space-y-1">
                                            <div className="flex justify-between">
                                                <span style={{ color: "var(--ink)" }}>Total Cut:</span>
                                                <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {totalCutAmount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                <span style={{ color: "var(--accent-2)" }}>After Cut:</span>
                                                <span className="font-mono text-red-600" style={{ color: "var(--accent-2)" }}>-Rs {totalCutAmount.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Final Total Card */}
                        <div className="mt-4 p-4 rounded-lg" style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)" }}>
                            <p className="text-xs font-semibold mb-2" style={{ color: "#dc2626" }}>Total Refund Amount</p>
                            <div className="text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Final Refund:</span>
                                    <span className="text-lg font-bold font-mono text-red-600">Rs {(purchaseReturn?.totalRefundAmount ?? purchaseReturn?.totalAmount ?? 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-[var(--border)] my-10" />

                        {/* Refunds/Transactions */}
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
                                Refunds ({payments.length})
                            </h3>
                            {purchaseReturn?.status === 'approved' && remainingAmount > 0 && (
                                <button
                                    onClick={() => setShowPaymentModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--accent-2)] text-white rounded-lg hover:bg-[var(--accent-2)]/90 transition-all"
                                >
                                    <Plus size={15} />
                                    Record Refund
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
                                                        <td className="py-3 text-right font-semibold text-red-600">Rs {(payment.amount || 0).toLocaleString()}</td>
                                                        <td className="py-3 text-sm text-center text-[var(--muted)]">{payment.notes || "—"}</td>
                                                        <td className="py-3">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button
                                                                    onClick={() => setExpandedPayments(prev => ({ ...prev, [index]: !prev[index] }))}
                                                                    className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-lg"
                                                                    title={isPaymentExpanded ? "Hide details" : "Show details"}
                                                                >
                                                                    {isPaymentExpanded ? <EyeOff size={15} /> : <Eye size={15} />}
                                                                </button>
                                                                <ConfirmDialog
                                                                    onConfirm={() => handleDeletePayment(payment._id)}
                                                                    message="Are you sure you want to delete this refund?"
                                                                >
                                                                    <button
                                                                        className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg"
                                                                        title="Delete refund"
                                                                    >
                                                                        <Trash2 size={15} />
                                                                    </button>
                                                                </ConfirmDialog>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {isPaymentExpanded && (
                                                        <tr>
                                                            <td colSpan="5" className="px-2 sm:px-3 py-4" style={{ background: "var(--surface-muted)" }}>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                                        <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Refund Details</p>
                                                                        <div className="text-xs space-y-1">
                                                                            <div className="flex justify-between">
                                                                                <span style={{ color: "var(--ink)" }}>Refund ID:</span>
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
                                                                                <span style={{ color: "var(--ink)" }}>Cash Amount:</span>
                                                                                <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {(payment.cashAmount || 0).toLocaleString()}</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span style={{ color: "var(--ink)" }}>Credit Amount:</span>
                                                                                <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {(payment.creditAmount || 0).toLocaleString()}</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span style={{ color: "var(--ink)" }}>Notes:</span>
                                                                                <span className="font-mono" style={{ color: "var(--ink)" }}>{payment.notes || "—"}</span>
                                                                            </div>
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
                            <p className="text-sm text-[var(--muted)] py-6 text-center">No refunds recorded yet</p>
                        )}
                    </div>
                </div>
            </div>
            {showPdfModal && (
                <PdfModal
                    isOpen={showPdfModal}
                    onClose={() => setShowPdfModal(false)}
                    fileName={`PurchaseReturn-${purchaseReturn?.purchaseReturnNumber || purchaseReturn?.returnNumber || 'details'}.pdf`}
                    labels={labels}
                >
                    <PurchaseReturnDetailPdfTemplate purchaseReturn={purchaseReturn} labels={labels} />
                </PdfModal>
            )}
            {showPaymentModal && (
                <PurchaseReturnPaymentModal
                    purchaseReturn={purchaseReturn}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </>
    );
}

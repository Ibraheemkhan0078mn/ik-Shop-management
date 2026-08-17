import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, RefreshCw, Trash2, Eye, EyeOff, Download } from "lucide-react";
import { getOrderReturnLabels } from "../labels/orderReturnLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { useGetOrderReturnByIdQuery, useGetOrderReturnPaymentsQuery, useDeleteOrderReturnPaymentMutation, useRecalculateOrderReturnMutation } from "../api/orderReturn.api.js";
import OrderReturnPaymentModal from "../components/OrderReturnPaymentModal.jsx";
import OrderReturnPdfTemplate from "../components/OrderReturnPdfTemplate.jsx";
import PdfModal from "../../../shared/components/PdfModal.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";

const STATUS_STYLE = {
    pending: { background: "rgba(180,83,9,0.1)", color: "#d97706", text: "Pending" },
    approved: { background: "rgba(15,118,110,0.1)", color: "var(--accent-2)", text: "Approved" },
    rejected: { background: "rgba(220,38,38,0.1)", color: "#dc2626", text: "Rejected" },
    completed: { background: "rgba(59,130,246,0.1)", color: "#3b82f6", text: "Completed" },
};

export default function OrderReturnDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [expandedPayments, setExpandedPayments] = useState({});
    const [expandedItems, setExpandedItems] = useState({});

    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getOrderReturnLabels(language);

    const { data: orderReturn, isLoading, refetch } = useGetOrderReturnByIdQuery(id);
    const { data: paymentsData, refetch: refetchPayments } = useGetOrderReturnPaymentsQuery(id);
    const [deletePayment] = useDeleteOrderReturnPaymentMutation();
    const [recalculateOrderReturn] = useRecalculateOrderReturnMutation();

    const payments = paymentsData || [];

    // Calculate payment status
    const totalRefundAmount = orderReturn?.totalRefundAmount || 0;
    const refundedAmount = orderReturn?.refundedAmount || 0;
    const remainingAmount = totalRefundAmount - refundedAmount;
    const refundStatus = orderReturn?.refundStatus || 'pending';

    const handleDeletePayment = async (paymentId) => {
        try {
            await deletePayment({ id, paymentId }).unwrap();
            await recalculateOrderReturn(id).unwrap();
            showSuccess("Refund deleted successfully");
            refetchPayments();
            refetch();
        } catch (error) {
            showError(error?.data?.message || "Failed to delete refund");
        }
    };

    const handleRecalculate = async () => {
        try {
            await recalculateOrderReturn(id).unwrap();
            showSuccess("Order return recalculated successfully");
            refetchPayments();
            refetch();
        } catch (error) {
            showError(error?.data?.message || "Failed to recalculate");
        }
    };

    const handlePaymentSuccess = async () => {
        setShowPaymentModal(false);
        refetchPayments();
        refetch();
    };

    if (isLoading) {
        return <div className="p-6 text-center">{labels.loading || "Loading..."}</div>;
    }

    if (!orderReturn) {
        return <div className="p-6 text-center">Order Return not found</div>;
    }

    const statusStyle = STATUS_STYLE[orderReturn.returnStatus] || STATUS_STYLE.pending;

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
                                    {labels.orderReturn || "Order Return Details"}
                                </h1>
                                <p className="text-sm text-[var(--muted)]">
                                    {orderReturn.returnNumber} · {new Date(orderReturn.returnDate || orderReturn.createdAt).toLocaleDateString()}
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
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Paper sheet */}
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm px-8 py-8">

                        {/* Return info row */}
                        <div className="flex flex-wrap items-start justify-between gap-6">
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Return Number</p>
                                <p className="text-base font-semibold text-[var(--ink)]">{orderReturn.returnNumber}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Order Number</p>
                                <p className="text-base font-semibold text-[var(--ink)]">{orderReturn.referenceOrderNumber || "—"}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Customer</p>
                                <p className="text-base font-semibold text-[var(--ink)]">{orderReturn.customerName || "—"}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Date</p>
                                <p className="text-base font-semibold text-[var(--ink)]">{new Date(orderReturn.returnDate || orderReturn.createdAt).toLocaleDateString()}</p>
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

                        {orderReturn.notes && (
                            <p className="text-sm text-[var(--muted)] mt-6 italic">
                                {orderReturn.notes}
                            </p>
                        )}

                        <div className="h-px bg-[var(--border)] my-8" />

                        {/* Payment KPI row */}
                        <div className="flex flex-wrap items-start justify-between gap-6">
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Total Refund</p>
                                <p className="text-2xl font-bold text-[var(--accent-2)]">Rs {totalRefundAmount.toLocaleString()}</p>
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
                                Items ({orderReturn?.items?.length || 0})
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[var(--border)]">
                                        <th className="py-2 text-left text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Product</th>
                                        <th className="py-2 text-center text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Qty</th>
                                        <th className="py-2 text-right text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Original Price</th>
                                        <th className="py-2 text-right text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Cut</th>
                                        <th className="py-2 text-right text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Refund Amount</th>
                                        <th className="py-2 text-center text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {orderReturn?.items?.map((item, index) => {
                                        const originalPrice = item.originalPrice || 0;
                                        const quantity = item.quantity || 0;
                                        const cut = item.cut || 0;
                                        const refundAmount = item.refundAmount || 0;
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
                                                    </td>
                                                    <td className="py-3 text-center text-[var(--ink)]">{quantity}</td>
                                                    <td className="py-3 text-right text-[var(--ink)]">Rs {originalPrice.toLocaleString()}</td>
                                                    <td className="py-3 text-right text-red-600">Rs {cut.toLocaleString()}</td>
                                                    <td className="py-3 text-right font-semibold text-[var(--accent-2)]">Rs {refundAmount.toLocaleString()}</td>
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
                                                                <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Total Price Calculation</p>
                                                                    <div className="text-xs space-y-1">
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Quantity:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>{quantity}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Original Price:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {originalPrice.toFixed(2)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                                            <span style={{ color: "var(--accent-2)" }}>Base Total:</span>
                                                                            <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {(quantity * originalPrice).toFixed(2)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Cut Calculation</p>
                                                                    <div className="text-xs space-y-1">
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Cut Amount:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {cut.toFixed(2)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                                            <span style={{ color: "var(--accent-2)" }}>After Cut:</span>
                                                                            <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {(quantity * originalPrice - cut).toFixed(2)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Refund Calculation</p>
                                                                    <div className="text-xs space-y-1">
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>After Cut Value:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {(quantity * originalPrice - cut).toFixed(2)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                                            <span style={{ color: "var(--accent-2)" }}>Refund Amount:</span>
                                                                            <span className="font-mono text-green-600" style={{ color: "var(--accent-2)" }}>Rs {refundAmount.toFixed(2)}</span>
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Total Refund Amount</p>
                                <div className="text-xs space-y-1">
                                    <div className="flex justify-between">
                                        <span style={{ color: "var(--ink)" }}>Items Count:</span>
                                        <span className="font-mono" style={{ color: "var(--ink)" }}>{orderReturn?.items?.length || 0}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                        <span style={{ color: "var(--accent-2)" }}>Total Refund:</span>
                                        <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {totalRefundAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Refund Status</p>
                                <div className="text-xs space-y-1">
                                    <div className="flex justify-between">
                                        <span style={{ color: "var(--ink)" }}>Refunded Amount:</span>
                                        <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {refundedAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: "var(--ink)" }}>Remaining Amount:</span>
                                        <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {remainingAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                        <span style={{ color: "var(--accent-2)" }}>Status:</span>
                                        <span className="font-mono capitalize" style={{ color: "var(--accent-2)" }}>{refundStatus}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Final Total Card */}
                        <div className="mt-4 p-4 rounded-lg" style={{ background: "rgba(15,118,110,0.08)", border: "1px solid rgba(15,118,110,0.25)" }}>
                            <p className="text-xs font-semibold mb-2" style={{ color: "var(--accent-2)" }}>Total</p>
                            <div className="text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span style={{ color: "var(--ink)" }}>Total Refund Amount:</span>
                                    <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {totalRefundAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: "var(--ink)" }}>Refunded Amount:</span>
                                    <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {refundedAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                                    <span style={{ color: "var(--accent-2)" }}>Remaining to Refund:</span>
                                    <span className="font-mono text-xl" style={{ color: "var(--accent-2)" }}>Rs {remainingAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-[var(--border)] my-10" />

                        {/* Payments */}
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
                                Refunds ({payments.length})
                            </h3>
                            {orderReturn?.returnStatus === 'approved' && remainingAmount > 0 && (
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
                                                        <td className="py-3 text-right font-semibold text-[var(--accent-2)]">Rs {(payment.amount || 0).toLocaleString()}</td>
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
                                                                <button
                                                                    onClick={() => handleDeletePayment(payment._id)}
                                                                    className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg"
                                                                    title="Delete Refund"
                                                                >
                                                                    <Trash2 size={15} />
                                                                </button>
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

            {/* Payment Modal */}
            {showPaymentModal && (
                <OrderReturnPaymentModal
                    orderReturn={orderReturn}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={handlePaymentSuccess}
                />
            )}
            {showPdfModal && (
                <PdfModal
                    isOpen={showPdfModal}
                    onClose={() => setShowPdfModal(false)}
                    fileName={`OrderReturn-${orderReturn?.returnNumber || 'details'}.pdf`}
                    labels={{}}
                >
                    <OrderReturnPdfTemplate orderReturn={orderReturn} refunds={payments} labels={{}} />
                </PdfModal>
            )}
        </>
    );
}

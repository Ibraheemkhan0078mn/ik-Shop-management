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
        <div className="h-screen flex flex-col bg-[var(--app-bg)]">
            {/* Header */}
            <div className="flex-none px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--ink)]"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-[var(--ink)]">{orderReturn.returnNumber}</h1>
                            <p className="text-sm text-[var(--muted)]">{labels.orderReturn || "Order Return"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
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
                            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--hover)] rounded-lg transition-all"
                            title="Export PDF"
                        >
                            <Download size={15} />
                            Export
                        </button>
                        <button
                            onClick={() => setShowPaymentModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-2)] text-white rounded-lg hover:bg-[var(--accent-2)]/90 transition-all"
                        >
                            <Plus size={16} />
                            Record Refund
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Status Card */}
                    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-[var(--ink)]">{labels.returnStatus || "Return Status"}</h2>
                            <span
                                className="px-4 py-2 rounded-full text-sm font-medium"
                                style={{ background: statusStyle.background, color: statusStyle.color }}
                            >
                                {statusStyle.text}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-[var(--hover)] rounded-lg">
                                <p className="text-sm text-[var(--muted)] mb-1">{labels.totalRefundAmount || "Total Refund Amount"}</p>
                                <p className="text-2xl font-bold text-[var(--ink)]">Rs {totalRefundAmount.toLocaleString()}</p>
                            </div>
                            <div className="p-4 bg-[var(--hover)] rounded-lg">
                                <p className="text-sm text-[var(--muted)] mb-1">{labels.refundedAmount || "Refunded Amount"}</p>
                                <p className="text-2xl font-bold text-[var(--accent-2)]">Rs {refundedAmount.toLocaleString()}</p>
                            </div>
                            <div className="p-4 bg-[var(--hover)] rounded-lg">
                                <p className="text-sm text-[var(--muted)] mb-1">{labels.remainingAmount || "Remaining Amount"}</p>
                                <p className="text-2xl font-bold text-[var(--ink)]">Rs {remainingAmount.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Order Information */}
                    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
                        <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">{labels.orderInformation || "Order Information"}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-[var(--muted)] mb-1">{labels.orderNumber || "Order Number"}</p>
                                <p className="font-medium text-[var(--ink)]">{orderReturn.referenceOrderNumber}</p>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--muted)] mb-1">{labels.customerName || "Customer Name"}</p>
                                <p className="font-medium text-[var(--ink)]">{orderReturn.customerName || "—"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--muted)] mb-1">{labels.returnDate || "Return Date"}</p>
                                <p className="font-medium text-[var(--ink)]">
                                    {new Date(orderReturn.returnDate || orderReturn.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--muted)] mb-1">{labels.refundStatus || "Refund Status"}</p>
                                <p className="font-medium text-[var(--ink)] capitalize">{refundStatus}</p>
                            </div>
                        </div>
                        {orderReturn.notes && (
                            <div className="mt-4">
                                <p className="text-sm text-[var(--muted)] mb-1">{labels.notes || "Notes"}</p>
                                <p className="font-medium text-[var(--ink)]">{orderReturn.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Items */}
                    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
                        <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">{labels.items || "Items"}</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--border)]">
                                        <th className="px-4 py-3 text-left text-[var(--muted)] font-medium">{labels.productName || "Product"}</th>
                                        <th className="px-4 py-3 text-center text-[var(--muted)] font-medium">{labels.quantity || "Qty"}</th>
                                        <th className="px-4 py-3 text-right text-[var(--muted)] font-medium">{labels.originalPrice || "Original Price"}</th>
                                        <th className="px-4 py-3 text-right text-[var(--muted)] font-medium">{labels.cut || "Cut"}</th>
                                        <th className="px-4 py-3 text-right text-[var(--muted)] font-medium">{labels.refundAmount || "Refund Amount"}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orderReturn.items?.map((item, index) => (
                                        <tr key={index} className="border-b border-[var(--border)]">
                                            <td className="px-4 py-3 text-[var(--ink)]">{item.productName}</td>
                                            <td className="px-4 py-3 text-center text-[var(--ink)]">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right text-[var(--ink)]">Rs {item.originalPrice?.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right text-[var(--ink)]">Rs {item.cut?.toLocaleString() || 0}</td>
                                            <td className="px-4 py-3 text-right text-[var(--accent-2)] font-medium">Rs {item.refundAmount?.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Refunds/Transactions */}
                    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-[var(--ink)]">Refunds ({payments.length})</h2>
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
                        {payments.length === 0 ? (
                            <div className="text-center py-8 text-[var(--muted)]">No refunds recorded yet</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[var(--border)]">
                                            <th className="px-4 py-3 text-left text-[var(--muted)] font-medium">Date</th>
                                            <th className="px-4 py-3 text-left text-[var(--muted)] font-medium">Method</th>
                                            <th className="px-4 py-3 text-right text-[var(--muted)] font-medium">Amount</th>
                                            <th className="px-4 py-3 text-right text-[var(--muted)] font-medium">Cash</th>
                                            <th className="px-4 py-3 text-right text-[var(--muted)] font-medium">Credit</th>
                                            <th className="px-4 py-3 text-center text-[var(--muted)] font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((payment, index) => {
                                            const isPaymentExpanded = expandedPayments[index];
                                            return (
                                                <React.Fragment key={payment._id}>
                                                    <tr className="border-b border-[var(--border)]">
                                                        <td className="px-4 py-3 text-[var(--ink)]">
                                                            {new Date(payment.transactionDate || payment.date).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-4 py-3 text-[var(--ink)] capitalize">{payment.method}</td>
                                                        <td className="px-4 py-3 text-right text-[var(--accent-2)] font-medium">
                                                            Rs {(payment.amount || 0).toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-[var(--ink)]">
                                                            Rs {(payment.cashAmount || 0).toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-[var(--ink)]">
                                                            Rs {(payment.creditAmount || 0).toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => setExpandedPayments(prev => ({ ...prev, [index]: !prev[index] }))}
                                                                    className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition"
                                                                    title={isPaymentExpanded ? "Hide details" : "Show details"}
                                                                >
                                                                    {isPaymentExpanded ? <EyeOff size={14} /> : <Eye size={14} />}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeletePayment(payment._id)}
                                                                    className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                                                                    title="Delete Refund"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {isPaymentExpanded && (
                                                        <tr>
                                                            <td colSpan="6" className="px-2 py-4" style={{ background: "var(--surface-muted)" }}>
                                                                <div className="p-4 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                                    <p className="text-xs font-semibold mb-3" style={{ color: "var(--muted)" }}>Refunded Items</p>
                                                                    <div className="overflow-x-auto">
                                                                        <table className="w-full text-xs">
                                                                            <thead>
                                                                                <tr className="border-b border-[var(--border)]">
                                                                                    <th className="px-3 py-2 text-left text-[var(--muted)] font-medium">Product</th>
                                                                                    <th className="px-3 py-2 text-center text-[var(--muted)] font-medium">Qty</th>
                                                                                    <th className="px-3 py-2 text-right text-[var(--muted)] font-medium">Original Price</th>
                                                                                    <th className="px-3 py-2 text-right text-[var(--muted)] font-medium">Cut</th>
                                                                                    <th className="px-3 py-2 text-right text-[var(--muted)] font-medium">Refund Amount</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {orderReturn?.items?.map((item, itemIndex) => (
                                                                                    <tr key={itemIndex} className="border-b border-[var(--border)]">
                                                                                        <td className="px-3 py-2 text-[var(--ink)]">{item.productName}</td>
                                                                                        <td className="px-3 py-2 text-center text-[var(--ink)]">{item.quantity}</td>
                                                                                        <td className="px-3 py-2 text-right text-[var(--ink)]">Rs {item.originalPrice?.toLocaleString()}</td>
                                                                                        <td className="px-3 py-2 text-right text-[var(--ink)]">Rs {item.cut?.toLocaleString() || 0}</td>
                                                                                        <td className="px-3 py-2 text-right text-[var(--accent-2)] font-medium">Rs {item.refundAmount?.toLocaleString()}</td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
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
        </div>
    );
}

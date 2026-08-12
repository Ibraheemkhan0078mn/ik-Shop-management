import { useParams, useNavigate } from "react-router-dom";
import { useOrder, useGetOrderPayments, useGetOrderPaymentStatus, useDeleteOrderPayment, useRecalculateOrderPaidAmount } from "../services/orders.service.js";
import { Receipt, Package, DollarSign, CreditCard, FileText, Copy, Download, Trash2, RefreshCw, Eye, EyeOff, ArrowLeft } from "lucide-react";
import OrderDetailsPdfTemplate from "../components/OrderDetailsPdfTemplate.jsx";
import PdfModal from "../../../shared/components/PdfModal.jsx";
import { useState } from "react";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import { usePermissionGuard } from "../../../shared/hooks/usePermissionGuard.js";
import ConfirmDialog from "../../../shared/components/ConfirmationDialog.jsx";
import React from "react";

export default function OrderDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: order, isLoading, error, refetch: refetchOrder } = useOrder(id, { skip: !id });
    const { data: paymentsData, refetch: refetchPayments } = useGetOrderPayments(id, { skip: !id });
    const { data: paymentStatusData, refetch: refetchPaymentStatus } = useGetOrderPaymentStatus(id, { skip: !id });
    const [deletePayment] = useDeleteOrderPayment();
    const [recalculateOrderPaidAmount] = useRecalculateOrderPaidAmount();
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [expandedItems, setExpandedItems] = useState({});
    const { hasPermission } = usePermissionGuard();

    const payments = paymentsData?.data || paymentsData || [];
    const paymentStatus = paymentStatusData?.data || paymentStatusData || {};

    const totalPaid = order?.paid ?? 0;
    const remainingAmount = order?.remainingAmount ?? 0;

    const handleDeletePayment = async (paymentId) => {
        try {
            await deletePayment({ paymentId }).unwrap();
            await recalculateOrderPaidAmount(id).unwrap();
            showSuccess("Payment deleted successfully");
            refetchOrder();
            refetchPayments();
            refetchPaymentStatus();
        } catch (error) {
            showError(error?.data?.message || "Failed to delete payment");
        }
    };

    const handleRecalculate = async () => {
        try {
            await recalculateOrderPaidAmount(id).unwrap();
            showSuccess("Order payment recalculated successfully");
        } catch (error) {
            showError(error?.data?.message || "Failed to recalculate payment");
        }
    };

    const canDeletePayments = hasPermission('orders:delete');

    const handleCopyOrderNumber = () => {
        if (order?.orderNumber) {
            navigator.clipboard.writeText(order.orderNumber);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-xl bg-(--surface-muted) flex items-center justify-center mx-auto mb-4">
                        <Receipt size={28} className="text-(--muted)" strokeWidth={1.5} />
                    </div>
                    <p className="text-(--muted) font-semibold text-sm">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                        <Receipt size={28} className="text-red-500" />
                    </div>
                    <p className="text-red-500 font-semibold text-sm">Failed to load order details</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-150 hover:scale-105"
                        style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--accent-2)" }}
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

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
                                    Order Details
                                </h1>
                                <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                                    <span>{order.orderNumber || "—"}</span>
                                    <button
                                        onClick={handleCopyOrderNumber}
                                        className="p-0.5 rounded hover:bg-[var(--hover)] transition-all"
                                        title="Copy order number"
                                    >
                                        <Copy size={13} className="text-[var(--muted)]" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {hasPermission('orders:edit') && (
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
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Paper sheet */}
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm px-8 py-8">

                        {/* Status row */}
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                                    order?.status === "completed" ? "bg-green-100 text-green-700" :
                                    order?.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                                    order?.status === "cancelled" ? "bg-red-100 text-red-700" :
                                    "bg-blue-100 text-blue-700"
                                }`}>
                                    {order?.status || "Unknown"}
                                </span>
                                {order?.isPosOrder && (
                                    <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-100 text-purple-700">
                                        POS Order
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-[var(--muted)]">
                                Created {new Date(order?.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                        </div>

                        <div className="h-px bg-[var(--border)] mt-6 mb-2" />

                        {/* Order Details */}
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] pt-3 pb-3">Order Details</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Order ID</p>
                                <p className="text-sm font-semibold text-[var(--ink)] truncate">{order?._id || "—"}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Customer Name</p>
                                <p className="text-sm font-semibold text-[var(--ink)]">{order?.customerName || "Walk-in Customer"}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Customer Type</p>
                                <p className="text-sm font-semibold text-[var(--ink)] capitalize">{order?.customerType || "—"}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Customer ID</p>
                                <p className="text-sm font-semibold text-[var(--ink)] truncate">{order?.customerId || "—"}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Served By</p>
                                <p className="text-sm font-semibold text-[var(--ink)]">{order?.waiter || "Not specified"}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Order Type</p>
                                <p className="text-sm font-semibold text-[var(--ink)] capitalize">{order?.orderType || "Retail"}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Staff ID</p>
                                <p className="text-sm font-semibold text-[var(--ink)]">{order?.staffId || "—"}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Last Updated</p>
                                <p className="text-sm font-semibold text-[var(--ink)]">
                                    {order?.updatedAt ? new Date(order.updatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : "—"}
                                </p>
                            </div>
                        </div>

                        {order?.note && (
                            <p className="text-sm text-[var(--muted)] mt-4 italic">
                                {order.note}
                            </p>
                        )}

                        <div className="h-px bg-[var(--border)] mt-7 mb-2" />

                        {/* Financial Details */}
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] pt-3 pb-3">Financial Details</p>
                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-x-6 gap-y-4">
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Subtotal</p>
                                <p className="text-sm font-semibold text-[var(--ink)]">Rs {(order?.subtotal ?? 0).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Tax</p>
                                <p className="text-sm font-semibold text-[var(--ink)]">Rs {(order?.totalTaxAmount ?? 0).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Discount</p>
                                <p className="text-sm font-semibold text-red-600">Rs {(order?.discountAmount ?? 0).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Paid</p>
                                <p className="text-sm font-semibold text-green-600">Rs {totalPaid.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Remaining</p>
                                <p className="text-sm font-semibold text-orange-600">Rs {remainingAmount.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Total Amount</p>
                                <p className="text-sm font-semibold text-[var(--accent-2)]">Rs {(order?.totalAmount ?? 0).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="h-px bg-[var(--border)] mt-7 mb-2" />

                        {/* Items */}
                        <div className="flex items-center justify-between pt-3 pb-3">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                                Items ({order?.items?.length || 0})
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[var(--border)]">
                                        <th className="py-2 text-left text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Product</th>
                                        <th className="py-2 text-center text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Portion</th>
                                        <th className="py-2 text-center text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Qty</th>
                                        <th className="py-2 text-right text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Unit Price</th>
                                        <th className="py-2 text-right text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Tax</th>
                                        <th className="py-2 text-right text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Discount</th>
                                        <th className="py-2 text-right text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Total</th>
                                        <th className="py-2 text-center text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {order?.items?.map((item, index) => {
                                        const isItemExpanded = expandedItems[index];
                                        const lineTotal = (item.unitPrice || 0) * (item.quantity || 0);
                                        const totalTax = (item.taxAmount || 0) * (item.quantity || 0);
                                        const totalDiscount = item.discountAmount || 0;
                                        const finalTotal = lineTotal - totalDiscount + totalTax;
                                        return (
                                            <React.Fragment key={index}>
                                                <tr>
                                                    <td className="py-3">
                                                        <p className="font-medium text-[var(--ink)]">{item.name || "—"}</p>
                                                        {item.batchNumber && (
                                                            <p className="text-xs text-[var(--muted)]">Batch: {item.batchNumber}</p>
                                                        )}
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-[var(--surface-muted)] text-[var(--ink)] capitalize">
                                                            {item.portionType || "full"}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-center text-[var(--ink)]">{item.quantity || 0}</td>
                                                    <td className="py-3 text-right text-[var(--ink)]">Rs {(item.unitPrice || 0).toLocaleString()}</td>
                                                    <td className="py-3 text-right text-[var(--ink)]">
                                                        <div className="text-xs">
                                                            <span className="text-[var(--muted)]">{item.taxPercent || 0}%</span>
                                                            {item.taxAmount > 0 && <span className="ml-1">({totalTax.toFixed(2)})</span>}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-right text-red-600">
                                                        <div className="text-xs">
                                                            <span>{item.discountPercent || 0}%</span>
                                                            {item.discountAmount > 0 && <span className="ml-1">({totalDiscount.toFixed(2)})</span>}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-right font-semibold text-[var(--accent-2)]">
                                                        Rs {finalTotal.toLocaleString()}
                                                    </td>
                                                    <td className="py-3">
                                                        <button
                                                            onClick={() => setExpandedItems(prev => ({ ...prev, [index]: !prev[index] }))}
                                                            className="p-1.5 hover:bg-[var(--hover)] text-[var(--muted)] rounded-lg"
                                                            title={isItemExpanded ? "Hide details" : "Show details"}
                                                        >
                                                            {isItemExpanded ? <EyeOff size={15} /> : <Eye size={15} />}
                                                        </button>
                                                    </td>
                                                </tr>
                                                {isItemExpanded && (
                                                    <tr>
                                                        <td colSpan="8" className="px-2 sm:px-3 py-4" style={{ background: "var(--surface-muted)" }}>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Item Details</p>
                                                                    <div className="text-xs space-y-1">
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Product ID:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>{item.product || "—"}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Original Price:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {(item.originalPrice || 0).toLocaleString()}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Batch ID:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>{item.batchId || "—"}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Batch Number:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>{item.batchNumber || "—"}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Price Calculation</p>
                                                                    <div className="text-xs space-y-1">
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Unit Price:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {(item.unitPrice || 0).toLocaleString()}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Quantity:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>{item.quantity || 0}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Line Total:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {lineTotal.toLocaleString()}</span>
                                                                        </div>
                                                                        <div className="h-px my-1" style={{ background: "var(--border)" }}></div>
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Tax ({item.taxPercent || 0}%):</span>
                                                                            <span className="font-mono text-green-600" style={{ color: "var(--ink)" }}>Rs {totalTax.toFixed(2)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Discount ({item.discountPercent || 0}%):</span>
                                                                            <span className="font-mono text-red-600" style={{ color: "var(--ink)" }}>-Rs {totalDiscount.toFixed(2)}</span>
                                                                        </div>
                                                                        <div className="h-px my-1" style={{ background: "var(--border)" }}></div>
                                                                        <div className="flex justify-between font-semibold">
                                                                            <span style={{ color: "var(--ink)" }}>Final Total:</span>
                                                                            <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {finalTotal.toLocaleString()}</span>
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

                        <div className="h-px bg-[var(--border)] mt-7 mb-2" />

                        {/* Payments */}
                        <div className="flex items-center justify-between pt-3 pb-3">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                                Payments ({paymentStatus.transactionCount || payments.length})
                            </p>
                        </div>

                        {payments.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-[var(--border)]">
                                            <th className="py-2 text-left text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Date</th>
                                            <th className="py-2 text-left text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Method</th>
                                            <th className="py-2 text-right text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Amount</th>
                                            <th className="py-2 text-right text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Notes</th>
                                            {/* <th className="py-2 text-center text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Actions</th> */}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]">
                                        {payments.map((payment, index) => (
                                            <tr key={index}>
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
                                                         payment.method || "—"}</span>
                                                </td>
                                                <td className="py-3 text-right font-semibold text-[var(--accent-2)]">Rs {(payment.amount || 0).toLocaleString()}</td>
                                                <td className="py-3 text-right text-[var(--muted)]">{payment.notes || "—"}</td>
                                                {/* <td className="py-3">
                                                    <div className="flex items-center justify-center gap-1">
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
                                                </td> */}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-[var(--muted)] py-6 text-center">No payments recorded yet</p>
                        )}
                    </div>
                </div>
            </div>
            {showPdfModal && (
                <PdfModal
                    isOpen={showPdfModal}
                    onClose={() => setShowPdfModal(false)}
                    fileName={`Order-${order?.orderNumber || 'details'}.pdf`}
                    labels={{}}
                >
                    <OrderDetailsPdfTemplate order={order} labels={{}} />
                </PdfModal>
            )}
        </>
    );
}
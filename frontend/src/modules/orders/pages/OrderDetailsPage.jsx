import { useParams, useNavigate } from "react-router-dom";
import { useOrder, useGetOrderPayments, useGetOrderPaymentStatus, useDeleteOrderPayment, useRecalculateOrderPaidAmount } from "../services/orders.service.js";
import { Receipt, Download, RefreshCw, ArrowLeft } from "lucide-react";
import OrderDetailsPdfTemplate from "../components/OrderDetailsPdfTemplate.jsx";
import OrderPaymentPdfTemplate from "../components/OrderPaymentPdfTemplate.jsx";
import PdfModal from "../../../shared/components/PdfModal.jsx";
import { useState } from "react";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import { usePermissionGuard } from "../../../shared/hooks/usePermissionGuard.js";

export default function OrderDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: order, isLoading, error, refetch: refetchOrder } = useOrder(id, { skip: !id });
    const { data: paymentsData, refetch: refetchPayments } = useGetOrderPayments(id, { skip: !id });
    const { data: paymentStatusData, refetch: refetchPaymentStatus } = useGetOrderPaymentStatus(id, { skip: !id });
    const [deletePayment] = useDeleteOrderPayment();
    const [recalculateOrderPaidAmount] = useRecalculateOrderPaidAmount();
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [showPaymentPdfModal, setShowPaymentPdfModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [expandedItems, setExpandedItems] = useState({});
    const { hasPermission } = usePermissionGuard();

    const payments = paymentsData?.data || paymentsData || [];
    const paymentStatus = paymentStatusData?.data || paymentStatusData || {};

    const totalPaid = paymentStatus?.totalPaid ?? order?.paid ?? 0;
    const remainingAmount = paymentStatus?.remainingAmount ?? order?.remainingAmount ?? 0;
    const date = order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—";
    const totalQty = (order?.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0);
    const totalItemDiscount = (order?.items || []).reduce((sum, it) => sum + (it.discountAmount || 0), 0);
    const totalItemTax = (order?.items || []).reduce((sum, it) => sum + ((it.taxAmount || 0) * (it.quantity || 0)), 0);

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

    const handlePaymentPdf = (payment) => {
        setSelectedPayment(payment);
        setShowPaymentPdfModal(true);
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

                    {/* Paper sheet - PDF-style layout */}
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

                        {/* Customer / Order Meta Row */}
                        <div className="flex justify-between items-start mb-6 gap-6">
                            <div>
                                <p className="text-xs font-semibold text-[var(--muted)] mb-1">Customer:</p>
                                <p className="text-sm font-bold text-[var(--ink)] uppercase">{order?.customerName || "Walk-in Customer"}</p>
                                {order?.customerType && <p className="text-xs text-[var(--muted)] capitalize">Type: {order.customerType}</p>}
                                {order?.customerId && <p className="text-xs text-[var(--muted)]">Customer ID: {order.customerId}</p>}
                            </div>
                            <div className="flex flex-col gap-2 min-w-[240px]">
                                <div className="border border-[var(--border)] px-3 py-2 flex justify-between text-sm" style={{ background: "var(--surface-muted)" }}>
                                    <span className="font-semibold text-[var(--ink)]">Order #: {order?.orderNumber || "—"}</span>
                                    <span className="font-semibold text-[var(--ink)]">Date: {date}</span>
                                </div>
                                <div className="border border-[var(--border)] px-3 py-2 flex justify-between text-sm" style={{ background: "var(--surface-muted)" }}>
                                    <span className="font-semibold text-[var(--ink)]">Status:</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                        order?.status === "completed" ? "bg-green-100 text-green-700" :
                                        order?.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                                        order?.status === "cancelled" ? "bg-red-100 text-red-700" :
                                        "bg-blue-100 text-blue-700"
                                    }`}>{order?.status || "—"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Items Table - PDF style */}
                        <table className="w-full border-collapse mb-4 text-sm">
                            <thead>
                                <tr className="text-[var(--ink)]" style={{ background: "var(--accent-2)" }}>
                                    <th className="px-3 py-2 text-left font-semibold text-white">#</th>
                                    <th className="px-3 py-2 text-left font-semibold text-white">Item &amp; Description</th>
                                    <th className="px-3 py-2 text-right font-semibold text-white">Qty</th>
                                    <th className="px-3 py-2 text-right font-semibold text-white">Unit Price</th>
                                    <th className="px-3 py-2 text-right font-semibold text-white">Disc</th>
                                    <th className="px-3 py-2 text-right font-semibold text-white">Tax</th>
                                    <th className="px-3 py-2 text-right font-semibold text-white">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(order?.items || []).map((item, index) => {
                                    const lineTotal = (item.unitPrice || 0) * (item.quantity || 0);
                                    const itemTax = (item.taxAmount || 0) * (item.quantity || 0);
                                    const itemDiscount = item.discountAmount || 0;
                                    const finalTotal = lineTotal - itemDiscount + itemTax;

                                    return (
                                        <tr key={index} className="border-b border-[var(--border)]">
                                            <td className="px-3 py-2 text-[var(--ink)]">{index + 1}</td>
                                            <td className="px-3 py-2 text-[var(--ink)]">
                                                {item.name || "—"}
                                                {item.portionType && <span className="text-xs text-[var(--muted)] capitalize"> ({item.portionType})</span>}
                                                {item.batchNumber && <span className="text-xs text-[var(--muted)] block">Batch: {item.batchNumber}</span>}
                                            </td>
                                            <td className="px-3 py-2 text-right text-[var(--ink)]">{item.quantity || 0}</td>
                                            <td className="px-3 py-2 text-right text-[var(--ink)]">{(item.unitPrice || 0).toLocaleString()}</td>
                                            <td className="px-3 py-2 text-right text-red-600">
                                                {item.discountPercent || 0}%
                                                {itemDiscount > 0 && <span className="block text-[10px] text-[var(--muted)]">-{itemDiscount.toLocaleString()}</span>}
                                            </td>
                                            <td className="px-3 py-2 text-right text-green-700">
                                                {item.taxPercent || 0}%
                                                {itemTax > 0 && <span className="block text-[10px] text-[var(--muted)]">+{itemTax.toLocaleString()}</span>}
                                            </td>
                                            <td className="px-3 py-2 text-right font-semibold text-[var(--accent-2)]">{finalTotal.toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
                                <tr className="font-semibold" style={{ background: "var(--surface-muted)" }}>
                                    <td className="px-3 py-2 text-[var(--ink)]" colSpan={2}>Sub Total</td>
                                    <td className="px-3 py-2 text-right text-[var(--ink)]">{totalQty}</td>
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2 text-right text-[var(--ink)]">{totalItemDiscount.toLocaleString()}</td>
                                    <td className="px-3 py-2 text-right text-[var(--ink)]">{totalItemTax.toLocaleString()}</td>
                                    <td className="px-3 py-2 text-right text-[var(--ink)]">{(order?.subtotal ?? 0).toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Payment Summary / Totals Row */}
                        <div className="flex justify-between gap-6 mb-6">
                            <div className="border border-[var(--border)] p-3 text-sm min-w-[260px]" style={{ background: "var(--surface-muted)" }}>
                                <p className="font-semibold mb-2 text-[var(--ink)]">Payment Summary:</p>
                                <div className="flex justify-between py-1">
                                    <span>Total Amount</span>
                                    <span>{(order?.totalAmount ?? 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span>Total Paid</span>
                                    <span>{totalPaid.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between py-1 font-bold border-t border-[var(--border)] mt-1 pt-1">
                                    <span>Remaining Balance</span>
                                    <span>{remainingAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="border border-[var(--border)] min-w-[280px] text-sm">
                                <div className="flex justify-between px-3 py-2 border-b border-[var(--border)]">
                                    <span>Subtotal</span>
                                    <span>{(order?.subtotal ?? 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between px-3 py-2 border-b border-[var(--border)] text-red-600">
                                    <span>Discount</span>
                                    <span>-{(order?.discountAmount ?? 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between px-3 py-2 border-b border-[var(--border)] text-green-700">
                                    <span>Tax</span>
                                    <span>+{(order?.totalTaxAmount ?? 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between px-3 py-2 font-bold text-[var(--accent-2)]">
                                    <span>Total Amount</span>
                                    <span>{(order?.totalAmount ?? 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Sign-off Bar */}
                        <div className="border border-[var(--border)] mb-4">
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
            {showPdfModal && (
                <PdfModal
                    isOpen={showPdfModal}
                    onClose={() => setShowPdfModal(false)}
                    fileName={`Order-${order?.orderNumber || 'details'}.pdf`}
                    labels={{}}
                >
                    <OrderDetailsPdfTemplate order={order} payments={payments} labels={{}} />
                </PdfModal>
            )}
            {showPaymentPdfModal && selectedPayment && (
                <PdfModal
                    isOpen={showPaymentPdfModal}
                    onClose={() => setShowPaymentPdfModal(false)}
                    fileName={`Payment-${selectedPayment._id || 'receipt'}.pdf`}
                    labels={{}}
                >
                    <OrderPaymentPdfTemplate payment={selectedPayment} order={order} labels={{}} />
                </PdfModal>
            )}
        </>
    );
}
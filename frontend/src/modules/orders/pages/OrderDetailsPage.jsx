import { useParams, useNavigate } from "react-router-dom";
import { useOrder, useGetOrderPayments, useGetOrderPaymentStatus, useRecalculateOrderPaidAmount } from "../services/orders.service.js";
import { useCustomerPaymentsSummary } from "../../qarza/services/qarza.service.js";
import { Receipt, Download, RefreshCw, ArrowLeft, Calendar, User, FileText, DollarSign, CreditCard, ToggleLeft, ToggleRight } from "lucide-react";
import OrderDetailsPdfTemplate from "../components/OrderDetailsPdfTemplate.jsx";
import OrderPaymentPdfTemplate from "../components/OrderPaymentPdfTemplate.jsx";
import PdfModal from "../../../shared/components/PdfModal.jsx";
import { useState } from "react";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import { usePermissionGuard } from "../../../shared/hooks/usePermissionGuard.js";

export default function OrderDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: order, isLoading, error } = useOrder(id, { skip: !id });
    const { data: paymentsData } = useGetOrderPayments(id, { skip: !id });
    const { data: paymentStatusData } = useGetOrderPaymentStatus(id, { skip: !id });
    const [recalculateOrderPaidAmount] = useRecalculateOrderPaidAmount();
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [showPaymentPdfModal, setShowPaymentPdfModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [showCustomerKPI, setShowCustomerKPI] = useState(false);
    const { hasPermission } = usePermissionGuard();

    // Fetch customer qarza payment summary when toggle is on and customer has qarza account
    const { data: qarzaSummary, isLoading: qarzaLoading } = useCustomerPaymentsSummary(
        order?.customerData?.qarzaAccountId,
        {
            skip: !showCustomerKPI || !order?.customerData?.qarzaAccountId || order?.customerType !== 'regular'
        }
    );

    const payments = paymentsData?.data || paymentsData || [];
    const paymentStatus = paymentStatusData?.data || paymentStatusData || {};

    const totalPaid = paymentStatus?.totalPaid ?? order?.paid ?? 0;
    const remainingAmount = paymentStatus?.remainingAmount ?? order?.remainingAmount ?? 0;
    const orderDate = order?.createdAt ? new Date(order.createdAt) : null;
    const date = orderDate ? orderDate.toLocaleDateString() : "—";
    const time = orderDate ? orderDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
    const customerName = order?.customerData?.name || order?.customerName || "Walk-in Customer";
    const totalQty = (order?.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0);
    const totalItemDiscount = (order?.items || []).reduce((sum, it) => sum + (it.discountAmount || 0), 0);
    const totalItemTax = (order?.items || []).reduce((sum, it) => sum + (it.taxAmount || 0), 0);
    const totalLineTotal = (order?.items || []).reduce((sum, it) => sum + ((it.unitPrice || 0) * (it.quantity || 0)), 0);
    const totalItemFinal = (order?.items || []).reduce((sum, it) => sum + (it.itemTotal || 0), 0);

    const handleRecalculate = async () => {
        try {
            await recalculateOrderPaidAmount(id).unwrap();
            showSuccess("Order payment recalculated successfully");
        } catch (error) {
            showError(error?.data?.message || "Failed to recalculate payment");
        }
    };

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
                            {order?.customerType === 'regular' && (
                                <button
                                    onClick={() => setShowCustomerKPI(!showCustomerKPI)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--hover)] rounded-lg transition-all"
                                    title="Toggle Customer Qarza KPI"
                                >
                                    {showCustomerKPI ? <ToggleRight size={15} className="text-green-600" /> : <ToggleLeft size={15} />}
                                    {showCustomerKPI ? 'Hide Qarza' : 'Show Qarza'}
                                </button>
                            )}
                            {hasPermission('orders.update') && (
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

                    {/* Paper sheet - Invoice-style layout with ALL details */}
                    <div className="bg-(--surface) border border-(--border) rounded-2xl shadow-lg px-6 py-6 mb-6">

                        {/* Company Header */}
                        <div className="text-center mb-6 pb-4 border-b-2 border-(--border)">
                            <div className="inline-flex flex-col items-center leading-none mb-2">
                                <span className="text-3xl font-extrabold tracking-wide text-(--ink)" style={{ letterSpacing: "2px" }}>LOGIN</span>
                                <span className="text-xs font-semibold tracking-[0.3em] text-(--muted) mt-1">LARAIB</span>
                            </div>
                            <h2 className="text-2xl font-bold text-(--ink) mt-2">
                                Afrasiab Mobile Accesories
                            </h2>
                            <p className="text-sm text-(--muted) mt-1">Sales Invoice</p>
                        </div>

                        {/* Invoice Metadata Grid */}
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            {/* Left: Customer Information */}
                            <div className="border border-(--border) p-4 rounded-lg" style={{ background: "var(--surface-muted)" }}>
                                <div className="flex items-center gap-2 mb-3">
                                    <User size={16} className="text-(--accent-2)" />
                                    <p className="text-xs font-bold text-(--muted) uppercase tracking-wide">Bill To</p>
                                </div>
                                <div className="mt-3 space-y-2">
                                    <div className="border border-(--border) px-3 py-2 flex justify-between text-sm">
                                        <span className="text-(--muted)">Name:</span>
                                        <span className="font-semibold">{customerName}</span>
                                    </div>
                                    {order?.customerData?.phoneNo && (
                                        <div className="border border-(--border) px-3 py-2 flex justify-between text-sm">
                                            <span className="text-(--muted)">Phone:</span>
                                            <span className="font-semibold">{order.customerData.phoneNo}</span>
                                        </div>
                                    )}
                                    {order?.customerData?.address && (
                                        <div className="border border-(--border) px-3 py-2 flex justify-between text-sm">
                                            <span className="text-(--muted)">Address:</span>
                                            <span className="font-semibold">{order.customerData.address}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Order Information */}
                            <div className="border border-(--border) p-4 rounded-lg" style={{ background: "var(--surface-muted)" }}>
                                <div className="flex items-center gap-2 mb-3">
                                    <Receipt size={16} className="text-(--accent-2)" />
                                    <p className="text-xs font-bold text-(--muted) uppercase tracking-wide">Invoice Details</p>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="border border-(--border) px-3 py-2 flex justify-between">
                                        <span className="text-(--muted)">Invoice #:</span>
                                        <span className="font-bold text-(--ink)">{order?.orderNumber || "—"}</span>
                                    </div>
                                    <div className="border border-(--border) px-3 py-2 flex justify-between">
                                        <span className="text-(--muted)">Date & Time:</span>
                                        <span className="font-semibold text-(--ink)">{date} - {time}</span>
                                    </div>
                                    <div className="border border-(--border) px-3 py-2 flex justify-between">
                                        <span className="text-(--muted)">Order Type:</span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                                            order?.orderType === "wholesale" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                                        }`}>{order?.orderType || "retail"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <FileText size={16} className="text-(--accent-2)" />
                                <h3 className="text-sm font-bold text-(--muted) uppercase tracking-wide">Items & Services</h3>
                            </div>
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="text-white" style={{ background: "var(--accent-2)" }}>
                                        <th className="px-3 py-2.5 text-left font-semibold">#</th>
                                        <th className="px-3 py-2.5 text-left font-semibold">Item Description</th>
                                        <th className="px-3 py-2.5 text-center font-semibold">Qty</th>
                                        <th className="px-3 py-2.5 text-right font-semibold">Unit Price</th>
                                        <th className="px-3 py-2.5 text-right font-semibold">Line Total</th>
                                        <th className="px-3 py-2.5 text-right font-semibold">Discount</th>
                                        <th className="px-3 py-2.5 text-right font-semibold">Tax</th>
                                        <th className="px-3 py-2.5 text-right font-semibold">Final Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(order?.items || []).map((item, index) => {
                                        const lineTotal = (item.unitPrice || 0) * (item.quantity || 0);
                                        const itemTax = item.taxAmount || 0; // taxAmount is already the total tax
                                        const itemDiscount = item.discountAmount || 0;
                                        const finalTotal = item.itemTotal || (lineTotal - itemDiscount + itemTax);

                                        return (
                                            <tr key={index} className="border-b border-(--border) hover:bg-(--surface-muted) transition-colors">
                                                <td className="px-3 py-3 text-(--ink) font-medium">{index + 1}</td>
                                                <td className="px-3 py-3">
                                                    <div>
                                                        <p className="font-semibold text-(--ink)">{item.name || "—"}</p>
                                                        <div className="flex gap-3 mt-1 text-xs text-(--muted)">
                                                            {item.portionType && item.portionType !== "full" && (
                                                                <span className="capitalize">Portion: {item.portionType}</span>
                                                            )}
                                                            {item.batchNumber && (
                                                                <span>Batch: {item.batchNumber}</span>
                                                            )}
                                                            {item.customInput && (
                                                                <span className="text-orange-600 font-semibold">Custom Price</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-center font-semibold text-(--ink)">{item.quantity || 0}</td>
                                                <td className="px-3 py-3 text-right text-(--ink)">
                                                    Rs {(item.unitPrice || 0).toLocaleString()}
                                                    {item.originalPrice && item.originalPrice !== item.unitPrice && (
                                                        <p className="text-xs text-(--muted) line-through">Rs {item.originalPrice.toLocaleString()}</p>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 text-right text-(--ink)">Rs {lineTotal.toLocaleString()}</td>
                                                <td className="px-3 py-3 text-right">
                                                    {item.discountPercent > 0 && (
                                                        <div className="text-red-600">
                                                            <p className="font-semibold">
                                                                {item.discountType === "fixed" ? `Rs ${item.discountPercent}` : `${item.discountPercent}%`}
                                                            </p>
                                                            <p className="text-xs">-Rs {itemDiscount.toLocaleString()}</p>
                                                        </div>
                                                    )}
                                                    {!item.discountPercent && <span className="text-(--muted)">—</span>}
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                    {item.taxPercent > 0 && (
                                                        <div className="text-green-700">
                                                            <p className="font-semibold">
                                                                {item.taxType === "fixed" ? `Rs ${item.taxPercent}` : `${item.taxPercent}%`}
                                                            </p>
                                                            <p className="text-xs">+Rs {itemTax.toLocaleString()}</p>
                                                        </div>
                                                    )}
                                                    {!item.taxPercent && <span className="text-(--muted)">—</span>}
                                                </td>
                                                <td className="px-3 py-3 text-right font-bold text-(--accent-2)">Rs {finalTotal.toLocaleString()}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="font-bold" style={{ background: "var(--surface-muted)" }}>
                                        <td className="px-3 py-3 text-(--ink)" colSpan={2}>Subtotal</td>
                                        <td className="px-3 py-3 text-center text-(--ink)">{totalQty}</td>
                                        <td className="px-3 py-3"></td>
                                        <td className="px-3 py-3 text-right text-(--ink)">Rs {totalLineTotal.toLocaleString()}</td>
                                        <td className="px-3 py-3 text-right text-red-600">-Rs {totalItemDiscount.toLocaleString()}</td>
                                        <td className="px-3 py-3 text-right text-green-700">+Rs {totalItemTax.toLocaleString()}</td>
                                        <td className="px-3 py-3 text-right text-(--accent-2)">Rs {totalItemFinal.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Amount Breakdown - Full Width */}
                        <div className="mb-6">
                            <div className="border border-(--border) rounded-lg overflow-hidden">
                                <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "var(--accent-2)" }}>
                                    <DollarSign size={14} className="text-white" />
                                    <p className="text-xs font-bold text-white uppercase tracking-wide">Amount Breakdown</p>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-center py-2 text-sm">
                                        <span className="text-(--muted)">Subtotal (Items)</span>
                                        <span className="font-semibold text-(--ink)">Rs {(order?.subtotal ?? 0).toLocaleString()}</span>
                                    </div>
                                    {order?.discountAmount > 0 && (
                                        <div className="flex justify-between items-center py-2 text-sm text-red-600">
                                            <span className="font-semibold">
                                                Order Discount
                                                {order?.orderDiscountValue && order?.orderDiscountType === "percentage" 
                                                    ? ` (${order.orderDiscountValue}%)` 
                                                    : ""
                                                }
                                            </span>
                                            <span className="font-semibold">-Rs {(order?.discountAmount ?? 0).toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="border-t-2 border-(--border) pt-3 mt-3">
                                        <div className="flex justify-between items-center py-2">
                                            <span className="font-bold text-lg text-(--ink)">Grand Total</span>
                                            <span className="font-bold text-lg text-(--accent-2)">Rs {(order?.totalAmount ?? 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 text-sm">
                                            <span className="text-(--muted)">Total Paid</span>
                                            <span className="font-semibold text-green-600">Rs {totalPaid.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-t border-(--border) pt-2">
                                            <span className="font-bold text-lg text-(--ink)">Balance Due</span>
                                            <div className="flex items-center gap-3">
                                                <span className={`font-bold text-lg ${remainingAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                                                    Rs {remainingAmount.toLocaleString()}
                                                </span>
                                                {remainingAmount === 0 ? (
                                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">PAID IN FULL</span>
                                                ) : remainingAmount < (order?.totalAmount ?? 0) ? (
                                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">PARTIALLY PAID</span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">UNPAID</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {order?.staffCommission > 0 && (
                                        <div className="flex justify-between items-center py-2 text-sm border-t border-(--border) pt-2 mt-2">
                                            <span className="text-(--muted)">Staff Commission</span>
                                            <span className="font-semibold text-purple-600">Rs {order.staffCommission.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Order Notes (if any) */}
                        {order?.note && (
                            <div className="mb-6 border border-(--border) rounded-lg p-4" style={{ background: "var(--surface-muted)" }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText size={14} className="text-(--accent-2)" />
                                    <p className="text-xs font-bold text-(--muted) uppercase tracking-wide">Order Notes</p>
                                </div>
                                <p className="text-sm text-(--ink) italic">{order.note}</p>
                            </div>
                        )}

                    {/* Payment Transactions Section */}
                    {payments && payments.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-(--border)">
                            <div className="flex items-center gap-2 mb-4">
                                <CreditCard size={18} className="text-(--accent-2)" />
                                <h3 className="text-lg font-bold text-(--ink)">Payment Transactions</h3>
                                <span className="px-2 py-0.5 bg-(--accent-2) text-white text-xs font-semibold rounded-full">
                                    {payments.length}
                                </span>
                            </div>

                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="text-white" style={{ background: "var(--accent-2)" }}>
                                        <th className="px-3 py-2.5 text-left font-semibold">#</th>
                                        <th className="px-3 py-2.5 text-left font-semibold">Date</th>
                                        <th className="px-3 py-2.5 text-left font-semibold">Payment Method</th>
                                        <th className="px-3 py-2.5 text-right font-semibold">Amount</th>
                                        <th className="px-3 py-2.5 text-left font-semibold">Note</th>
                                        <th className="px-3 py-2.5 text-center font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((payment, index) => (
                                        <tr key={payment._id || index} className="border-b border-(--border) hover:bg-(--surface-muted) transition-colors">
                                            <td className="px-3 py-3 text-(--ink) font-medium">{index + 1}</td>
                                            <td className="px-3 py-3 text-(--ink)">
                                                {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : "—"}
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                                    payment.paymentMethodData?.name === "Cash" ? "bg-green-100 text-green-700" :
                                                    payment.paymentMethodData?.name === "Card" ? "bg-blue-100 text-blue-700" :
                                                    payment.paymentMethodData?.name === "Bank Transfer" ? "bg-purple-100 text-purple-700" :
                                                    payment.paymentMethodData?.name === "easypaisa" ? "bg-orange-100 text-orange-700" :
                                                    payment.creditAccountData ? "bg-yellow-100 text-yellow-700" :
                                                    "bg-gray-100 text-gray-700"
                                                }`}>
                                                    {payment.paymentMethodData?.name || payment.paymentMethodName || payment.creditAccountData?.name || "Unknown"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-right font-bold text-green-600">
                                                Rs {(payment.amount || 0).toLocaleString()}
                                            </td>
                                            <td className="px-3 py-3 text-(--muted) text-xs italic">
                                                {payment.note || "—"}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handlePaymentPdf(payment)}
                                                        className="p-2 rounded-lg border border-(--border) hover:border-(--accent-2) hover:text-(--accent-2) transition-all"
                                                        title="Download Receipt"
                                                    >
                                                        <Download size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Customer Qarza KPI Section */}
                    {showCustomerKPI && qarzaSummary && (
                        <div className="mt-6 pt-6 border-t border-(--border)">
                            <div className="border border-(--border) p-4 mb-6" style={{ background: "var(--surface-muted)" }}>
                                <h3 className="text-lg font-semibold mb-3 text-(--ink)">Customer Account Summary</h3>
                            {qarzaLoading ? (
                                <p className="text-(--muted)">Loading Qarza data...</p>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-xs text-(--muted) uppercase font-bold mb-1">Cash In</p>
                                        <p className="text-lg font-bold text-green-600">Rs {Number(qarzaSummary.cashIn || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-(--muted) uppercase font-bold mb-1">Cash Out</p>
                                        <p className="text-lg font-bold text-red-600">Rs {Number(qarzaSummary.cashOut || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-(--muted) uppercase font-bold mb-1">To Give</p>
                                        <p className="text-lg font-bold text-amber-600">Rs {Math.max(Number(qarzaSummary.overall || 0), 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-(--muted) uppercase font-bold mb-1">To Receive</p>
                                        <p className="text-lg font-bold text-purple-600">Rs {Math.max(Number(qarzaSummary.overall || 0) * -1, 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            )}
                                {!qarzaLoading && (
                                    <div className="border-t border-(--border) mt-4 pt-3 flex justify-between text-sm font-bold text-(--ink)">
                                        <span>Overall Balance</span>
                                        <span className={Number(qarzaSummary.overall || 0) >= 0 ? "text-amber-600" : "text-purple-600"}>
                                            {Number(qarzaSummary.overall || 0) > 0 ? "To Give: " : Number(qarzaSummary.overall || 0) < 0 ? "To Receive: " : "Balanced: "}
                                            Rs {Math.abs(Number(qarzaSummary.overall || 0)).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Sign-off Bar */}
                    <div className="border border-(--border) mb-4 mt-6">
                        <div className="flex text-sm">
                            <div className="w-1/2 text-center py-3 border-r border-(--border)">
                                <p className="text-(--muted)">Prepared By</p>
                                <p className="font-semibold mt-1 text-(--ink)">SyedSoft</p>
                            </div>
                            <div className="w-1/2 text-center py-3">
                                <p className="text-(--muted)">Approved By</p>
                                <p className="font-semibold mt-1 text-(--ink)">Afrasiab Mobile Accesories</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center text-xs text-(--muted) pt-4 border-t border-(--border)">
                        <p className="italic">This is a computer generated document, no signature required</p>
                        <div className="flex items-center gap-2">
                            <Calendar size={12} />
                            <p>Printed: {new Date().toLocaleString()}</p>
                        </div>
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
                    <OrderDetailsPdfTemplate order={order} payments={payments} labels={{}} showCustomerKPI={showCustomerKPI} qarzaSummary={qarzaSummary} />
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
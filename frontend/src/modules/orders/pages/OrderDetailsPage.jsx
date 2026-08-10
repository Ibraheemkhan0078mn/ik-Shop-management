import { useParams, useNavigate } from "react-router-dom";
import { useOrder } from "../services/orders.service.js";
import { Receipt, Package, DollarSign, CreditCard, Percent, FileText, Copy, Download } from "lucide-react";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import OrderDetailsPdfTemplate from "../components/OrderDetailsPdfTemplate.jsx";
import PdfModal from "../../../shared/components/PdfModal.jsx";
import { useState } from "react";

// ── Payment Method Configuration ───────────────────────────────────────
const PAYMENT_METHODS = {
    cash: { label: "Cash", icon: DollarSign },
    online: { label: "Online", icon: CreditCard },
    credit: { label: "Credit Card", icon: CreditCard },
    hybrid: { label: "Multiple", icon: CreditCard },
    free: { label: "Free", icon: Percent },
};

function PaymentBadge({ method }) {
    const config = PAYMENT_METHODS[method] || PAYMENT_METHODS.free;
    const Icon = config.icon;
    return (
        <span
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: "rgba(15,118,110,0.12)", color: "var(--accent-2)" }}
        >
            <Icon size={14} />
            <span>{config.label}</span>
        </span>
    );
}

export default function OrderDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: order, isLoading, error } = useOrder(id, { skip: !id });
    const [showPdfModal, setShowPdfModal] = useState(false);
    console.log(order, "The order data")

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
        <div className="h-screen flex flex-col overflow-hidden">
            <div className="flex-none">
                <PageHeading
                    id="order-details-page-heading"
                    heading="Order Details"
                    subheading={
                        <div className="flex items-center gap-2">
                            <span>{order.orderNumber || "—"}</span>
                            <button
                                onClick={handleCopyOrderNumber}
                                className="p-1 rounded hover:bg-(--surface-muted) transition-all"
                                title="Copy order number"
                            >
                                <Copy size={14} className="text-(--muted)" />
                            </button>
                        </div>
                    }
                    rightActions={
                        <button
                            onClick={() => setShowPdfModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-(--accent-2) text-white rounded-lg hover:bg-(--accent-2)/90 transition-all"
                        >
                            <Download size={16} />
                            Export Details
                        </button>
                    }
                />
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
                <div className="max-w-5xl mx-auto space-y-6 pt-2">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                                order?.status === "completed" ? "bg-green-100 text-green-700" :
                                order?.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                                order?.status === "cancelled" ? "bg-red-100 text-red-700" :
                                "bg-blue-100 text-blue-700"
                            }`}>
                                {order?.status || "Unknown"}
                            </span>
                            {order?.isPosOrder && (
                                <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-100 text-purple-700">
                                    POS Order
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-[var(--muted)]">
                            Created: {new Date(order?.createdAt).toLocaleString('en-US', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                            })}
                        </p>
                    </div>

                    {/* Financial Summary Section */}
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
                            <DollarSign size={20} />
                            Financial Summary
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="text-center p-4 rounded-xl bg-[var(--surface-muted)]">
                                <p className="text-xs text-[var(--muted)] uppercase font-bold">Subtotal</p>
                                <p className="font-semibold text-[var(--ink)] mt-1">Rs {(order?.subtotal ?? 0).toLocaleString()}</p>
                            </div>
                            <div className="text-center p-4 rounded-xl bg-[var(--surface-muted)]">
                                <p className="text-xs text-[var(--muted)] uppercase font-bold">Tax</p>
                                <p className="font-semibold text-[var(--ink)] mt-1">Rs {(order?.totalTaxAmount ?? 0).toLocaleString()}</p>
                            </div>
                            <div className="text-center p-4 rounded-xl bg-[var(--surface-muted)]">
                                <p className="text-xs text-[var(--muted)] uppercase font-bold">Discount</p>
                                <p className="font-semibold text-red-600 mt-1">Rs {(order?.discountAmount ?? 0).toLocaleString()}</p>
                            </div>
                            <div className="text-center p-4 rounded-xl bg-[var(--surface-muted)]">
                                <p className="text-xs text-[var(--muted)] uppercase font-bold">Cash Received</p>
                                <p className="font-semibold text-[var(--ink)] mt-1">Rs {(order?.cashReceived ?? 0).toLocaleString()}</p>
                            </div>
                            <div className="text-center p-4 rounded-xl bg-[var(--accent-2)]">
                                <p className="text-xs text-white uppercase font-bold">Total Amount</p>
                                <p className="font-bold text-white text-lg mt-1">Rs {(order?.totalAmount ?? 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Order Information Section */}
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
                            <FileText size={20} />
                            Order Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">Order Number</label>
                                <p className="font-semibold text-[var(--ink)] mt-1">{order?.orderNumber || "—"}</p>
                            </div>
                            <div>
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">Customer Name</label>
                                <p className="font-semibold text-[var(--ink)] mt-1">{order?.customerName || "Walk-in Customer"}</p>
                            </div>
                            <div>
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">Customer Type</label>
                                <p className="font-semibold text-[var(--ink)] mt-1 capitalize">{order?.customerType || "—"}</p>
                            </div>
                            <div>
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">Order Date & Time</label>
                                <p className="font-semibold text-[var(--ink)] mt-1">
                                    {new Date(order?.createdAt).toLocaleString('en-US', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                    })}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">Served By</label>
                                <p className="font-semibold text-[var(--ink)] mt-1">{order?.waiter || "Not specified"}</p>
                            </div>
                            <div>
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">Order Type</label>
                                <p className="font-semibold text-[var(--ink)] mt-1 capitalize">{order?.orderType || "Retail"}</p>
                            </div>
                        </div>
                        {order?.note && (
                            <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">Notes</label>
                                <p className="text-[var(--ink)] mt-1">{order.note}</p>
                            </div>
                        )}
                    </div>

                    {/* Items Section */}
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
                            <Package size={20} />
                            Items in Order
                            <span className="ml-auto text-xs font-bold px-3 py-1 rounded-full bg-[var(--surface-muted)] text-[var(--muted)]">
                                {order?.items?.length || 0} items
                            </span>
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead style={{ background: "var(--surface-muted)" }}>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">
                                            Product
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">
                                            Portion
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">
                                            Quantity
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">
                                            Unit Price
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">
                                            Tax
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">
                                            Discount
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">
                                            Item Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                                    {order?.items?.map((item, index) => (
                                        <tr key={index} className="hover:bg-[var(--surface-muted)] transition-all">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-[var(--ink)]">
                                                    {item.name || "—"}
                                                </p>
                                                {item.batchNumber && (
                                                    <p className="text-xs text-[var(--muted)]">Batch: {item.batchNumber}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-[var(--surface-muted)] text-[var(--ink)] capitalize">
                                                    {item.portionType || "full"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center font-medium text-[var(--ink)]">
                                                {item.quantity || 0}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-[var(--ink)]">
                                                Rs {(item.unitPrice || 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-[var(--ink)]">
                                                <div className="text-xs">
                                                    <span className="text-[var(--muted)]">{item.taxPercent || 0}%</span>
                                                    {item.taxAmount > 0 && (
                                                        <span className="ml-1">({(item.taxAmount * item.quantity).toFixed(2)})</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-red-600">
                                                <div className="text-xs">
                                                    <span>{item.discountPercent || 0}%</span>
                                                    {item.discountAmount > 0 && (
                                                        <span className="ml-1">({item.discountAmount.toFixed(2)})</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-[var(--accent-2)]">
                                                Rs {((item.unitPrice || 0) * (item.quantity || 0) - (item.discountAmount || 0) + (item.taxAmount || 0) * (item.quantity || 0)).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Payment Details Section */}
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
                            <CreditCard size={20} />
                            Payment Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">Payment Method</label>
                                <p className="font-semibold text-[var(--ink)] mt-1">
                                    <PaymentBadge method={order?.paymentMethod} />
                                </p>
                            </div>
                            {order?.paymentMethodName && (
                                <div>
                                    <label className="text-xs text-[var(--muted)] uppercase font-bold">Payment Method Name</label>
                                    <p className="font-semibold text-[var(--ink)] mt-1">{order.paymentMethodName}</p>
                                </div>
                            )}
                            {order?.paymentMethod === "cash" && (
                                <>
                                    <div>
                                        <label className="text-xs text-[var(--muted)] uppercase font-bold">Cash Received</label>
                                        <p className="font-semibold text-[var(--ink)] mt-1">Rs {(order?.cashReceived ?? 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-[var(--muted)] uppercase font-bold">Change Returned</label>
                                        <p className="font-semibold text-[var(--accent-2)] mt-1">Rs {(order?.change ?? 0).toLocaleString()}</p>
                                    </div>
                                </>
                            )}
                            {order?.paymentMethod === "online" && (
                                <>
                                    <div>
                                        <label className="text-xs text-[var(--muted)] uppercase font-bold">Platform</label>
                                        <p className="font-semibold text-[var(--ink)] mt-1 capitalize">{order?.onlinePlatform || "—"}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-[var(--muted)] uppercase font-bold">Online Amount</label>
                                        <p className="font-semibold text-[var(--ink)] mt-1">Rs {(order?.onlineAmount ?? 0).toLocaleString()}</p>
                                    </div>
                                </>
                            )}
                            {order?.paymentMethod === "credit" && (
                                <div>
                                    <label className="text-xs text-[var(--muted)] uppercase font-bold">Qarza Account</label>
                                    <p className="font-semibold text-[var(--ink)] mt-1">{order?.qarzaAccount?.name || "—"}</p>
                                </div>
                            )}
                            {order?.paymentMethod === "hybrid" && (
                                <>
                                    <div>
                                        <label className="text-xs text-[var(--muted)] uppercase font-bold">Cash Portion</label>
                                        <p className="font-semibold text-[var(--ink)] mt-1">Rs {(order?.hybridCash ?? 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-[var(--muted)] uppercase font-bold">Qarza Portion</label>
                                        <p className="font-semibold text-[var(--ink)] mt-1">Rs {(order?.hybridQarza ?? 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-[var(--muted)] uppercase font-bold">Qarza Account</label>
                                        <p className="font-semibold text-[var(--ink)] mt-1">{order?.hybridQarzaAccount?.name || "—"}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
                            <Receipt size={20} />
                            Additional Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">Order ID</label>
                                <p className="font-semibold text-[var(--ink)] mt-1 text-xs">{order?._id || "—"}</p>
                            </div>
                            <div>
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">Last Updated</label>
                                <p className="font-semibold text-[var(--ink)] mt-1">
                                    {order?.updatedAt ? new Date(order.updatedAt).toLocaleString('en-US', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                    }) : "—"}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">Staff ID</label>
                                <p className="font-semibold text-[var(--ink)] mt-1">{order?.staffId || "—"}</p>
                            </div>
                            <div>
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">Customer ID</label>
                                <p className="font-semibold text-[var(--ink)] mt-1">{order?.customerId || "—"}</p>
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
                    <OrderDetailsPdfTemplate order={order} labels={{}} />
                </PdfModal>
            )}
        </div>
    );
}

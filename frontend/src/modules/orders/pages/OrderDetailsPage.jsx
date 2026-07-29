import { useParams, useNavigate } from "react-router-dom";
import { useOrder } from "../services/orders.service.js";
import { ArrowLeft, Receipt, User, Clock, Package, DollarSign, CreditCard, Percent, FileText, ShoppingBag, Printer, Download } from "lucide-react";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";

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

function InfoCard({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ background: "var(--surface-muted)", borderColor: "var(--border)" }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(15,118,110,0.12)" }}>
                <Icon size={18} className="text-(--accent-2)" />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-semibold text-(--muted) uppercase tracking-wider">{label}</p>
                <p className="font-bold text-(--ink) mt-0.5 truncate">{value}</p>
            </div>
        </div>
    );
}

function SummaryRow({ label, value, icon: Icon, isDiscount = false }) {
    return (
        <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
                <Icon size={14} className={isDiscount ? "text-red-500" : "text-(--muted)"} />
                <span className="font-semibold text-(--ink)">{label}</span>
            </div>
            <span className={`font-bold ${isDiscount ? "text-red-500" : "text-(--ink)"}`}>
                {isDiscount && value > 0 ? "- " : ""}Rs {(value || 0).toLocaleString()}
            </span>
        </div>
    );
}

export default function OrderDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: order, isLoading, error } = useOrder(id, { skip: !id });

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
                    subheading={order.orderNumber || "—"}
                    leftActions={
                        <>
                            <div id="order-details-back-button" onClick={() => navigate(-1)}>
                                <ScreenTabButton lucideIcon={ArrowLeft} text="Back" />
                            </div>
                            <div id="order-details-print-button" onClick={() => console.log("Print")}>
                                <ScreenTabButton lucideIcon={Printer} text="Print" />
                            </div>
                            <div id="order-details-export-button" onClick={() => console.log("Export")}>
                                <ScreenTabButton lucideIcon={Download} text="Export" />
                            </div>
                        </>
                    }
                />
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
                <div className="max-w-4xl mx-auto space-y-6 pt-2">
                    {/* Info Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoCard
                            icon={User}
                            label="Customer Name"
                            value={order.customerName || "Walk-in Customer"}
                        />
                        <InfoCard
                            icon={Clock}
                            label="Order Date & Time"
                            value={new Date(order.createdAt).toLocaleString('en-US', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                            })}
                        />
                        <InfoCard
                            icon={User}
                            label="Served By"
                            value={order.waiter || "Not specified"}
                        />
                        <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ background: "var(--surface-muted)", borderColor: "var(--border)" }}>
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(15,118,110,0.12)" }}>
                                <CreditCard size={18} className="text-(--accent-2)" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-(--muted) uppercase tracking-wider">Payment Method</p>
                                <div className="mt-1">
                                    <PaymentBadge method={order.paymentMethod} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <ShoppingBag size={16} className="text-(--accent-2)" />
                            <h3 className="text-sm font-bold text-(--ink)">Order Items</h3>
                            <span className="ml-auto text-xs font-bold px-3 py-1 rounded-full bg-(--surface-muted) text-(--muted)">
                                {order.items?.length || 0} items
                            </span>
                        </div>
                        <div className="space-y-2">
                            {order.items?.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between gap-4 p-3.5 rounded-xl border transition-all duration-150 hover:bg-(--surface-muted)"
                                    style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(15,118,110,0.12)" }}>
                                            <Package size={15} className="text-(--accent-2)" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-(--ink) truncate text-sm">{item.name}</p>
                                            <p className="text-xs text-(--muted)">
                                                Qty: {item.quantity} × Rs {item.unitPrice?.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-bold text-(--accent-2) shrink-0">
                                        Rs {(item.quantity * item.unitPrice).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary Section */}
                    <div className="rounded-xl border p-5 space-y-3" style={{ background: "var(--surface-muted)", borderColor: "var(--border)" }}>
                        <div className="flex items-center gap-2 mb-1">
                            <FileText size={16} className="text-(--accent-2)" />
                            <h3 className="text-sm font-bold text-(--ink)">Order Summary</h3>
                        </div>

                        <div className="space-y-2">
                            <SummaryRow label="Subtotal" value={order.subtotal} icon={DollarSign} />
                            <SummaryRow label="Discount" value={order.discountAmount} icon={Percent} isDiscount />

                            <div className="h-px" style={{ background: "var(--border)" }} />

                            <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "var(--accent-2)" }}>
                                <div className="flex items-center gap-2">
                                    <DollarSign size={16} className="text-white" />
                                    <span className="text-sm font-bold text-white">Total Amount</span>
                                </div>
                                <span className="text-xl font-black text-white">
                                    Rs {(order.totalAmount || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrder } from "../services/orders.service.js";
import { ArrowLeft, Receipt, User, Clock, Package, DollarSign, CreditCard, Percent, FileText, ShoppingBag, Printer, Download } from "lucide-react";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";

// ── Payment Method Configuration ───────────────────────────────────────
const PAYMENT_METHODS = {
    cash: {
        label: "Cash",
        icon: DollarSign,
        bgColor: "rgba(15,118,110,0.12)",
        textColor: "var(--accent-2)",
        borderColor: "rgba(15,118,110,0.3)",
        iconBg: "rgba(15,118,110,0.2)",
    },
    online: {
        label: "Online",
        icon: CreditCard,
        bgColor: "rgba(59,130,246,0.12)",
        textColor: "#3b82f6",
        borderColor: "rgba(59,130,246,0.3)",
        iconBg: "rgba(59,130,246,0.2)",
    },
    credit: {
        label: "Credit Card",
        icon: CreditCard,
        bgColor: "rgba(168,85,247,0.12)",
        textColor: "#a855f7",
        borderColor: "rgba(168,85,247,0.3)",
        iconBg: "rgba(168,85,247,0.2)",
    },
    hybrid: {
        label: "Multiple",
        icon: CreditCard,
        bgColor: "rgba(249,115,22,0.12)",
        textColor: "#f97316",
        borderColor: "rgba(249,115,22,0.3)",
        iconBg: "rgba(249,115,22,0.2)",
    },
    free: {
        label: "Free",
        icon: Percent,
        bgColor: "var(--surface-muted)",
        textColor: "var(--muted)",
        borderColor: "var(--border)",
        iconBg: "var(--surface-muted)",
    },
};

function PaymentBadge({ method, showIcon = true, size = "sm" }) {
    const config = PAYMENT_METHODS[method] || PAYMENT_METHODS.free;
    const Icon = config.icon;
    
    const sizeClasses = {
        sm: "text-xs px-2.5 py-1",
        md: "text-sm px-3 py-1.5",
        lg: "text-base px-4 py-2",
    };

    return (
        <span 
            className={`inline-flex items-center gap-1.5 rounded-lg font-semibold border ${sizeClasses[size]}`}
            style={{
                background: config.bgColor,
                color: config.textColor,
                borderColor: config.borderColor,
            }}
        >
            {showIcon && <Icon size={size === "sm" ? 12 : size === "md" ? 14 : 16} />}
            <span>{config.label}</span>
        </span>
    );
}

// Info Card Component
function InfoCard({ icon: Icon, label, value, bgColor, iconColor }) {
    return (
        <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-edge bg-(--surface-muted)">
            <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: bgColor }}
            >
                <Icon size={20} style={{ color: iconColor }} />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-semibold text-ink-subtle uppercase tracking-wider">{label}</p>
                <p className="font-bold text-ink mt-0.5 truncate">{value}</p>
            </div>
        </div>
    );
}

function SummaryRow({ label, value, icon: Icon, isDiscount = false }) {
    return (
        <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDiscount ? 'bg-red-100' : 'bg-(--surface-muted)'}`}>
                    <Icon size={14} className={isDiscount ? 'text-red-600' : 'text-ink-subtle'} />
                </div>
                <span className="font-semibold text-ink">{label}</span>
            </div>
            <span className={`font-bold ${isDiscount ? 'text-red-600' : 'text-ink'}`}>
                {isDiscount && value > 0 ? '- ' : ''}Rs {(value || 0).toLocaleString()}
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
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-[#0d8a7e] flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Receipt size={32} className="text-white" />
                    </div>
                    <p className="text-ink-subtle font-semibold">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <Receipt size={32} className="text-red-600" />
                    </div>
                    <p className="text-red-600 font-semibold">Failed to load order details</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-[#0d8a7e] text-white font-semibold"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-app-bg">
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="shrink-0 w-11 h-11 flex items-center justify-center rounded-2xl border-2 border-edge text-ink-subtle hover:text-primary hover:border-primary hover:bg-primary/10 transition-all hover:scale-105 active:scale-95"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-ink">Order Details</h1>
                            <p className="text-sm text-ink-subtle font-semibold">{order.orderNumber || "—"}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => console.log("Print")}
                            className="w-10 h-10 rounded-xl transition-all hover:bg-(--surface-muted) border-2 border-edge hover:border-primary text-ink-subtle hover:text-primary flex items-center justify-center"
                            title="Print"
                        >
                            <Printer size={18} />
                        </button>
                        <button
                            onClick={() => console.log("Export")}
                            className="w-10 h-10 rounded-xl transition-all hover:bg-(--surface-muted) border-2 border-edge hover:border-primary text-ink-subtle hover:text-primary flex items-center justify-center"
                            title="Export"
                        >
                            <Download size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Info Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoCard 
                            icon={User} 
                            label="Customer Name" 
                            value={order.customerName || "Walk-in Customer"}
                            bgColor="rgba(15,118,110,0.1)"
                            iconColor="var(--accent-2)"
                        />
                        <InfoCard 
                            icon={Clock} 
                            label="Order Date & Time" 
                            value={new Date(order.createdAt).toLocaleString('en-US', { 
                                dateStyle: 'medium', 
                                timeStyle: 'short' 
                            })}
                            bgColor="rgba(249,115,22,0.1)"
                            iconColor="#f97316"
                        />
                        <InfoCard 
                            icon={User} 
                            label="Served By" 
                            value={order.waiter || "Not specified"}
                            bgColor="rgba(59,130,246,0.1)"
                            iconColor="#3b82f6"
                        />
                        <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-edge bg-(--surface-muted)">
                            <div 
                                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: "rgba(168,85,247,0.1)" }}
                            >
                                <CreditCard size={20} style={{ color: "#a855f7" }} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-ink-subtle uppercase tracking-wider">Payment Method</p>
                                <div className="mt-1">
                                    <PaymentBadge method={order.paymentMethod} size="md" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <ShoppingBag size={16} className="text-primary" />
                            </div>
                            <h3 className="text-base font-bold text-ink">Order Items</h3>
                            <span className="ml-auto text-xs font-bold px-3 py-1 rounded-full bg-(--surface-muted) text-ink-subtle">
                                {order.items?.length || 0} items
                            </span>
                        </div>
                        <div className="space-y-2">
                            {order.items?.map((item, idx) => (
                                <div 
                                    key={idx} 
                                    className="flex items-center justify-between gap-4 p-4 rounded-xl border-2 border-edge bg-(--surface) hover:border-primary/30 hover:bg-primary/5 transition-all group"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                            <Package size={16} className="text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-ink truncate">{item.name}</p>
                                            <p className="text-sm text-ink-subtle">
                                                <span className="font-medium">Qty:</span> {item.quantity} × Rs {item.unitPrice?.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-lg font-bold text-primary">
                                            Rs {(item.quantity * item.unitPrice).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary Section */}
                    <div className="rounded-2xl border-2 border-edge bg-gradient-to-br from-(--surface-muted) to-(--surface) p-5 space-y-3">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FileText size={16} className="text-primary" />
                            </div>
                            <h3 className="text-base font-bold text-ink">Order Summary</h3>
                        </div>
                        
                        <div className="space-y-2">
                            <SummaryRow label="Subtotal" value={order.subtotal} icon={DollarSign} />
                            <SummaryRow label="Discount" value={order.discountAmount} icon={Percent} isDiscount />
                            
                            <div className="h-px bg-edge my-2" />
                            
                            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary to-[#0d8a7e]">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                        <DollarSign size={16} className="text-white" />
                                    </div>
                                    <span className="text-base font-bold text-white">Total Amount</span>
                                </div>
                                <span className="text-2xl font-black text-white">
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

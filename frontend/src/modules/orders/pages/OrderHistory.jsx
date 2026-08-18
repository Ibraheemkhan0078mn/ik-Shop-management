import { useSelector } from "react-redux";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePaginatedOrders, useDeleteOrder } from "../services/orders.service.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import {
    Eye, Trash2, X, Receipt, Calendar,
    User, Clock, Package, DollarSign, CreditCard, Wallet, Smartphone,
    Percent, FileText, ShoppingBag, TrendingUp, Filter, Copy, RotateCcw
} from "lucide-react";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import OrderReturnModal from "../../orderReturn/components/OrderReturnModal.jsx";
import ConfirmDialog from "../../../shared/components/ConfirmationDialog.jsx";

// ── Payment Method Configuration ───────────────────────────────────────
const PAYMENT_METHODS = {
    cash: { label: "Cash", icon: Wallet },
    online: { label: "Online", icon: Smartphone },
    credit: { label: "Credit Card", icon: CreditCard },
    hybrid: { label: "Multiple", icon: TrendingUp },
    free: { label: "Free", icon: Percent },
};

function PaymentBadge({ method }) {
    const config = PAYMENT_METHODS[method] || PAYMENT_METHODS.free;
    const Icon = config.icon;
    return (
        <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(15,118,110,0.12)", color: "var(--accent-2)" }}
        >
            <Icon size={12} />
            <span>{config.label}</span>
        </span>
    );
}

// ── Date Filter Component ───────────────────────────────────────────────
function DateFilter({ startDate, endDate, onStartDateChange, onEndDateChange, onClear }) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(startDate || endDate ? "custom" : "all");
    const hasFilters = startDate || endDate;

    const formatDateRange = () => {
        if (startDate && endDate) {
            return `${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        }
        if (startDate) return `From ${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        if (endDate) return `Until ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        return "Select Date Range";
    };

    const handlePresetSelect = (presetKey) => {
        setActiveTab(presetKey);
        const today = new Date();
        const end = today.toISOString().split('T')[0];

        if (presetKey === "today") {
            onStartDateChange(end);
            onEndDateChange(end);
        } else if (presetKey === "week") {
            const startD = new Date(today);
            startD.setDate(today.getDate() - 7);
            onStartDateChange(startD.toISOString().split('T')[0]);
            onEndDateChange(end);
        } else if (presetKey === "month") {
            const startD = new Date(today.getFullYear(), today.getMonth(), 1);
            onStartDateChange(startD.toISOString().split('T')[0]);
            onEndDateChange(end);
        } else if (presetKey === "custom") {
            // Keep current custom dates or leave empty for user input
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150 hover:scale-105"
                style={{
                    background: hasFilters ? "rgba(15,118,110,0.12)" : "var(--surface-muted)",
                    borderColor: hasFilters ? "var(--accent-2)" : "var(--border)",
                    color: hasFilters ? "var(--accent-2)" : "var(--ink)",
                }}
            >
                <Calendar size={16} />
                <div className="flex flex-col items-start min-w-0">
                    <span className="text-[10px] uppercase tracking-wider text-(--muted)">Date Filter</span>
                    <span className="font-bold truncate text-xs">{formatDateRange()}</span>
                </div>
                {hasFilters && (
                    <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black"
                        style={{ background: "var(--accent-2)", color: "white" }}>
                        ✓
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-3 z-50 w-96 rounded-2xl border overflow-hidden"
                        style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "0 8px 30px rgba(64,45,28,0.12)" }}>
                        {/* Header */}
                        <div className="px-5 py-4 flex items-center justify-between"
                            style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--border)" }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ background: "rgba(15,118,110,0.12)" }}>
                                    <Calendar size={18} className="text-(--accent-2)" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-(--ink) text-sm">Date Range Filter</h3>
                                    <p className="text-xs text-(--muted)">Select start and end dates</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)}
                                className="p-2 rounded-lg bg-(--surface) border border-(--border) hover:scale-105 transition-all">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-4">
                            {/* Preset Buttons */}
                            <div>
                                <p className="text-xs font-semibold text-(--muted) mb-2 uppercase tracking-wider">Quick Presets</p>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {[
                                        { key: "today", label: "Today" },
                                        { key: "week", label: "Week" },
                                        { key: "month", label: "Month" },
                                        { key: "custom", label: "Custom" },
                                    ].map((preset) => (
                                        <button
                                            key={preset.key}
                                            onClick={() => handlePresetSelect(preset.key)}
                                            className="px-2 py-2 rounded-lg border text-xs font-semibold transition-all text-center"
                                            style={{
                                                background: activeTab === preset.key ? "rgba(15,118,110,0.12)" : "var(--surface-muted)",
                                                borderColor: activeTab === preset.key ? "var(--accent-2)" : "var(--border)",
                                                color: activeTab === preset.key ? "var(--accent-2)" : "var(--ink)",
                                            }}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Date Picker Section */}
                            {activeTab === "custom" && (
                                <div className="space-y-3 pt-2 border-t border-(--border)">
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-semibold text-(--ink) mb-1.5">
                                            <Clock size={13} className="text-(--accent-2)" />
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => onStartDateChange(e.target.value)}
                                            className="w-full px-3.5 py-2 rounded-xl border bg-(--surface-muted) text-(--ink) text-xs font-medium outline-none transition-all"
                                            style={{ borderColor: "var(--border)" }}
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-semibold text-(--ink) mb-1.5">
                                            <Clock size={13} className="text-(--accent-2)" />
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => onEndDateChange(e.target.value)}
                                            className="w-full px-3.5 py-2 rounded-xl border bg-(--surface-muted) text-(--ink) text-xs font-medium outline-none transition-all"
                                            style={{ borderColor: "var(--border)" }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => { onClear(); setActiveTab("all"); setIsOpen(false); }}
                                    className="flex-1 px-4 py-2.5 rounded-xl border text-(--muted) hover:border-red-400 hover:text-red-500 font-semibold text-xs transition-all"
                                    style={{ borderColor: "var(--border)" }}
                                >
                                    Clear All
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
                                    style={{ background: "var(--accent-2)", color: "white" }}
                                >
                                    Apply Filter
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// ── Order detail modal ──────────────────────────────────────────────────
function OrderDetailModal({ order, onClose }) {
    const handleCopyOrderNumber = () => {
        if (order?.orderNumber) {
            navigator.clipboard.writeText(order.orderNumber);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border"
                style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "0 8px 30px rgba(64,45,28,0.12)" }}>
                {/* Header */}
                <div className="px-6 py-5" style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                                style={{ background: "rgba(15,118,110,0.12)" }}>
                                <Receipt size={20} className="text-(--accent-2)" />
                            </div>
                            <div className="flex items-center gap-2">
                                <div>
                                    <h2 className="text-lg font-bold text-(--ink)">Order Details</h2>
                                    <p className="text-sm text-(--muted) font-semibold">{order.orderNumber}</p>
                                </div>
                                <button
                                    onClick={handleCopyOrderNumber}
                                    className="p-1.5 rounded-lg hover:bg-(--surface-muted) transition-all"
                                    title="Copy order number"
                                >
                                    <Copy size={14} className="text-(--muted)" />
                                </button>
                            </div>
                        </div>
                        <button onClick={onClose}
                            className="p-2 rounded-lg bg-(--surface) border border-(--border) hover:scale-105 transition-all">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoCard icon={User} label="Customer Name" value={order.customerName || "Walk-in Customer"} />
                        <InfoCard icon={Clock} label="Order Date & Time" value={new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} />
                        <InfoCard icon={User} label="Served By" value={order.waiter || "Not specified"} />
                        <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ background: "var(--surface-muted)", borderColor: "var(--border)" }}>
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(15,118,110,0.12)" }}>
                                <CreditCard size={18} className="text-(--accent-2)" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-(--muted) uppercase tracking-wider">Payment Method</p>
                                <div className="mt-1"><PaymentBadge method={order.paymentMethod} /></div>
                            </div>
                        </div>
                    </div>

                    {/* Items */}
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
                                <div key={idx}
                                    className="flex items-center justify-between gap-4 p-3.5 rounded-xl border transition-all duration-150 hover:bg-(--surface-muted)"
                                    style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
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

                    {/* Summary */}
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

function InfoCard({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ background: "var(--surface-muted)", borderColor: "var(--border)" }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(15,118,110,0.12)" }}>
                <Icon size={18} className="text-(--accent-2)" />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-semibold text-(--muted) uppercase tracking-wider">{label}</p>
                <p className="font-bold text-(--ink) mt-0.5 truncate text-sm">{value}</p>
            </div>
        </div>
    );
}

function SummaryRow({ label, value, icon: Icon, isDiscount = false }) {
    return (
        <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
                <Icon size={14} className={isDiscount ? "text-red-500" : "text-(--muted)"} />
                <span className="font-semibold text-(--ink) text-sm">{label}</span>
            </div>
            <span className={`font-bold text-sm ${isDiscount ? "text-red-500" : "text-(--ink)"}`}>
                {isDiscount && value > 0 ? "- " : ""}Rs {(value || 0).toLocaleString()}
            </span>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function OrderHistory() {
    const navigate = useNavigate();
    const authUser = useSelector(s => s.auth);
    const user = authUser?.role ? authUser : { role: "admin", permissions: { deleteOrders: true } };
    const language = user?.language || "en";

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [returnModalOrderId, setReturnModalOrderId] = useState(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [filterId, setFilterId] = useState("");
    const [debouncedFilterId, setDebouncedFilterId] = useState("");
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [deleteOrder] = useDeleteOrder();
    const paginatedListRef = useRef(null);

    const hasActiveFilter = filterId !== "";

    const clearFilter = () => {
        setFilterId("");
    };

    // Debounce filter input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilterId(filterId);
        }, 300);
        return () => clearTimeout(timer);
    }, [filterId]);

    const handleDelete = async (id) => {
        try {
            await deleteOrder(id).unwrap();
        } catch (error) {
            console.error("Failed to delete order:", error);
        }
    };

    const handleClearFilters = () => {
        setStartDate("");
        setEndDate("");
    };

    const dateFilter = {};
    if (startDate) dateFilter.startDate = startDate;
    if (endDate) dateFilter.endDate = endDate;
    if (debouncedFilterId) dateFilter.orderNumber = debouncedFilterId;

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <div className="flex-none">
                <PageHeading
                    id="order-history-page-heading"
                    heading={language === "en" ? "Order History" : "آرڈر کی تاریخ"}
                    subheading={language === "en" ? "View, manage and track all your orders" : "تمام آرڈرز دیکھیں اور منظم کریں"}
                    leftActions={
                        <DateFilter
                            startDate={startDate}
                            endDate={endDate}
                            onStartDateChange={setStartDate}
                            onEndDateChange={setEndDate}
                            onClear={handleClearFilters}
                        />
                    }
                    rightActions={
                        <div className="relative">
                            <button
                                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all duration-150 ${
                                    hasActiveFilter 
                                        ? "border-(--accent-2) text-(--accent-2) bg-(--accent-2)/10" 
                                        : "border-(--border) text-(--muted) bg-(--surface-muted) hover:border-(--accent-2) hover:text-(--accent-2)"
                                }`}
                            >
                                <Filter size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">
                                    {language === "en" ? "Filter" : "فلٹر"}
                                </span>
                                {hasActiveFilter && (
                                    <div className="w-2 h-2 rounded-full bg-(--accent-2)" />
                                )}
                            </button>

                            {/* Filter Dropdown */}
                            {showFilterDropdown && (
                                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-(--border) bg-(--surface) shadow-xl z-50 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold uppercase tracking-wider text-(--muted)">
                                            {language === "en" ? "Filter by ID" : "آئی ڈی سے فلٹر کریں"}
                                        </span>
                                        {hasActiveFilter && (
                                            <button
                                                onClick={clearFilter}
                                                className="flex items-center gap-1 text-xs text-(--accent-2) hover:underline"
                                            >
                                                <X size={12} />
                                                {language === "en" ? "Clear" : "صاف"}
                                            </button>
                                        )}
                                    </div>

                                    {/* ID Filter */}
                                    <div>
                                        <label className="block text-xs font-semibold mb-1.5 text-(--muted)">
                                            {language === "en" ? "Order Number" : "آرڈر نمبر"}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter order number..."
                                            value={filterId}
                                            onChange={(e) => setFilterId(e.target.value)}
                                            className="w-full px-3 py-2 text-sm rounded-xl border-2 border-(--border) bg-(--surface-muted) outline-none focus:border-(--accent-2) transition-all"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    }
                />
            </div>

            <div className="flex-1 overflow-hidden">
                <PaginatedList
                    ref={paginatedListRef}
                    rtkQuery={usePaginatedOrders}
                    limit={20}
                    dataKey="data"
                    queryArgs={dateFilter}
                    wrapperClassName="h-full"
                    renderEmpty={() => (
                        <div className="flex flex-col items-center justify-center gap-4 py-20 px-6">
                            <div className="w-16 h-16 rounded-xl bg-(--surface-muted) flex items-center justify-center">
                                <Receipt className="w-8 h-8 text-(--muted)" strokeWidth={1.5} />
                            </div>
                            <div className="text-center space-y-1">
                                <h3 className="text-base font-bold text-(--ink)">
                                    {language === "en" ? "No Orders Found" : "کوئی آرڈر نہیں ملا"}
                                </h3>
                                <p className="text-sm text-(--muted) max-w-md">
                                    {(startDate || endDate)
                                        ? (language === "en" ? "No orders match your selected date range." : "منتخب تاریخ کی حد میں کوئی آرڈر نہیں ملا۔")
                                        : (language === "en" ? "Your order history is empty." : "آپ کی آرڈر کی تاریخ خالی ہے۔")}
                                </p>
                            </div>
                            {(startDate || endDate) && (
                                <button
                                    onClick={handleClearFilters}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-150 hover:scale-105"
                                    style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--accent-2)" }}
                                >
                                    <Filter size={14} />
                                    <span>Clear All Filters</span>
                                </button>
                            )}
                        </div>
                    )}
                    renderItems={(orders) => (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--border)" }}>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-(--muted)">Order #</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-(--muted)">Customer</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-(--muted) hidden sm:table-cell">Date & Time</th>
                                        <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider text-(--muted) hidden md:table-cell">Items</th>
                                        <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-(--muted)">Paid</th>
                                        <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-(--muted)">Remaining</th>
                                        <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-(--muted)">Total</th>
                                        <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider text-(--muted)">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order, index) => (
                                        <tr key={order._id || order.id}
                                            className="transition-all duration-150 hover:bg-(--surface-muted)"
                                            style={{ background: index % 2 === 0 ? "var(--surface)" : "rgba(255,250,243,0.6)", borderBottom: "1px solid var(--border)" }}>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-(--ink) whitespace-nowrap">{order.orderNumber || "—"}</span>
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(order.orderNumber)}
                                                        className="p-1 rounded hover:bg-(--surface-muted) transition-all"
                                                        title="Copy order number"
                                                    >
                                                        <Copy size={12} className="text-(--muted)" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="font-semibold text-(--ink) truncate">{order.customerName || "Walk-in"}</p>
                                                {order.waiter && (
                                                    <p className="text-xs text-(--muted) truncate mt-0.5">Served by {order.waiter}</p>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 hidden sm:table-cell">
                                                <p className="font-medium text-(--ink) whitespace-nowrap">
                                                    {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                                <p className="text-xs text-(--muted) whitespace-nowrap">
                                                    {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </td>
                                            <td className="px-5 py-3.5 text-center hidden md:table-cell">
                                                <StockBadgeLike qty={order.items?.length || 0} />
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <span className="font-semibold text-green-600 whitespace-nowrap">
                                                    Rs {(order.paidAmount ?? order.paid ?? 0).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <span className="font-semibold text-orange-600 whitespace-nowrap">
                                                    Rs {(order.remainingAmount ?? 0).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <span className="font-bold text-(--accent-2) whitespace-nowrap">
                                                    Rs {(order.totalAmount || 0).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex gap-1.5 justify-center">
                                                    <button
                                                        onClick={() => navigate(`/order-history/${order._id}`)}
                                                        id={`order-history-view-${order._id}`}
                                                        className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) transition-all duration-150 hover:scale-105 hover:border-(--accent-2) hover:text-(--accent-2)"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => setReturnModalOrderId(order._id)}
                                                        id={`order-history-return-${order._id}`}
                                                        className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) transition-all duration-150 hover:scale-105 hover:border-orange-400 hover:text-orange-500"
                                                        title="Return Order"
                                                    >
                                                        <RotateCcw size={15} />
                                                    </button>
                                                    <PermissionGuard permission="orders.delete">
                                                        <ConfirmDialog message={language === "en" ? "Delete this order?" : "کیا آپ یہ آرڈر حذف کرنا چاہتے ہیں؟"} onConfirm={() => handleDelete(order._id)}>
                                                            <button id={`order-history-delete-${order._id}`}
                                                                className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) transition-all duration-150 hover:scale-105 hover:border-red-400 hover:text-red-500">
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </ConfirmDialog>
                                                    </PermissionGuard>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                />
            </div>

            {selectedOrder && (
                <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
            )}
            {returnModalOrderId && (
                <OrderReturnModal
                    isOpen={!!returnModalOrderId}
                    orderId={returnModalOrderId}
                    onClose={() => setReturnModalOrderId(null)}
                    onSuccess={() => {
                        setReturnModalOrderId(null);
                        paginatedListRef.current?.refetch();
                    }}
                />
            )}
        </div>
    );
}

function StockBadgeLike({ qty }) {
    return (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: qty > 0 ? "rgba(15,118,110,0.12)" : "rgba(100,100,100,0.1)", color: qty > 0 ? "var(--accent-2)" : "var(--muted)" }}>
            {qty ?? 0}
        </span>
    );
}





import { useSelector } from "react-redux";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePaginatedOrders, useDeleteOrder } from "../services/orders.service.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import { 
    Eye, Trash2, X, ArrowLeft, Receipt, Calendar, Download, Printer, 
    User, Clock, Package, DollarSign, CreditCard, Wallet, Smartphone, 
    Percent, FileText, ShoppingBag, TrendingUp, Filter as FilterIcon
} from "lucide-react";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";

// ── Payment Method Configuration ───────────────────────────────────────
const PAYMENT_METHODS = {
    cash: {
        label: "Cash",
        icon: Wallet,
        bgColor: "rgba(15,118,110,0.12)",
        textColor: "var(--accent-2)",
        borderColor: "rgba(15,118,110,0.3)",
        iconBg: "rgba(15,118,110,0.2)",
    },
    online: {
        label: "Online",
        icon: Smartphone,
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
        icon: TrendingUp,
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

// ── Date Filter Component ───────────────────────────────────────────────
function DateFilter({ startDate, endDate, onStartDateChange, onEndDateChange, onClear }) {
    const [isOpen, setIsOpen] = useState(false);
    const hasFilters = startDate || endDate;

    const formatDateRange = () => {
        if (startDate && endDate) {
            return `${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        }
        if (startDate) return `From ${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        if (endDate) return `Until ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        return "Select Date Range";
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                    hasFilters
                        ? 'bg-gradient-to-r from-primary to-[#0d8a7e] text-white border-2 border-primary/30 shadow-lg shadow-primary/20'
                        : 'bg-(--surface) border-2 border-edge text-ink hover:border-primary hover:shadow-md'
                }`}
            >
                <div className={`p-1 rounded-lg ${hasFilters ? 'bg-white/20' : 'bg-(--surface-muted)'}`}>
                    <Calendar size={16} className={hasFilters ? 'text-white' : 'text-ink-subtle'} />
                </div>
                <div className="flex flex-col items-start min-w-0">
                    <span className={`text-[10px] uppercase tracking-wider ${hasFilters ? 'text-white/70' : 'text-ink-subtle'}`}>
                        Date Filter
                    </span>
                    <span className="font-bold truncate text-xs">
                        {formatDateRange()}
                    </span>
                </div>
                {hasFilters && (
                    <span className="ml-1 bg-white/25 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-black">
                        ✓
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-3 z-50 w-96 rounded-2xl border-2 border-edge bg-(--surface) shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-primary to-[#0d8a7e] px-5 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <Calendar size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-base">Date Range Filter</h3>
                                    <p className="text-xs text-white/70">Select start and end dates</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-4">
                            <div className="space-y-3">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-ink mb-2">
                                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Clock size={12} className="text-primary" />
                                        </div>
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => onStartDateChange(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-edge bg-(--surface-muted) text-ink font-medium focus:border-primary focus:bg-(--surface) outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-ink mb-2">
                                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Clock size={12} className="text-primary" />
                                        </div>
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => onEndDateChange(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-edge bg-(--surface-muted) text-ink font-medium focus:border-primary focus:bg-(--surface) outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Quick Filters */}
                            <div>
                                <p className="text-xs font-semibold text-ink-subtle mb-2 uppercase tracking-wider">Quick Filters</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: "Today", days: 0 },
                                        { label: "Last 7 Days", days: 7 },
                                        { label: "Last 30 Days", days: 30 },
                                        { label: "This Month", days: "month" },
                                    ].map((filter) => (
                                        <button
                                            key={filter.label}
                                            onClick={() => {
                                                const today = new Date();
                                                const end = today.toISOString().split('T')[0];
                                                let start;
                                                
                                                if (filter.days === "month") {
                                                    start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                                                } else {
                                                    const startDate = new Date(today);
                                                    startDate.setDate(today.getDate() - filter.days);
                                                    start = startDate.toISOString().split('T')[0];
                                                }
                                                
                                                onStartDateChange(start);
                                                onEndDateChange(end);
                                            }}
                                            className="px-3 py-2 rounded-lg border-2 border-edge text-xs font-semibold text-ink-subtle hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                                        >
                                            {filter.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => {
                                        onClear();
                                        setIsOpen(false);
                                    }}
                                    className="flex-1 px-4 py-3 rounded-xl border-2 border-edge text-ink-subtle hover:border-red-300 hover:text-red-600 hover:bg-red-50 font-semibold transition-all"
                                >
                                    Clear All
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-[#0d8a7e] text-white font-bold hover:shadow-lg hover:shadow-primary/30 transition-all"
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
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

            <div className="app-enter relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl bg-(--surface) border-2 border-edge">
                {/* Header with gradient */}
                <div className="relative bg-gradient-to-r from-primary to-[#0d8a7e] px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Receipt size={24} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Order Details</h2>
                                <p className="text-sm text-white/80 font-semibold">{order.orderNumber}</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto custom-scrollbar max-h-[calc(90vh-100px)] p-6 space-y-6">
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OrderHistory() {
    const navigate = useNavigate();
    const authUser = useSelector(s => s.auth);
    const user = authUser?.role ? authUser : { role: "admin", permissions: { deleteOrders: true } };
    const language = user?.language || "en";
    
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [deleteOrder] = useDeleteOrder();
    const paginatedListRef = useRef(null);

    const handleDelete = async (id) => {
        if (window.confirm(language === "en" ? "Delete this order?" : "کیا آپ یہ آرڈر حذف کرنا چاہتے ہیں؟")) {
            try {
                await deleteOrder(id).unwrap();
            } catch (error) {
                console.error("Failed to delete order:", error);
            }
        }
    };

    const handleClearFilters = () => {
        setStartDate("");
        setEndDate("");
    };

    // Build filter object for PaginatedList
    const dateFilter = {};
    if (startDate) dateFilter.startDate = startDate;
    if (endDate) dateFilter.endDate = endDate;

    return (
        <div className="h-screen flex flex-col bg-app-bg">
            {/* ── Header ── */}
            <div className="flex-none px-6 pt-6 pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            title="Go Back"
                            className="shrink-0 w-11 h-11 flex items-center justify-center rounded-2xl border-2 border-edge text-ink-subtle hover:text-primary hover:border-primary hover:bg-primary/10 transition-all hover:scale-105 active:scale-95"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-ink flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-[#0d8a7e] flex items-center justify-center">
                                    <Receipt size={20} className="text-white" />
                                </div>
                                {language === "en" ? "Order History" : "آرڈر کی تاریخ"}
                            </h1>
                            <p className="text-sm text-ink-subtle mt-1 font-medium">
                                {language === "en" ? "View, manage and track all your orders" : "تمام آرڈرز دیکھیں اور منظم کریں"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <DateFilter
                            startDate={startDate}
                            endDate={endDate}
                            onStartDateChange={setStartDate}
                            onEndDateChange={setEndDate}
                            onClear={handleClearFilters}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => console.log("Print")}
                                className="w-10 h-10 rounded-xl transition-all hover:bg-(--surface-muted) border-2 border-edge hover:border-primary text-ink-subtle hover:text-primary flex items-center justify-center"
                                title="Print Orders"
                            >
                                <Printer size={18} />
                            </button>
                            <button
                                onClick={() => console.log("Export")}
                                className="w-10 h-10 rounded-xl transition-all hover:bg-(--surface-muted) border-2 border-edge hover:border-primary text-ink-subtle hover:text-primary flex items-center justify-center"
                                title="Export to Excel"
                            >
                                <Download size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Table ── */}
            <div className="flex-1 overflow-hidden px-6 pb-6">
                <PaginatedList
                    ref={paginatedListRef}
                    rtkQuery={usePaginatedOrders}
                    limit={20}
                    dataKey="data"
                    queryArgs={dateFilter}
                    wrapperClassName="h-full"
                    className="p-0"
                    renderEmpty={() => (
                        <div className="flex flex-col items-center justify-center gap-5 py-20 px-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                    <Receipt className="w-12 h-12 text-primary" />
                                </div>
                                <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                                    <X size={20} className="text-white" />
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold text-ink">
                                    {language === "en" ? "No Orders Found" : "کوئی آرڈر نہیں ملا"}
                                </h3>
                                <p className="text-sm text-ink-subtle max-w-md">
                                    {(startDate || endDate)
                                        ? language === "en" 
                                            ? "No orders match your selected date range. Try adjusting the filters."
                                            : "منتخب تاریخ کی حد میں کوئی آرڈر نہیں ملا۔"
                                        : language === "en"
                                            ? "Your order history is empty. Orders will appear here once customers make purchases."
                                            : "آپ کی آرڈر کی تاریخ خالی ہے۔"}
                                </p>
                            </div>
                            {(startDate || endDate) && (
                                <button
                                    onClick={handleClearFilters}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-[#0d8a7e] text-white font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all hover:scale-105 active:scale-95"
                                >
                                    <FilterIcon size={16} />
                                    <span>Clear All Filters</span>
                                </button>
                            )}
                        </div>
                    )}
                    renderItems={(orders) => (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 z-10">
                                    <tr className="bg-gradient-to-r from-(--surface-muted) to-(--surface)">
                                        <th className="px-5 py-4 text-left">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Receipt size={14} className="text-primary" />
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-widest text-ink-subtle">Order #</span>
                                            </div>
                                        </th>
                                        <th className="px-5 py-4 text-left">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <User size={14} className="text-primary" />
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-widest text-ink-subtle">Customer</span>
                                            </div>
                                        </th>
                                        <th className="px-5 py-4 text-left hidden sm:table-cell">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Clock size={14} className="text-primary" />
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-widest text-ink-subtle">Date & Time</span>
                                            </div>
                                        </th>
                                        <th className="px-5 py-4 text-center hidden md:table-cell">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Package size={14} className="text-primary" />
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-widest text-ink-subtle">Items</span>
                                            </div>
                                        </th>
                                        <th className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <CreditCard size={14} className="text-primary" />
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-widest text-ink-subtle">Payment</span>
                                            </div>
                                        </th>
                                        <th className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <DollarSign size={14} className="text-primary" />
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-widest text-ink-subtle">Total</span>
                                            </div>
                                        </th>
                                        <th className="px-5 py-4 text-center">
                                            <span className="text-xs font-black uppercase tracking-widest text-ink-subtle">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order, index) => (
                                        <tr
                                            key={order._id || order.id}
                                            className="border-t-2 border-edge transition-all hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent group"
                                        >
                                            {/* Order Number */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-black text-primary text-xs">
                                                        #{index + 1}
                                                    </div>
                                                    <span className="font-bold text-ink whitespace-nowrap">
                                                        {order.orderNumber || "—"}
                                                    </span>
                                                </div>
                                            </td>
                                            
                                            {/* Customer */}
                                            <td className="px-5 py-4">
                                                <div>
                                                    <p className="font-semibold text-ink truncate flex items-center gap-2">
                                                        {order.customerName || "Walk-in"}
                                                    </p>
                                                    {order.waiter && (
                                                        <p className="text-xs text-ink-subtle truncate mt-0.5 flex items-center gap-1">
                                                            <User size={10} />
                                                            Served by {order.waiter}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            
                                            {/* Date & Time */}
                                            <td className="px-5 py-4 hidden sm:table-cell">
                                                <div className="space-y-0.5">
                                                    <p className="font-semibold text-ink whitespace-nowrap">
                                                        {new Date(order.createdAt).toLocaleDateString('en-US', { 
                                                            month: 'short', 
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                    <p className="text-xs text-ink-subtle whitespace-nowrap flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {new Date(order.createdAt).toLocaleTimeString('en-US', { 
                                                            hour: '2-digit', 
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </td>
                                            
                                            {/* Items Count */}
                                            <td className="px-5 py-4 text-center hidden md:table-cell">
                                                <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border-2 border-primary/20">
                                                    <Package size={14} className="text-primary" />
                                                    <span className="font-bold text-primary">
                                                        {order.items?.length || 0}
                                                    </span>
                                                </div>
                                            </td>
                                            
                                            {/* Payment Method */}
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex justify-center">
                                                    <PaymentBadge method={order.paymentMethod} size="md" />
                                                </div>
                                            </td>
                                            
                                            {/* Total */}
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="text-lg font-black text-primary whitespace-nowrap">
                                                        Rs {(order.totalAmount || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                            </td>
                                            
                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex gap-2 justify-center">
                                                    <button
                                                        onClick={() => setSelectedOrder(order)}
                                                        title="View Details"
                                                        className="w-9 h-9 rounded-xl transition-all flex items-center justify-center bg-(--surface-muted) border-2 border-edge hover:border-primary hover:bg-primary/10 text-ink-subtle hover:text-primary group-hover:scale-105"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <PermissionGuard execute={() => handleDelete(order._id)} permission="orders.delete" isConfirmation={true}>
                                                        <button
                                                            title="Delete Order"
                                                            className="w-9 h-9 rounded-xl transition-all flex items-center justify-center bg-red-50 border-2 border-red-200 hover:border-red-400 hover:bg-red-100 text-red-500 hover:text-red-700 group-hover:scale-105"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
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
        </div>
    );
}




















// import { useSelector } from "react-redux";
// import { useState } from "react";
// import { usePaginatedOrders, useDeleteOrder } from "../services/orders.service.js";
// import PaginatedList from "../../../shared/components/PaginatedList.jsx";
// import { Eye, Trash2, X } from "lucide-react";

// function HistoryCard({ order, onView, onDelete }) {
//     const METHOD_STYLE = {
//         cash:   { bg: "rgba(15,118,110,0.1)", color: "var(--accent-2)", border: "rgba(15,118,110,0.2)" },
//         online: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "rgba(59,130,246,0.2)" },
//         credit: { bg: "rgba(168,85,247,0.1)", color: "#a855f7", border: "rgba(168,85,247,0.2)" },
//         hybrid: { bg: "rgba(249,115,22,0.1)", color: "#f97316", border: "rgba(249,115,22,0.2)" },
//         free:   { bg: "var(--surface-muted)", color: "var(--muted)", border: "var(--border)" },
//     };

//     const style = METHOD_STYLE[order.paymentMethod] || METHOD_STYLE.free;

//     return (
//         <div className="border rounded-xl p-4"
//             style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
//             <div className="flex items-center justify-between">
//                 <div className="flex-1">
//                     <div className="flex items-center gap-3">
//                         <p className="text-base font-semibold" style={{ color: "var(--ink)" }}>{order.orderNumber || "—"}</p>
//                         <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
//                             style={{ background: style.bg, color: style.color, border: "1px solid " + style.border }}>
//                             {order.paymentMethod || "—"}
//                         </span>
//                     </div>
//                     <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
//                         {order.customerName || "—"} · Rs {(order.totalAmount || 0).toLocaleString()}
//                     </p>
//                     <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
//                         {new Date(order.createdAt).toLocaleString()} · {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
//                     </p>
//                 </div>
//                 <div className="flex gap-2">
//                     <button 
//                         onClick={() => onView(order)}
//                         className="p-2 rounded-lg transition"
//                         style={{ background: "var(--surface-muted)", color: "var(--ink)", border: "1px solid var(--border)" }}
//                     >
//                         <Eye size={16} />
//                     </button>
//                     <button 
//                         onClick={() => onDelete(order._id)}
//                         className="p-2 rounded-lg transition"
//                         style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" }}
//                     >
//                         <Trash2 size={16} />
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }

// function OrderDetailModal({ order, onClose }) {
//     const METHOD_STYLE = {
//         cash:   { bg: "rgba(15,118,110,0.1)", color: "var(--accent-2)", border: "rgba(15,118,110,0.2)" },
//         online: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "rgba(59,130,246,0.2)" },
//         credit: { bg: "rgba(168,85,247,0.1)", color: "#a855f7", border: "rgba(168,85,247,0.2)" },
//         hybrid: { bg: "rgba(249,115,22,0.1)", color: "#f97316", border: "rgba(249,115,22,0.2)" },
//         free:   { bg: "var(--surface-muted)", color: "var(--muted)", border: "var(--border)" },
//     };

//     const style = METHOD_STYLE[order.paymentMethod] || METHOD_STYLE.free;

//     return (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//             <div 
//                 className="absolute inset-0 bg-black/40 backdrop-blur-sm"
//                 onClick={onClose}
//             />
//             <div 
//                 className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
//                 style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
//             >
//                 <div className="sticky top-0 p-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
//                     <h2 className="text-xl font-bold" style={{ color: "var(--ink)" }}>
//                         Order {order.orderNumber}
//                     </h2>
//                     <button 
//                         onClick={onClose}
//                         className="p-2 rounded-lg transition"
//                         style={{ background: "var(--surface-muted)", color: "var(--ink)", border: "1px solid var(--border)" }}
//                     >
//                         <X size={20} />
//                     </button>
//                 </div>
//                 <div className="p-6 space-y-4">
//                     <div className="grid grid-cols-2 gap-4">
//                         <div>
//                             <p className="text-sm" style={{ color: "var(--muted)" }}>Customer</p>
//                             <p className="font-medium" style={{ color: "var(--ink)" }}>{order.customerName || "—"}</p>
//                         </div>
//                         <div>
//                             <p className="text-sm" style={{ color: "var(--muted)" }}>Payment Method</p>
//                             <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
//                                 style={{ background: style.bg, color: style.color, border: "1px solid " + style.border }}>
//                                 {order.paymentMethod || "—"}
//                             </span>
//                         </div>
//                         <div>
//                             <p className="text-sm" style={{ color: "var(--muted)" }}>Date</p>
//                             <p className="font-medium" style={{ color: "var(--ink)" }}>{new Date(order.createdAt).toLocaleString()}</p>
//                         </div>
//                         <div>
//                             <p className="text-sm" style={{ color: "var(--muted)" }}>Waiter</p>
//                             <p className="font-medium" style={{ color: "var(--ink)" }}>{order.waiter || "—"}</p>
//                         </div>
//                     </div>
//                     <div>
//                         <p className="text-sm font-semibold mb-2" style={{ color: "var(--ink)" }}>Items</p>
//                         <div className="space-y-2">
//                             {order.items?.map((item, idx) => (
//                                 <div key={idx} className="flex justify-between p-3 rounded-lg" style={{ background: "var(--surface-muted)" }}>
//                                     <div>
//                                         <p className="font-medium" style={{ color: "var(--ink)" }}>{item.name}</p>
//                                         <p className="text-sm" style={{ color: "var(--muted)" }}>
//                                             {item.quantity} × Rs {item.unitPrice?.toLocaleString()}
//                                         </p>
//                                     </div>
//                                     <p className="font-semibold" style={{ color: "var(--accent-2)" }}>
//                                         Rs {(item.quantity * item.unitPrice).toLocaleString()}
//                                     </p>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                     <div className="pt-4" style={{ borderTop: "1px solid var(--border)" }}>
//                         <div className="flex justify-between">
//                             <span className="font-medium" style={{ color: "var(--muted)" }}>Subtotal</span>
//                             <span style={{ color: "var(--ink)" }}>Rs {(order.subtotal || 0).toLocaleString()}</span>
//                         </div>
//                         <div className="flex justify-between">
//                             <span className="font-medium" style={{ color: "var(--muted)" }}>Discount</span>
//                             <span style={{ color: "var(--ink)" }}>Rs {(order.discountAmount || 0).toLocaleString()}</span>
//                         </div>
//                         <div className="flex justify-between text-lg font-bold mt-2">
//                             <span style={{ color: "var(--ink)" }}>Total</span>
//                             <span style={{ color: "var(--accent-2)" }}>Rs {(order.totalAmount || 0).toLocaleString()}</span>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

// export default function OrderHistory() {
//     const authUser = useSelector(s => s.auth);
//     const user = authUser?.role ? authUser : { role: "admin", permissions: { deleteOrders: true } };
//     const language = user?.language || "en";
//     const [selectedOrder, setSelectedOrder] = useState(null);
//     const [deleteOrder] = useDeleteOrder();

//     const handleDelete = async (id) => {
//         if (window.confirm(language === "en" ? "Delete this order?" : "کیا آپ یہ آرڈر حذف کرنا چاہتے ہیں؟")) {
//             try {
//                 await deleteOrder(id).unwrap();
//             } catch (error) {
//                 console.error("Failed to delete order:", error);
//             }
//         }
//     };

//     return (
//         <div className="p-6">
//             <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--ink)" }}>
//                 {language === "en" ? "Order History" : "آرڈر کی تاریخ"}
//             </h1>
//             <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-4">
//                 <PaginatedList
//                     rtkQuery={usePaginatedOrders}
//                     limit={20}
//                     dataKey="data"
//                     renderItems={(orders) => (
//                         <div className="space-y-3">
//                             {orders.length === 0 ? (
//                                 <p className="text-center text-sm py-8" style={{ color: "var(--muted)" }}>
//                                     {language === "en" ? "No orders yet" : "کوئی آرڈر نہیں"}
//                                 </p>
//                             ) : (
//                                 orders.map((order) => (
//                                     <HistoryCard 
//                                         key={order._id || order.id} 
//                                         order={order} 
//                                         onView={setSelectedOrder}
//                                         onDelete={handleDelete}
//                                     />
//                                 ))
//                             )}
//                         </div>
//                     )}
//                 />
//             </div>
//             {selectedOrder && (
//                 <OrderDetailModal 
//                     order={selectedOrder} 
//                     onClose={() => setSelectedOrder(null)} 
//                 />
//             )}
//         </div>
//     );
// }

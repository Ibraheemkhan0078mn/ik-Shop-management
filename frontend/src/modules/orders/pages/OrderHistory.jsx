import { useSelector } from "react-redux";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePaginatedOrders, useDeleteOrder } from "../services/orders.service.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import { Eye, Trash2, X, ArrowLeft, Receipt, Calendar, Download, Printer, Filter } from "lucide-react";

// ── Shared payment-method styling ───────────────────────────────────────
const PAYMENT_METHOD_STYLES = {
    cash:   "bg-primary-hover text-primary border-edge-brand",
    online: "bg-[rgba(59,130,246,0.1)] text-[#3b82f6] border-[rgba(59,130,246,0.25)]",
    credit: "bg-[rgba(168,85,247,0.1)] text-[#a855f7] border-[rgba(168,85,247,0.25)]",
    hybrid: "bg-[rgba(249,115,22,0.1)] text-[#f97316] border-[rgba(249,115,22,0.25)]",
    free:   "bg-(--surface-muted) text-ink-subtle border-edge",
};
const getPaymentStyle = (method) => PAYMENT_METHOD_STYLES[method] ?? PAYMENT_METHOD_STYLES.free;

function PaymentBadge({ method }) {
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize border ${getPaymentStyle(method)}`}>
            {method || "—"}
        </span>
    );
}

// ── Date Filter Component ───────────────────────────────────────────────
function DateFilter({ startDate, endDate, onStartDateChange, onEndDateChange, onClear }) {
    const [isOpen, setIsOpen] = useState(false);

    const hasFilters = startDate || endDate;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    hasFilters
                        ? 'bg-primary text-white border-2 border-primary'
                        : 'border-2 border-edge text-ink-subtle hover:border-edge-brand hover:text-primary'
                }`}
            >
                <Calendar size={16} />
                <span>Filter by Date</span>
                {hasFilters && (
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                        Active
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border-2 border-edge bg-(--surface) shadow-2xl p-4 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-ink">Date Range</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-ink-subtle hover:text-ink"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-ink-subtle mb-1.5">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => onStartDateChange(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border-2 border-edge bg-(--surface-muted) text-ink focus:border-primary outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-ink-subtle mb-1.5">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => onEndDateChange(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border-2 border-edge bg-(--surface-muted) text-ink focus:border-primary outline-none transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => {
                                    onClear();
                                    setIsOpen(false);
                                }}
                                className="flex-1 px-4 py-2 rounded-lg border-2 border-edge text-ink-subtle hover:border-edge-brand hover:text-ink font-medium transition-colors"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="flex-1 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
                            >
                                Apply
                            </button>
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
            <div className="absolute inset-0 app-overlay" onClick={onClose} />

            <div className="app-enter relative w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl shadow-2xl bg-(--surface) border-2 border-edge">
                <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between border-b-2 border-edge bg-(--surface)">
                    <h2 className="text-lg sm:text-xl font-bold text-ink truncate">Order {order.orderNumber}</h2>
                    <button onClick={onClose} className="btn-close p-2 shrink-0">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 sm:p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DetailField label="Customer" value={order.customerName || "—"} />
                        <DetailField label="Payment Method" value={<PaymentBadge method={order.paymentMethod} />} />
                        <DetailField label="Date" value={new Date(order.createdAt).toLocaleString()} />
                        <DetailField label="Waiter" value={order.waiter || "—"} />
                    </div>

                    <div>
                        <p className="text-sm font-semibold mb-2 text-ink">Items</p>
                        <div className="space-y-2">
                            {order.items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-start gap-3 p-3 rounded-lg bg-(--surface-muted)">
                                    <div className="min-w-0">
                                        <p className="font-medium text-ink truncate">{item.name}</p>
                                        <p className="text-sm text-ink-subtle">
                                            {item.quantity} × Rs {item.unitPrice?.toLocaleString()}
                                        </p>
                                    </div>
                                    <p className="font-semibold text-primary shrink-0">
                                        Rs {(item.quantity * item.unitPrice).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t-2 border-edge space-y-1">
                        <SummaryRow label="Subtotal" value={order.subtotal} />
                        <SummaryRow label="Discount" value={order.discountAmount} />
                        <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t-2 border-edge">
                            <span className="text-ink">Total</span>
                            <span className="text-primary">Rs {(order.totalAmount || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailField({ label, value }) {
    return (
        <div>
            <p className="text-sm text-ink-subtle">{label}</p>
            <div className="font-medium text-ink mt-0.5">{value}</div>
        </div>
    );
}

function SummaryRow({ label, value }) {
    return (
        <div className="flex justify-between text-sm">
            <span className="font-medium text-ink-subtle">{label}</span>
            <span className="text-ink">Rs {(value || 0).toLocaleString()}</span>
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
            <div className="flex-none px-6 pt-4 pb-3">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            title="Back"
                            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full border-2 border-edge text-ink-subtle hover:text-primary hover:border-edge-brand hover:bg-primary-hover transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-ink">
                                {language === "en" ? "Order History" : "آرڈر کی تاریخ"}
                            </h1>
                            <p className="text-sm text-ink-subtle mt-0.5">
                                {language === "en" ? "View and manage all orders" : "تمام آرڈرز دیکھیں اور منظم کریں"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <DateFilter
                            startDate={startDate}
                            endDate={endDate}
                            onStartDateChange={setStartDate}
                            onEndDateChange={setEndDate}
                            onClear={handleClearFilters}
                        />
                        <button
                            onClick={() => console.log("Print")}
                            className="p-2 rounded-lg transition-all hover:bg-(--surface-muted) text-ink-subtle hover:text-ink"
                            title="Print"
                        >
                            <Printer size={18} />
                        </button>
                        <button
                            onClick={() => console.log("Export")}
                            className="p-2 rounded-lg transition-all hover:bg-(--surface-muted) text-ink-subtle hover:text-ink"
                            title="Export"
                        >
                            <Download size={18} />
                        </button>
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
                        <div className="flex flex-col items-center gap-3 text-center py-12">
                            <div className="bg-(--surface-muted) w-14 h-14 rounded-full flex items-center justify-center">
                                <Receipt className="w-7 h-7 text-ink-subtle" />
                            </div>
                            <p className="text-sm text-ink-subtle">
                                {language === "en" ? "No orders found" : "کوئی آرڈر نہیں ملا"}
                            </p>
                            {(startDate || endDate) && (
                                <button
                                    onClick={handleClearFilters}
                                    className="text-sm text-primary hover:underline"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    )}
                    renderItems={(orders) => (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="sticky top-0 z-10 bg-(--surface-muted)">
                                    <tr className="text-xs uppercase tracking-wider text-ink-subtle border-b-2 border-edge">
                                        <th className="px-4 py-3 font-semibold">Order #</th>
                                        <th className="px-4 py-3 font-semibold">Customer</th>
                                        <th className="px-4 py-3 font-semibold hidden sm:table-cell">Date</th>
                                        <th className="px-4 py-3 font-semibold text-center hidden md:table-cell">Items</th>
                                        <th className="px-4 py-3 font-semibold text-center">Payment</th>
                                        <th className="px-4 py-3 font-semibold text-right">Total</th>
                                        <th className="px-4 py-3 font-semibold text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr
                                            key={order._id || order.id}
                                            className="border-b border-edge transition-colors hover:bg-primary-hover"
                                        >
                                            <td className="px-4 py-3 font-medium text-ink whitespace-nowrap">
                                                {order.orderNumber || "—"}
                                            </td>
                                            <td className="px-4 py-3 text-ink">
                                                <div>
                                                    <p className="font-medium truncate">{order.customerName || "—"}</p>
                                                    {order.waiter && (
                                                        <p className="text-xs text-ink-subtle truncate">by {order.waiter}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-ink-subtle hidden sm:table-cell whitespace-nowrap">
                                                <div>
                                                    <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                                                    <p className="text-xs">{new Date(order.createdAt).toLocaleTimeString()}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center text-ink-subtle hidden md:table-cell">
                                                {order.items?.length || 0}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <PaymentBadge method={order.paymentMethod} />
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-primary whitespace-nowrap">
                                                Rs {(order.totalAmount || 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1 justify-center">
                                                    <button
                                                        onClick={() => setSelectedOrder(order)}
                                                        title="View"
                                                        className="p-2 rounded-lg transition-colors hover:bg-primary-hover text-ink-subtle hover:text-primary"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(order._id)}
                                                        title="Delete"
                                                        className="p-2 rounded-lg transition-colors hover:bg-red-100 text-red-500"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
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

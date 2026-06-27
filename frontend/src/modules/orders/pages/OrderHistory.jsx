import { useSelector } from "react-redux";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePaginatedOrders, useDeleteOrder } from "../services/orders.service.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import { Eye, Trash2, X, ArrowLeft, Receipt } from "lucide-react";

// ── Shared payment-method styling ───────────────────────────────────────
// Theme colors come straight from index.css; the rest (online/credit/hybrid)
// are kept as standalone accents since the theme doesn't define them.
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

// ── Order card ───────────────────────────────────────────────────────────
function HistoryCard({ order, onView, onDelete }) {
    return (
        <div className="card !p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-ink truncate">{order.orderNumber || "—"}</p>
                        <PaymentBadge method={order.paymentMethod} />
                    </div>
                    <p className="text-sm mt-1 text-ink-subtle truncate">
                        {order.customerName || "—"} · Rs {(order.totalAmount || 0).toLocaleString()}
                    </p>
                    <p className="text-xs mt-1 text-ink-subtle">
                        {new Date(order.createdAt).toLocaleString()} · {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
                    </p>
                </div>

                <div className="flex gap-2 self-end sm:self-auto shrink-0">
                    <button onClick={() => onView(order)} title="View" className="card-button">
                        <Eye size={16} />
                    </button>
                    <button onClick={() => onDelete(order._id)} title="Delete" className="card-button text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Order detail modal ──────────────────────────────────────────────────
function OrderDetailModal({ order, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 app-overlay" onClick={onClose} />

            <div className="app-enter relative w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl shadow-2xl bg-(--surface) border border-edge">
                <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between border-b border-edge bg-(--surface)">
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

                    <div className="pt-4 border-t border-edge space-y-1">
                        <SummaryRow label="Subtotal" value={order.subtotal} />
                        <SummaryRow label="Discount" value={order.discountAmount} />
                        <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-edge">
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

// ── Page ─────────────────────────────────────────────────────────────────
export default function OrderHistory() {
    const navigate = useNavigate();
    const authUser = useSelector(s => s.auth);
    const user = authUser?.role ? authUser : { role: "admin", permissions: { deleteOrders: true } };
    const language = user?.language || "en";
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [deleteOrder] = useDeleteOrder();

    const handleDelete = async (id) => {
        if (window.confirm(language === "en" ? "Delete this order?" : "کیا آپ یہ آرڈر حذف کرنا چاہتے ہیں؟")) {
            try {
                await deleteOrder(id).unwrap();
            } catch (error) {
                console.error("Failed to delete order:", error);
            }
        }
    };

    return (
        <div className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    title="Back"
                    className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full border border-edge text-ink-subtle hover:text-primary hover:border-edge-brand hover:bg-primary-hover transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <h1 className="text-xl sm:text-2xl font-bold text-ink">
                    {language === "en" ? "Order History" : "آرڈر کی تاریخ"}
                </h1>
            </div>

            <div className="rounded-2xl border border-edge bg-(--surface) shadow-[0_14px_30px_rgba(64,45,28,0.1)] p-3 sm:p-4">
                <PaginatedList
                    rtkQuery={usePaginatedOrders}
                    limit={20}
                    dataKey="data"
                    renderItems={(orders) => (
                        <div className="space-y-3">
                            {orders.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 text-center py-12">
                                    <div className="bg-(--surface-muted) w-14 h-14 rounded-full flex items-center justify-center">
                                        <Receipt className="w-7 h-7 text-ink-subtle" />
                                    </div>
                                    <p className="text-sm text-ink-subtle">
                                        {language === "en" ? "No orders yet" : "کوئی آرڈر نہیں"}
                                    </p>
                                </div>
                            ) : (
                                orders.map((order) => (
                                    <HistoryCard
                                        key={order._id || order.id}
                                        order={order}
                                        onView={setSelectedOrder}
                                        onDelete={handleDelete}
                                    />
                                ))
                            )}
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

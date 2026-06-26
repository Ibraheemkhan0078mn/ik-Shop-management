import { useSelector } from "react-redux";
import { useState } from "react";
import { usePaginatedOrders, useDeleteOrder } from "../services/orders.service.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import { Eye, Trash2, X } from "lucide-react";

function HistoryCard({ order, onView, onDelete }) {
    const METHOD_STYLE = {
        cash:   { bg: "rgba(15,118,110,0.1)", color: "var(--accent-2)", border: "rgba(15,118,110,0.2)" },
        online: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "rgba(59,130,246,0.2)" },
        credit: { bg: "rgba(168,85,247,0.1)", color: "#a855f7", border: "rgba(168,85,247,0.2)" },
        hybrid: { bg: "rgba(249,115,22,0.1)", color: "#f97316", border: "rgba(249,115,22,0.2)" },
        free:   { bg: "var(--surface-muted)", color: "var(--muted)", border: "var(--border)" },
    };

    const style = METHOD_STYLE[order.paymentMethod] || METHOD_STYLE.free;

    return (
        <div className="border rounded-xl p-4"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <p className="text-base font-semibold" style={{ color: "var(--ink)" }}>{order.orderNumber || "—"}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                            style={{ background: style.bg, color: style.color, border: "1px solid " + style.border }}>
                            {order.paymentMethod || "—"}
                        </span>
                    </div>
                    <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                        {order.customerName || "—"} · Rs {(order.totalAmount || 0).toLocaleString()}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                        {new Date(order.createdAt).toLocaleString()} · {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => onView(order)}
                        className="p-2 rounded-lg transition"
                        style={{ background: "var(--surface-muted)", color: "var(--ink)", border: "1px solid var(--border)" }}
                    >
                        <Eye size={16} />
                    </button>
                    <button 
                        onClick={() => onDelete(order._id)}
                        className="p-2 rounded-lg transition"
                        style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" }}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function OrderDetailModal({ order, onClose }) {
    const METHOD_STYLE = {
        cash:   { bg: "rgba(15,118,110,0.1)", color: "var(--accent-2)", border: "rgba(15,118,110,0.2)" },
        online: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "rgba(59,130,246,0.2)" },
        credit: { bg: "rgba(168,85,247,0.1)", color: "#a855f7", border: "rgba(168,85,247,0.2)" },
        hybrid: { bg: "rgba(249,115,22,0.1)", color: "#f97316", border: "rgba(249,115,22,0.2)" },
        free:   { bg: "var(--surface-muted)", color: "var(--muted)", border: "var(--border)" },
    };

    const style = METHOD_STYLE[order.paymentMethod] || METHOD_STYLE.free;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div 
                className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
                <div className="sticky top-0 p-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
                    <h2 className="text-xl font-bold" style={{ color: "var(--ink)" }}>
                        Order {order.orderNumber}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-lg transition"
                        style={{ background: "var(--surface-muted)", color: "var(--ink)", border: "1px solid var(--border)" }}
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm" style={{ color: "var(--muted)" }}>Customer</p>
                            <p className="font-medium" style={{ color: "var(--ink)" }}>{order.customerName || "—"}</p>
                        </div>
                        <div>
                            <p className="text-sm" style={{ color: "var(--muted)" }}>Payment Method</p>
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                                style={{ background: style.bg, color: style.color, border: "1px solid " + style.border }}>
                                {order.paymentMethod || "—"}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm" style={{ color: "var(--muted)" }}>Date</p>
                            <p className="font-medium" style={{ color: "var(--ink)" }}>{new Date(order.createdAt).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm" style={{ color: "var(--muted)" }}>Waiter</p>
                            <p className="font-medium" style={{ color: "var(--ink)" }}>{order.waiter || "—"}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-semibold mb-2" style={{ color: "var(--ink)" }}>Items</p>
                        <div className="space-y-2">
                            {order.items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between p-3 rounded-lg" style={{ background: "var(--surface-muted)" }}>
                                    <div>
                                        <p className="font-medium" style={{ color: "var(--ink)" }}>{item.name}</p>
                                        <p className="text-sm" style={{ color: "var(--muted)" }}>
                                            {item.quantity} × Rs {item.unitPrice?.toLocaleString()}
                                        </p>
                                    </div>
                                    <p className="font-semibold" style={{ color: "var(--accent-2)" }}>
                                        Rs {(item.quantity * item.unitPrice).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                        <div className="flex justify-between">
                            <span className="font-medium" style={{ color: "var(--muted)" }}>Subtotal</span>
                            <span style={{ color: "var(--ink)" }}>Rs {(order.subtotal || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium" style={{ color: "var(--muted)" }}>Discount</span>
                            <span style={{ color: "var(--ink)" }}>Rs {(order.discountAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold mt-2">
                            <span style={{ color: "var(--ink)" }}>Total</span>
                            <span style={{ color: "var(--accent-2)" }}>Rs {(order.totalAmount || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function OrderHistory() {
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
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--ink)" }}>
                {language === "en" ? "Order History" : "آرڈر کی تاریخ"}
            </h1>
            <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-4">
                <PaginatedList
                    rtkQuery={usePaginatedOrders}
                    limit={20}
                    dataKey="data"
                    renderItems={(orders) => (
                        <div className="space-y-3">
                            {orders.length === 0 ? (
                                <p className="text-center text-sm py-8" style={{ color: "var(--muted)" }}>
                                    {language === "en" ? "No orders yet" : "کوئی آرڈر نہیں"}
                                </p>
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
                <OrderDetailModal 
                    order={selectedOrder} 
                    onClose={() => setSelectedOrder(null)} 
                />
            )}
        </div>
    );
}

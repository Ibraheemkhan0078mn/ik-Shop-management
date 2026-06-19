import { useState }           from "react";
import { ShoppingCart, Trash2, RotateCcw, Pause } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
//  PosCartSidebar
//
//  Right-side panel of the POS screen. Shows:
//    • The current cart (items, quantities, totals)
//    • A checkout button
//    • A slide-out drawer for Held Orders and Order History
//
//  Props from PosPage:
//    cart, subtotal, resumedHoldId
//    holdOrders, orderHistory, showHeldOrders, setShowHeldOrders
//    user
//    incQty, decQty, removeFromCart, setCartItemQty, openPortionModal
//    onCheckout, onHold, handleResumeOrder, handleDeleteHeldOrder
// ─────────────────────────────────────────────────────────────────────────────
export default function PosCartSidebar({
    cart = [],
    subtotal = 0,
    resumedHoldId = null,
    holdOrders = [],
    orderHistory = [],
    showHeldOrders,
    setShowHeldOrders,
    user,
    incQty,
    decQty,
    removeFromCart,
    setCartItemQty,
    openPortionModal,
    onCheckout,
    onHold,
    handleResumeOrder,
    handleDeleteHeldOrder,
}) {
    const [activeTab, setActiveTab] = useState("held");

    const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);

    // Portion type display labels
    const PORTION_LABEL = { full: "", half: " (½)", custom: " (custom)" };

    return (
        <>
            {/* ── Main Sidebar ──────────────────────────────────────────── */}
            <aside className="w-[400px] h-screen flex flex-col bg-white/70 backdrop-blur-md border-l border-white/50 shadow-xl">

                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                    <ShoppingCart size={20} className="text-cyan-600" />
                    <h2 className="font-bold text-gray-800 text-base">Current Order</h2>

                    {/* Shows "Resumed" if the cart was loaded from a held order */}
                    {resumedHoldId && (
                        <span className="ml-1 text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                            Resumed
                        </span>
                    )}

                    {totalItems > 0 && (
                        <span className="ml-auto bg-cyan-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {totalItems}
                        </span>
                    )}
                </div>

                {/* Cart item list */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-2">
                            <ShoppingCart size={48} strokeWidth={1} />
                            <p className="text-sm font-medium">Cart is empty</p>
                            <p className="text-xs">Click a product to add it</p>
                        </div>
                    ) : (
                        cart.map((item, idx) => (
                            <CartItem
                                key={`${item._id}-${item.portionType}-${item.unitPrice}-${item.batchId}`}
                                item={item}
                                portionLabel={PORTION_LABEL[item.portionType] || ""}
                                onInc={()    => incQty(item._id, item.portionType, item.unitPrice, item.batchId)}
                                onDec={()    => decQty(item._id, item.portionType, item.unitPrice, item.batchId)}
                                onRemove={()  => removeFromCart(item._id, item.portionType, item.unitPrice, item.batchId)}
                                onQtyChange={(v) => setCartItemQty(item._id, item.portionType, item.unitPrice, item.batchId, v)}
                                onEdit={()    => openPortionModal(item, idx)}
                            />
                        ))
                    )}
                </div>

                {/* Subtotal + checkout button */}
                <div className="border-t border-gray-100 bg-white/80 px-5 py-4 space-y-3">
                    <div className="flex justify-between text-sm text-gray-500">
                        <span>Items</span>
                        <span>{totalItems}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-800 text-lg">
                        <span>Subtotal</span>
                        <span>Rs {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onHold}
                            disabled={cart.length === 0}
                            className="flex-1 py-3 bg-amber-50 hover:bg-amber-100 disabled:bg-gray-200 disabled:text-gray-400
                                       text-amber-700 border border-amber-200 font-semibold rounded-xl transition text-sm flex items-center justify-center gap-2"
                        >
                            <Pause size={16} /> Hold
                        </button>
                        <button
                            onClick={onCheckout}
                            disabled={cart.length === 0}
                            className="flex-2 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-200 disabled:text-gray-400
                                       text-white font-bold rounded-xl transition-all active:scale-95 text-sm shadow-sm"
                        >
                            {cart.length === 0 ? "Add items" : "Complete  ⇧↵"}
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Held Orders / History Drawer ──────────────────────────── */}
            {showHeldOrders && (
                <div
                    className="fixed inset-y-0 right-[400px] w-80 z-50 bg-white/90 backdrop-blur-lg shadow-2xl border-l border-gray-100 flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Tab switcher */}
                    <div className="flex border-b border-gray-100">
                        {[
                            { key: "held",    label: `Held (${holdOrders.length})` },
                            { key: "history", label: "History" },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`flex-1 py-3 text-sm font-semibold transition
                                    ${activeTab === key
                                        ? "text-cyan-600 border-b-2 border-cyan-600"
                                        : "text-gray-400 hover:text-gray-600"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">

                        {activeTab === "held" && (
                            holdOrders.length === 0
                                ? <p className="text-center text-gray-400 text-sm mt-8">No held orders</p>
                                : holdOrders.map((order) => (
                                    <HeldOrderCard
                                        key={order._id}
                                        order={order}
                                        isInCart={order._id === resumedHoldId}
                                        canDelete={user?.permissions?.deleteOrders}
                                        onResume={() => handleResumeOrder(order)}
                                        onDelete={() => handleDeleteHeldOrder(order._id)}
                                    />
                                ))
                        )}

                        {activeTab === "history" && (
                            orderHistory.length === 0
                                ? <p className="text-center text-gray-400 text-sm mt-8">No history yet</p>
                                : orderHistory.slice(0, 30).map((order) => (
                                    <HistoryCard key={order._id || order.id} order={order} />
                                ))
                        )}
                    </div>
                </div>
            )}
        </>
    );
}


// ─────────────────────────────────────────────────────────────────────────────
//  CartItem — one product row inside the cart
// ─────────────────────────────────────────────────────────────────────────────
function CartItem({ item, portionLabel, onInc, onDec, onRemove, onQtyChange, onEdit }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 group hover:border-cyan-100 transition">
            <div className="flex items-start gap-3">
                {/* Product image */}
                {item.image && (
                    <img
                        src={item.image} alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover shrink-0 bg-gray-100"
                        onError={(e) => { e.target.style.display = "none"; }}
                    />
                )}

                {/* Name + price breakdown */}
                <div className="flex-1 min-w-0">
                    {/* Clicking the name opens the portion-type editor */}
                    <button
                        onClick={onEdit}
                        className="text-sm font-semibold text-gray-800 hover:text-cyan-600 transition truncate block text-left w-full"
                        title="Click to change portion type"
                    >
                        {item.name}{portionLabel}
                    </button>
                    {item.batchNumber && (
                        <span className="text-xs text-gray-400">Batch: {item.batchNumber}</span>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">
                        Rs {item.unitPrice.toLocaleString()} × {item.qty}
                        {" = "}
                        <span className="font-semibold text-gray-700">
                            Rs {(item.unitPrice * item.qty).toLocaleString()}
                        </span>
                    </p>
                </div>

                {/* Remove button (appears on hover) */}
                <button
                    onClick={onRemove}
                    className="opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-600 p-1 rounded"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Quantity controls */}
            <div className="flex items-center gap-2 mt-2">
                <button
                    onClick={onDec}
                    className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-cyan-100 text-gray-700 font-bold text-sm transition flex items-center justify-center"
                >
                    −
                </button>
                <input
                    type="number" min={1} value={item.qty}
                    onChange={(e) => onQtyChange(Number(e.target.value))}
                    className="w-12 text-center text-sm font-semibold border border-gray-200 rounded-lg py-0.5 outline-none focus:ring-1 focus:ring-cyan-400"
                />
                <button
                    onClick={onInc}
                    className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-cyan-100 text-gray-700 font-bold text-sm transition flex items-center justify-center"
                >
                    +
                </button>
            </div>
        </div>
    );
}


// ─────────────────────────────────────────────────────────────────────────────
//  HeldOrderCard — one card in the Held Orders tab
// ─────────────────────────────────────────────────────────────────────────────
function HeldOrderCard({ order, isInCart, canDelete, onResume, onDelete }) {
    return (
        <div className={`border rounded-xl p-3 ${isInCart ? "bg-cyan-50 border-cyan-200" : "bg-amber-50 border-amber-100"}`}>
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800">{order.orderNumber || "—"}</p>
                        {isInCart && (
                            <span className="text-xs bg-cyan-600 text-white px-1.5 py-0.5 rounded-full">In cart</span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500">
                        {order.customerName || "No name"} · Rs {(order.totalAmount || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">
                        {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
                    </p>
                </div>

                <div className="flex gap-1.5">
                    <button onClick={onResume} title="Resume order"
                        className="p-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition">
                        <RotateCcw size={14} />
                    </button>
                    {canDelete && (
                        <button onClick={onDelete} title="Delete order"
                            className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition">
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}


// ─────────────────────────────────────────────────────────────────────────────
//  HistoryCard — one card in the Order History tab
// ─────────────────────────────────────────────────────────────────────────────
function HistoryCard({ order }) {
    const METHOD_STYLE = {
        cash:   "bg-green-100 text-green-700",
        online: "bg-blue-100 text-blue-700",
        credit: "bg-purple-100 text-purple-700",
        hybrid: "bg-orange-100 text-orange-700",
        free:   "bg-gray-100 text-gray-600",
    };

    return (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold text-gray-800">{order.orderNumber || "—"}</p>
                    <p className="text-xs text-gray-500">
                        {order.customerName || "—"} · Rs {(order.totalAmount || 0).toLocaleString()}
                    </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${METHOD_STYLE[order.paymentMethod] || "bg-gray-100 text-gray-600"}`}>
                    {order.paymentMethod || "—"}
                </span>
            </div>
        </div>
    );
}

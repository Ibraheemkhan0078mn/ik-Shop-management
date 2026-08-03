import { useState } from "react";
import { ShoppingCart, Trash2, RotateCcw, Pause } from "lucide-react";
import { usePaginatedOrders } from "../../orders/services/orders.service.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import { useEffect } from "react";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getPosLabels } from "../labels/posLabels.js";

const PORTION_LABEL = { full: "", half: " ½", custom: " custom" };

const PAYMENT_METHOD_STYLE = {
    cash: { bg: "rgba(15,118,110,0.1)", color: "var(--accent-2)", border: "rgba(15,118,110,0.2)" },
    online: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "rgba(59,130,246,0.2)" },
    credit: { bg: "rgba(168,85,247,0.1)", color: "#a855f7", border: "rgba(168,85,247,0.2)" },
    hybrid: { bg: "rgba(249,115,22,0.1)", color: "#f97316", border: "rgba(249,115,22,0.2)" },
    free: { bg: "var(--surface-muted)", color: "var(--muted)", border: "var(--border)" },
};

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export default function PosCartSidebar({
    cart = [],
    subtotal = 0,
    resumedHoldId = null,
    holdOrders = [],
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
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getPosLabels(language);

    const [activeDrawerTab, setActiveDrawerTab] = useState("held");
    const totalItemCount = cart.reduce((sum, item) => sum + item.qty, 0);
    const isCartEmpty = cart.length === 0;




    useEffect(() => {
        const onKey = (e) => {
            console.log(e.key, isCartEmpty)
            if (e.shiftKey && e.key === "Enter" && !isCartEmpty) onCheckout();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isCartEmpty, onCheckout]);




    return (
        <>
            {/* ── Cart Sidebar ─────────────────────────────────────────────────── */}
            <aside
                className="w-80 lg:w-96 h-screen flex flex-col shrink-0"
                style={{ background: "var(--surface)", borderLeft: "1px solid var(--border)" }}
            >
                {/* Header */}
                <div
                    className="px-4 py-3 flex items-center gap-2.5 shrink-0"
                    style={{ borderBottom: "1px solid var(--border)" }}
                >
                    <ShoppingCart size={18} style={{ color: "var(--accent-2)" }} />
                    <h2 className="font-bold text-sm" style={{ color: "var(--ink)" }}>
                        {labels.currentOrder}
                    </h2>

                    {resumedHoldId && (
                        <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                                background: "rgba(180,83,9,0.1)",
                                color: "var(--accent)",
                                border: "1px solid rgba(180,83,9,0.2)",
                            }}
                        >
                            {labels.resumed}
                        </span>
                    )}

                    {totalItemCount > 0 && (
                        <span
                            className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: "var(--accent-2)", color: "white" }}
                        >
                            {totalItemCount}
                        </span>
                    )}
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
                    {isCartEmpty ? (
                        <div
                            className="flex flex-col items-center justify-center h-full gap-2"
                            style={{ color: "var(--muted)" }}
                        >
                            <ShoppingCart size={40} strokeWidth={1} />
                            <p className="text-sm font-medium">{labels.cartEmpty}</p>
                            <p className="text-xs">{labels.clickProductToAdd}</p>
                        </div>
                    ) : (
                        cart.map((cartItem, index) => (
                            <CartItemRow
                                key={`${cartItem._id}-${cartItem.portionType}-${cartItem.unitPrice}-${cartItem.batchId}`}
                                cartItem={cartItem}
                                portionLabel={PORTION_LABEL[cartItem.portionType] || ""}
                                onIncrement={() => incQty(cartItem._id, cartItem.portionType, cartItem.unitPrice, cartItem.batchId)}
                                onDecrement={() => decQty(cartItem._id, cartItem.portionType, cartItem.unitPrice, cartItem.batchId)}
                                onRemove={() => removeFromCart(cartItem._id, cartItem.portionType, cartItem.unitPrice, cartItem.batchId)}
                                onQtyChange={(newQty) => setCartItemQty(cartItem._id, cartItem.portionType, cartItem.unitPrice, cartItem.batchId, newQty)}
                                onEditPortion={() => openPortionModal(cartItem, index)}
                                labels={labels}
                            />
                        ))
                    )}
                </div>





                <div
                    className="px-3 py-3 shrink-0 space-y-2"
                    style={{ borderTop: "1px solid var(--border)", background: "var(--surface-muted)" }}
                >
                    {/* Totals */}
                    <div
                        className="flex items-center justify-between px-3 py-2 rounded-lg"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: "var(--muted)" }}>{labels.items}</span>
                            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md" style={{ background: "var(--surface-muted)", color: "var(--muted)" }}>
                                {totalItemCount}
                            </span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>{labels.subtotal}</span>
                            <span className="text-base font-bold" style={{ color: "var(--ink)" }}>
                                Rs {subtotal.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={onHold}
                            disabled={isCartEmpty}
                            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95"
                            style={{
                                flex: 1,
                                background: isCartEmpty ? "var(--surface)" : "rgba(180,83,9,0.09)",
                                color: isCartEmpty ? "var(--muted)" : "var(--accent)",
                                border: `1px solid ${isCartEmpty ? "var(--border)" : "rgba(180,83,9,0.3)"}`,
                                cursor: isCartEmpty ? "not-allowed" : "pointer",
                                opacity: isCartEmpty ? 0.6 : 1,
                            }}
                        >
                            <Pause size={13} /> {labels.hold}
                        </button>

                        <button
                            onClick={onCheckout}
                            disabled={isCartEmpty}
                            className="py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95"
                            style={{
                                flex: 2,
                                background: isCartEmpty ? "var(--surface)" : "linear-gradient(135deg, var(--accent-2), #0b5f59)",
                                color: isCartEmpty ? "var(--muted)" : "white",
                                border: `1px solid ${isCartEmpty ? "var(--border)" : "transparent"}`,
                                cursor: isCartEmpty ? "not-allowed" : "pointer",
                                opacity: isCartEmpty ? 0.6 : 1,
                                boxShadow: isCartEmpty ? "none" : "0 4px 14px rgba(15,118,110,0.25)",
                            }}
                        >
                            {isCartEmpty ? labels.cartEmpty : labels.checkoutShortcut}
                        </button>
                    </div>
                </div>




            </aside>

            {/* ── Held Orders / History Drawer ─────────────────────────────────── */}
          {showHeldOrders && (
  <div
    className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
               w-[95vw] sm:w-[80vw] lg:w-[60vw]
               h-[60vh]
               max-w-4xl
               rounded-2xl shadow-2xl overflow-hidden flex flex-col"
    style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
    }}
    onClick={(e) => e.stopPropagation()}
  >
    {/* Header */}
    <div
      className="flex items-center justify-between px-4 py-3 shrink-0"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <h2
        className="text-sm font-semibold"
        style={{ color: "var(--text)" }}
      >
        {labels.heldOrders} ({holdOrders.length})
      </h2>

      <button
        onClick={() => setShowHeldOrders(false)}
        className="text-xl leading-none"
        style={{ color: "var(--muted)" }}
      >
        ×
      </button>
    </div>

    {/* Content */}
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {holdOrders.length === 0 ? (
        <EmptyState message={labels.noHeldOrders} />
      ) : (
        holdOrders.map((heldOrder) => (
          <HeldOrderCard
            key={heldOrder._id}
            heldOrder={heldOrder}
            isCurrentlyInCart={heldOrder._id === resumedHoldId}
            canDelete={user?.permissions?.deleteOrders}
            onResume={() => handleResumeOrder(heldOrder)}
            onDelete={() => handleDeleteHeldOrder(heldOrder._id)}
            labels={labels}
          />
        ))
      )}
    </div>
  </div>
)}
        </>
    );
}

// ─── Cart Item Row ────────────────────────────────────────────────────────────

function CartItemRow({ cartItem, portionLabel, onIncrement, onDecrement, onRemove, onQtyChange, onEditPortion, labels }) {
    return (
        <div
            className="rounded-lg p-2.5 group transition-all"
            style={{ background: "var(--surface-muted)", border: "1px solid var(--border)" }}
        >
            {/* Top row: image + name + remove */}
            <div className="flex items-center gap-2">
                {cartItem.image && (
                    <img
                        src={cartItem.image}
                        alt={cartItem.name}
                        className="w-8 h-8 rounded-md object-cover shrink-0"
                        onError={(e) => { e.target.style.display = "none"; }}
                    />
                )}

                <button
                    onClick={onEditPortion}
                    className="flex-1 text-xs font-semibold text-left truncate transition"
                    style={{ color: "var(--ink)" }}
                    title="Click to change portion"
                >
                    {cartItem.name}
                    {portionLabel && (
                        <span className="ml-1 font-normal" style={{ color: "var(--muted)" }}>
                            {portionLabel}
                        </span>
                    )}
                </button>

                <button
                    onClick={onRemove}
                    className="opacity-0 group-hover:opacity-100 transition p-1 rounded"
                    style={{ color: "#f87171" }}
                >
                    <Trash2 size={12} />
                </button>
            </div>

            {/* Bottom row: qty controls + line total */}
            <div className="flex items-center gap-2 mt-2">
                <button
                    onClick={onDecrement}
                    className="w-6 h-6 rounded-md text-sm font-bold flex items-center justify-center transition shrink-0"
                    style={{ background: "var(--surface)", color: "var(--ink)", border: "1px solid var(--border)" }}
                >
                    −
                </button>

                <input
                    type="number"
                    min={1}
                    value={cartItem.qty}
                    onChange={(e) => onQtyChange(Number(e.target.value))}
                    className="w-10 text-center text-xs font-semibold rounded-md py-0.5 outline-none"
                    style={{ background: "var(--surface)", color: "var(--ink)", border: "1px solid var(--border)" }}
                />

                <button
                    onClick={onIncrement}
                    className="w-6 h-6 rounded-md text-sm font-bold flex items-center justify-center transition shrink-0"
                    style={{ background: "var(--surface)", color: "var(--ink)", border: "1px solid var(--border)" }}
                >
                    +
                </button>

                <span className="ml-auto text-xs" style={{ color: "var(--muted)" }}>
                    {cartItem.unitPrice.toLocaleString()} ×{cartItem.qty} ={" "}
                    <span className="font-semibold" style={{ color: "var(--ink)" }}>
                        Rs {(cartItem.unitPrice * cartItem.qty).toLocaleString()}
                    </span>
                </span>
            </div>

            {cartItem.batchNumber && (
                <p className="text-[10px] mt-1" style={{ color: "var(--muted)" }}>
                    {labels.batch}: {cartItem.batchNumber}
                </p>
            )}
        </div>
    );
}

// ─── Held Order Card ──────────────────────────────────────────────────────────

function HeldOrderCard({ heldOrder, isCurrentlyInCart, canDelete, onResume, onDelete, labels }) {
    return (
        <div
            className="rounded-xl p-3 flex items-center justify-between gap-2"
            style={{
                background: isCurrentlyInCart ? "rgba(15,118,110,0.08)" : "var(--surface-muted)",
                border: `1px solid ${isCurrentlyInCart ? "rgba(15,118,110,0.25)" : "var(--border)"}`,
            }}
        >
            {/* Order Info */}
            <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--ink)" }}>
                        {heldOrder.orderNumber || "—"}
                    </p>
                    {isCurrentlyInCart && (
                        <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                            style={{ background: "var(--accent-2)", color: "white" }}
                        >
                            {labels.inCart}
                        </span>
                    )}
                </div>
                <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
                    {heldOrder.customerName || labels.noName} · Rs {(heldOrder.totalAmount || 0).toLocaleString()}
                </p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {heldOrder.items?.length || 0} {heldOrder.items?.length !== 1 ? labels.itemsPlural : labels.item}
                </p>
            </div>

            {/* Actions */}
            <div className="flex gap-1.5 shrink-0">
                <button
                    onClick={onResume}
                    title={labels.resume}
                    className="p-1.5 rounded-lg transition"
                    style={{ background: "var(--accent-2)", color: "white" }}
                >
                    <RotateCcw size={13} />
                </button>
                {canDelete && (
                    <button
                        onClick={onDelete}
                        title={labels.delete}
                        className="p-1.5 rounded-lg transition"
                        style={{
                            background: "rgba(220,38,38,0.08)",
                            color: "#dc2626",
                            border: "1px solid rgba(220,38,38,0.2)",
                        }}
                    >
                        <Trash2 size={13} />
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Order History Card ───────────────────────────────────────────────────────

function OrderHistoryCard({ order }) {
    const methodStyle = PAYMENT_METHOD_STYLE[order.paymentMethod] || PAYMENT_METHOD_STYLE.free;

    return (
        <div
            className="rounded-xl p-3 flex items-center justify-between gap-2"
            style={{ background: "var(--surface-muted)", border: "1px solid var(--border)" }}
        >
            <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--ink)" }}>
                    {order.orderNumber || "—"}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
                    {order.customerName || "—"} · Rs {(order.totalAmount || 0).toLocaleString()}
                </p>
            </div>

            <span
                className="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize shrink-0"
                style={{
                    background: methodStyle.bg,
                    color: methodStyle.color,
                    border: `1px solid ${methodStyle.border}`,
                }}
            >
                {order.paymentMethod || "—"}
            </span>
        </div>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ message }) {
    return (
        <p className="text-center text-xs mt-8" style={{ color: "var(--muted)" }}>
            {message}
        </p>
    );
}



























































// import { useState }           from "react";
// import { ShoppingCart, Trash2, RotateCcw, Pause } from "lucide-react";
// import { usePaginatedOrders } from "../../orders/services/orders.service.js";
// import PaginatedList from "../../../shared/components/PaginatedList.jsx";

// // ─────────────────────────────────────────────────────────────────────────────
// //  PosCartSidebar
// //
// //  Right-side panel of the POS screen. Shows:
// //    • The current cart (items, quantities, totals)
// //    • A checkout button
// //    • A slide-out drawer for Held Orders and Order History
// //
// //  Props from PosPage:
// //    cart, subtotal, resumedHoldId
// //    holdOrders, showHeldOrders, setShowHeldOrders
// //    user
// //    incQty, decQty, removeFromCart, setCartItemQty, openPortionModal
// //    onCheckout, onHold, handleResumeOrder, handleDeleteHeldOrder
// // ─────────────────────────────────────────────────────────────────────────────
// export default function PosCartSidebar({
//     cart = [],
//     subtotal = 0,
//     resumedHoldId = null,
//     holdOrders = [],
//     showHeldOrders,
//     setShowHeldOrders,
//     user,
//     incQty,
//     decQty,
//     removeFromCart,
//     setCartItemQty,
//     openPortionModal,
//     onCheckout,
//     onHold,
//     handleResumeOrder,
//     handleDeleteHeldOrder,
// }) {
//     const [activeTab, setActiveTab] = useState("held");

//     const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);

//     // Portion type display labels
//     const PORTION_LABEL = { full: "", half: " (½)", custom: " (custom)" };

//     return (
//         <>
//             {/* ── Main Sidebar ──────────────────────────────────────────── */}
//             <aside className="w-[400px] h-screen flex flex-col backdrop-blur-md shadow-xl"
//                 style={{ background: "var(--surface)", borderLeft: "1px solid var(--border)" }}>

//                 {/* Header */}
//                 <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
//                     <ShoppingCart size={20} style={{ color: "var(--accent-2)" }} />
//                     <h2 className="font-bold text-base" style={{ color: "var(--ink)" }}>Current Order</h2>

//                     {/* Shows "Resumed" if the cart was loaded from a held order */}
//                     {resumedHoldId && (
//                         <span className="ml-1 text-xs px-2 py-0.5 rounded-full font-medium"
//                             style={{ background: "rgba(180,83,9,0.1)", color: "var(--accent)", border: "1px solid rgba(180,83,9,0.2)" }}>
//                             Resumed
//                         </span>
//                     )}

//                     {totalItems > 0 && (
//                         <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
//                             style={{ background: "var(--accent-2)", color: "white" }}>
//                             {totalItems}
//                         </span>
//                     )}
//                 </div>

//                 {/* Cart item list */}
//                 <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
//                     {cart.length === 0 ? (
//                         <div className="flex flex-col items-center justify-center h-full gap-2"
//                             style={{ color: "var(--muted)" }}>
//                             <ShoppingCart size={48} strokeWidth={1} />
//                             <p className="text-sm font-medium">Cart is empty</p>
//                             <p className="text-xs">Click a product to add it</p>
//                         </div>
//                     ) : (
//                         cart.map((item, idx) => (
//                             <CartItem
//                                 key={`${item._id}-${item.portionType}-${item.unitPrice}-${item.batchId}`}
//                                 item={item}
//                                 portionLabel={PORTION_LABEL[item.portionType] || ""}
//                                 onInc={()    => incQty(item._id, item.portionType, item.unitPrice, item.batchId)}
//                                 onDec={()    => decQty(item._id, item.portionType, item.unitPrice, item.batchId)}
//                                 onRemove={()  => removeFromCart(item._id, item.portionType, item.unitPrice, item.batchId)}
//                                 onQtyChange={(v) => setCartItemQty(item._id, item.portionType, item.unitPrice, item.batchId, v)}
//                                 onEdit={()    => openPortionModal(item, idx)}
//                             />
//                         ))
//                     )}
//                 </div>

//                 {/* Subtotal + checkout button */}
//                 <div className="px-5 py-4 space-y-3"
//                     style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
//                     <div className="flex justify-between text-sm" style={{ color: "var(--muted)" }}>
//                         <span>Items</span>
//                         <span>{totalItems}</span>
//                     </div>
//                     <div className="flex justify-between font-bold text-lg" style={{ color: "var(--ink)" }}>
//                         <span>Subtotal</span>
//                         <span>Rs {subtotal.toLocaleString()}</span>
//                     </div>
//                     <div className="flex gap-2">
//                         <button
//                             onClick={onHold}
//                             disabled={cart.length === 0}
//                             className="flex-1 py-3 font-semibold rounded-xl transition text-sm flex items-center justify-center gap-2"
//                             style={{
//                                 background: cart.length === 0 ? "var(--surface-muted)" : "rgba(180,83,9,0.1)",
//                                 color: cart.length === 0 ? "var(--muted)" : "var(--accent)",
//                                 border: "1px solid rgba(180,83,9,0.2)"
//                             }}
//                             onMouseEnter={e => {
//                                 if (cart.length > 0) e.currentTarget.style.background = "rgba(180,83,9,0.2)";
//                             }}
//                             onMouseLeave={e => {
//                                 if (cart.length > 0) e.currentTarget.style.background = "rgba(180,83,9,0.1)";
//                             }}
//                         >
//                             <Pause size={16} /> Hold
//                         </button>
//                         <button
//                             onClick={onCheckout}
//                             disabled={cart.length === 0}
//                             className="flex-2 py-3 font-bold rounded-xl transition-all active:scale-95 text-sm shadow-sm"
//                             style={{
//                                 background: cart.length === 0 ? "var(--surface-muted)" : "var(--accent-2)",
//                                 color: cart.length === 0 ? "var(--muted)" : "white"
//                             }}
//                             onMouseEnter={e => {
//                                 if (cart.length > 0) e.currentTarget.style.background = "rgba(15,118,110,0.8)";
//                             }}
//                             onMouseLeave={e => {
//                                 if (cart.length > 0) e.currentTarget.style.background = "var(--accent-2)";
//                             }}
//                         >
//                             {cart.length === 0 ? "Add items" : "Complete  ⇧↵"}
//                         </button>
//                     </div>
//                 </div>
//             </aside>

//             {/* ── Held Orders / History Drawer ──────────────────────────── */}
//             {showHeldOrders && (
//                 <div
//                     className="fixed inset-y-0 right-[400px] w-96 z-50 backdrop-blur-lg shadow-2xl flex flex-col rounded-l-2xl overflow-hidden"
//                     style={{ background: "var(--surface)", borderLeft: "1px solid var(--border)" }}
//                     onClick={(e) => e.stopPropagation()}
//                 >
//                     {/* Tab switcher */}
//                     <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
//                         {[
//                             { key: "held",    label: `Held (${holdOrders.length})` },
//                             { key: "history", label: "History" },
//                         ].map(({ key, label }) => (
//                             <button
//                                 key={key}
//                                 onClick={() => setActiveTab(key)}
//                                 className="flex-1 py-3 text-sm font-semibold transition"
//                                 style={{
//                                     color: activeTab === key ? "var(--accent-2)" : "var(--muted)",
//                                     borderBottom: activeTab === key ? "2px solid var(--accent-2)" : "none"
//                                 }}
//                             >
//                                 {label}
//                             </button>
//                         ))}
//                     </div>

//                     {/* Tab content */}
//                     <div className="flex-1 overflow-y-auto p-4">

//                         {activeTab === "held" && (
//                             holdOrders.length === 0
//                                 ? <p className="text-center text-sm mt-8" style={{ color: "var(--muted)" }}>No held orders</p>
//                                 : holdOrders.map((order) => (
//                                     <HeldOrderCard
//                                         key={order._id}
//                                         order={order}
//                                         isInCart={order._id === resumedHoldId}
//                                         canDelete={user?.permissions?.deleteOrders}
//                                         onResume={() => handleResumeOrder(order)}
//                                         onDelete={() => handleDeleteHeldOrder(order._id)}
//                                     />
//                                 ))
//                         )}

//                         {activeTab === "history" && (
//                             <PaginatedList
//                                 rtkQuery={usePaginatedOrders}
//                                 limit={20}
//                                 dataKey="data"
//                                 wrapperClassName="h-full"
//                                 className="space-y-2"
//                                 renderItems={(orders) => (
//                                     orders.length === 0
//                                         ? <p className="text-center text-sm mt-8" style={{ color: "var(--muted)" }}>No history yet</p>
//                                         : orders.map((order) => (
//                                             <HistoryCard key={order._id || order.id} order={order} />
//                                         ))
//                                 )}
//                             />
//                         )}
//                     </div>
//                 </div>
//             )}
//         </>
//     );
// }


// // ─────────────────────────────────────────────────────────────────────────────
// //  CartItem — one product row inside the cart
// // ─────────────────────────────────────────────────────────────────────────────
// function CartItem({ item, portionLabel, onInc, onDec, onRemove, onQtyChange, onEdit }) {
//     return (
//         <div className="rounded-xl shadow-sm p-3 group transition"
//             style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
//             onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(15,118,110,0.2)"}
//             onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
//             <div className="flex items-start gap-3">
//                 {/* Product image */}
//                 {item.image && (
//                     <img
//                         src={item.image} alt={item.name}
//                         className="w-10 h-10 rounded-lg object-cover shrink-0"
//                         style={{ background: "var(--surface-muted)" }}
//                         onError={(e) => { e.target.style.display = "none"; }}
//                     />
//                 )}

//                 {/* Name + price breakdown */}
//                 <div className="flex-1 min-w-0">
//                     {/* Clicking the name opens the portion-type editor */}
//                     <button
//                         onClick={onEdit}
//                         className="text-sm font-semibold transition truncate block text-left w-full"
//                         style={{ color: "var(--ink)" }}
//                         onMouseEnter={e => e.currentTarget.style.color = "var(--accent-2)"}
//                         onMouseLeave={e => e.currentTarget.style.color = "var(--ink)"}
//                         title="Click to change portion type"
//                     >
//                         {item.name}{portionLabel}
//                     </button>
//                     {item.batchNumber && (
//                         <span className="text-xs" style={{ color: "var(--muted)" }}>Batch: {item.batchNumber}</span>
//                     )}
//                     <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
//                         Rs {item.unitPrice.toLocaleString()} × {item.qty}
//                         {" = "}
//                         <span className="font-semibold" style={{ color: "var(--ink)" }}>
//                             Rs {(item.unitPrice * item.qty).toLocaleString()}
//                         </span>
//                     </p>
//                 </div>

//                 {/* Remove button (appears on hover) */}
//                 <button
//                     onClick={onRemove}
//                     className="opacity-0 group-hover:opacity-100 transition p-1 rounded"
//                     style={{ color: "#f87171" }}
//                     onMouseEnter={e => e.currentTarget.style.color = "#dc2626"}
//                     onMouseLeave={e => e.currentTarget.style.color = "#f87171"}
//                 >
//                     <Trash2 size={14} />
//                 </button>
//             </div>

//             {/* Quantity controls */}
//             <div className="flex items-center gap-2 mt-2">
//                 <button
//                     onClick={onDec}
//                     className="w-7 h-7 rounded-lg font-bold text-sm transition flex items-center justify-center"
//                     style={{ background: "var(--surface-muted)", color: "var(--ink)", border: "1px solid var(--border)" }}
//                     onMouseEnter={e => e.currentTarget.style.background = "rgba(15,118,110,0.1)"}
//                     onMouseLeave={e => e.currentTarget.style.background = "var(--surface-muted)"}
//                 >
//                     −
//                 </button>
//                 <input
//                     type="number" min={1} value={item.qty}
//                     onChange={(e) => onQtyChange(Number(e.target.value))}
//                     className="w-12 text-center text-sm font-semibold rounded-lg py-0.5 outline-none"
//                     style={{ background: "var(--surface-muted)", color: "var(--ink)", border: "1px solid var(--border)" }}
//                 />
//                 <button
//                     onClick={onInc}
//                     className="w-7 h-7 rounded-lg font-bold text-sm transition flex items-center justify-center"
//                     style={{ background: "var(--surface-muted)", color: "var(--ink)", border: "1px solid var(--border)" }}
//                     onMouseEnter={e => e.currentTarget.style.background = "rgba(15,118,110,0.1)"}
//                     onMouseLeave={e => e.currentTarget.style.background = "var(--surface-muted)"}
//                 >
//                     +
//                 </button>
//             </div>
//         </div>
//     );
// }


// // ─────────────────────────────────────────────────────────────────────────────
// //  HeldOrderCard — one card in the Held Orders tab
// // ─────────────────────────────────────────────────────────────────────────────
// function HeldOrderCard({ order, isInCart, canDelete, onResume, onDelete }) {
//     return (
//         <div className="border rounded-xl p-3"
//             style={{
//                 background: isInCart ? "rgba(15,118,110,0.1)" : "rgba(180,83,9,0.1)",
//                 borderColor: isInCart ? "rgba(15,118,110,0.2)" : "rgba(180,83,9,0.2)"
//             }}>
//             <div className="flex items-center justify-between">
//                 <div>
//                     <div className="flex items-center gap-2">
//                         <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{order.orderNumber || "—"}</p>
//                         {isInCart && (
//                             <span className="text-xs px-1.5 py-0.5 rounded-full"
//                                 style={{ background: "var(--accent-2)", color: "white" }}>In cart</span>
//                         )}
//                     </div>
//                     <p className="text-xs" style={{ color: "var(--muted)" }}>
//                         {order.customerName || "No name"} · Rs {(order.totalAmount || 0).toLocaleString()}
//                     </p>
//                     <p className="text-xs" style={{ color: "var(--muted)" }}>
//                         {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
//                     </p>
//                 </div>

//                 <div className="flex gap-1.5">
//                     <button onClick={onResume} title="Resume order"
//                         className="p-1.5 rounded-lg transition"
//                         style={{ background: "var(--accent-2)", color: "white" }}
//                         onMouseEnter={e => e.currentTarget.style.background = "rgba(15,118,110,0.8)"}
//                         onMouseLeave={e => e.currentTarget.style.background = "var(--accent-2)"}>
//                         <RotateCcw size={14} />
//                     </button>
//                     {canDelete && (
//                         <button onClick={onDelete} title="Delete order"
//                             className="p-1.5 rounded-lg transition"
//                             style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" }}
//                             onMouseEnter={e => e.currentTarget.style.background = "rgba(220,38,38,0.2)"}
//                             onMouseLeave={e => e.currentTarget.style.background = "rgba(220,38,38,0.1)"}>
//                             <Trash2 size={14} />
//                         </button>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }


// // ─────────────────────────────────────────────────────────────────────────────
// //  HistoryCard — one card in the Order History tab
// // ─────────────────────────────────────────────────────────────────────────────
// function HistoryCard({ order }) {
//     const METHOD_STYLE = {
//         cash:   { bg: "rgba(15,118,110,0.1)", color: "var(--accent-2)", border: "rgba(15,118,110,0.2)" },
//         online: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "rgba(59,130,246,0.2)" },
//         credit: { bg: "rgba(168,85,247,0.1)", color: "#a855f7", border: "rgba(168,85,247,0.2)" },
//         hybrid: { bg: "rgba(249,115,22,0.1)", color: "#f97316", border: "rgba(249,115,22,0.2)" },
//         free:   { bg: "var(--surface-muted)", color: "var(--muted)", border: "var(--border)" },
//     };

//     const style = METHOD_STYLE[order.paymentMethod] || METHOD_STYLE.free;

//     return (
//         <div className="border rounded-xl p-3"
//             style={{ background: "var(--surface-muted)", borderColor: "var(--border)" }}>
//             <div className="flex items-center justify-between">
//                 <div>
//                     <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{order.orderNumber || "—"}</p>
//                     <p className="text-xs" style={{ color: "var(--muted)" }}>
//                         {order.customerName || "—"} · Rs {(order.totalAmount || 0).toLocaleString()}
//                     </p>
//                 </div>
//                 <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
//                     style={{ background: style.bg, color: style.color, border: "1px solid " + style.border }}>
//                     {order.paymentMethod || "—"}
//                 </span>
//             </div>
//         </div>
//     );
// }

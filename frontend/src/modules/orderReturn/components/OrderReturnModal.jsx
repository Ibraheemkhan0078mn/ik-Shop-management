// ─── components/OrderReturnModal.jsx ──────────────────────────────────────
import React, { useState, useEffect } from "react";
import { X, Search, Check, Trash2 } from "lucide-react";
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
import {
    generateReturnNumber,
    getOrderForReturn,
    createOrderReturn,
    updateOrderReturn,
} from "../api/orderReturn.api.js";

// ─── Constants ────────────────────────────────────────────────
const RETURN_REASONS = [
    { value: "damaged", label: "Damaged" },
    { value: "defective", label: "Defective" },
    { value: "wrong-item", label: "Wrong Item" },
    { value: "not-needed", label: "Not Needed" },
    { value: "other", label: "Other" },
];

const buildReturnLineItem = (item) => ({
    productId: item.product || item._id,
    productName: item.name || item.productName,
    quantity: 1,
    maxQuantity: item.quantity,
    returnReason: "damaged",
    originalPrice: item.unitPrice || item.price,
    refundAmount: item.unitPrice || item.price,
    batchId: item.batchId,
});

const toSubmittableItem = (item) => ({
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    returnReason: item.returnReason,
    originalPrice: item.originalPrice,
    refundAmount: item.refundAmount,
    batchId: item.batchId,
    _id: item._id,
});

// ─── Sub-components ───────────────────────────────────────────
const OrderNumberSearch = ({ value, onChange, onSearch, error, isLoading }) => (
    <div className="mb-6">
        <label className="block text-sm font-medium text-(--ink) mb-2">Order Number</label>
        <div className="flex gap-2">
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && onSearch()}
                placeholder="Enter order number..."
                className="flex-1 px-4 py-2 border border-(--border) rounded-lg bg-(--app-bg) text-(--ink) focus:outline-none focus:ring-2 focus:ring-(--accent-2)"
            />
            <button
                onClick={onSearch}
                disabled={value.length < 3 || isLoading}
                className="px-4 py-2 bg-(--accent-2) text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
                <Search className="w-5 h-5" />
            </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">Order not found</p>}
    </div>
);

const OrderItemPicker = ({ items, onSelect }) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold text-(--ink) mb-4 font-display">Order Items</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
                <div
                    key={item._id}
                    onClick={() => onSelect(item)}
                    className="p-4 border border-(--border) rounded-lg hover:border-(--accent-2) transition-colors cursor-pointer"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-(--ink)">{item.name}</p>
                            <p className="text-sm text-(--muted)">
                                Qty: {item.quantity} | Price: Rs {item.unitPrice}
                            </p>
                        </div>
                        <Check className="w-5 h-5 text-(--accent-2)" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const ReturnLineItemEditor = ({ item, onQuantityChange, onReasonChange, onRefundChange, onRemove }) => (
    <div className="p-4 border border-(--border) rounded-lg bg-(--app-bg)">
        <div className="flex items-start justify-between mb-3">
            <div>
                <p className="font-medium text-(--ink)">{item.productName}</p>
                <p className="text-sm text-(--muted)">Original Price: Rs {item.originalPrice}</p>
            </div>
            <button onClick={() => onRemove(item.productId)} className="p-1 hover:bg-red-100 rounded transition-colors">
                <Trash2 className="w-4 h-4 text-red-500" />
            </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="block text-xs text-(--muted) mb-1">Quantity (max: {item.maxQuantity})</label>
                <input
                    type="number"
                    min="1"
                    max={item.maxQuantity}
                    value={item.quantity}
                    onChange={(e) => onQuantityChange(item.productId, e.target.value)}
                    className="w-full px-3 py-2 border border-(--border) rounded-lg bg-(--surface) text-(--ink) text-sm"
                />
            </div>
            <div>
                <label className="block text-xs text-(--muted) mb-1">Refund Amount</label>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.refundAmount}
                    onChange={(e) => onRefundChange(item.productId, e.target.value)}
                    className="w-full px-3 py-2 border border-(--border) rounded-lg bg-(--surface) text-(--ink) text-sm"
                />
            </div>
            <div className="col-span-2">
                <label className="block text-xs text-(--muted) mb-1">Return Reason</label>
                <select
                    value={item.returnReason}
                    onChange={(e) => onReasonChange(item.productId, e.target.value)}
                    className="w-full px-3 py-2 border border-(--border) rounded-lg bg-(--surface) text-(--ink) text-sm"
                >
                    {RETURN_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
            </div>
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────
const OrderReturnModal = ({ isOpen, onClose, editData, isEditMode, isViewMode }) => {
    const [orderNumber, setOrderNumber] = useState("");
    const [returnItems, setReturnItems] = useState([]);
    const [notes, setNotes] = useState("");
    const [generatedReturnNumber, setGeneratedReturnNumber] = useState(null);
    const [fetchedOrder, setFetchedOrder] = useState(null);
    const [orderFetchError, setOrderFetchError] = useState(null);
    const [orderFetching, setOrderFetching] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isEditMode && !isViewMode && isOpen) {
            generateReturnNumber()
                .then((res) => setGeneratedReturnNumber(res.data))
                .catch(console.error);
        }
    }, [isEditMode, isViewMode, isOpen]);

    useEffect(() => {
        if ((isEditMode || isViewMode) && editData) {
            setOrderNumber(editData.referenceOrderNumber || "");
            setReturnItems(editData.items?.map((item) => ({ ...item, maxQuantity: item.quantity })) || []);
            setNotes(editData.notes || "");
        } else {
            resetForm();
        }
    }, [isEditMode, isViewMode, editData, isOpen]);

    const addOrIncrementItem = (item) => {
        setReturnItems((prev) => {
            const productId = item.product || item._id;
            const existing = prev.find((i) => i.productId === productId);
            if (existing) {
                return prev.map((i) =>
                    i.productId === productId
                        ? { ...i, quantity: Math.min(i.quantity + 1, i.maxQuantity) }
                        : i
                );
            }
            return [...prev, buildReturnLineItem(item)];
        });
    };

    const removeItem = (productId) => setReturnItems((prev) => prev.filter((i) => i.productId !== productId));

    const updateQuantity = (productId, val) => {
        setReturnItems((prev) =>
            prev.map((i) => {
                if (i.productId !== productId) return i;
                if (val === "" || val === undefined) return { ...i, quantity: "" };
                const qty = parseInt(val);
                if (isNaN(qty)) return { ...i, quantity: "" };
                if (qty > i.maxQuantity) {
                    showError(`Max returnable quantity is ${i.maxQuantity}`);
                    return { ...i, quantity: i.maxQuantity };
                }
                if (qty < 1) return { ...i, quantity: 1 };
                return { ...i, quantity: qty };
            })
        );
    };

    const updateReason = (productId, reason) => setReturnItems((prev) =>
        prev.map((i) => i.productId === productId ? { ...i, returnReason: reason } : i)
    );

    const updateRefund = (productId, amount) => {
        setReturnItems((prev) =>
            prev.map((i) => {
                if (i.productId !== productId) return i;
                const refundAmt = parseFloat(amount) || 0;
                return { ...i, refundAmount: refundAmt };
            })
        );
    };

    const handleOrderSearch = async () => {
        if (orderNumber.length < 3) return;
        setOrderFetching(true);
        setOrderFetchError(null);
        setFetchedOrder(null);
        try {
            const res = await getOrderForReturn(orderNumber);
            setFetchedOrder(res.data);
        } catch (err) {
            setOrderFetchError(err);
        } finally {
            setOrderFetching(false);
        }
    };

    const totalRefundAmount = returnItems.reduce((sum, i) => sum + (parseFloat(i.refundAmount) || 0) * (parseInt(i.quantity) || 0), 0);

    const handleSubmit = async () => {
        if (!returnItems.length) return showError("Please select at least one item to return");
        if (returnItems.some((i) => !i.quantity || parseInt(i.quantity) < 1))
            return showError("Fix quantities before submitting");
        setSubmitting(true);
        try {
            const itemsPayload = returnItems.map(toSubmittableItem);
            if (isEditMode && editData) {
                await updateOrderReturn(editData._id, { items: itemsPayload, notes });
                showSuccess("Order return updated successfully");
            } else {
                await createOrderReturn({
                    returnNumber: generatedReturnNumber?.returnNumber,
                    referenceOrderId: fetchedOrder._id,
                    referenceOrderNumber: fetchedOrder.orderNumber,
                    customerName: fetchedOrder.customerName,
                    items: itemsPayload,
                    notes,
                });
                showSuccess("Order return created successfully");
            }
            resetForm();
            onClose();
        } catch (err) {
            showError(err?.response?.data?.message || err?.message || "Failed to save order return");
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => { setOrderNumber(""); setReturnItems([]); setNotes(""); setFetchedOrder(null); setOrderFetchError(null); };
    const handleClose = () => { resetForm(); onClose(); };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-(--surface) rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

                <div className="flex items-center justify-between p-6 border-b border-(--border)">
                    <h2 className="text-xl font-semibold text-(--ink) font-display">
                        {isViewMode ? "View Order Return" : (isEditMode ? "Edit Order Return" : "Order Return")}
                    </h2>
                    <button onClick={handleClose} className="p-2 hover:bg-(--app-bg) rounded-lg transition-colors">
                        <X className="w-5 h-5 text-(--muted)" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {isViewMode ? (
                        // View Mode - Read-only display
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-(--muted) mb-1">Return Number</label>
                                    <p className="font-medium text-(--ink)">{editData?.returnNumber}</p>
                                </div>
                                <div>
                                    <label className="block text-xs text-(--muted) mb-1">Order Number</label>
                                    <p className="font-medium text-(--ink)">{editData?.referenceOrderNumber}</p>
                                </div>
                                <div>
                                    <label className="block text-xs text-(--muted) mb-1">Customer Name</label>
                                    <p className="font-medium text-(--ink)">{editData?.customerName || "-"}</p>
                                </div>
                                <div>
                                    <label className="block text-xs text-(--muted) mb-1">Status</label>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        editData?.returnStatus === "pending" ? "bg-yellow-100 text-yellow-700" :
                                        editData?.returnStatus === "approved" ? "bg-green-100 text-green-700" :
                                        editData?.returnStatus === "rejected" ? "bg-red-100 text-red-700" :
                                        "bg-blue-100 text-blue-700"
                                    }`}>
                                        {editData?.returnStatus}
                                    </span>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-semibold text-(--ink) mb-4 font-display">Returned Items</h3>
                                <div className="space-y-3">
                                    {returnItems.map((item) => (
                                        <div key={item.productId} className="p-4 border border-(--border) rounded-lg bg-(--app-bg)">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="font-medium text-(--ink)">{item.productName}</p>
                                                <p className="text-sm font-bold text-(--accent-2)">Rs {(parseFloat(item.refundAmount) * parseInt(item.quantity)).toFixed(2)}</p>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-sm text-(--muted)">
                                                <div>Qty: {item.quantity}</div>
                                                <div>Price: Rs {item.originalPrice}</div>
                                                <div>Refund: Rs {item.refundAmount}</div>
                                            </div>
                                            <div className="mt-2 text-xs text-(--muted)">
                                                Reason: {item.returnReason}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 p-4 bg-(--accent-2)/10 rounded-lg flex justify-between items-center">
                                    <span className="font-semibold text-(--ink)">Total Refund:</span>
                                    <span className="text-2xl font-bold text-(--accent-2)">Rs {totalRefundAmount.toFixed(2)}</span>
                                </div>
                            </div>

                            {notes && (
                                <div>
                                    <label className="block text-sm font-medium text-(--ink) mb-2">Notes</label>
                                    <p className="text-sm text-(--muted) bg-(--app-bg) p-3 rounded-lg">{notes}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Edit/Create Mode
                        <>
                            {!isEditMode && (
                                <OrderNumberSearch
                                    value={orderNumber}
                                    onChange={setOrderNumber}
                                    onSearch={handleOrderSearch}
                                    error={orderFetchError}
                                    isLoading={orderFetching}
                                />
                            )}

                            {!isEditMode && fetchedOrder?.items?.length > 0 && (
                                <OrderItemPicker items={fetchedOrder.items} onSelect={addOrIncrementItem} />
                            )}

                            {returnItems.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-(--ink) mb-4 font-display">Items for Return</h3>
                                    <div className="space-y-4">
                                        {returnItems.map((item) => (
                                            <ReturnLineItemEditor
                                                key={item.productId}
                                                item={item}
                                                onQuantityChange={updateQuantity}
                                                onReasonChange={updateReason}
                                                onRefundChange={updateRefund}
                                                onRemove={removeItem}
                                            />
                                        ))}
                                    </div>
                                    <div className="mt-4 p-4 bg-(--accent-2)/10 rounded-lg flex justify-between items-center">
                                        <span className="font-semibold text-(--ink)">Total Refund:</span>
                                        <span className="text-2xl font-bold text-(--accent-2)">Rs {totalRefundAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-(--ink) mb-2">Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Additional notes..."
                                    rows={3}
                                    className="w-full px-4 py-2 border border-(--border) rounded-lg bg-(--app-bg) text-(--ink) focus:outline-none focus:ring-2 focus:ring-(--accent-2)"
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 p-6 border-t border-(--border) bg-(--app-bg)">
                    <button onClick={handleClose} disabled={submitting} className="px-4 py-2 border border-(--border) rounded-lg text-(--ink) hover:bg-(--surface) transition-colors disabled:opacity-50">
                        {isViewMode ? "Close" : "Cancel"}
                    </button>
                    {!isViewMode && (
                        <button onClick={handleSubmit} disabled={!returnItems.length || submitting} className="px-6 py-2 bg-(--accent-2) text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                            {submitting ? "Saving..." : (isEditMode ? "Update Return" : "Create Return")}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderReturnModal;
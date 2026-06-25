// ─── components/OrderReturnModal.jsx ──────────────────────────────────────
import React, { useState } from "react";
import { X, Search, Check, Trash2 } from "lucide-react";
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
import {
    useGenerateReturnNumberQuery,
    useGetOrderForReturnQuery,
    useCreateOrderReturnMutation,
} from "../services/orderReturn.service.js";

const OrderReturnModal = ({ isOpen, onClose }) => {
    const [orderNumber, setOrderNumber] = useState("");
    const [selectedItems, setSelectedItems] = useState([]);
    const [notes, setNotes] = useState("");
    const language = "en";

    const { data: returnNumber, refetch: refetchReturnNumber } = useGenerateReturnNumberQuery();
    const { data: orderData, isLoading: orderLoading, error: orderError } = useGetOrderForReturnQuery(orderNumber, {
        skip: !orderNumber || orderNumber.length < 3,
    });
    const [createOrderReturn] = useCreateOrderReturnMutation();

    const handleOrderSearch = () => {
        if (orderNumber.length >= 3) refetchReturnNumber();
    };

    const handleItemSelect = (item, maxQuantity) => {
        setSelectedItems(prev => {
            const existing = prev.find(i => i.productId === item._id);
            if (existing) {
                return prev.map(i =>
                    i.productId === item._id
                        ? { ...i, quantity: Math.min(i.quantity + 1, maxQuantity) }
                        : i
                );
            }
            return [...prev, {
                productId: item._id,
                productName: item.productName || item.name,
                quantity: 1,
                maxQuantity,
                returnReason: "damaged",
                originalPrice: item.price || item.unitPrice,
                refundAmount: item.price || item.unitPrice,
            }];
        });
    };

    const handleItemRemove = (productId) => {
        setSelectedItems(prev => prev.filter(i => i.productId !== productId));
    };

    const handleItemQuantityChange = (productId, quantity) => {
        setSelectedItems(prev =>
            prev.map(i =>
                i.productId === productId
                    ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxQuantity)) }
                    : i
            )
        );
    };

    const handleItemReasonChange = (productId, reason) => {
        setSelectedItems(prev =>
            prev.map(i => (i.productId === productId ? { ...i, returnReason: reason } : i))
        );
    };

    const handleItemRefundChange = (productId, refundAmount) => {
        setSelectedItems(prev =>
            prev.map(i =>
                i.productId === productId ? { ...i, refundAmount: parseFloat(refundAmount) || 0 } : i
            )
        );
    };

    const totalRefund = selectedItems.reduce((sum, item) => sum + item.refundAmount * item.quantity, 0);

    const handleSubmit = async () => {
        if (!selectedItems.length) {
            showError("Please select at least one item to return");
            return;
        }

        try {
            await createOrderReturn({
                returnNumber: returnNumber?.returnNumber,
                referenceOrderId: orderData._id,
                referenceOrderNumber: orderData.orderNumber,
                items: selectedItems.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    returnReason: item.returnReason,
                    originalPrice: item.originalPrice,
                    refundAmount: item.refundAmount,
                })),
                customerName: orderData.customerName,
                notes,
            }).unwrap();

            showSuccess("Order return created successfully");
            handleClose();
        } catch (error) {
            showError(error?.response?.data?.message || error?.data?.message || error?.message || "Failed to create order return");
        }
    };

    const handleClose = () => {
        setOrderNumber("");
        setSelectedItems([]);
        setNotes("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--surface)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
                    <h2 className="text-xl font-semibold text-[var(--ink)] font-display">
                        Order Return
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-[var(--app-bg)] rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-[var(--muted)]" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {/* Order Number Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-[var(--ink)] mb-2">
                            Order Number
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={orderNumber}
                                onChange={(e) => setOrderNumber(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleOrderSearch()}
                                placeholder="Enter order number..."
                                className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--app-bg)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                            />
                            <button
                                onClick={handleOrderSearch}
                                disabled={orderNumber.length < 3}
                                className="px-4 py-2 bg-[var(--accent-2)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        </div>
                        {orderError && (
                            <p className="text-red-500 text-sm mt-2">Order not found</p>
                        )}
                    </div>

                    {/* Order Items */}
                    {orderData && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-[var(--ink)] mb-4 font-display">
                                Order Items
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {orderData.items?.map((item) => (
                                    <div
                                        key={item._id}
                                        className="p-4 border border-[var(--border)] rounded-lg hover:border-[var(--accent-2)] transition-colors cursor-pointer"
                                        onClick={() => handleItemSelect(item, item.quantity)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-[var(--ink)]">
                                                    {item.productName || item.name}
                                                </p>
                                                <p className="text-sm text-[var(--muted)]">
                                                    Qty: {item.quantity} | Price: ${item.price || item.unitPrice}
                                                </p>
                                            </div>
                                            <Check className="w-5 h-5 text-[var(--accent-2)]" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Selected Items */}
                    {selectedItems.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-[var(--ink)] mb-4 font-display">
                                Selected Items for Return
                            </h3>
                            <div className="space-y-4">
                                {selectedItems.map((item) => (
                                    <div
                                        key={item.productId}
                                        className="p-4 border border-[var(--border)] rounded-lg bg-[var(--app-bg)]"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <p className="font-medium text-[var(--ink)]">{item.productName}</p>
                                                <p className="text-sm text-[var(--muted)]">
                                                    Original Price: ${item.originalPrice}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleItemRemove(item.productId)}
                                                className="p-1 hover:bg-red-100 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs text-[var(--muted)] mb-1">
                                                    Quantity
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={item.maxQuantity}
                                                    value={item.quantity}
                                                    onChange={(e) =>
                                                        handleItemQuantityChange(
                                                            item.productId,
                                                            parseInt(e.target.value)
                                                        )
                                                    }
                                                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-[var(--muted)] mb-1">
                                                    Refund Amount
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.refundAmount}
                                                    onChange={(e) =>
                                                        handleItemRefundChange(
                                                            item.productId,
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] text-sm"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs text-[var(--muted)] mb-1">
                                                    Return Reason
                                                </label>
                                                <select
                                                    value={item.returnReason}
                                                    onChange={(e) =>
                                                        handleItemReasonChange(
                                                            item.productId,
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] text-sm"
                                                >
                                                    <option value="damaged">Damaged</option>
                                                    <option value="defective">Defective</option>
                                                    <option value="wrong-item">Wrong Item</option>
                                                    <option value="not-needed">Not Needed</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-4 bg-[var(--accent-2)]/10 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-[var(--ink)]">
                                        Total Refund:
                                    </span>
                                    <span className="text-2xl font-bold text-[var(--accent-2)]">
                                        ${totalRefund.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--ink)] mb-2">
                            Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Additional notes..."
                            rows={3}
                            className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--app-bg)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--border)] bg-[var(--app-bg)]">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 border border-[var(--border)] rounded-lg text-[var(--ink)] hover:bg-[var(--surface)] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={selectedItems.length === 0}
                        className="px-6 py-2 bg-[var(--accent-2)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        Create Return
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderReturnModal;
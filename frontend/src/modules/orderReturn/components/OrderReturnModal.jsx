// ─── components/OrderReturnModal.jsx ──────────────────────────────────────
import React, { useState, useEffect } from "react";
import { X, Search, ChevronUp, ChevronDown, Trash2, DollarSign, Plus, Edit2, Download } from "lucide-react";
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
import {
    useGenerateReturnNumberQuery,
    useGetOrderForReturnQuery,
    useCreateOrderReturnMutation,
    useUpdateOrderReturnMutation,
    useGetOrderReturnRefundsQuery,
} from "../api/orderReturn.api.js";
import { useOrder } from "../../orders/services/orders.service.js";
import OrderReturnRefundModal from "./OrderReturnRefundModal.jsx";
import OrderReturnPdfTemplate from "../components/OrderReturnPdfTemplate.jsx";
import PdfModal from "../../../shared/components/PdfModal.jsx";
import ConfirmDialog from "../../../shared/components/ConfirmationDialog.jsx";

// ─── Constants ────────────────────────────────────────────────
const RETURN_REASONS = [
    { value: "damaged", label: "Damaged" },
    { value: "defective", label: "Defective" },
    { value: "wrong-item", label: "Wrong Item" },
    { value: "not-needed", label: "Not Needed" },
    { value: "other", label: "Other" },
];

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

const OrderItemPicker = ({ items, selectedItems, onSelect, onItemDetailChange, expandedCalculation, onToggleCalculation }) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold text-(--ink) mb-4 font-display">Order Items</h3>
        <div className="space-y-3">
            {items.map((item, idx) => {
                const itemId = item._id || item.product || idx;
                const isSelected = !!selectedItems[itemId];
                const details = selectedItems[itemId] || {};

                return (
                    <div key={itemId} className="border rounded-xl overflow-hidden" style={{ borderColor: "var(--border)" }}>
                        {/* Item header with checkbox */}
                        <div
                            className="flex items-center gap-3 px-4 py-3 cursor-pointer transition"
                            style={{ background: isSelected ? "rgba(15,118,110,0.04)" : "var(--surface)" }}
                            onClick={() => onSelect(itemId, item)}
                        >
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    onSelect(itemId, item);
                                }}
                                className="w-4 h-4 rounded"
                                style={{ accentColor: "var(--accent-2)" }}
                            />
                            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                                <div>
                                    <span className="font-semibold" style={{ color: "var(--ink)" }}>{item.name || item.productName || "—"}</span>
                                </div>
                                <div style={{ color: "var(--muted)" }}>
                                    Qty: {item.quantity}
                                </div>
                                <div style={{ color: "var(--muted)" }}>
                                    Price: Rs {Number(item.unitPrice || item.originalPrice || 0).toFixed(2)}
                                </div>
                                <div style={{ color: "var(--muted)" }}>
                                    Batch: {item.batchNumber || item.batch?.batchNumber || "—"}
                                </div>
                            </div>
                        </div>

                        {/* Inline form for selected item */}
                        {isSelected && (
                            <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)", background: "var(--surface-muted)" }}>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs text-(--muted) mb-1">Return Quantity *</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={item.quantity}
                                            value={details.returnQuantity || 1}
                                            onChange={(e) => onItemDetailChange(itemId, "returnQuantity", e.target.value)}
                                            className="w-full px-3 py-2 border border-(--border) rounded-lg bg-(--surface) text-(--ink) text-sm"
                                            onWheel={e => e.target.blur()}
                                        />
                                        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                                            Max limit: {item.quantity}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-(--muted) mb-1">Return Reason *</label>
                                        <select
                                            value={details.returnReason || "damaged"}
                                            onChange={(e) => onItemDetailChange(itemId, "returnReason", e.target.value)}
                                            className="w-full px-3 py-2 border border-(--border) rounded-lg bg-(--surface) text-(--ink) text-sm"
                                        >
                                            {RETURN_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-(--muted) mb-1">Cut Amount</label>
                                        <input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={details.cut || 0}
                                            onChange={(e) => onItemDetailChange(itemId, "cut", e.target.value)}
                                            className="w-full px-3 py-2 border border-(--border) rounded-lg bg-(--surface) text-(--ink) text-sm"
                                            onWheel={e => e.target.blur()}
                                        />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <button
                                        onClick={() => onToggleCalculation(itemId)}
                                        className="flex items-center gap-2 text-xs text-(--muted) hover:text-(--ink) transition-colors"
                                    >
                                        {expandedCalculation[itemId] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        Show Refund Calculation
                                    </button>
                                    {expandedCalculation[itemId] && (
                                        <div className="mt-2 p-3 bg-(--surface) rounded-lg text-xs" style={{ border: "1px solid var(--border)" }}>
                                            <div className="space-y-1">
                                                <div className="flex justify-between">
                                                    <span>Original Total:</span>
                                                    <span>Rs {((details.returnQuantity || 1) * (item.unitPrice || item.originalPrice || 0)).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Cut Amount:</span>
                                                    <span>- Rs {(details.cut || 0).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between font-semibold" style={{ color: "var(--accent-2)" }}>
                                                    <span>Refund Amount:</span>
                                                    <span>Rs {(((details.returnQuantity || 1) * (item.unitPrice || item.originalPrice || 0)) - (details.cut || 0)).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────
const OrderReturnModal = ({ isOpen, onClose, editData, isEditMode, isViewMode, orderId }) => {
    const [orderNumber, setOrderNumber] = useState("");
    const [selectedItems, setSelectedItems] = useState({});
    const [notes, setNotes] = useState("");
    const [generatedReturnNumber, setGeneratedReturnNumber] = useState(null);
    const [fetchedOrder, setFetchedOrder] = useState(null);
    const [orderFetchError, setOrderFetchError] = useState(null);
    const [orderFetching, setOrderFetching] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingRefund, setEditingRefund] = useState(null);
    const [expandedCalculation, setExpandedCalculation] = useState({});
    const [showPdfModal, setShowPdfModal] = useState(false);

    // RTK Query hooks
    const { data: returnNumberData } = useGenerateReturnNumberQuery(undefined, { skip: isEditMode || isViewMode || !isOpen });
    const { data: orderData, isLoading: orderFetchingQuery } = useGetOrderForReturnQuery(orderNumber, { skip: !orderNumber });
    const { data: orderDataById } = useOrder(orderId, { skip: !orderId || isEditMode });
    const { data: refunds, refetch: refetchRefunds, isLoading: refundsLoading } = useGetOrderReturnRefundsQuery(editData?._id, { skip: !isViewMode || !editData?._id });
    const refundsList = Array.isArray(refunds) ? refunds : [];
    const [createOrderReturn] = useCreateOrderReturnMutation();
    const [updateOrderReturn] = useUpdateOrderReturnMutation();

    useEffect(() => {
        if (returnNumberData) {
            setGeneratedReturnNumber(returnNumberData);
        }
    }, [returnNumberData]);

    useEffect(() => {
        if ((isEditMode || isViewMode) && editData) {
            setOrderNumber(editData.referenceOrderNumber || "");
            // Convert items array to selectedItems object
            const selectedItemsObj = {};
            editData.items?.forEach((item) => {
                const itemId = item.productId || item._id;
                selectedItemsObj[itemId] = {
                    returnQuantity: item.quantity,
                    returnReason: item.returnReason,
                    cut: item.cut || 0,
                    refundAmount: item.refundAmount,
                    originalPrice: item.originalPrice,
                };
            });
            setSelectedItems(selectedItemsObj);
            setNotes(editData.notes || "");
        } else {
            resetForm();
        }
    }, [isEditMode, isViewMode, editData, isOpen]);

    // Auto-load order data when orderId is provided in create mode
    useEffect(() => {
        if (isEditMode || isViewMode || !orderId || !orderDataById) return;
        setFetchedOrder(orderDataById);
        setOrderNumber(orderDataById.orderNumber || "");
        showSuccess("Order loaded successfully");
    }, [isEditMode, isViewMode, orderId, orderDataById]);

    const handleItemSelect = (itemId, item) => {
        setSelectedItems((prev) => {
            if (prev[itemId]) {
                // Deselect
                const newSelected = { ...prev };
                delete newSelected[itemId];
                return newSelected;
            } else {
                // Select with default values
                return {
                    ...prev,
                    [itemId]: {
                        returnQuantity: 1,
                        returnReason: "damaged",
                        cut: 0,
                        refundAmount: item.unitPrice || item.originalPrice || 0,
                        originalPrice: item.unitPrice || item.originalPrice || 0,
                    },
                };
            }
        });
    };

    const handleItemDetailChange = (itemId, field, value) => {
        setSelectedItems((prev) => {
            const updated = {
                ...prev,
                [itemId]: {
                    ...prev[itemId],
                    [field]: value,
                },
            };
            
            // Recalculate refund amount when quantity or cut changes
            if (field === 'returnQuantity' || field === 'cut') {
                const details = updated[itemId];
                const qty = Number(details.returnQuantity) || 1;
                const cut = Number(details.cut) || 0;
                const refundAmount = (qty * details.originalPrice) - cut;
                updated[itemId].refundAmount = Math.max(0, refundAmount);
            }
            
            return updated;
        });
    };

    const toggleCalculation = (itemId) => {
        setExpandedCalculation((prev) => ({
            ...prev,
            [itemId]: !prev[itemId],
        }));
    };

    useEffect(() => {
        if (orderData) {
            setFetchedOrder(orderData);
        } else if (!orderNumber || orderNumber.length < 3) {
            setFetchedOrder(null);
        }
        setOrderFetching(orderFetchingQuery);
    }, [orderData, orderNumber, orderFetchingQuery]);

    const handleOrderSearch = async () => {
        // Query is automatically triggered by orderNumber change via the hook
        // This function can be used for manual trigger if needed
    };

    const totalRefundAmount = Object.values(selectedItems).reduce((sum, item) => sum + (parseFloat(item.refundAmount) || 0), 0);

    const handleSubmit = async () => {
        const selectedItemsArray = Object.entries(selectedItems);
        if (selectedItemsArray.length === 0) return showError("Please select at least one item to return");
        
        const itemsPayload = selectedItemsArray.map(([itemId, details]) => ({
            productId: itemId,
            productName: "", // Will be filled from fetchedOrder items
            quantity: details.returnQuantity,
            returnReason: details.returnReason,
            originalPrice: details.originalPrice,
            refundAmount: details.refundAmount,
            cut: details.cut,
        }));

        // Fill productName from fetchedOrder items
        if (fetchedOrder?.items) {
            itemsPayload.forEach(item => {
                const orderItem = fetchedOrder.items.find(oi => 
                    (oi._id === item.productId || oi.product === item.productId)
                );
                if (orderItem) {
                    item.productName = orderItem.name || orderItem.productName;
                    item.batchId = orderItem.batchId;
                }
            });
        }

        setSubmitting(true);
        try {
            if (isEditMode && editData) {
                await updateOrderReturn({ id: editData._id, items: itemsPayload, notes }).unwrap();
                showSuccess("Order return updated successfully");
            } else {
                await createOrderReturn({
                    returnNumber: generatedReturnNumber?.returnNumber,
                    referenceOrderId: fetchedOrder._id,
                    referenceOrderNumber: fetchedOrder.orderNumber,
                    customerName: fetchedOrder.customerName,
                    customerId: fetchedOrder.customerId,
                    items: itemsPayload,
                    notes,
                }).unwrap();
                showSuccess("Order return created successfully");
            }
            resetForm();
            onClose();
        } catch (err) {
            showError(err?.data?.message || err?.message || "Failed to save order return");
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => { setOrderNumber(""); setSelectedItems({}); setNotes(""); setFetchedOrder(null); setOrderFetchError(null); };
    const handleClose = () => { resetForm(); onClose(); };

    const handleDeleteRefund = async (refundId) => {
        try {
            const response = await fetch(`http://localhost:5001/api/product-returns/${editData._id}/refunds/${refundId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await response.json();
            if (data.success) {
                showSuccess("Refund deleted successfully");
                refetchRefunds();
            } else {
                showError(data.message || "Failed to delete refund");
            }
        } catch (error) {
            showError("Failed to delete refund");
        }
    };

    const handleEditRefund = (refund) => {
        setEditingRefund(refund);
    };

    const handleRefundSuccess = () => {
        setEditingRefund(null);
        refetchRefunds();
    };

    if (!isOpen) return null;

    return (
        <React.Fragment>
            {editingRefund && (
                <OrderReturnRefundModal
                    orderReturn={editData}
                    refund={editingRefund}
                    onClose={() => setEditingRefund(null)}
                    onSuccess={handleRefundSuccess}
                />
            )}
            {showPdfModal && (
                <PdfModal
                    isOpen={showPdfModal}
                    onClose={() => setShowPdfModal(false)}
                    fileName={`OrderReturn-${editData?.returnNumber || 'details'}.pdf`}
                    labels={{}}
                >
                    <OrderReturnPdfTemplate orderReturn={editData} refunds={refundsList} labels={{}} />
                </PdfModal>
            )}
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-(--surface) rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

                <div className="flex items-center justify-between p-6 border-b border-(--border)">
                    <h2 className="text-xl font-semibold text-(--ink) font-display">
                        {isViewMode ? "View Order Return" : (isEditMode ? "Edit Order Return" : "Order Return")}
                    </h2>
                    <div className="flex items-center gap-2">
                        {isViewMode && (
                            <button
                                onClick={() => setShowPdfModal(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-(--accent-2) text-white rounded-lg hover:bg-(--accent-2)/90 text-sm font-medium"
                            >
                                <Download size={14} />
                                Export
                            </button>
                        )}
                        <button onClick={handleClose} className="p-2 hover:bg-(--app-bg) rounded-lg transition-colors">
                            <X className="w-5 h-5 text-(--muted)" />
                        </button>
                    </div>
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
                                    {Object.entries(selectedItems).map(([itemId, item]) => (
                                        <div key={itemId} className="p-4 border border-(--border) rounded-lg bg-(--app-bg)">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="font-medium text-(--ink)">{item.productName || `Product ${itemId}`}</p>
                                                <p className="text-sm font-bold text-(--accent-2)">Rs {parseFloat(item.refundAmount).toFixed(2)}</p>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-sm text-(--muted)">
                                                <div>Qty: {item.returnQuantity}</div>
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
                                    <span className="font-semibold text(--ink)">Total Refund:</span>
                                    <span className="text-2xl font-bold text-(--accent-2)">Rs {totalRefundAmount.toFixed(2)}</span>
                                </div>
                            </div>

                            {notes && (
                                <div>
                                    <label className="block text-sm font-medium text-(--ink) mb-2">Notes</label>
                                    <p className="text-sm text-(--muted) bg-(--app-bg) p-3 rounded-lg">{notes}</p>
                                </div>
                            )}

                            {/* Refund Details Section */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-(--ink) flex items-center gap-2">
                                        <DollarSign size={20} />
                                        Refund Details
                                    </h3>
                                    <button
                                        onClick={() => setEditingRefund({})}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-(--accent-2) text-white rounded-lg hover:bg-(--accent-2)/90 text-sm font-medium"
                                    >
                                        <Plus size={16} />
                                        Add Refund
                                    </button>
                                </div>
                                {refundsLoading ? (
                                    <div className="text-center text-(--muted) py-4">Loading refunds...</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead style={{ background: "var(--surface-muted)" }}>
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-(--muted)">
                                                        Date
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-(--muted)">
                                                        Method
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-(--muted)">
                                                        Amount
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-(--muted)">
                                                        Credit Account
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-(--muted)">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                                                {refundsList?.length > 0 ? (
                                                    refundsList.map((refund) => (
                                                        <tr key={refund._id} className="hover:bg-(--surface-muted) transition-all">
                                                            <td className="px-4 py-3">
                                                                <p className="font-medium text-(--ink)">
                                                                    {new Date(refund.refundDate).toLocaleDateString()}
                                                                </p>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                                                    refund.refundMethod === 'cash' ? 'bg-green-100 text-green-800' :
                                                                    refund.refundMethod === 'credit' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-purple-100 text-purple-800'
                                                                }`}>
                                                                    {refund.refundMethod}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-bold text-(--ink)">
                                                                {refund.amount?.toLocaleString()} Rs
                                                                {refund.cashAmount > 0 && <span className="text-xs text-(--muted) block">Cash: {refund.cashAmount?.toLocaleString()}</span>}
                                                                {refund.creditAmount > 0 && <span className="text-xs text-(--muted) block">Credit: {refund.creditAmount?.toLocaleString()}</span>}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {refund.creditAccount?.name || "—"}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <div className="flex justify-center gap-2">
                                                                    <button
                                                                        onClick={() => handleEditRefund(refund)}
                                                                        className="p-2 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors"
                                                                        title="Edit Refund"
                                                                    >
                                                                        <Edit2 size={16} />
                                                                    </button>
                                                                    <ConfirmDialog message="Are you sure you want to delete this refund?" onConfirm={() => handleDeleteRefund(refund._id)}>
                                                                        <button
                                                                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                                                            title="Delete Refund"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </ConfirmDialog>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="px-4 py-8 text-center text-(--muted)">
                                                            No refunds recorded for this return.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
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
                                <OrderItemPicker 
                                    items={fetchedOrder.items} 
                                    selectedItems={selectedItems}
                                    onSelect={handleItemSelect}
                                    onItemDetailChange={handleItemDetailChange}
                                    expandedCalculation={expandedCalculation}
                                    onToggleCalculation={toggleCalculation}
                                />
                            )}

                            {Object.keys(selectedItems).length > 0 && (
                                <div className="mt-4 p-4 bg-(--accent-2)/10 rounded-lg flex justify-between items-center">
                                    <span className="font-semibold text-(--ink)">Total Refund ({Object.keys(selectedItems).length} items):</span>
                                    <span className="text-2xl font-bold text-(--accent-2)">Rs {totalRefundAmount.toFixed(2)}</span>
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
                        <button onClick={handleSubmit} disabled={Object.keys(selectedItems).length === 0 || submitting} className="px-6 py-2 bg-(--accent-2) text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                            {submitting ? "Saving..." : (isEditMode ? "Update Return" : "Create Return")}
                        </button>
                    )}
                </div>
            </div>
            </div>
        </React.Fragment>
    );
};

export default OrderReturnModal;
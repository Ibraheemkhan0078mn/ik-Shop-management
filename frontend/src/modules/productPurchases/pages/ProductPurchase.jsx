// src/modules/productPurchases/pages/ProductPurchase.jsx
import { useState, useRef, useEffect } from "react";
import { Plus, Check, X, DollarSign, Eye, Copy, RotateCcw, Edit, Trash2, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDeletePurchase, usePurchases, useUpdatePurchaseStatus } from "../services/purchases.service.js";
import { getPurchaseLabels } from "../labels/purchaseLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import PurchaseModal from "../components/PurchaseModal.jsx";
import PurchasePaymentModal from "../components/PurchasePaymentModal.jsx";
import PurchaseReturnModal from "../../purchaseReturn/components/PurchaseReturnModal.jsx";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";

export default function ProductPurchasePage() {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getPurchaseLabels(language);
    
    const [deletePurchase] = useDeletePurchase();
    const [updateStatus] = useUpdatePurchaseStatus();

    const [modal,        setModal]        = useState(null);
    const [paymentModal, setPaymentModal] = useState(null);
    const [returnModal,  setReturnModal]  = useState(null);
    const [filterId, setFilterId] = useState("");
    const [debouncedFilterId, setDebouncedFilterId] = useState("");
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [expandAll, setExpandAll] = useState(false);
    const [expandedRows, setExpandedRows] = useState({});

    const listRef = useRef(null);

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
            await deletePurchase(id).unwrap();
            showSuccess(labels.purchaseDeleted);
        } catch (error) {
            showError(error?.data?.message || labels.failedToDelete);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await updateStatus({ id, status }).unwrap();
            showSuccess(`Purchase marked as ${status}`);
        } catch (error) {
            showError(error?.data?.message || labels.failedToUpdate);
        }
    };

    return (
        <div className="h-screen flex flex-col">
            {/* ── modals ── */}
            {modal && (
                <PurchaseModal
                    mode={modal.mode}
                    purchaseId={modal.id}
                    onClose={() => setModal(null)}
                />
            )}
            {paymentModal && (
                <PurchasePaymentModal
                    purchase={paymentModal}
                    onClose={() => setPaymentModal(null)}
                    onSuccess={() => {
                        setPaymentModal(null);
                        listRef.current?.refetch();
                    }}
                />
            )}
            {returnModal && (
                <PurchaseReturnModal
                    mode="create"
                    purchaseId={returnModal.purchaseId}
                    onClose={() => setReturnModal(null)}
                    onSuccess={() => {
                        setReturnModal(null);
                        listRef.current?.refetch();
                    }}
                />
            )}

            <div className="flex-none">
                <PageHeading
                    heading={labels.purchaseManagement}
                    subheading={labels.managePurchases}
                    leftActions={
                        <PermissionGuard 
                            execute={() => setModal({ mode: "create" })} 
                            permission="purchases.create" 
                            isConfirmation={false}
                        >
                            <div>
                                <ScreenTabButton lucideIcon={Plus} text={labels.addPurchase} />
                            </div>
                        </PermissionGuard>
                    }
                    rightActions={
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setExpandAll(!expandAll)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all duration-150 ${
                                    expandAll 
                                        ? "border-(--accent-2) text-(--accent-2) bg-(--accent-2)/10" 
                                        : "border-(--border) text-(--muted) bg-(--surface-muted) hover:border-(--accent-2) hover:text-(--accent-2)"
                                }`}
                                title={expandAll ? "Collapse All" : "Expand All"}
                            >
                                {expandAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                <span className="text-xs font-bold uppercase tracking-wider">
                                    {expandAll ? "Collapse" : "Expand"}
                                </span>
                            </button>
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
                                                {language === "en" ? "Invoice Number" : "انوائس نمبر"}
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Enter invoice number..."
                                                value={filterId}
                                                onChange={(e) => setFilterId(e.target.value)}
                                                className="w-full px-3 py-2 text-sm rounded-xl border-2 border-(--border) bg-(--surface-muted) outline-none focus:border-(--accent-2) transition-all"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    }
                />
            </div>

            {/* ── list ── */}
            <PaginatedList
                ref={listRef}
                rtkQuery={usePurchases}
                limit={20}
                dataKey="data"
                wrapperClassName="flex-1"
                queryArgs={debouncedFilterId ? { invoiceNumber: debouncedFilterId } : {}}
                renderItems={(purchases) => (
                    <div className="overflow-x-auto rounded-2xl overflow-hidden border-edge">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="text-xs uppercase tracking-wider bg-surface-muted border-b border-edge text-ink-muted">
                                    <th className="px-4 py-3 font-semibold">{labels.invoice}</th>
                                    <th className="px-4 py-3 font-semibold text-center">{labels.items}</th>
                                    <th className="px-4 py-3 font-semibold text-right">{labels.total}</th>
                                    <th className="px-4 py-3 font-semibold text-right">{labels.paid || "Paid"}</th>
                                    <th className="px-4 py-3 font-semibold text-right">{labels.remaining || "Remaining"}</th>
                                    <th className="px-4 py-3 font-semibold">{labels.date}</th>
                                    <th className="px-4 py-3 font-semibold">{labels.status}</th>
                                    <th className="px-4 py-3 font-semibold">{labels.payment}</th>
                                    <th className="px-4 py-3 font-semibold text-center">{labels.actions}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchases.map(p => (
                                    <PurchaseRow
                                        key={p._id}
                                        purchase={p}
                                        isExpanded={expandAll || expandedRows[p._id]}
                                        onToggleExpand={() => setExpandedRows(prev => ({ ...prev, [p._id]: !prev[p._id] }))}
                                        onEdit={() => setModal({ mode: "update", id: p._id })}
                                        onDelete={() => handleDelete(p._id)}
                                        onStatusUpdate={handleStatusUpdate}
                                        onPayment={() => setPaymentModal(p)}
                                        onReturn={() => setReturnModal({ purchaseId: p._id })}
                                        onView={(purchase) => navigate(`/purchases/${purchase._id}`)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                renderEmpty={() => (
                    <p className="text-center py-12 text-sm text-ink-muted">
                        {labels.noPurchasesFound}
                    </p>
                )}
            />
        </div>
    );
}

function PurchaseRow({ purchase, isExpanded, onToggleExpand, onEdit, onDelete, onStatusUpdate, onPayment, onReturn, onView }) {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getPurchaseLabels(language);
    
    const purchaseId = purchase?._id ?? "";
    const dateStr = purchase?.date ?? purchase?.createdAt ?? "";
    const date = dateStr ? new Date(dateStr).toLocaleDateString() : "—";
    const status = purchase?.status ?? 'ordered';
    const paymentStatus = purchase?.paymentStatus ?? 'pending';
    
    // Calculate paid and remaining from purchase data
    const totalAmount = purchase?.totalAmount ?? 0;
    const paidAmount = purchase?.paidAmount ?? 0;
    const remainingAmount = totalAmount - paidAmount;

    const getStatusColor = (status) => {
        switch (status) {
            case 'ordered': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'delivered': return 'bg-green-100 text-green-800 border-green-300';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-gray-100 text-gray-800 border-gray-300';
            case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'full': return 'bg-green-100 text-green-800 border-green-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'ordered': return labels.ordered;
            case 'delivered': return labels.delivered;
            case 'rejected': return labels.rejected;
            default: return status;
        }
    };

    const getPaymentStatusLabel = (status) => {
        switch (status) {
            case 'pending': return labels.paymentPending;
            case 'partial': return labels.paymentPartial;
            case 'full': return labels.paymentFull;
            default: return status;
        }
    };

    const items = purchase?.items || [];

    return (
        <>
            <tr className="transition border-b border-edge hover:bg-surface-muted">

                <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                    <div className="flex items-center gap-2">
                        <span>{purchase?.invoiceNumber ?? "—"}</span>
                        {purchase?.invoiceNumber && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(purchase.invoiceNumber);
                                    showSuccess("Invoice number copied");
                                }}
                                className="hover:text-primary transition-colors"
                                title="Copy invoice number"
                            >
                                <Copy className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </td>
                <td className="px-4 py-3 text-center text-ink">
                    <div className="text-sm font-medium">{items.length}</div>
                    {items.length > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleExpand();
                            }}
                            className="text-xs text-(--accent-2) hover:underline mt-1"
                        >
                            {isExpanded ? "Hide items" : "Show items"}
                        </button>
                    )}
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-primary">
                    Rs {(purchase?.totalAmount ?? 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-green-600">
                    Rs {paidAmount.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-orange-600">
                    Rs {remainingAmount.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-ink-muted">{date}</td>
                <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(status)}`}>
                        {getStatusLabel(status)}
                    </span>
                </td>
                <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getPaymentStatusColor(paymentStatus)}`}>
                        {getPaymentStatusLabel(paymentStatus)}
                    </span>
                </td>
                <td className="px-4 py-3">
                    <div className="flex justify-center gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => onView?.(purchase)}
                            className="px-3 py-1 text-xs rounded-lg font-medium transition bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 flex items-center gap-1"
                            title="View Details"
                        >
                            <Eye className="w-3 h-3" />
                        </button>
                        {status === 'ordered' && (
                            <>
                                <PermissionGuard execute={() => onStatusUpdate(purchaseId, 'delivered')} permission="purchases.update" isConfirmation={true}>
                                    <button 
                                        className="px-3 py-1 text-xs rounded-lg font-medium transition bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 flex items-center gap-1"
                                        title={labels.delivered}
                                    >
                                        <Check className="w-3 h-3" />
                                    </button>
                                </PermissionGuard>
                                <PermissionGuard execute={() => onStatusUpdate(purchaseId, 'rejected')} permission="purchases.update" isConfirmation={true}>
                                    <button 
                                        className="px-3 py-1 text-xs rounded-lg font-medium transition bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 flex items-center gap-1"
                                        title={labels.rejected}
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </PermissionGuard>
                            </>
                        )}
                        {status === 'delivered' && remainingAmount > 0 && (
                            <PermissionGuard execute={() => onPayment?.()} permission="purchases.payment" isConfirmation={true}>
                                <button 
                                    className="px-3 py-1 text-xs rounded-lg font-medium transition bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 flex items-center gap-1"
                                    title={labels.pay}
                                >
                                    <DollarSign className="w-3 h-3" />
                                </button>
                            </PermissionGuard>
                        )}
                        {status === 'delivered' && (
                            <PermissionGuard execute={() => onReturn?.()} permission="purchases.return" isConfirmation={false}>
                                <button 
                                    className="px-3 py-1 text-xs rounded-lg font-medium transition bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 flex items-center gap-1"
                                    title={labels.return || "Return"}
                                >
                                    <RotateCcw className="w-3 h-3" />
                                </button>
                            </PermissionGuard>
                        )}
                        <PermissionGuard execute={onEdit} permission="purchases.update" isConfirmation={true}>
                            <button 
                                className="px-3 py-1 text-xs rounded-lg font-medium transition bg-primary-hover text-primary border border-edge-brand hover:bg-primary-hover/80"
                                title={labels.edit}
                            >
                                <Edit className="w-3 h-3" />
                            </button>
                        </PermissionGuard>
                        <PermissionGuard execute={onDelete} permission="purchases.delete" isConfirmation={true}>
                            <button 
                                className="px-3 py-1 text-xs rounded-lg font-medium transition bg-red-50 text-red-500 border border-red-200 hover:bg-red-100"
                                title={labels.delete}
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </PermissionGuard>
                    </div>
                </td>
            </tr>
            {/* Expandable item details row */}
            {isExpanded && items.length > 0 && (
                <tr className="bg-(--surface-muted)">
                    <td colSpan="9" className="px-4 py-3">
                        <div className="flex flex-wrap gap-2 text-sm">
                            {items.map((item, idx) => {
                                const itemName = item.name || item.product?.name || item.productName || String(item.product);
                                const quantity = item.quantity || 0;
                                return (
                                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-(--surface) border border-(--border) rounded-md">
                                        <span className="font-semibold text-(--accent-2)">{quantity}×</span>
                                        <span className="text-(--ink)">{itemName}</span>
                                    </span>
                                );
                            })}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}


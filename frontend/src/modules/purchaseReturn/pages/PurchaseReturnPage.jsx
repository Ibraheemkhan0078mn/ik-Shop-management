// src/modules/purchaseReturn/pages/PurchaseReturnPage.jsx
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Plus, CheckCircle, Pencil, Trash2, Check, X, Filter, DollarSign, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { useSelector } from "react-redux";
import { getPurchaseReturnLabels } from "../labels/purchaseReturnLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import PaginatedList, { usePaginatedFetch } from "../../../shared/components/PaginatedList.jsx";
import PurchaseReturnModal from "../components/PurchaseReturnModal.jsx";
import PurchaseReturnPaymentModal from "../components/PurchaseReturnPaymentModal.jsx";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import { deletePurchaseReturnApi, getPaginatedPurchaseReturnsApi, approvePurchaseReturnApi } from "../api/purchaseReturnApi.js";
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";
import { productApi } from "../../productsModule/services/product.service.js";

const STATUS_CLASS = {
    draft: "bg-gray-100 text-gray-600",
    pending: "bg-amber-100 text-amber-600",
    approved: "bg-primary-hover text-primary",
    rejected: "bg-red-100 text-red-600",
};

export default function PurchaseReturnPage() {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getPurchaseReturnLabels(language);
    const dispatch = useDispatch();

    const [modal, setModal] = useState(null);
    const [approvalModal, setApprovalModal] = useState(false);
    const [paymentModal, setPaymentModal] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [filterId, setFilterId] = useState("");
    const [filterInvoiceId, setFilterInvoiceId] = useState("");
    const [debouncedFilterId, setDebouncedFilterId] = useState("");
    const [debouncedFilterInvoiceId, setDebouncedFilterInvoiceId] = useState("");
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [expandAll, setExpandAll] = useState(false);
    const [expandedRows, setExpandedRows] = useState({});

    const hasActiveFilter = filterId !== "" || filterInvoiceId !== "";

    const clearFilter = () => {
        setFilterId("");
        setFilterInvoiceId("");
    };

    // Debounce filter input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilterId(filterId);
        }, 300);
        return () => clearTimeout(timer);
    }, [filterId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilterInvoiceId(filterInvoiceId);
        }, 300);
        return () => clearTimeout(timer);
    }, [filterInvoiceId]);

    const usePurchaseReturnsQuery = (params = {}) => {
        const [data, setData] = useState(null);
        const [isLoading, setIsLoading] = useState(true);
        const [isFetching, setIsFetching] = useState(false);

        const fetchData = useCallback(async () => {
            setIsFetching(true);
            try {
                const result = await getPaginatedPurchaseReturnsApi(params);
                setData(result);
            } catch (error) {
                // Error is already handled in the API function with toast
                setData({ data: [], total: 0 });
            } finally {
                setIsLoading(false);
                setIsFetching(false);
            }
        }, [params.page, params.limit, params.status, params.supplier, refreshKey]);

        useEffect(() => {
            fetchData();
        }, [fetchData]);

        return { data, isLoading, isFetching, refetch: fetchData };
    };

    const handleDelete = async (id) => {
        try {
            await deletePurchaseReturnApi(id);
            showSuccess(labels.returnDeleted);
            setRefreshKey((v) => v + 1);
            // Invalidate product cache to refresh product data
            dispatch(productApi.util.invalidateTags(["Product"]));
        } catch (error) {
            showError(error?.response?.data?.message || error?.message || labels.failedToDelete);
        }
    };

    const handleApprove = async (id) => {
        try {
            await approvePurchaseReturnApi(id);
            showSuccess(labels.returnApproved);
            setRefreshKey((v) => v + 1);
            // Invalidate product cache to refresh product data
            dispatch(productApi.util.invalidateTags(["Product"]));
            // Also refresh the approval modal data
            if (approvalModal) {
                setApprovalModal(false);
                setTimeout(() => setApprovalModal(true), 100);
            }
        } catch (error) {
            showError(error?.response?.data?.message || error?.message || labels.failedToApprove);
        }
    };

    return (
        <div>
            {modal && (
                <PurchaseReturnModal
                    mode={modal.mode}
                    purchaseReturnId={modal.id}
                    onClose={() => setModal(null)}
                    onSuccess={() => setRefreshKey((v) => v + 1)}
                />
            )}

            {paymentModal && (
                <PurchaseReturnPaymentModal
                    purchaseReturn={paymentModal}
                    onClose={() => setPaymentModal(null)}
                    onSuccess={() => {
                        setPaymentModal(null);
                        setRefreshKey((v) => v + 1);
                    }}
                />
            )}

            {approvalModal && (
                <PurchaseReturnApprovalModal
                    onClose={() => setApprovalModal(false)}
                    onApprove={handleApprove}
                    onDelete={handleDelete}
                />
            )}

            <PageHeading
                heading={labels.purchaseReturns}
                subheading={labels.manageReturns}
                leftActions={
                    <>
                        <PermissionGuard 
                            execute={() => setModal({ mode: "create" })} 
                            permission="purchaseReturns.create" 
                            isConfirmation={false}
                        >
                            <div>
                                <ScreenTabButton lucideIcon={Plus} text={labels.addReturn} />
                            </div>
                        </PermissionGuard>
                        <PermissionGuard 
                            execute={() => setApprovalModal(true)} 
                            permission="purchaseReturns.approve" 
                            isConfirmation={false}
                        >
                            <div>
                                <ScreenTabButton lucideIcon={CheckCircle} text={labels.approveReturn} />
                            </div>
                        </PermissionGuard>
                    </>
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
                                            {language === "en" ? "Filter" : "فلٹر"}
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

                                    {/* Return Hash Filter */}
                                    <div className="mb-3">
                                        <label className="block text-xs font-semibold mb-1.5 text-(--muted)">
                                            {language === "en" ? "Return Hash" : "ریٹرن ہاش"}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter return hash..."
                                            value={filterId}
                                            onChange={(e) => setFilterId(e.target.value)}
                                            className="w-full px-3 py-2 text-sm rounded-xl border-2 border-(--border) bg-(--surface-muted) outline-none focus:border-(--accent-2) transition-all"
                                        />
                                    </div>

                                    {/* Purchase Invoice ID Filter */}
                                    <div>
                                        <label className="block text-xs font-semibold mb-1.5 text-(--muted)">
                                            {language === "en" ? "Purchase Invoice ID" : "خرید انوائس آئی ڈی"}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter purchase invoice ID..."
                                            value={filterInvoiceId}
                                            onChange={(e) => setFilterInvoiceId(e.target.value)}
                                            className="w-full px-3 py-2 text-sm rounded-xl border-2 border-(--border) bg-(--surface-muted) outline-none focus:border-(--accent-2) transition-all"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                }
            />

                <PaginatedList
                    rtkQuery={usePurchaseReturnsQuery}
                    limit={20}
                    dataKey="data"
                    wrapperClassName="min-h-0"
                    queryArgs={debouncedFilterId || debouncedFilterInvoiceId ? { 
                        ...(debouncedFilterId && { returnHash: debouncedFilterId }),
                        ...(debouncedFilterInvoiceId && { invoiceNumber: debouncedFilterInvoiceId })
                    } : {}}
                    renderItems={(purchaseReturns) => (
                        <div className="overflow-x-auto rounded-2xl overflow-hidden border-edge">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="text-xs uppercase tracking-wider bg-surface-muted border-b border-edge text-ink-muted">
                                        <th className="px-4 py-3 font-semibold">{labels.returnHash}</th>
                                        <th className="px-4 py-3 font-semibold">{labels.purchaseInvoice}</th>
                                        <th className="px-4 py-3 font-semibold">{labels.supplier}</th>
                                        <th className="px-4 py-3 font-semibold text-center">{labels.items}</th>
                                        <th className="px-4 py-3 font-semibold text-right">{labels.refund}</th>
                                        <th className="px-4 py-3 font-semibold text-center">{labels.status}</th>
                                        <th className="px-4 py-3 font-semibold">{labels.date}</th>
                                        <th className="px-4 py-3 font-semibold text-center">{labels.actions}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchaseReturns.map((pr) => (
                                        <PurchaseReturnRow
                                            key={pr._id}
                                            purchaseReturn={pr}
                                            isExpanded={expandAll || expandedRows[pr._id]}
                                            onToggleExpand={() => setExpandedRows(prev => ({ ...prev, [pr._id]: !prev[pr._id] }))}
                                            onEdit={() => setModal({ mode: "update", id: pr._id })}
                                            onDelete={() => handleDelete(pr._id)}
                                            onPayment={() => setPaymentModal(pr)}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    renderEmpty={() => (
                        <p className="text-center py-12 text-sm text-ink-muted">
                            {labels.noReturnsFound}
                        </p>
                    )}
                />
        </div>
    );
}

function PurchaseReturnRow({ purchaseReturn, isExpanded, onToggleExpand, onEdit, onDelete, onPayment }) {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getPurchaseReturnLabels(language);

    const date = new Date(purchaseReturn?.returnDate ?? purchaseReturn?.createdAt).toLocaleDateString();
    const status = purchaseReturn?.status ?? "draft";
    const statusClass = STATUS_CLASS[status] ?? STATUS_CLASS.draft;

    // Calculate payment status
    const totalRefundAmount = purchaseReturn?.totalRefundAmount || 0;
    const refundedAmount = purchaseReturn?.refundedAmount || 0;
    const remainingAmount = totalRefundAmount - refundedAmount;

    const items = purchaseReturn?.items || [];

    const getStatusLabel = (status) => {
        switch (status) {
            case 'draft': return labels.draft;
            case 'pending': return labels.pending;
            case 'approved': return labels.approved;
            case 'rejected': return labels.rejected;
            default: return status;
        }
    };

    const handlePaymentClick = (e) => {
        e.stopPropagation();
        onPayment();
    };

    const handleViewDetails = (e) => {
        e.stopPropagation();
        navigate(`/purchase-returns/${purchaseReturn._id}`);
    };

    return (
        <>
            <tr className="transition border-b border-edge hover:bg-surface-muted">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">
                    {purchaseReturn?.purchaseReturnNumber ?? "—"}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                    {purchaseReturn?.purchase?.invoiceNumber ?? "—"}
                </td>
                <td className="px-4 py-3 text-xs text-ink">
                    {purchaseReturn?.supplier?.name ?? "—"}
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
                <td className="px-4 py-3 text-right">
                    <div className="text-xs">
                        <div className="font-semibold tabular-nums text-primary">Rs {totalRefundAmount.toLocaleString()}</div>
                        <div className="text-[10px] text-green-600">Paid: Rs {refundedAmount.toLocaleString()}</div>
                        <div className="text-[10px] text-orange-600">Rem: Rs {remainingAmount.toLocaleString()}</div>
                    </div>
                </td>
                <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold capitalize ${statusClass}`}>
                        {getStatusLabel(status)}
                    </span>
                </td>
                <td className="px-4 py-3 text-xs text-ink-muted">
                    {date}
                </td>
                <td className="px-4 py-3">
                    <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={handleViewDetails}
                            className="px-3 py-1 text-xs rounded-lg font-medium transition bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 flex items-center gap-1"
                            title="View Details"
                        >
                            <Eye className="w-3 h-3" />
                        </button>
                        {purchaseReturn?.status === 'approved' && remainingAmount > 0 && (
                            <button
                                onClick={handlePaymentClick}
                                className="px-3 py-1 text-xs rounded-lg font-medium transition bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 flex items-center gap-1"
                                title="Record Refund"
                            >
                                <DollarSign className="w-3 h-3" />
                            </button>
                        )}
                        {purchaseReturn?.status !== 'approved' && (
                            <PermissionGuard execute={onEdit} permission="purchaseReturns.update" isConfirmation={true}>
                                <button
                                    className="px-3 py-1 text-xs rounded-lg font-medium transition bg-primary-hover text-primary border border-edge-brand hover:bg-primary-hover/80 flex items-center gap-1"
                                    title={labels.edit}
                                >
                                    <Pencil className="w-3 h-3" />
                                </button>
                            </PermissionGuard>
                        )}
                        <PermissionGuard execute={onDelete} permission="purchaseReturns.delete" isConfirmation={true}>
                            <button
                                className="px-3 py-1 text-xs rounded-lg font-medium transition bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 flex items-center gap-1"
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
                    <td colSpan="8" className="px-4 py-3">
                        <div className="flex flex-wrap gap-2 text-sm">
                            {items.map((item, idx) => {
                                const itemName = item.name || item.product?.name || item.productName || String(item.product);
                                const quantity = item.quantity || item.returnQuantity || 0;
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

function PurchaseReturnApprovalModal({ onClose, onApprove, onDelete }) {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getPurchaseReturnLabels(language);
    
    const usePendingPurchaseReturnsQuery = (params = {}) => {
        const [data, setData] = useState(null);
        const [isLoading, setIsLoading] = useState(true);

        const fetchData = useCallback(async () => {
            try {
                const result = await getPaginatedPurchaseReturnsApi({ ...params, status: "pending" });
                setData(result);
            } catch (error) {
                setData({ data: [], total: 0 });
            } finally {
                setIsLoading(false);
            }
        }, [params.page, params.limit]);

        useEffect(() => {
            fetchData();
        }, [fetchData]);

        return { data, isLoading, refetch: fetchData };
    };

    const { data, isLoading } = usePendingPurchaseReturnsQuery({ page: 1, limit: 20 });
    const purchaseReturns = data?.data ?? [];

    const getStatusLabel = (status) => {
        switch (status) {
            case 'draft': return labels.draft;
            case 'pending': return labels.pending;
            case 'approved': return labels.approved;
            case 'rejected': return labels.rejected;
            default: return status;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">
                        {labels.approvePurchaseReturnRequests}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <div className="overflow-y-auto max-h-[65vh]">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">{labels.loading}</div>
                    ) : purchaseReturns.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            {labels.noPendingRequests}
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl overflow-hidden border-edge">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="text-xs uppercase tracking-wider bg-surface-muted border-b border-edge text-ink-muted">
                                        <th className="px-4 py-3 font-semibold">{labels.returnHash}</th>
                                        <th className="px-4 py-3 font-semibold">{labels.purchaseInvoice}</th>
                                        <th className="px-4 py-3 font-semibold">{labels.supplier}</th>
                                        <th className="px-4 py-3 font-semibold text-center">{labels.items}</th>
                                        <th className="px-4 py-3 font-semibold text-right">{labels.refund}</th>
                                        <th className="px-4 py-3 font-semibold text-center">{labels.status}</th>
                                        <th className="px-4 py-3 font-semibold">{labels.date}</th>
                                        <th className="px-4 py-3 font-semibold text-center">{labels.actions}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchaseReturns.map((pr) => (
                                        <tr key={pr._id} className="transition border-b border-edge hover:bg-surface-muted">
                                            <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">
                                                {pr?.purchaseReturnNumber ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                                                {pr?.purchase?.invoiceNumber ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-ink">
                                                {pr?.supplier?.name ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 text-center text-ink">
                                                {pr?.totalItems ?? pr?.items?.length ?? 0}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold tabular-nums text-primary">
                                                Rs {(pr?.totalRefundAmount ?? 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold capitalize ${STATUS_CLASS[pr?.status ?? "pending"]}`}>
                                                    {getStatusLabel(pr?.status ?? "pending")}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-ink-muted">
                                                {new Date(pr?.returnDate ?? pr?.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => onApprove(pr._id)}
                                                        className="px-3 py-1 text-xs rounded-lg font-medium transition bg-primary-hover text-primary border border-edge-brand hover:bg-primary-hover/80 flex items-center gap-1"
                                                        title={labels.approve}
                                                    >
                                                        <Check className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => onDelete(pr._id, e)}
                                                        className="px-3 py-1 text-xs rounded-lg font-medium transition bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 flex items-center gap-1"
                                                        title={labels.delete}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                {data?.totalPages > 1 && (
                    <div className="p-4 border-t text-center text-xs text-ink-muted">
                        {labels.showingPendingRequests.replace("{count}", purchaseReturns.length).replace("{total}", data.total)}
                    </div>
                )}
            </div>
        </div>
    );
}

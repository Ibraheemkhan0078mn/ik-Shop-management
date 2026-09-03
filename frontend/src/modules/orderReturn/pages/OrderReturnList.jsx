// ─── pages/OrderReturnList.jsx ────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, Eye, Trash2, Edit, ChevronLeft, ChevronRight, PackageX, CheckCircle, Check, X, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import { getOrderReturnLabels } from "../labels/orderReturnLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import OrderReturnModal from "../components/OrderReturnModal.jsx";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import { useGetPaginatedOrderReturnsQuery, useDeleteOrderReturnMutation, useApproveOrderReturnMutation } from "../api/orderReturn.api.js";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";
import ConfirmDialog from "../../../shared/components/ConfirmationDialog.jsx";

// Status → badge classes, built only from tokens already defined in index.css.
const STATUS_STYLES = {
    pending: "bg-[rgba(180,83,9,0.14)] text-[var(--accent)]",
    approved: "bg-primary-hover text-primary",
    rejected: "bg-danger text-primary-foreground",
    completed: "bg-inverse text-primary-foreground",
};
const DEFAULT_STATUS_STYLE = "bg-[var(--surface-muted)] text-ink-subtle";
const getStatusStyle = (status) => STATUS_STYLES[status] ?? DEFAULT_STATUS_STYLE;

const HIDE_CLASS = { sm: "hidden sm:table-cell", md: "hidden md:table-cell" };
const colClass = (col) => [HIDE_CLASS[col.hideBelow], col.align && `text-${col.align}`].filter(Boolean).join(" ");

const OrderReturnList = () => {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getOrderReturnLabels(language);

    const TABLE_COLUMNS = [
        { key: "returnNumber", label: labels.returnNumber },
        { key: "referenceOrderNumber", label: labels.orderNumber, hideBelow: "sm" },
        { key: "customerName", label: labels.customer, hideBelow: "md" },
        { key: "items", label: labels.items, align: "center", hideBelow: "sm" },
        { key: "refund", label: labels.refund, align: "right" },
        { key: "paid", label: "Paid", align: "right" },
        { key: "remaining", label: "Remaining", align: "right" },
        { key: "refundStatus", label: labels.refundStatus || "Refund Status", align: "center" },
        { key: "status", label: labels.status, align: "center" },
        { key: "date", label: labels.date, hideBelow: "md" },
        { key: "actions", label: labels.actions, align: "center" },
    ];

    const [showModal, setShowModal] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [approvalModal, setApprovalModal] = useState(false);
    const [filterId, setFilterId] = useState("");
    const [debouncedFilterId, setDebouncedFilterId] = useState("");
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [expandAll, setExpandAll] = useState(false);
    const [expandedRows, setExpandedRows] = useState({});

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

    const { data: returnsData, isLoading, refetch } = useGetPaginatedOrderReturnsQuery({ page: currentPage, limit: 10, returnNumber: debouncedFilterId });
    const [deleteOrderReturn] = useDeleteOrderReturnMutation();
    const [approveOrderReturn] = useApproveOrderReturnMutation();

    // The API returns full response with pagination info
    const returns = returnsData?.data || [];
    const pagination = {
        page: returnsData?.page || 1,
        limit: returnsData?.limit || 10,
        total: returnsData?.total || 0,
        totalPages: returnsData?.totalPages || 0,
    };

    const handleDelete = async (id) => {
        try {
            await deleteOrderReturn(id).unwrap();
            showSuccess(labels.returnDeleted);
            refetch();
        } catch (error) {
            showError(error?.data?.message || labels.failedToDelete);
        }
    };

    const handleApprove = async (id) => {
        try {
            await approveOrderReturn(id).unwrap();
            showSuccess("Return approved successfully");
            refetch();
            if (approvalModal) {
                setApprovalModal(false);
                setTimeout(() => setApprovalModal(true), 100);
            }
        } catch (error) {
            showError(error?.data?.message || "Failed to approve return");
        }
    };

    const handleEdit = (returnItem) => {
        setSelectedReturn(returnItem);
        setIsEditMode(true);
        setIsViewMode(false);
        setShowModal(true);
    };

    const handleView = (returnItem) => {
        navigate(`/order-returns/${returnItem._id}`);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedReturn(null);
        setIsEditMode(false);
        setIsViewMode(false);
        refetch();
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const location = useLocation();
    const [passedOrderId, setPassedOrderId] = useState(null);

    React.useEffect(() => {
        if (location.state?.searchOrderId) {
            setPassedOrderId(location.state.searchOrderId);
            setShowModal(true);
            // Clear state so a refresh doesn't keep reopening it
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    return (
        <div className="h-screen flex flex-col bg-app-bg">
            {showModal && (
                <OrderReturnModal
                    isOpen={showModal}
                    onClose={() => {
                        handleModalClose();
                        setPassedOrderId(null);
                    }}
                    editData={selectedReturn}
                    isEditMode={isEditMode}
                    isViewMode={isViewMode}
                    orderId={passedOrderId}
                />
            )}

            {approvalModal && (
                <OrderReturnApprovalModal
                    onClose={() => setApprovalModal(false)}
                    onApprove={handleApprove}
                    onDelete={handleDelete}
                />
            )}


            {/* ── Heading section ── */}
            <div className="flex-none px-6 pt-4">
                <PageHeading
                    heading={labels.orderReturns}
                    subheading={labels.manageReturns}
                    leftActions={
                        <div className="flex items-center gap-3">
                            <PermissionGuard 
                                execute={() => setShowModal(true)} 
                                permission="orderReturns.create" 
                                isConfirmation={false}
                            >
                                <div>
                                    <ScreenTabButton lucideIcon={Plus} text={labels.addReturn} />
                                </div>
                            </PermissionGuard>
                            <PermissionGuard 
                                execute={() => setApprovalModal(true)} 
                                permission="orderReturns.approve" 
                                isConfirmation={false}
                            >
                                <div>
                                    <ScreenTabButton lucideIcon={CheckCircle} text="Approve Returns" />
                                </div>
                            </PermissionGuard>
                        </div>
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
                                                {language === "en" ? "Return Number" : "ریٹرن نمبر"}
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Enter return number..."
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

            {/* ── Table section ── */}
            <div className="flex-1 overflow-hidden pb-6">
    <div className="h-full flex flex-col rounded-2xl border border-edge bg-(--surface) shadow-[0_14px_30px_rgba(64,45,28,0.1)] overflow-hidden">
                    {isLoading ? (
                        <LoadingState />
                    ) : returns.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <table className="w-full text-sm text-left">
                                <thead className="sticky top-0 z-10 bg-(--surface-muted)">
                                    <tr className="text-xs uppercase tracking-wider text-ink-subtle border-b border-edge">
                                        {TABLE_COLUMNS.map((col) => (
                                            <th key={col.key} className={`px-4 py-3 font-semibold ${colClass(col)}`}>
                                                {col.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {returns.map((returnItem) => (
                                        <ReturnRow
                                            key={returnItem._id}
                                            returnItem={returnItem}
                                            isExpanded={expandAll || expandedRows[returnItem._id]}
                                            onToggleExpand={() => setExpandedRows(prev => ({ ...prev, [returnItem._id]: !prev[returnItem._id] }))}
                                            onView={() => handleView(returnItem)}
                                            onEdit={() => handleEdit(returnItem)}
                                            onDelete={() => handleDelete(returnItem._id)}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!isLoading && pagination.totalPages > 1 && (
                        <PaginationBar pagination={pagination} onPageChange={handlePageChange} />
                    )}
                </div>
            </div>
        </div>
    );
};

// ---- Subcomponents ---------------------------------------------------------

function ReturnRow({ returnItem, isExpanded, onToggleExpand, onView, onEdit, onDelete }) {
    const refundStatusStyle = {
        pending: "bg-gray-100 text-gray-700",
        partial: "bg-yellow-100 text-yellow-700",
        fully_refunded: "bg-green-100 text-green-700",
    };
    const getRefundStatusLabel = (status) => {
        switch (status) {
            case 'pending': return 'Pending';
            case 'partial': return 'Partial';
            case 'fully_refunded': return 'Fully Refunded';
            default: return status;
        }
    };

    const isApproved = returnItem.returnStatus === 'approved';

    const items = returnItem?.items || [];

    return (
        <>
            <tr className="border-b border-edge transition-colors hover:bg-primary-hover">
                <td className="px-4 py-3 font-medium text-ink">{returnItem.returnNumber}</td>
                <td className="px-4 py-3 text-ink-subtle hidden sm:table-cell">
                    {returnItem.referenceOrderNumber}
                </td>
                <td className="px-4 py-3 text-ink hidden md:table-cell">
                    {returnItem.customerName || "—"}
                </td>
                <td className="px-4 py-3 text-ink-subtle text-center hidden sm:table-cell">
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
                <td className="px-4 py-3 text-right font-semibold text-primary">
                    Rs {(returnItem.totalRefundAmount || 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-green-600">
                    Rs {(returnItem.refundedAmount || 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-orange-600">
                    Rs {((returnItem.totalRefundAmount || 0) - (returnItem.refundedAmount || 0)).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${refundStatusStyle[returnItem.refundStatus] || refundStatusStyle.pending}`}>
                        {getRefundStatusLabel(returnItem.refundStatus)}
                    </span>
                </td>
                <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(returnItem.returnStatus)}`}>
                        {returnItem.returnStatus}
                    </span>
                </td>
                <td className="px-4 py-3 text-ink-subtle hidden md:table-cell">
                    {new Date(returnItem.returnDate || returnItem.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                    <div className="flex gap-1 justify-center">
                        <RowAction icon={Eye} title="View Details" onClick={onView} className="text-ink-subtle" />
                        {!isApproved && (
                            <PermissionGuard execute={onEdit} permission="orderReturns.update" isConfirmation={true}>
                                <RowAction icon={Edit} title="Edit" onClick={() => {}} className="text-primary" />
                            </PermissionGuard>
                        )}
                        <PermissionGuard execute={onDelete} permission="orderReturns.delete" isConfirmation={true}>
                            <RowAction icon={Trash2} title="Delete" onClick={() => {}} className="text-red-500" hoverBg="hover:bg-red-100" />
                        </PermissionGuard>
                    </div>
                </td>
            </tr>
            {/* Expandable item details row */}
            {isExpanded && items.length > 0 && (
                <tr className="bg-(--surface-muted)">
                    <td colSpan="11" className="px-4 py-3">
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

function RowAction({ icon: Icon, title, onClick, className, hoverBg = "hover:bg-primary-hover" }) {
    return (
        <button onClick={onClick} title={title} className={`p-2 rounded-lg transition-colors ${hoverBg}`}>
            <Icon className={`w-4 h-4 ${className}`} />
        </button>
    );
}

function LoadingState() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-ink-subtle">
            <div className="w-8 h-8 border-4 border-(--accent-2) border-t-transparent rounded-full animate-spin" />
            <p>Loading...</p>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-12">
            <div className="bg-(--surface-muted) w-14 h-14 rounded-full flex items-center justify-center">
                <PackageX className="w-7 h-7 text-ink-subtle" />
            </div>
            <p className="text-sm text-ink-subtle">No returns found.</p>
        </div>
    );
}

function PaginationBar({ pagination, onPageChange }) {
    const { page, limit, total, totalPages } = pagination;
    const rangeStart = (page - 1) * limit + 1;
    const rangeEnd = Math.min(page * limit, total);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-edge bg-(--surface-muted)">
            <p className="text-sm text-ink-subtle">
                Showing {rangeStart} to {rangeEnd} of {total} returns
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                    className="card-button disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Previous
                </button>
                <span className="px-3 py-1 text-sm text-ink">
                    Page {page} of {totalPages}
                </span>
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages}
                    className="card-button disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

export default OrderReturnList;

// ── Order Return Approval Modal ────────────────────────────────────────────
function OrderReturnApprovalModal({ onClose, onApprove, onDelete }) {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getOrderReturnLabels(language);
    
    const { data: pendingReturnsData, isLoading } = useGetPaginatedOrderReturnsQuery({ page: 1, limit: 20, status: "pending" });
    const pendingReturns = pendingReturnsData?.data ?? [];

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending': return labels.pending || 'Pending';
            case 'approved': return labels.approved || 'Approved';
            case 'rejected': return labels.rejected || 'Rejected';
            case 'completed': return labels.completed || 'Completed';
            default: return status;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">
                        Approve Order Return Requests
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>
                <div className="overflow-y-auto max-h-[65vh]">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : pendingReturns.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No pending requests
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl overflow-hidden border-edge">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="text-xs uppercase tracking-wider bg-surface-muted border-b border-edge text-ink-muted">
                                        <th className="px-4 py-3 font-semibold">Return #</th>
                                        <th className="px-4 py-3 font-semibold">Order #</th>
                                        <th className="px-4 py-3 font-semibold">Customer</th>
                                        <th className="px-4 py-3 font-semibold text-center">Items</th>
                                        <th className="px-4 py-3 font-semibold text-right">Refund</th>
                                        <th className="px-4 py-3 font-semibold text-center">Status</th>
                                        <th className="px-4 py-3 font-semibold">Date</th>
                                        <th className="px-4 py-3 font-semibold text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingReturns.map((ret) => (
                                        <tr key={ret._id} className="transition border-b border-edge hover:bg-surface-muted">
                                            <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">
                                                {ret?.returnNumber ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                                                {ret?.referenceOrderNumber ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-ink">
                                                {ret?.customerName ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 text-center text-ink">
                                                {ret?.items?.length ?? 0}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold tabular-nums text-primary">
                                                Rs {(ret?.totalRefundAmount ?? 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold capitalize ${STATUS_STYLES[ret?.returnStatus ?? "pending"] ?? DEFAULT_STATUS_STYLE}`}>
                                                    {getStatusLabel(ret?.returnStatus ?? "pending")}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-ink-muted">
                                                {new Date(ret?.returnDate ?? ret?.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => onApprove(ret._id)}
                                                        className="px-3 py-1 text-xs rounded-lg font-medium transition bg-primary-hover text-primary border border-edge-brand hover:bg-primary-hover/80 flex items-center gap-1"
                                                        title="Approve"
                                                    >
                                                        <Check className="w-3 h-3" />
                                                    </button>
                                                    <ConfirmDialog message={labels.deleteConfirm} onConfirm={() => onDelete(ret._id)}>
                                                        <button
                                                            className="px-3 py-1 text-xs rounded-lg font-medium transition bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 flex items-center gap-1"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </ConfirmDialog>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                {pendingReturnsData?.totalPages > 1 && (
                    <div className="p-4 border-t text-center text-xs text-ink-muted">
                        Showing {pendingReturns.length} of {pendingReturnsData.total} pending requests
                    </div>
                )}
            </div>
        </div>
    );
}



























// // ─── pages/OrderReturnList.jsx ────────────────────────────────────────────
// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { Plus, Eye, Trash2, ArrowLeft, Edit } from "lucide-react";
// import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
// import OrderReturnModal from "../components/OrderReturnModal.jsx";
// import PageHeading from "../../../shared/components/PageHeading.jsx";
// import { getPaginatedOrderReturns, deleteOrderReturn as deleteOrderReturnApi } from "../api/orderReturn.api.js";

// const OrderReturnList = () => {
//     const navigate = useNavigate();
//     const [showModal, setShowModal] = useState(false);
//     const [selectedReturn, setSelectedReturn] = useState(null);
//     const [isEditMode, setIsEditMode] = useState(false);
//     const [isViewMode, setIsViewMode] = useState(false);
//     const [returns, setReturns] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
//     const language = "en";

//     const fetchReturns = async (page = 1) => {
//         setLoading(true);
//         try {
//             const response = await getPaginatedOrderReturns({ page, limit: 10 });
//             setReturns(response.data || []);
//             setPagination({
//                 page: response.page || 1,
//                 limit: response.limit || 10,
//                 total: response.total || 0,
//                 totalPages: response.totalPages || 0,
//             });
//         } catch (error) {
//             showError(error?.response?.data?.message || "Failed to fetch returns");
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchReturns(1);
//     }, []);

//     const handleDelete = async (id) => {
//         if (window.confirm("Are you sure you want to delete this return?")) {
//             try {
//                 await deleteOrderReturnApi(id);
//                 showSuccess("Return deleted successfully");
//                 fetchReturns(pagination.page);
//             } catch (error) {
//                 showError(error?.response?.data?.message || "Failed to delete return");
//             }
//         }
//     };

//     const handleEdit = (returnItem) => {
//         setSelectedReturn(returnItem);
//         setIsEditMode(true);
//         setIsViewMode(false);
//         setShowModal(true);
//     };

//     const handleView = (returnItem) => {
//         setSelectedReturn(returnItem);
//         setIsEditMode(false);
//         setIsViewMode(true);
//         setShowModal(true);
//     };

//     const handleModalClose = () => {
//         setShowModal(false);
//         setSelectedReturn(null);
//         setIsEditMode(false);
//         setIsViewMode(false);
//         fetchReturns(pagination.page);
//     };

//     const handlePageChange = (newPage) => {
//         fetchReturns(newPage);
//     };

//     const getStatusColor = (status) => {
//         switch (status) {
//             case "pending": return "bg-yellow-100 text-yellow-700";
//             case "approved": return "bg-green-100 text-green-700";
//             case "rejected": return "bg-red-100 text-red-700";
//             case "completed": return "bg-blue-100 text-blue-700";
//             default: return "bg-gray-100 text-gray-700";
//         }
//     };

//     return (
//         <div className="h-screen flex flex-col bg-[var(--app-bg)]">
//             {showModal && (
//                 <OrderReturnModal
//                     isOpen={showModal}
//                     onClose={handleModalClose}
//                     editData={selectedReturn}
//                     isEditMode={isEditMode}
//                     isViewMode={isViewMode}
//                 />
//             )}

//             <div className="flex-none">
//                 <PageHeading
//                     heading="Order Returns"
//                     subheading="Manage all order returns"
//                 >
//                     <div className="flex gap-2">
//                         <button
//                             onClick={() => navigate(-1)}
//                             className="flex items-center gap-2 px-4 py-2 rounded-lg transition"
//                             style={{ background: "var(--surface-muted)", color: "var(--ink)", border: "1px solid var(--border)" }}
//                         >
//                             <ArrowLeft className="w-5 h-5" />
//                             Back
//                         </button>
//                         <button
//                             onClick={() => setShowModal(true)}
//                             className="flex items-center gap-2 px-4 py-2 rounded-lg transition"
//                             style={{ background: "var(--accent-2)", color: "white" }}
//                         >
//                             <Plus className="w-5 h-5" />
//                             New Return
//                         </button>
//                     </div>
//                 </PageHeading>
//             </div>

//             <div className="flex-1 overflow-hidden p-6">
//                 {loading ? (
//                     <div className="flex items-center justify-center h-full">
//                         <p className="text-[var(--muted)]">Loading...</p>
//                     </div>
//                 ) : (
//                     <>
//                         <div className="overflow-x-auto rounded-2xl overflow-hidden border border-[var(--border)]">
//                             <table className="w-full text-sm text-left bg-[var(--surface)]">
//                                 <thead>
//                                     <tr className="text-xs uppercase tracking-wider bg-[var(--app-bg)] border-b border-[var(--border)] text-[var(--muted)]">
//                                         <th className="px-4 py-3 font-semibold">Return #</th>
//                                         <th className="px-4 py-3 font-semibold">Order #</th>
//                                         <th className="px-4 py-3 font-semibold">Customer</th>
//                                         <th className="px-4 py-3 font-semibold text-center">Items</th>
//                                         <th className="px-4 py-3 font-semibold text-right">Refund</th>
//                                         <th className="px-4 py-3 font-semibold text-center">Status</th>
//                                         <th className="px-4 py-3 font-semibold">Date</th>
//                                         <th className="px-4 py-3 font-semibold text-center">Actions</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {returns.map((returnItem) => (
//                                         <tr key={returnItem._id} className="transition border-b border-[var(--border)] hover:bg-[var(--app-bg)]">
//                                             <td className="px-4 py-3 font-medium text-[var(--ink)]">
//                                                 {returnItem.returnNumber}
//                                             </td>
//                                             <td className="px-4 py-3 text-sm text-[var(--muted)]">
//                                                 {returnItem.referenceOrderNumber}
//                                             </td>
//                                             <td className="px-4 py-3 text-sm text-[var(--ink)]">
//                                                 {returnItem.customerName || "-"}
//                                             </td>
//                                             <td className="px-4 py-3 text-sm text-center text-[var(--muted)]">
//                                                 {returnItem.items?.length || 0}
//                                             </td>
//                                             <td className="px-4 py-3 text-sm font-medium text-right text-[var(--accent-2)]">
//                                                 ${returnItem.totalRefundAmount?.toFixed(2) || "0.00"}
//                                             </td>
//                                             <td className="px-4 py-3">
//                                                 <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(returnItem.returnStatus)}`}>
//                                                     {returnItem.returnStatus}
//                                                 </span>
//                                             </td>
//                                             <td className="px-4 py-3 text-sm text-[var(--muted)]">
//                                                 {new Date(returnItem.returnDate || returnItem.createdAt).toLocaleDateString()}
//                                             </td>
//                                             <td className="px-4 py-3">
//                                                 <div className="flex gap-2 justify-center">
//                                                     <button
//                                                         onClick={() => handleView(returnItem)}
//                                                         className="p-2 hover:bg-[var(--app-bg)] rounded-lg transition-colors"
//                                                         title="View Details"
//                                                     >
//                                                         <Eye className="w-4 h-4 text-[var(--muted)]" />
//                                                     </button>
//                                                     <button
//                                                         onClick={() => handleEdit(returnItem)}
//                                                         className="p-2 hover:bg-[var(--app-bg)] rounded-lg transition-colors"
//                                                         title="Edit"
//                                                     >
//                                                         <Edit className="w-4 h-4 text-[var(--accent-2)]" />
//                                                     </button>
//                                                     <button
//                                                         onClick={() => handleDelete(returnItem._id)}
//                                                         className="p-2 hover:bg-red-100 rounded-lg transition-colors"
//                                                         title="Delete"
//                                                     >
//                                                         <Trash2 className="w-4 h-4 text-red-500" />
//                                                     </button>
//                                                 </div>
//                                             </td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         </div>

//                         {returns.length === 0 && (
//                             <p className="text-center py-12 text-sm text-[var(--muted)]">
//                                 No returns found.
//                             </p>
//                         )}

//                         {pagination.totalPages > 1 && (
//                             <div className="flex items-center justify-between mt-4">
//                                 <p className="text-sm text-[var(--muted)]">
//                                     Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} returns
//                                 </p>
//                                 <div className="flex gap-2">
//                                     <button
//                                         onClick={() => handlePageChange(pagination.page - 1)}
//                                         disabled={pagination.page === 1}
//                                         className="px-3 py-1 rounded border border-[var(--border)] disabled:opacity-50 hover:bg-[var(--app-bg)]"
//                                     >
//                                         Previous
//                                     </button>
//                                     <span className="px-3 py-1 text-[var(--ink)]">
//                                         Page {pagination.page} of {pagination.totalPages}
//                                     </span>
//                                     <button
//                                         onClick={() => handlePageChange(pagination.page + 1)}
//                                         disabled={pagination.page === pagination.totalPages}
//                                         className="px-3 py-1 rounded border border-[var(--border)] disabled:opacity-50 hover:bg-[var(--app-bg)]"
//                                     >
//                                         Next
//                                     </button>
//                                 </div>
//                             </div>
//                         )}
//                     </>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default OrderReturnList;
// src/modules/productPurchases/pages/ProductPurchase.jsx
import { useState, useRef } from "react";
import { Plus, Check, X, DollarSign, Eye, Copy, RotateCcw, Edit, Trash2 } from "lucide-react";
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

    const listRef = useRef(null);

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
                />
            </div>

            {/* ── list ── */}
            <PaginatedList
                ref={listRef}
                rtkQuery={usePurchases}
                limit={20}
                dataKey="data"
                wrapperClassName="flex-1"
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

function PurchaseRow({ purchase, onEdit, onDelete, onStatusUpdate, onPayment, onReturn, onView }) {
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

    return (
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
                <div className="text-sm font-medium">{purchase?.items?.length ?? 0}</div>
                {/* {purchase?.items?.length > 0 && (
                    <div className="text-xs text-[var(--muted)] max-w-[150px] truncate" title={purchase.items.map(i => i.name || i.product?.name || i.productName || String(i.product)).join(', ')}>
                        {purchase.items.slice(0, 2).map((item, idx) => (
                            <span key={idx}>{item.name || item.product?.name || item.productName || String(item.product)}</span>
                        )).join(', ')}
                        {purchase.items.length > 2 && '...'}
                    </div>
                )} */}
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
    );
}


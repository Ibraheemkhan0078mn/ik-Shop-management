// src/modules/productPurchases/pages/ProductPurchase.jsx
import { useState, useRef } from "react";
import { Plus, Printer, Download, Check, X, DollarSign } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useDeletePurchase, usePurchases, useUpdatePurchaseStatus } from "../services/purchases.service.js";
import { getPurchaseLabels } from "../labels/purchaseLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import PurchaseModal from "../components/PurchaseModal.jsx";
import ViewPurchaseDetail from "../components/ViewPurchaseDetail.jsx";
import PurchasePaymentModal from "../components/PurchasePaymentModal.jsx";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";

export default function ProductPurchasePage() {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getPurchaseLabels(language);
    
    const navigate         = useNavigate();
    const [deletePurchase] = useDeletePurchase();
    const [updateStatus] = useUpdatePurchaseStatus();

    const [modal,        setModal]        = useState(null);
    const [viewPurchase, setViewPurchase] = useState(null);
    const [paymentModal, setPaymentModal] = useState(null);

    const listRef = useRef(null);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm(labels.deleteConfirm)) return;
        try {
            await deletePurchase(id).unwrap();
            showSuccess(labels.purchaseDeleted);
        } catch (error) {
            showError(error?.data?.message || labels.failedToDelete);
        }
    };

    const handleStatusUpdate = async (id, status, e) => {
        e.stopPropagation();
        if (!window.confirm(`${labels.deleteConfirm} ${status}?`)) return;
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
            {viewPurchase && (
                <ViewPurchaseDetail
                    purchase={viewPurchase}
                    language={language}
                    onClose={() => setViewPurchase(null)}
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

            <div className="flex-none">
                <PageHeading
                    heading={labels.purchaseManagement}
                    subheading={labels.managePurchases}
                    leftActions={
                        <div onClick={() => setModal({ mode: "create" })}>
                            <ScreenTabButton lucideIcon={Plus} text={labels.addPurchase} />
                        </div>
                    }
                    rightActions={
                        <>
                            <button onClick={() => console.log("Print")} className="p-2 rounded-lg transition-all hover:bg-[var(--surface-muted)]" style={{ color: "var(--muted)" }}>
                                <Printer size={18} />
                            </button>
                            <button onClick={() => console.log("Export")} className="p-2 rounded-lg transition-all hover:bg-[var(--surface-muted)]" style={{ color: "var(--muted)" }}>
                                <Download size={18} />
                            </button>
                        </>
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

                                    <th className="px-4 py-3 font-semibold">Invoice</th>
                                    <th className="px-4 py-3 font-semibold text-center">Items</th>
                                    <th className="px-4 py-3 font-semibold text-right">Total</th>
                                    <th className="px-4 py-3 font-semibold">Date</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold">Payment</th>
                                    <th className="px-4 py-3 font-semibold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchases.map(p => (
                                    <PurchaseRow
                                        key={p._id}
                                        purchase={p}
                                        onView={() => setViewPurchase(p)}
                                        onEdit={e => { e.stopPropagation(); setModal({ mode: "update", id: p._id }); }}
                                        onDelete={e => handleDelete(p._id, e)}
                                        onStatusUpdate={handleStatusUpdate}
                                        onPayment={() => setPaymentModal(p)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                renderEmpty={() => (
                    <p className="text-center py-12 text-sm text-ink-muted">
                        No purchases found.
                    </p>
                )}
            />
        </div>
    );
}

function PurchaseRow({ purchase, onView, onEdit, onDelete, onStatusUpdate, onPayment }) {
    const purchaseId = purchase?._id ?? "";
    const dateStr = purchase?.date ?? purchase?.createdAt ?? "";
    const date = dateStr ? new Date(dateStr).toLocaleDateString() : "—";
    const status = purchase?.status ?? 'ordered';
    const paymentStatus = purchase?.paymentStatus ?? 'pending';

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

    return (
        <tr className="cursor-pointer transition border-b border-edge hover:bg-surface-muted"
            onClick={onView}>

            <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                {purchase?.invoiceNumber ?? "—"}
            </td>
            <td className="px-4 py-3 text-center text-ink">
                {purchase?.items?.length ?? 0}
            </td>
            <td className="px-4 py-3 text-right font-semibold tabular-nums text-primary">
                Rs {(purchase?.totalAmount ?? 0).toLocaleString()}
            </td>
            <td className="px-4 py-3 text-ink-muted">{date}</td>
            <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(status)}`}>
                    {status}
                </span>
            </td>
            <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getPaymentStatusColor(paymentStatus)}`}>
                    {paymentStatus}
                </span>
            </td>
            <td className="px-4 py-3">
                <div className="flex justify-center gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                    {status === 'ordered' && (
                        <>
                            <button 
                                onClick={e => onStatusUpdate(purchaseId, 'delivered', e)}
                                className="px-3 py-1 text-xs rounded-lg font-medium transition bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Delivered
                            </button>
                            <button 
                                onClick={e => onStatusUpdate(purchaseId, 'rejected', e)}
                                className="px-3 py-1 text-xs rounded-lg font-medium transition bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 flex items-center gap-1">
                                <X className="w-3 h-3" />
                                Rejected
                            </button>
                        </>
                    )}
                    {status === 'delivered' && paymentStatus !== 'full' && (
                        <button 
                            onClick={onPayment}
                            className="px-3 py-1 text-xs rounded-lg font-medium transition bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                                Pay
                            </button>
                    )}
                    <button onClick={onEdit}
                        className="px-3 py-1 text-xs rounded-lg font-medium transition bg-primary-hover text-primary border border-edge-brand hover:bg-primary-hover/80">
                        Edit
                    </button>
                    <button onClick={onDelete}
                        className="px-3 py-1 text-xs rounded-lg font-medium transition bg-red-50 text-red-500 border border-red-200 hover:bg-red-100">
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    );
}


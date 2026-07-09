// src/modules/purchaseReturn/pages/PurchaseReturnPage.jsx
import { useCallback, useEffect, useState } from "react";
import { Plus, CheckCircle, Printer, Download } from "lucide-react";
import { useSelector } from "react-redux";
import { getPurchaseReturnLabels } from "../labels/purchaseReturnLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import PaginatedList, { usePaginatedFetch } from "../../../shared/components/PaginatedList.jsx";
import PurchaseReturnModal from "../components/PurchaseReturnModal.jsx";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import { deletePurchaseReturnApi, getPaginatedPurchaseReturnsApi, approvePurchaseReturnApi } from "../api/purchaseReturnApi.js";
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";

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
    
    const [modal, setModal] = useState(null);
    const [approvalModal, setApprovalModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

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

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm(labels.deleteConfirm)) return;
        try {
            await deletePurchaseReturnApi(id);
            showSuccess(labels.returnDeleted);
            setRefreshKey((v) => v + 1);
        } catch (error) {
            showError(error?.response?.data?.message || error?.message || labels.failedToDelete);
        }
    };

    const handleApprove = async (id) => {
        try {
            await approvePurchaseReturnApi(id);
            showSuccess(labels.returnApproved);
            setRefreshKey((v) => v + 1);
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
                        <div onClick={() => setModal({ mode: "create" })}>
                            <ScreenTabButton lucideIcon={Plus} text={labels.addReturn} />
                        </div>
                        <div onClick={() => setApprovalModal(true)}>
                            <ScreenTabButton lucideIcon={CheckCircle} text={labels.approveReturn} />
                        </div>
                    </>
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

                <PaginatedList
                    rtkQuery={usePurchaseReturnsQuery}
                    limit={20}
                    dataKey="data"
                    wrapperClassName="min-h-0"
                    renderItems={(purchaseReturns) => (
                        <div className="overflow-x-auto rounded-2xl overflow-hidden border-edge">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="text-xs uppercase tracking-wider bg-surface-muted border-b border-edge text-ink-muted">
                                        <th className="px-4 py-3 font-semibold">Return #</th>
                                        <th className="px-4 py-3 font-semibold">Purchase Invoice</th>
                                        <th className="px-4 py-3 font-semibold">Supplier</th>
                                        <th className="px-4 py-3 font-semibold text-center">Items</th>
                                        <th className="px-4 py-3 font-semibold text-right">Refund</th>
                                        <th className="px-4 py-3 font-semibold text-center">Status</th>
                                        <th className="px-4 py-3 font-semibold">Date</th>
                                        <th className="px-4 py-3 font-semibold text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchaseReturns.map((pr) => (
                                        <PurchaseReturnRow
                                            key={pr._id}
                                            purchaseReturn={pr}
                                            onEdit={(e) => {
                                                e.stopPropagation();
                                                setModal({ mode: "update", id: pr._id });
                                            }}
                                            onDelete={(e) => handleDelete(pr._id, e)}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    renderEmpty={() => (
                        <p className="text-center py-12 text-sm text-ink-muted">
                            No purchase returns found.
                        </p>
                    )}
                />
        </div>
    );
}

function PurchaseReturnRow({ purchaseReturn, onEdit, onDelete }) {
    const date = new Date(purchaseReturn?.returnDate ?? purchaseReturn?.createdAt).toLocaleDateString();
    const status = purchaseReturn?.status ?? "draft";
    const statusClass = STATUS_CLASS[status] ?? STATUS_CLASS.draft;

    return (
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
                {purchaseReturn?.totalItems ?? purchaseReturn?.items?.length ?? 0}
            </td>
            <td className="px-4 py-3 text-right font-semibold tabular-nums text-primary">
                Rs {(purchaseReturn?.totalRefundAmount ?? 0).toLocaleString()}
            </td>
            <td className="px-4 py-3 text-center">
                <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold capitalize ${statusClass}`}>
                    {status}
                </span>
            </td>
            <td className="px-4 py-3 text-xs text-ink-muted">
                {date}
            </td>
            <td className="px-4 py-3">
                <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={onEdit}
                        className="px-3 py-1 text-xs rounded-lg font-medium transition bg-primary-hover text-primary border border-edge-brand hover:bg-primary-hover/80"
                    >
                        Edit
                    </button>
                    <button
                        onClick={onDelete}
                        className="px-3 py-1 text-xs rounded-lg font-medium transition bg-red-50 text-red-500 border border-red-200 hover:bg-red-100"
                    >
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    );
}

function PurchaseReturnApprovalModal({ onClose, onApprove, onDelete }) {
    const language = useSelector((s) => s.auth?.user?.language ?? "en");
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">
                        {language === "en" ? "Approve Purchase Return Requests" : "خریداری واپسی کی درخواستیں منظور کریں"}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <div className="overflow-y-auto max-h-[65vh]">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : purchaseReturns.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            {language === "en" ? "No pending purchase return requests" : "زیر التواء خریداری واپسی کی درخواستیں نہیں"}
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl overflow-hidden border-edge">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="text-xs uppercase tracking-wider bg-surface-muted border-b border-edge text-ink-muted">
                                        <th className="px-4 py-3 font-semibold">Return #</th>
                                        <th className="px-4 py-3 font-semibold">Purchase Invoice</th>
                                        <th className="px-4 py-3 font-semibold">Supplier</th>
                                        <th className="px-4 py-3 font-semibold text-center">Items</th>
                                        <th className="px-4 py-3 font-semibold text-right">Refund</th>
                                        <th className="px-4 py-3 font-semibold text-center">Status</th>
                                        <th className="px-4 py-3 font-semibold">Date</th>
                                        <th className="px-4 py-3 font-semibold text-center">Actions</th>
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
                                                    {pr?.status ?? "pending"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-ink-muted">
                                                {new Date(pr?.returnDate ?? pr?.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => onApprove(pr._id)}
                                                        className="px-3 py-1 text-xs rounded-lg font-medium transition bg-primary-hover text-primary border border-edge-brand hover:bg-primary-hover/80"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={(e) => onDelete(pr._id, e)}
                                                        className="px-3 py-1 text-xs rounded-lg font-medium transition bg-red-50 text-red-500 border border-red-200 hover:bg-red-100"
                                                    >
                                                        Delete
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
                        Showing {purchaseReturns.length} of {data.total} pending requests
                    </div>
                )}
            </div>
        </div>
    );
}

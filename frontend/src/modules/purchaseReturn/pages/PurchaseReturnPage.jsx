// src/modules/purchaseReturn/pages/PurchaseReturnPage.jsx
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useSelector } from "react-redux";
import PaginatedList, { usePaginatedFetch } from "../../../shared/components/PaginatedList.jsx";
import PurchaseReturnModal from "../components/PurchaseReturnModal.jsx";
import { deletePurchaseReturnApi, getPaginatedPurchaseReturnsApi } from "../api/purchaseReturnApi.js";

const STATUS_CLASS = {
    draft: "bg-gray-100 text-gray-600",
    pending: "bg-amber-100 text-amber-600",
    approved: "bg-primary-hover text-primary",
    rejected: "bg-red-100 text-red-600",
};

export default function PurchaseReturnPage() {
    const language = useSelector((s) => s.auth?.user?.language ?? "en");
    const [modal, setModal] = useState(null);
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
        if (!window.confirm("Delete this purchase return?")) return;
        await deletePurchaseReturnApi(id);
        setRefreshKey((v) => v + 1);
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

            <div className="flex flex-wrap items-center gap-3 mb-4">
                <button className="btn-add" onClick={() => setModal({ mode: "create" })}>
                    <Plus className="w-4 h-4" />
                    {language === "en" ? "Add Purchase Return" : "خریداری واپسی شامل کریں"}
                </button>
            </div>

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
                    {status === "draft" && (
                        <>
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
                        </>
                    )}
                    {status === "pending" && (
                        <span className="text-xs text-ink-muted">
                            Pending Approval
                        </span>
                    )}
                    {status !== "draft" && status !== "pending" && (
                        <span className="text-xs text-ink-muted">
                            —
                        </span>
                    )}
                </div>
            </td>
        </tr>
    );
}


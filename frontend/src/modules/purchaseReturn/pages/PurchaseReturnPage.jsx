// src/modules/purchaseReturn/pages/PurchaseReturnPage.jsx
import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { useSelector } from "react-redux";
import { useDeletePurchaseReturnMutation } from "../services/purchaseReturn.service.js";
import PaginatedList from "@shared/components/PaginatedList.jsx";
import PurchaseReturnModal from "../components/PurchaseReturnModal.jsx";

const STATUS_STYLE = {
    draft: { background: "rgba(107,114,128,0.1)", color: "#6b7280" },
    pending: { background: "rgba(180,83,9,0.1)", color: "var(--accent)" },
    approved: { background: "rgba(15,118,110,0.1)", color: "var(--accent-2)" },
    rejected: { background: "rgba(220,38,38,0.1)", color: "#dc2626" },
};

export default function PurchaseReturnPage() {
    const language = useSelector((s) => s.auth?.user?.language ?? "en");
    const [deletePurchaseReturn] = useDeletePurchaseReturnMutation();

    const [modal, setModal] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this purchase return?")) return;
        await deletePurchaseReturn(id);
        refresh();
    };

    return (
        <div>
            {modal && (
                <PurchaseReturnModal
                    mode={modal.mode}
                    purchaseReturnId={modal.id}
                    onClose={() => setModal(null)}
                    onSuccess={refresh}
                />
            )}

            <div className="flex flex-wrap items-center gap-3 mb-4">
                <button className="btn-add" onClick={() => setModal({ mode: "create" })}>
                    <Plus className="w-4 h-4" />
                    {language === "en" ? "Add Purchase Return" : "خریداری واپسی شامل کریں"}
                </button>
            </div>

            <PaginatedList
                key={refreshKey}
                endpoint="/purchase-returns/paginate"
                limit={20}
                dataKey="data"
                wrapperClassName="min-h-0"
                renderItems={(purchaseReturns) => (
                    <div
                        className="overflow-x-auto rounded-2xl overflow-hidden"
                        style={{ border: "1px solid var(--border)" }}
                    >
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr
                                    className="text-xs uppercase tracking-wider"
                                    style={{
                                        background: "var(--surface-muted)",
                                        borderBottom: "1px solid var(--border)",
                                        color: "var(--muted)",
                                    }}
                                >
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
                    <p className="text-center py-12 text-sm" style={{ color: "var(--muted)" }}>
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
    const style = STATUS_STYLE[status] ?? STATUS_STYLE.draft;

    return (
        <tr
            className="transition"
            style={{ borderBottom: "1px solid var(--border)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-muted)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
            <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: "var(--accent-2)" }}>
                {purchaseReturn?.purchaseReturnNumber ?? "—"}
            </td>
            <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--muted)" }}>
                {purchaseReturn?.purchase?.invoiceNumber ?? "—"}
            </td>
            <td className="px-4 py-3 text-xs" style={{ color: "var(--ink)" }}>
                {purchaseReturn?.supplier?.name ?? "—"}
            </td>
            <td className="px-4 py-3 text-center" style={{ color: "var(--ink)" }}>
                {purchaseReturn?.totalItems ?? purchaseReturn?.items?.length ?? 0}
            </td>
            <td className="px-4 py-3 text-right font-semibold tabular-nums" style={{ color: "var(--accent-2)" }}>
                Rs {(purchaseReturn?.totalRefundAmount ?? 0).toLocaleString()}
            </td>
            <td className="px-4 py-3 text-center">
                <span className="px-2 py-0.5 rounded-lg text-xs font-semibold capitalize" style={style}>
                    {status}
                </span>
            </td>
            <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>
                {date}
            </td>
            <td className="px-4 py-3">
                <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {status === "draft" && (
                        <>
                            <button
                                onClick={onEdit}
                                className="px-3 py-1 text-xs rounded-lg font-medium transition"
                                style={{
                                    background: "rgba(15,118,110,0.08)",
                                    color: "var(--accent-2)",
                                    border: "1px solid rgba(15,118,110,0.2)",
                                }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.background = "rgba(15,118,110,0.15)")
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.background = "rgba(15,118,110,0.08)")
                                }
                            >
                                Edit
                            </button>
                            <button
                                onClick={onDelete}
                                className="px-3 py-1 text-xs rounded-lg font-medium transition"
                                style={{
                                    background: "rgba(220,38,38,0.06)",
                                    color: "#dc2626",
                                    border: "1px solid rgba(220,38,38,0.15)",
                                }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.background = "rgba(220,38,38,0.12)")
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.background = "rgba(220,38,38,0.06)")
                                }
                            >
                                Delete
                            </button>
                        </>
                    )}
                    {status === "pending" && (
                        <span className="text-xs" style={{ color: "var(--muted)" }}>
                            Pending Approval
                        </span>
                    )}
                    {status !== "draft" && status !== "pending" && (
                        <span className="text-xs" style={{ color: "var(--muted)" }}>
                            —
                        </span>
                    )}
                </div>
            </td>
        </tr>
    );
}


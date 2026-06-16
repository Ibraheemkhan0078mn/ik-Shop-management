// src/modules/wastage/pages/WastagePage.jsx
import { useState, useCallback }   from "react";
import { Plus }                    from "lucide-react";
import { useSelector }             from "react-redux";
import { useDeleteWastage }        from "../services/wastage.service.js";
import PaginatedList               from "../../../components/common/PaginatedList.jsx";
import WastageModal                from "../components/WastageModal.jsx";

const STATUS_STYLE = {
    draft:    { background: "rgba(107,114,128,0.1)", color: "#6b7280"  },
    pending:  { background: "rgba(180,83,9,0.1)",    color: "var(--accent)"   },
    approved: { background: "rgba(15,118,110,0.1)",  color: "var(--accent-2)" },
    rejected: { background: "rgba(220,38,38,0.1)",   color: "#dc2626"  },
};

export default function WastagePage() {
    const language        = useSelector(s => s.auth?.user?.language ?? "en");
    const [deleteWastage] = useDeleteWastage();

    const [modal,      setModal]      = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this wastage record?")) return;
        await deleteWastage(id);
        refresh();
    };

    return (
        <div>
            {modal && (
                <WastageModal
                    mode={modal.mode}
                    wastageId={modal.id}
                    onClose={() => setModal(null)}
                    onSuccess={refresh}
                />
            )}

            <div className="flex flex-wrap items-center gap-3 mb-4">
                <button className="btn-add" onClick={() => setModal({ mode: "create" })}>
                    <Plus className="w-4 h-4" />
                    {language === "en" ? "Add Wastage" : "ضیاع شامل کریں"}
                </button>
            </div>

            <PaginatedList
                key={refreshKey}
                endpoint="/wastages/paginate"
                limit={20}
                dataKey="data"
                wrapperClassName="min-h-0"
                renderItems={(wastages) => (
                    <div className="overflow-x-auto rounded-2xl overflow-hidden"
                        style={{ border: "1px solid var(--border)" }}>
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="text-xs uppercase tracking-wider"
                                    style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
                                    <th className="px-4 py-3 font-semibold">Wastage #</th>
                                    <th className="px-4 py-3 font-semibold">Reason</th>
                                    <th className="px-4 py-3 font-semibold text-center">Items</th>
                                    <th className="px-4 py-3 font-semibold text-center">Total Qty</th>
                                    <th className="px-4 py-3 font-semibold text-right">Total Loss</th>
                                    <th className="px-4 py-3 font-semibold text-center">Status</th>
                                    <th className="px-4 py-3 font-semibold">Date</th>
                                    <th className="px-4 py-3 font-semibold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {wastages.map(w => (
                                    <WastageRow
                                        key={w._id}
                                        wastage={w}
                                        onEdit={e => { e.stopPropagation(); setModal({ mode: "update", id: w._id }); }}
                                        onDelete={e => handleDelete(w._id, e)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                renderEmpty={() => (
                    <p className="text-center py-12 text-sm" style={{ color: "var(--muted)" }}>
                        No wastage records found.
                    </p>
                )}
            />
        </div>
    );
}

function WastageRow({ wastage, onEdit, onDelete }) {
    const date   = new Date(wastage?.wastageDate ?? wastage?.createdAt).toLocaleDateString();
    const status = wastage?.status ?? "draft";
    const style  = STATUS_STYLE[status] ?? STATUS_STYLE.draft;

    return (
        <tr className="transition" style={{ borderBottom: "1px solid var(--border)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--surface-muted)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

            <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: "var(--accent)" }}>
                {wastage?.wastageNumber ?? "—"}
            </td>
            <td className="px-4 py-3 text-xs capitalize" style={{ color: "var(--ink)" }}>
                {wastage?.reason?.replace(/_/g, " ") ?? "—"}
            </td>
            <td className="px-4 py-3 text-center" style={{ color: "var(--ink)" }}>
                {wastage?.totalItems ?? wastage?.items?.length ?? 0}
            </td>
            <td className="px-4 py-3 text-center tabular-nums" style={{ color: "var(--ink)" }}>
                {wastage?.totalQuantity ?? 0}
            </td>
            <td className="px-4 py-3 text-right font-semibold tabular-nums" style={{ color: "var(--accent)" }}>
                Rs {(wastage?.totalLossAmount ?? 0).toLocaleString()}
            </td>
            <td className="px-4 py-3 text-center">
                <span className="px-2 py-0.5 rounded-lg text-xs font-semibold capitalize" style={style}>
                    {status}
                </span>
            </td>
            <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>{date}</td>
            <td className="px-4 py-3">
                <div className="flex justify-center gap-2" onClick={e => e.stopPropagation()}>
                    {status === "draft" && (
                        <>
                            <button onClick={onEdit}
                                className="px-3 py-1 text-xs rounded-lg font-medium transition"
                                style={{ background: "rgba(15,118,110,0.08)", color: "var(--accent-2)", border: "1px solid rgba(15,118,110,0.2)" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(15,118,110,0.15)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(15,118,110,0.08)"}>
                                Edit
                            </button>
                            <button onClick={onDelete}
                                className="px-3 py-1 text-xs rounded-lg font-medium transition"
                                style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.15)" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(220,38,38,0.12)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(220,38,38,0.06)"}>
                                Delete
                            </button>
                        </>
                    )}
                    {status !== "draft" && (
                        <span className="text-xs" style={{ color: "var(--muted)" }}>—</span>
                    )}
                </div>
            </td>
        </tr>
    );
}

// src/modules/wastage/pages/WastagePage.jsx
import { useState }   from "react";
import { Plus, CheckCircle }          from "lucide-react";
import { useSelector }             from "react-redux";
import { useDeleteWastage, useWastages, useApproveWastage } from "../services/wastage.service.js";
import PaginatedList               from "../../../shared/components/PaginatedList.jsx";
import WastageModal                from "../components/WastageModal.jsx";
import PageHeading                 from "../../../shared/components/PageHeading.jsx";
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";

const STATUS_STYLE = {
    draft:    { background: "rgba(107,114,128,0.1)", color: "#6b7280"  },
    pending:  { background: "rgba(180,83,9,0.1)",    color: "var(--accent)"   },
    approved: { background: "rgba(15,118,110,0.1)",  color: "var(--accent-2)" },
    rejected: { background: "rgba(220,38,38,0.1)",   color: "#dc2626"  },
};

export default function WastagePage() {
    const language        = useSelector(s => s.auth?.user?.language ?? "en");
    const [deleteWastage] = useDeleteWastage();
    const [approveWastage] = useApproveWastage();

    const [modal,      setModal]      = useState(null);
    const [approvalModal, setApprovalModal] = useState(false);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this wastage record?")) return;
        try {
            await deleteWastage(id).unwrap();
            showSuccess("Wastage record deleted successfully");
        } catch (error) {
            showError(error?.data?.message || "Failed to delete wastage record");
        }
    };

    const handleApprove = async (id) => {
        try {
            await approveWastage(id).unwrap();
            showSuccess("Wastage approved successfully");
        } catch (error) {
            showError(error?.data?.message || "Failed to approve wastage");
        }
    };

    return (
        <div className="h-screen flex flex-col">
            {modal && (
                <WastageModal
                    mode={modal.mode}
                    wastageId={modal.id}
                    onClose={() => setModal(null)}
                />
            )}

            {approvalModal && (
                <WastageApprovalModal
                    onClose={() => setApprovalModal(false)}
                    onApprove={handleApprove}
                    onDelete={handleDelete}
                />
            )}

            <div className="flex-none">
                <PageHeading
                    heading={language === "en" ? "Wastage" : "ضیاع"}
                    subheading={language === "en" ? "Manage wastage records" : "ضیاع ریکارڈز کا انتظام کریں"}
                >
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                        <button className="btn-add" onClick={() => setModal({ mode: "create" })}>
                            <Plus className="w-4 h-4" />
                            {language === "en" ? "Add Wastage" : "ضیاع شامل کریں"}
                        </button>
                        <button
                            onClick={() => setApprovalModal(true)}
                            className="px-4 py-2 text-sm rounded-lg font-medium transition flex items-center gap-2"
                            style={{ background: "rgba(15,118,110,0.08)", color: "var(--accent-2)", border: "1px solid rgba(15,118,110,0.2)" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(15,118,110,0.15)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(15,118,110,0.08)"}>
                            <CheckCircle className="w-4 h-4" />
                            {language === "en" ? "Approve Wastage" : "ضیاع منظور کریں"}
                        </button>
                    </div>
                </PageHeading>
            </div>

            <PaginatedList
                rtkQuery={useWastages}
                limit={20}
                dataKey="data"
                wrapperClassName="flex-1"
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
                </div>
            </td>
        </tr>
    );
}

function WastageApprovalModal({ onClose, onApprove, onDelete }) {
    const language = useSelector(s => s.auth?.user?.language ?? "en");
    const { data, isLoading } = useWastages({ status: "pending", page: 1, limit: 20 });

    const wastages = data?.data ?? [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">
                        {language === "en" ? "Approve Wastage Requests" : "ضیاع کی درخواستیں منظور کریں"}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <div className="overflow-y-auto max-h-[65vh]">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : wastages.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            {language === "en" ? "No pending wastage requests" : "زیر التواء ضیاع کی درخواستیں نہیں"}
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
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
                                        <tr key={w._id} className="transition" style={{ borderBottom: "1px solid var(--border)" }}
                                            onMouseEnter={e => e.currentTarget.style.background = "var(--surface-muted)"}
                                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                            <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: "var(--accent)" }}>
                                                {w?.wastageNumber ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 text-xs capitalize" style={{ color: "var(--ink)" }}>
                                                {w?.reason?.replace(/_/g, " ") ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 text-center" style={{ color: "var(--ink)" }}>
                                                {w?.totalItems ?? w?.items?.length ?? 0}
                                            </td>
                                            <td className="px-4 py-3 text-center tabular-nums" style={{ color: "var(--ink)" }}>
                                                {w?.totalQuantity ?? 0}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold tabular-nums" style={{ color: "var(--accent)" }}>
                                                Rs {(w?.totalLossAmount ?? 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="px-2 py-0.5 rounded-lg text-xs font-semibold capitalize"
                                                    style={STATUS_STYLE[w?.status ?? "pending"]}>
                                                    {w?.status ?? "pending"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>
                                                {new Date(w?.wastageDate ?? w?.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center gap-2" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => onApprove(w._id)}
                                                        className="px-3 py-1 text-xs rounded-lg font-medium transition"
                                                        style={{ background: "rgba(15,118,110,0.08)", color: "var(--accent-2)", border: "1px solid rgba(15,118,110,0.2)" }}
                                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(15,118,110,0.15)"}
                                                        onMouseLeave={e => e.currentTarget.style.background = "rgba(15,118,110,0.08)"}>
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={e => onDelete(w._id, e)}
                                                        className="px-3 py-1 text-xs rounded-lg font-medium transition"
                                                        style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.15)" }}
                                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(220,38,38,0.12)"}
                                                        onMouseLeave={e => e.currentTarget.style.background = "rgba(220,38,38,0.06)"}>
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
                    <div className="p-4 border-t text-center text-xs" style={{ color: "var(--muted)" }}>
                        Showing {wastages.length} of {data.total} pending requests
                    </div>
                )}
            </div>
        </div>
    );
}

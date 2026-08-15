// src/modules/wastage/pages/WastagePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, CheckCircle, X, Edit, Trash2, Filter, Eye } from "lucide-react";
import { useDeleteWastage, useWastages, useApproveWastage } from "../services/wastage.service.js";
import { getWastageLabels } from "../labels/wastageLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import WastageModal from "../components/WastageModal.jsx";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";

const STATUS_STYLE = {
    draft:    { background: "rgba(107,114,128,0.1)", color: "#6b7280"  },
    pending:  { background: "rgba(180,83,9,0.1)",    color: "var(--accent)"   },
    approved: { background: "rgba(15,118,110,0.1)",  color: "var(--accent-2)" },
    rejected: { background: "rgba(220,38,38,0.1)",   color: "#dc2626"  },
};

export default function WastagePage() {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getWastageLabels(language);
    
    const [deleteWastage] = useDeleteWastage();
    const [approveWastage] = useApproveWastage();

    const [modal,      setModal]      = useState(null);
    const [approvalModal, setApprovalModal] = useState(false);
    const [filterId, setFilterId] = useState("");
    const [debouncedFilterId, setDebouncedFilterId] = useState("");
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

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
            await deleteWastage(id).unwrap();
            showSuccess(labels.wastageDeleted);
        } catch (error) {
            showError(error?.data?.message || labels.failedToDelete);
        }
    };

    const handleApprove = async (id) => {
        try {
            await approveWastage(id).unwrap();
            showSuccess(labels.wastageApproved);
        } catch (error) {
            showError(error?.data?.message || labels.failedToApprove);
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
                    heading={labels.wastageManagement}
                    subheading={labels.manageWastage}
                    leftActions={
                        <>
                            <PermissionGuard 
                                execute={() => setModal({ mode: "create" })} 
                                permission="wastage.create" 
                                isConfirmation={false}
                            >
                                <div>
                                    <ScreenTabButton lucideIcon={Plus} text={labels.addWastage} />
                                </div>
                            </PermissionGuard>
                            <PermissionGuard 
                                execute={() => setApprovalModal(true)} 
                                permission="wastage.approve" 
                                isConfirmation={false}
                            >
                                <div>
                                    <ScreenTabButton lucideIcon={CheckCircle} text={labels.approveWastage} />
                                </div>
                            </PermissionGuard>
                        </>
                    }
                    rightActions={
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
                                            {language === "en" ? "Wastage Number" : "ویسٹیج نمبر"}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter wastage number..."
                                            value={filterId}
                                            onChange={(e) => setFilterId(e.target.value)}
                                            className="w-full px-3 py-2 text-sm rounded-xl border-2 border-(--border) bg-(--surface-muted) outline-none focus:border-(--accent-2) transition-all"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    }
                />
            </div>

            <PaginatedList
                rtkQuery={useWastages}
                limit={20}
                dataKey="data"
                wrapperClassName="flex-1"
                queryArgs={debouncedFilterId ? { wastageNumber: debouncedFilterId } : {}}
                renderItems={(wastages) => (
                    <div className="overflow-x-auto rounded-2xl overflow-hidden"
                        style={{ border: "1px solid var(--border)" }}>
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="text-xs uppercase tracking-wider"
                                    style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
                                    <th className="px-4 py-3 font-semibold">{labels.wastageNumber}</th>
                                    <th className="px-4 py-3 font-semibold">{labels.reason}</th>
                                    <th className="px-4 py-3 font-semibold text-center">{labels.items}</th>
                                    <th className="px-4 py-3 font-semibold text-center">{labels.totalQty}</th>
                                    <th className="px-4 py-3 font-semibold text-right">{labels.totalLossAmount}</th>
                                    <th className="px-4 py-3 font-semibold text-center">{labels.status}</th>
                                    <th className="px-4 py-3 font-semibold">{labels.date}</th>
                                    <th className="px-4 py-3 font-semibold text-center">{labels.actions}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {wastages.map(w => (
                                    <WastageRow
                                        key={w._id}
                                        wastage={w}
                                        onEdit={() => setModal({ mode: "update", id: w._id })}
                                        onDelete={() => handleDelete(w._id)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                renderEmpty={() => (
                    <p className="text-center py-12 text-sm" style={{ color: "var(--muted)" }}>
                        {labels.noWastageFound}
                    </p>
                )}
            />
        </div>
    );
}

function WastageRow({ wastage, onEdit, onDelete }) {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getWastageLabels(language);
    
    const date   = new Date(wastage?.wastageDate ?? wastage?.createdAt).toLocaleDateString();
    const status = wastage?.status ?? "draft";
    const style  = STATUS_STYLE[status] ?? STATUS_STYLE.draft;
    const isApproved = status === "approved";

    return (
        <tr 
            className="transition" 
            style={{ borderBottom: "1px solid var(--border)" }}
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
                    {labels[status] || status}
                </span>
            </td>
            <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>{date}</td>
            <td className="px-4 py-3">
                <div className="flex justify-center gap-2">
                    <button
                        onClick={() => navigate(`/wastage/${wastage._id}`)}
                        className="px-3 py-1 text-xs rounded-lg font-medium transition"
                        style={{ background: "rgba(59,130,246,0.08)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.15)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(59,130,246,0.08)"}
                        title="View Details">
                        <Eye className="w-3 h-3" />
                    </button>
                    {!isApproved && (
                        <PermissionGuard execute={onEdit} permission="wastage.update" isConfirmation={true}>
                            <button
                                className="px-3 py-1 text-xs rounded-lg font-medium transition"
                                style={{ background: "rgba(15,118,110,0.08)", color: "var(--accent-2)", border: "1px solid rgba(15,118,110,0.2)" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(15,118,110,0.15)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(15,118,110,0.08)"}>
                                <Edit className="w-3 h-3" />
                            </button>
                        </PermissionGuard>
                    )}
                    <PermissionGuard execute={onDelete} permission="wastage.delete" isConfirmation={true}>
                        <button
                            className="px-3 py-1 text-xs rounded-lg font-medium transition"
                            style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.15)" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(220,38,38,0.12)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(220,38,38,0.06)"}>
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </PermissionGuard>
                </div>
            </td>
        </tr>
    );
}

function WastageApprovalModal({ onClose, onApprove, onDelete }) {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getWastageLabels(language);
    const { data, isLoading } = useWastages({ status: "pending", page: 1, limit: 20 });

    const wastages = data?.data ?? [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-[var(--surface)] rounded-2xl shadow-xl w-full max-w-6xl max-h-[85vh] overflow-hidden border border-[var(--border)]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--surface-muted)]">
                    <h2 className="text-lg font-semibold text-[var(--ink)]">
                        {labels.approveWastageRequests}
                    </h2>
                    <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--ink)]">✕</button>
                </div>
                <div className="overflow-y-auto max-h-[65vh]">
                    {isLoading ? (
                        <div className="p-8 text-center text-[var(--muted)]">{labels.loading}</div>
                    ) : wastages.length === 0 ? (
                        <div className="p-8 text-center text-[var(--muted)]">
                            {labels.noPendingRequests}
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="text-xs uppercase tracking-wider"
                                        style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
                                        <th className="px-4 py-3 font-semibold">{labels.wastageNumber}</th>
                                        <th className="px-4 py-3 font-semibold">{labels.reason}</th>
                                        <th className="px-4 py-3 font-semibold text-center">{labels.items}</th>
                                        <th className="px-4 py-3 font-semibold text-center">{labels.totalQty}</th>
                                        <th className="px-4 py-3 font-semibold text-right">{labels.totalLossAmount}</th>
                                        <th className="px-4 py-3 font-semibold text-center">{labels.status}</th>
                                        <th className="px-4 py-3 font-semibold">{labels.date}</th>
                                        <th className="px-4 py-3 font-semibold text-center">{labels.actions}</th>
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
                                                    {labels[w?.status ?? "pending"] || w?.status || "pending"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>
                                                {new Date(w?.wastageDate ?? w?.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center gap-2" onClick={e => e.stopPropagation()}>
                                                    <PermissionGuard execute={() => onApprove(w._id)} permission="wastage.approve" isConfirmation={true}>
                                                        <button
                                                            className="px-3 py-1 text-xs rounded-lg font-medium transition"
                                                            style={{ background: "rgba(15,118,110,0.08)", color: "var(--accent-2)", border: "1px solid rgba(15,118,110,0.2)" }}
                                                            onMouseEnter={e => e.currentTarget.style.background = "rgba(15,118,110,0.15)"}
                                                            onMouseLeave={e => e.currentTarget.style.background = "rgba(15,118,110,0.08)"}>
                                                            {labels.approve}
                                                        </button>
                                                    </PermissionGuard>
                                                    <PermissionGuard execute={() => onDelete(w._id)} permission="wastage.delete" isConfirmation={true}>
                                                        <button
                                                            className="px-3 py-1 text-xs rounded-lg font-medium transition"
                                                            style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.15)" }}
                                                            onMouseEnter={e => e.currentTarget.style.background = "rgba(220,38,38,0.12)"}
                                                            onMouseLeave={e => e.currentTarget.style.background = "rgba(220,38,38,0.06)"}>
                                                            {labels.delete}
                                                        </button>
                                                    </PermissionGuard>
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
                    <div className="p-4 border-t border-[var(--border)] text-center text-xs" style={{ color: "var(--muted)" }}>
                        {labels.showingPendingRequests.replace('{count}', wastages.length).replace('{total}', data.total)}
                    </div>
                )}
            </div>
        </div>
    );
}


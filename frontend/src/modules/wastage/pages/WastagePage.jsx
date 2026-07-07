// src/modules/wastage/pages/WastagePage.jsx
import { useState } from "react";
import { Plus, CheckCircle, Printer, Download, X, FileText, Calendar, Package, AlertTriangle, DollarSign } from "lucide-react";
import { useSelector } from "react-redux";
import { useDeleteWastage, useWastages, useApproveWastage } from "../services/wastage.service.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import WastageModal from "../components/WastageModal.jsx";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
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
    const [viewWastage, setViewWastage] = useState(null);

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

            {viewWastage && (
                <WastageDetailModal
                    wastage={viewWastage}
                    onClose={() => setViewWastage(null)}
                />
            )}

            <div className="flex-none">
                <PageHeading
                    heading={language === "en" ? "Wastage" : "ضیاع"}
                    subheading={language === "en" ? "Manage wastage records" : "ضیاع ریکارڈز کا انتظام کریں"}
                    leftActions={
                        <>
                            <div onClick={() => setModal({ mode: "create" })}>
                                <ScreenTabButton lucideIcon={Plus} text={language === "en" ? "Add Wastage" : "ضیاع شامل کریں"} />
                            </div>
                            <div onClick={() => setApprovalModal(true)}>
                                <ScreenTabButton lucideIcon={CheckCircle} text={language === "en" ? "Approve Wastage" : "ضیاع منظور کریں"} />
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
                                        onClick={() => setViewWastage(w)}
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

function WastageRow({ wastage, onClick, onEdit, onDelete }) {
    const date   = new Date(wastage?.wastageDate ?? wastage?.createdAt).toLocaleDateString();
    const status = wastage?.status ?? "draft";
    const style  = STATUS_STYLE[status] ?? STATUS_STYLE.draft;

    return (
        <tr 
            className="transition cursor-pointer" 
            style={{ borderBottom: "1px solid var(--border)" }}
            onClick={onClick}
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

function WastageDetailModal({ wastage, onClose }) {
    const language = useSelector(s => s.auth?.user?.language ?? "en");
    const status = wastage?.status ?? "draft";
    const style = STATUS_STYLE[status] ?? STATUS_STYLE.draft;

    if (!wastage) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-[var(--surface)] w-full max-w-4xl rounded-3xl shadow-2xl border border-[var(--border)] overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200"
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="bg-[var(--surface-muted)] px-6 py-5 border-b border-[var(--border)] flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[var(--accent-2)]/10 rounded-2xl text-[var(--accent-2)]">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--ink)] flex items-center gap-2">
                                {wastage?.wastageNumber || "Wastage Details"}
                            </h2>
                            <p className="text-sm text-[var(--muted)]">
                                {language === "en" ? "Wastage Record Details" : "ضیاع ریکارڈ کی تفصیلات"}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--surface)] rounded-xl transition-colors text-[var(--muted)] hover:text-[var(--ink)]">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Summary Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar size={18} className="text-[var(--muted)]" />
                                <span className="text-sm text-[var(--muted)]">{language === "en" ? "Date" : "تاریخ"}</span>
                            </div>
                            <p className="text-lg font-semibold text-[var(--ink)]">
                                {new Date(wastage?.wastageDate ?? wastage?.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle size={18} className="text-[var(--muted)]" />
                                <span className="text-sm text-[var(--muted)]">{language === "en" ? "Status" : "حیثیت"}</span>
                            </div>
                            <span className="px-3 py-1 rounded-lg text-sm font-semibold capitalize" style={style}>
                                {status}
                            </span>
                        </div>
                        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign size={18} className="text-[var(--muted)]" />
                                <span className="text-sm text-[var(--muted)]">{language === "en" ? "Total Loss" : "کل نقصان"}</span>
                            </div>
                            <p className="text-lg font-semibold text-[var(--accent)]">
                                Rs {(wastage?.totalLossAmount ?? 0).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Reason Section */}
                    <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                        <h3 className="text-base font-semibold text-[var(--ink)] mb-2 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-[var(--accent)]" />
                            {language === "en" ? "Reason" : "وجہ"}
                        </h3>
                        <p className="text-sm text-[var(--ink)] capitalize">
                            {wastage?.reason?.replace(/_/g, " ") || "—"}
                        </p>
                        {wastage?.notes && (
                            <p className="text-sm text-[var(--muted)] mt-2">
                                {wastage.notes}
                            </p>
                        )}
                    </div>

                    {/* Items Section */}
                    <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--surface)]">
                        <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-muted)]">
                            <h3 className="text-base font-semibold text-[var(--ink)] flex items-center gap-2">
                                <Package size={18} className="text-[var(--accent-2)]" />
                                {language === "en" ? "Wasted Items" : "ضائع شدہ آئٹمز"}
                                <span className="ml-auto text-xs bg-[var(--surface)] px-2 py-1 rounded-lg border border-[var(--border)] text-[var(--muted)]">
                                    {wastage?.items?.length || 0} {language === "en" ? "items" : "آئٹمز"}
                                </span>
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[var(--surface)] border-b border-[var(--border)] text-[var(--muted)] uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">{language === "en" ? "Product" : "پروڈکٹ"}</th>
                                        <th className="px-5 py-3 font-semibold text-center">{language === "en" ? "Quantity" : "مقدار"}</th>
                                        <th className="px-5 py-3 font-semibold text-right">{language === "en" ? "Cost Price" : "قیمت"}</th>
                                        <th className="px-5 py-3 font-semibold text-right">{language === "en" ? "Total Loss" : "کل نقصان"}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {wastage?.items?.length > 0 ? (
                                        wastage.items.map((item, index) => (
                                            <tr key={index} className="hover:bg-[var(--surface-muted)]/50 transition-colors">
                                                <td className="px-5 py-4">
                                                    <p className="font-medium text-[var(--ink)]">
                                                        {item.product?.name || item.productName || "—"}
                                                    </p>
                                                    {item.batchNumber && (
                                                        <p className="text-xs text-[var(--muted)]">Batch: {item.batchNumber}</p>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    {item.quantity || 0}
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    Rs {(item.costPrice || 0).toLocaleString()}
                                                </td>
                                                <td className="px-5 py-4 text-right font-semibold text-[var(--accent)]">
                                                    Rs {((item.quantity || 0) * (item.costPrice || 0)).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-5 py-8 text-center text-[var(--muted)]">
                                                {language === "en" ? "No items recorded." : "کوئی آئٹم ریکارڈ نہیں کیا گیا۔"}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]">
                        <div>
                            <p className="text-sm text-[var(--muted)]">{language === "en" ? "Total Items" : "کل آئٹمز"}</p>
                            <p className="text-xl font-bold text-[var(--ink)]">{wastage?.totalItems || wastage?.items?.length || 0}</p>
                        </div>
                        <div>
                            <p className="text-sm text-[var(--muted)]">{language === "en" ? "Total Quantity" : "کل مقدار"}</p>
                            <p className="text-xl font-bold text-[var(--ink)]">{wastage?.totalQuantity || 0}</p>
                        </div>
                        <div>
                            <p className="text-sm text-[var(--muted)]">{language === "en" ? "Total Loss Amount" : "کل نقصان کی رقم"}</p>
                            <p className="text-xl font-bold text-[var(--accent)]">Rs {(wastage?.totalLossAmount ?? 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

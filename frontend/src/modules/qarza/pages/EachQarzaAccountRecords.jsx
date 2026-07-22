// src/modules/qarza/pages/EachQarzaAccountRecords.jsx
import { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, ArrowLeft, Edit2, Trash2, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useSelector } from "react-redux";
import {
    useAccountPaymentsPaginated,
    useAccountPaymentsSummary,
    useDeleteQarzaPayment,
} from "../services/qarza.service.js";
import QarzaPaymentModal from "../components/QarzaPaymentModal.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import { hasPermission } from "../../../shared/utilities/permissionUtils.js";

const STATUS_COLOR = {
    cashin: { bg: "rgba(16,185,129,0.1)", text: "#10b981", Icon: ArrowDownLeft },
    cashout: { bg: "rgba(239,68,68,0.1)", text: "#ef4444", Icon: ArrowUpRight },
};

export default function EachQarzaAccountRecords() {
    const { id } = useParams();
    console.log("the account id", id)
    const navigate = useNavigate();
    const language = useSelector(s => s.auth?.user?.language ?? "en");
    const { permissions = [], role } = useSelector(s => s.auth) ?? {};

    const { data: summary } = useAccountPaymentsSummary(id);
    const [deletePayment] = useDeleteQarzaPayment();

    const [modal, setModal] = useState(null);
    const [page, setPage] = useState(1);
    const [sourceFilter, setSourceFilter] = useState('all');
    const limit = 20;

    const { data: paymentsData, isLoading } = useAccountPaymentsPaginated({ qarzaAccountId: id, page, limit, source: sourceFilter });

    const refresh = useCallback(() => { setPage(1); }, []);

    const handleDelete = async (paymentId) => {
        if (!window.confirm("Delete this payment?")) return;
        try {
            await deletePayment({ paymentId, qarzaAccountId: id }).unwrap();
            showSuccess("Payment deleted");
            refresh();
        } catch (e) {
            showError(e?.data?.message ?? "Delete failed");
        }
    };

    const payments = paymentsData?.data || [];
    const totalPages = paymentsData?.totalPages || 1;

    return (
        <div style={{ color: "var(--ink)" }}>
            {modal && (
                <QarzaPaymentModal
                    mode={modal.mode}
                    qarzaAccountId={id}
                    payment={modal.payment}
                    onClose={() => setModal(null)}
                    onSuccess={refresh}
                />
            )}

            {/* Page Heading */}
            <div className="flex-none mb-6">
                <PageHeading
                    heading={language === "en" ? "Account Payments" : "اکاؤنٹ ادائیگیاں"}
                    subheading={language === "en" ? "View and manage payment records" : "ادائیگی ریکارڈز دیکھیں اور انتظام کریں"}
                    leftActions={
                        <button className="btn-back" onClick={() => navigate("/qarzaAccount")}>
                            <ArrowLeft className="w-4 h-4" />
                            {language === "en" ? "Back" : "واپس"}
                        </button>
                    }
                />
            </div>

            {/* toolbar */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
                {(role === "admin" || hasPermission(permissions, "accounts.payment.create")) && (
                    <button className="btn-add" onClick={() => setModal({ mode: "create" })}>
                        <Plus className="w-4 h-4" />
                        {language === "en" ? "Add Payment" : "ادائیگی شامل کریں"}
                    </button>
                )}
                {/* <select
                    value={sourceFilter}
                    onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--border)', '--tw-ring-color': 'var(--accent-2)' }}
                >
                    <option value="all">All Sources</option>
                    <option value="pos">POS</option>
                    <option value="purchaseProducts">Purchase</option>
                    <option value="manual">Manual</option>
                </select> */}
            </div>

            {/* summary cards */}
            {summary && (
                <div className="grid grid-cols-5 gap-4 mb-6">
                    {[
                        { 
                            label: "Manual Cash In", 
                            value: summary.manualCashIn || 0, 
                            color: "#10b981", 
                            bg: "rgba(16,185,129,0.08)" 
                        },
                        { 
                            label: "Manual Cash Out", 
                            value: summary.manualCashOut || 0, 
                            color: "#ef4444", 
                            bg: "rgba(239,68,68,0.08)" 
                        },
                        { 
                            label: "POS", 
                            value: summary.posAmount || 0, 
                            color: "#f59e0b", 
                            bg: "rgba(245,158,11,0.08)" 
                        },
                        { 
                            label: "Purchase", 
                            value: summary.purchaseAmount || 0, 
                            color: "#8b5cf6", 
                            bg: "rgba(139,92,246,0.08)" 
                        },
                        { 
                            label: "Overall", 
                            value: summary.overall || 0,
                            color: (summary.overall || 0) >= 0 ? "var(--accent-2)" : "#ef4444",
                            bg: (summary.overall || 0) >= 0 ? "rgba(15,118,110,0.08)" : "rgba(239,68,68,0.08)"
                        },
                    ].map(({ label, value, color, bg }) => (
                        <div key={label} className="rounded-2xl p-4"
                            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>
                                {label}
                            </p>
                            <p className="text-xl font-black tabular-nums" style={{ color }}>
                                Rs {Math.abs(value).toLocaleString()}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* payments list */}
            {isLoading ? (
                <div className="flex items-center justify-center h-40 text-sm" style={{ color: "var(--muted)" }}>
                    Loading payments...
                </div>
            ) : payments.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-sm" style={{ color: "var(--muted)" }}>
                    No payments recorded.
                </div>
            ) : (
                <>
                    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                        <table className="w-full">
                            <thead>
                                <tr style={{ background: "var(--surface-muted)" }}>
                                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>{language === "en" ? "Type" : "قسم"}</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>{language === "en" ? "Amount" : "رقم"}</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>{language === "en" ? "Notes" : "نوٹس"}</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>{language === "en" ? "Date" : "تاریخ"}</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>{language === "en" ? "Source" : "ماخذ"}</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>{language === "en" ? "Actions" : "اقدامات"}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((p, i) => {
                                    const { bg, text, Icon } = STATUS_COLOR[p.type] ?? STATUS_COLOR.cashin;
                                    return (
                                        <tr key={p._id ?? i}
                                            className="border-t transition-colors"
                                            style={{ borderColor: "var(--border)" }}
                                            onMouseEnter={e => e.currentTarget.style.background = "var(--surface-muted)"}
                                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                                            {/* type icon */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
                                                        <Icon className="w-4 h-4" style={{ color: text }} />
                                                    </div>
                                                    <span className="text-xs font-semibold uppercase" style={{ color: text }}>{p.type}</span>
                                                </div>
                                            </td>

                                            {/* amount */}
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-sm tabular-nums" style={{ color: text }}>
                                                    Rs {(p.amount || 0).toLocaleString()}
                                                </p>
                                            </td>

                                            {/* notes */}
                                            <td className="px-4 py-3">
                                                <p className="text-xs truncate max-w-[200px]" style={{ color: "var(--muted)" }}>
                                                    {p.notes || "-"}
                                                </p>
                                            </td>

                                            {/* date */}
                                            <td className="px-4 py-3 text-sm" style={{ color: "var(--muted)" }}>
                                                {new Date(p.date).toLocaleDateString()}
                                            </td>

                                            {/* source */}
                                            <td className="px-4 py-3">
                                                <span className="text-xs px-2 py-1 rounded-md font-semibold"
                                                    style={{
                                                        background: "var(--surface-muted)",
                                                        color: "var(--ink)"
                                                    }}>
                                                    {p.source || "manual"}
                                                </span>
                                            </td>

                                            {/* actions */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    {(role === "admin" || hasPermission(permissions, "accounts.payment.update")) && (
                                                        <button onClick={() => setModal({ mode: "update", payment: p })}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg transition"
                                                            style={{ color: "var(--muted)" }}
                                                            onMouseEnter={e => { e.currentTarget.style.color = "var(--accent-2)"; e.currentTarget.style.background = "rgba(15,118,110,0.08)"; }}
                                                            onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}>
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    {(role === "admin" || hasPermission(permissions, "accounts.payment.delete")) && (
                                                        <button onClick={() => handleDelete(p._id)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg transition"
                                                            style={{ color: "var(--muted)" }}
                                                            onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
                                                            onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}>
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* pagination controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 rounded-lg text-sm transition disabled:opacity-50"
                                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                {language === "en" ? "Previous" : "پچھلا"}
                            </button>
                            <span className="text-sm" style={{ color: "var(--muted)" }}>
                                {page} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1 rounded-lg text-sm transition disabled:opacity-50"
                                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                {language === "en" ? "Next" : "اگلا"}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}


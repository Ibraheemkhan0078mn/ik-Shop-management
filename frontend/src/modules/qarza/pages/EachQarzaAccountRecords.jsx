// src/modules/qarza/pages/EachQarzaAccountRecords.jsx
import { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate }          from "react-router-dom";
import { Plus, ArrowLeft, Edit2, Trash2, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useSelector }                     from "react-redux";
import {
    useAccountPayments,
    useDeleteQarzaPayment,
} from "../services/qarza.service.js";
import QarzaPaymentModal from "../components/QarzaPaymentModal.jsx";
import { showSuccess, showError } from "@shared/utilities/toastHelpers";

const STATUS_COLOR = {
    cashin:  { bg: "rgba(16,185,129,0.1)",  text: "#10b981", Icon: ArrowDownLeft },
    cashout: { bg: "rgba(239,68,68,0.1)",   text: "#ef4444", Icon: ArrowUpRight  },
};

export default function EachQarzaAccountRecords() {
    const { id }     = useParams();
    const navigate   = useNavigate();
    const language   = useSelector(s => s.auth?.user?.language ?? "en");

    const { data: payments = [], refetch } = useAccountPayments(id);
    const [deletePayment]                  = useDeleteQarzaPayment();

    const [modal,      setModal]      = useState(null);  // null | { mode, payment? }
    const [refreshKey, setRefreshKey] = useState(0);

    const refresh = useCallback(() => { refetch(); setRefreshKey(k => k + 1); }, [refetch]);

    const summary = useMemo(() => {
        const totalIn  = payments.filter(p => p.type === "cashin").reduce((s, p) => s + p.amount, 0);
        const totalOut = payments.filter(p => p.type === "cashout").reduce((s, p) => s + p.amount, 0);
        return { totalIn, totalOut, net: totalIn - totalOut };
    }, [payments]);

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

            {/* toolbar */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
                <button className="btn-back" onClick={() => navigate("/qarzaAccount")}>
                    <ArrowLeft className="w-4 h-4" />
                    {language === "en" ? "Back" : "واپس"}
                </button>
                <button className="btn-add" onClick={() => setModal({ mode: "create" })}>
                    <Plus className="w-4 h-4" />
                    {language === "en" ? "Add Payment" : "ادائیگی شامل کریں"}
                </button>
            </div>

            {/* summary cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: "Cash In",  value: summary.totalIn,  color: "#10b981", bg: "rgba(16,185,129,0.08)"  },
                    { label: "Cash Out", value: summary.totalOut, color: "#ef4444", bg: "rgba(239,68,68,0.08)"   },
                    { label: "Balance",  value: summary.net,
                      color: summary.net >= 0 ? "var(--accent-2)" : "#ef4444",
                      bg:    summary.net >= 0 ? "rgba(15,118,110,0.08)" : "rgba(239,68,68,0.08)" },
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

            {/* payments list */}
            {payments.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-sm" style={{ color: "var(--muted)" }}>
                    No payments recorded.
                </div>
            ) : (
                <div className="space-y-2">
                    {payments.map((p, i) => {
                        const { bg, text, Icon } = STATUS_COLOR[p.type] ?? STATUS_COLOR.cashin;
                        return (
                            <div key={p._id ?? i}
                                className="flex items-center gap-4 px-4 py-3 rounded-2xl transition"
                                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                                onMouseEnter={e => e.currentTarget.style.background = "var(--surface-muted)"}
                                onMouseLeave={e => e.currentTarget.style.background = "var(--surface)"}>

                                {/* type icon */}
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: bg }}>
                                    <Icon className="w-4 h-4" style={{ color: text }} />
                                </div>

                                {/* details */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm tabular-nums" style={{ color: text }}>
                                        Rs {p.amount?.toLocaleString()}
                                    </p>
                                    {p.notes && (
                                        <p className="text-xs truncate mt-0.5" style={{ color: "var(--muted)" }}>
                                            {p.notes}
                                        </p>
                                    )}
                                </div>

                                {/* date */}
                                <div className="text-xs text-right shrink-0" style={{ color: "var(--muted)" }}>
                                    {new Date(p.date).toLocaleDateString()}
                                </div>

                                {/* actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <button onClick={() => setModal({ mode: "update", payment: p })}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg transition"
                                        style={{ color: "var(--muted)" }}
                                        onMouseEnter={e => { e.currentTarget.style.color = "var(--accent-2)"; e.currentTarget.style.background = "rgba(15,118,110,0.08)"; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}>
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleDelete(p._id)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg transition"
                                        style={{ color: "var(--muted)" }}
                                        onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}


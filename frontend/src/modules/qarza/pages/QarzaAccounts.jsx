// src/modules/qarza/pages/QarzaAccounts.jsx
import { useState, useCallback } from "react";
import { useNavigate }           from "react-router-dom";
import { Plus, Edit2, Trash2, Phone, MapPin, Wallet } from "lucide-react";
import { useSelector }           from "react-redux";
import { useQarzaAccounts, useDeleteQarzaAccount } from "../services/qarza.service.js";
import QarzaAccountModal         from "../components/QarzaAccountModal.jsx";
import { showSuccess, showError } from "@shared/utilities/toastHelpers";
import emptyImage                from "@shared/assets/images/boy-user.jpg";
import { backendBaseUrl }        from "@shared/constants/constants.js";

export default function QarzaAccounts() {
    const navigate   = useNavigate();
    const language   = useSelector(s => s.auth?.user?.language ?? "en");

    const { data: accounts = [], refetch } = useQarzaAccounts();
    const [deleteAccount]                  = useDeleteQarzaAccount();

    const [modal,  setModal]  = useState(null);   // null | { mode, account? }
    const [search, setSearch] = useState("");

    const refresh = useCallback(() => refetch(), [refetch]);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this account?")) return;
        try {
            await deleteAccount(id).unwrap();
            showSuccess("Account deleted");
            refresh();
        } catch (e) {
            showError(e?.data?.message ?? "Delete failed");
        }
    };

    const filtered = accounts.filter(a =>
        !search || a.name?.toLowerCase().includes(search.toLowerCase())
    );

    // net balance for an account
    const netBalance = (acc) =>
        (acc.payments ?? []).reduce((sum, p) =>
            p.type === "cashin" ? sum + p.amount : sum - p.amount, 0);

    return (
        <div style={{ color: "var(--ink)" }}>
            {modal && (
                <QarzaAccountModal
                    mode={modal.mode}
                    account={modal.account}
                    onClose={() => setModal(null)}
                    onSuccess={refresh}
                />
            )}

            {/* toolbar */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
                <button className="btn-add" onClick={() => setModal({ mode: "create" })}>
                    <Plus className="w-4 h-4" />
                    {language === "en" ? "Add Account" : "اکاؤنٹ شامل کریں"}
                </button>
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search accounts…"
                    className="input-search flex-1 max-w-sm"
                />
            </div>

            {filtered.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm" style={{ color: "var(--muted)" }}>
                    No accounts found.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(acc => {
                        const net    = netBalance(acc);
                        const letter = acc.name?.charAt(0)?.toUpperCase() ?? "?";

                        return (
                            <div key={acc._id}
                                onClick={() => navigate(`/EachQarzaAccountRecord/${acc._id}`)}
                                className="card cursor-pointer group hover:-translate-y-1 transition-all duration-200">

                                {/* top strip */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0"
                                        style={{ border: "2px solid var(--border)" }}>
                                        <img
                                            src={acc.qarzaProfileImage
                                                ? `${backendBaseUrl}/uploads/${acc.qarzaProfileImage}`
                                                : emptyImage}
                                            className="w-full h-full object-cover"
                                            alt={acc.name}
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-sm truncate" style={{ color: "var(--ink)" }}>{acc.name}</h3>
                                        <span className="text-xs px-2 py-0.5 rounded-md"
                                            style={{ background: "var(--surface-muted)", color: "var(--muted)" }}>
                                            {acc.type}
                                        </span>
                                    </div>
                                </div>

                                {/* contact */}
                                <div className="space-y-1.5 mb-4">
                                    {acc.phoneNo && (
                                        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
                                            <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent-2)" }} />
                                            {acc.phoneNo}
                                        </div>
                                    )}
                                    {acc.address && (
                                        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
                                            <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent-2)" }} />
                                            <span className="truncate">{acc.address}</span>
                                        </div>
                                    )}
                                </div>

                                {/* balance */}
                                {net !== 0 && (
                                    <div className="flex items-center justify-between px-3 py-2 rounded-xl mb-4"
                                        style={{
                                            background: net > 0 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                                            border: `1px solid ${net > 0 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                                        }}>
                                        <span className="text-xs font-semibold" style={{ color: net > 0 ? "#10b981" : "#ef4444" }}>
                                            {net > 0 ? "To Give" : "To Receive"}
                                        </span>
                                        <span className="text-sm font-black" style={{ color: net > 0 ? "#10b981" : "#ef4444" }}>
                                            Rs {Math.abs(net).toLocaleString()}
                                        </span>
                                    </div>
                                )}

                                {/* actions */}
                                <div className="card-actions" onClick={e => e.stopPropagation()}>
                                    <button className="card-button card-button-edit"
                                        onClick={e => { e.stopPropagation(); setModal({ mode: "update", account: acc }); }}>
                                        <Edit2 className="w-3.5 h-3.5" /> Edit
                                    </button>
                                    <button className="card-button card-button-delete"
                                        onClick={e => handleDelete(acc._id, e)}>
                                        <Trash2 className="w-3.5 h-3.5" /> Delete
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



// src/modules/qarza/pages/QarzaAccounts.jsx
import { useState } from "react";
import { useNavigate }           from "react-router-dom";
import { Plus, Edit2, Trash2, Phone, MapPin, Wallet } from "lucide-react";
import { useSelector }           from "react-redux";
import { useQarzaAccountsPaginated, useDeleteQarzaAccount } from "../services/qarza.service.js";
import QarzaAccountModal         from "../components/QarzaAccountModal.jsx";
import { showSuccess, showError } from "@shared/utilities/toastHelpers";
import emptyImage                from "@shared/assets/images/boy-user.jpg";
import { backendBaseUrl }        from "@shared/constants/constants.js";
import PaginatedList             from "@shared/components/PaginatedList.jsx";
import PageHeading               from "@shared/components/PageHeading.jsx";

export default function QarzaAccounts() {
    const navigate   = useNavigate();
    const language   = useSelector(s => s.auth?.user?.language ?? "en");

    const [deleteAccount] = useDeleteQarzaAccount();
    const [modal,  setModal]  = useState(null);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this account?")) return;
        try {
            await deleteAccount(id).unwrap();
            showSuccess("Account deleted");
        } catch (e) {
            showError(e?.data?.message ?? "Delete failed");
        }
    };

    // net balance for an account
    const netBalance = (acc) =>
        (acc.payments ?? []).reduce((sum, p) =>
            p.type === "cashin" ? sum + p.amount : sum - p.amount, 0);

    return (
        <div className="h-screen flex flex-col">
            {modal && (
                <QarzaAccountModal
                    mode={modal.mode}
                    account={modal.account}
                    onClose={() => setModal(null)}
                />
            )}

            <div className="flex-none">
                <PageHeading
                    heading={language === "en" ? "Credit & Debits" : "کریڈٹ اور ڈیبٹس"}
                    subheading={language === "en" ? "Manage credit and debit accounts" : "کریڈٹ اور ڈیبٹ اکاؤنٹس کا انتظام کریں"}
                >
                    <button className="btn-add" onClick={() => setModal({ mode: "create" })}>
                        <Plus className="w-4 h-4" />
                        {language === "en" ? "Add Account" : "اکاؤنٹ شامل کریں"}
                    </button>
                </PageHeading>
            </div>

            <PaginatedList
                rtkQuery={useQarzaAccountsPaginated}
                limit={20}
                dataKey="data"
                wrapperClassName="flex-1"
                renderItems={(accounts) => (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {accounts.map(acc => {
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
                                                style={{
                                                    background: net >= 0 ? "rgba(15,118,110,0.1)" : "rgba(220,38,38,0.1)",
                                                    color: net >= 0 ? "var(--accent-2)" : "#dc2626"
                                                }}>
                                                {net >= 0 ? "Receivable" : "Payable"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* balance */}
                                    <div className="mb-4">
                                        <div className="text-xs mb-1" style={{ color: "var(--muted)" }}>Net Balance</div>
                                        <div className="text-2xl font-bold tabular-nums"
                                            style={{ color: net >= 0 ? "var(--accent-2)" : "#dc2626" }}>
                                            Rs {Math.abs(net).toLocaleString()}
                                        </div>
                                    </div>

                                    {/* contact info */}
                                    {(acc.phone || acc.address) && (
                                        <div className="space-y-2 mb-4">
                                            {acc.phone && (
                                                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
                                                    <Phone className="w-3.5 h-3.5" />
                                                    {acc.phone}
                                                </div>
                                            )}
                                            {acc.address && (
                                                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    <span className="truncate">{acc.address}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setModal({ mode: "update", account: acc }); }}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                                            style={{
                                                background: "var(--surface-muted)",
                                                border: "1px solid var(--border)",
                                                color: "var(--ink)"
                                            }}
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(acc._id, e)}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                                            style={{
                                                background: "rgba(220,38,38,0.1)",
                                                border: "1px solid rgba(220,38,38,0.2)",
                                                color: "#dc2626"
                                            }}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                renderEmpty={() => (
                    <div className="flex items-center justify-center h-48 text-sm" style={{ color: "var(--muted)" }}>
                        No accounts found.
                    </div>
                )}
            />
        </div>
    );
}


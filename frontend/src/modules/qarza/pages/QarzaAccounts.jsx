// src/modules/qarza/pages/QarzaAccounts.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MapPin, Edit2, Trash2, Phone } from "lucide-react";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getQarzaLabels } from "../labels/qarzaLabels.js";
import { useQarzaAccountsPaginated, useDeleteQarzaAccount } from "../services/qarza.service.js";
import QarzaAccountModal from "../components/QarzaAccountModal.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import emptyImage from "../../../shared/assets/images/boy-user.jpg";
import { backendBaseUrl } from "../../../shared/constants/constants.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";

export default function QarzaAccounts() {
    const navigate   = useNavigate();
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getQarzaLabels(language);

    const [deleteAccount] = useDeleteQarzaAccount();
    const [modal,  setModal]  = useState(null);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm(labels.deleteConfirm)) return;
        try {
            await deleteAccount(id).unwrap();
            showSuccess(labels.accountDeleted);
        } catch (e) {
            showError(e?.data?.message ?? labels.deleteFailed);
        }
    };

    // net balance for an account
    const netBalance = (acc) =>
        (acc.payments ?? []).reduce((sum, p) =>
            p.type === "cashin" ? sum + (p.amount || 0) : sum - (p.amount || 0), 0);

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
                    heading={labels.creditDebits}
                    subheading={labels.manageCreditDebitAccounts}
                    leftActions={
                        <div onClick={() => setModal({ mode: "create" })}>
                            <ScreenTabButton lucideIcon={Plus} text={labels.addAccount} />
                        </div>
                    }
                />
            </div>

            <PaginatedList
                rtkQuery={useQarzaAccountsPaginated}
                limit={20}
                dataKey="data"
                wrapperClassName="flex-1 overflow-auto"
                renderItems={(accounts) => (
                    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                        <table className="w-full">
                            <thead>
                                <tr style={{ background: "var(--surface-muted)" }}>
                                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>{labels.name}</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>{labels.balance}</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>{labels.phone}</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>{labels.address}</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>{labels.status}</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>{labels.actions}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map(acc => {
                                    const net = netBalance(acc);
                                    return (
                                        <tr 
                                            key={acc._id}
                                            onClick={() => navigate(`/EachQarzaAccountRecord/${acc._id}`)}
                                            className="border-t cursor-pointer hover:bg-opacity-50 transition-colors"
                                            style={{ borderColor: "var(--border)" }}
                                            onMouseEnter={e => e.currentTarget.style.background = "var(--surface-muted)"}
                                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0" style={{ border: "1px solid var(--border)" }}>
                                                        <img
                                                            src={acc.qarzaProfileImage
                                                                ? `${backendBaseUrl}/uploads/${acc.qarzaProfileImage}`
                                                                : emptyImage}
                                                            className="w-full h-full object-cover"
                                                            alt={acc.name}
                                                        />
                                                    </div>
                                                    <span className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{acc.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-bold tabular-nums" style={{ color: net >= 0 ? "var(--accent-2)" : "#dc2626" }}>
                                                    Rs {Math.abs(net).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{ color: "var(--muted)" }}>{acc.phone || "-"}</td>
                                            <td className="px-4 py-3 text-sm" style={{ color: "var(--muted)" }}>
                                                <span className="truncate block max-w-[200px]">{acc.address || "-"}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs px-2 py-1 rounded-md font-semibold"
                                                    style={{
                                                        background: net >= 0 ? "rgba(15,118,110,0.1)" : "rgba(220,38,38,0.1)",
                                                        color: net >= 0 ? "var(--accent-2)" : "#dc2626"
                                                    }}>
                                                    {net >= 0 ? labels.receivable : labels.payable}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setModal({ mode: "update", account: acc }); }}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg transition"
                                                        style={{ color: "var(--muted)" }}
                                                        onMouseEnter={e => { e.currentTarget.style.color = "var(--accent-2)"; e.currentTarget.style.background = "rgba(15,118,110,0.08)"; }}
                                                        onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(acc._id, e)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg transition"
                                                        style={{ color: "var(--muted)" }}
                                                        onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
                                                        onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                renderEmpty={() => (
                    <div className="flex items-center justify-center h-48 text-sm" style={{ color: "var(--muted)" }}>
                        {labels.noAccountsFound}
                    </div>
                )}
            />
        </div>
    );
}


// src/modules/qarza/pages/QarzaAccounts.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MapPin, Edit2, Trash2, Phone } from "lucide-react";
import { useSelector } from "react-redux";
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
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";
import { hasPermission } from "../../../shared/utilities/permissionUtils.js";

export default function QarzaAccounts() {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getQarzaLabels(language);
    const { permissions = [], role } = useSelector(s => s.auth) ?? {};

    const [deleteAccount] = useDeleteQarzaAccount();
    const [modal, setModal] = useState(null);

    // Helper function to format name to proper case
   const formatName = (name) => {
        if (!name) return "";
        return name
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Helper function to get initials from name
    const getInitials = (name) => {
        if (!name) return "";
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .join('')
            .slice(0, 2);
    };

    const handleDelete = async (id) => {
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
                        (role === "admin" || hasPermission(permissions, "accounts.create")) && (
                            <div onClick={() => setModal({ mode: "create" })}>
                                <ScreenTabButton lucideIcon={Plus} text={labels.addAccount} />
                            </div>
                        )
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
                                    const initials = getInitials(acc.name);
                                    const formattedName = formatName(acc.name);
                                    const imageUrl = acc.qarzaProfileImage 
                                        ? `${backendBaseUrl}/${acc.qarzaProfileImage}` 
                                        : null;
                                    
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
                                                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center" style={{ border: "1px solid var(--border)", background: "var(--surface-muted)" }}>
                                                        {imageUrl ? (
                                                            <img
                                                                src={imageUrl}
                                                                className="w-full h-full object-cover"
                                                                alt={acc.name}
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    e.target.parentElement.style.display = 'flex';
                                                                    e.target.parentElement.innerHTML = `<span class="text-sm font-bold" style="color: var(--accent-2)">${initials}</span>`;
                                                                }}
                                                            />
                                                        ) : (
                                                            <span className="text-sm font-bold" style={{ color: "var(--accent-2)" }}>{initials}</span>
                                                        )}
                                                    </div>
                                                    <span className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{formattedName}</span>
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
                                                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                    {(role === "admin" || hasPermission(permissions, "accounts.update")) && (
                                                        <PermissionGuard execute={() => setModal({ mode: "update", account: acc })} permission="accounts.update" isConfirmation={true}>
                                                            <button
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg transition"
                                                                style={{ color: "var(--muted)" }}
                                                                onMouseEnter={e => { e.currentTarget.style.color = "var(--accent-2)"; e.currentTarget.style.background = "rgba(15,118,110,0.08)"; }}
                                                                onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </PermissionGuard>
                                                    )}
                                                    {(role === "admin" || hasPermission(permissions, "accounts.delete")) && (
                                                        <PermissionGuard execute={() => handleDelete(acc._id)} permission="accounts.delete" isConfirmation={true}>
                                                            <button
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg transition"
                                                                style={{ color: "var(--muted)" }}
                                                                onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
                                                                onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </PermissionGuard>
                                                    )}
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


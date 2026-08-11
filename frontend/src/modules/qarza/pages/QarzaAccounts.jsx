// src/modules/qarza/pages/QarzaAccounts.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit2, Trash2, Eye, Filter, X } from "lucide-react";
import { useSelector } from "react-redux";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getQarzaLabels } from "../labels/qarzaLabels.js";
import { useQarzaAccountsPaginated, useDeleteQarzaAccount } from "../services/qarza.service.js";
import QarzaAccountModal from "../components/QarzaAccountModal.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import { toImageUrl } from "../../../shared/utilities/image.utility.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import BigViewImage from "../../../shared/components/BigViewImage.jsx";
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
    const [filterType, setFilterType] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterBalance, setFilterBalance] = useState("all");
    const [searchName, setSearchName] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    const hasActiveFilters = filterType !== "all" || filterStatus !== "all" || filterBalance !== "all" || searchName !== "";

    const clearFilters = () => {
        setFilterType("all");
        setFilterStatus("all");
        setFilterBalance("all");
        setSearchName("");
    };

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchName);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchName]);

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
                        (role === "admin" || hasPermission(permissions, "creditsAndDebitsAccounts.create")) && (
                            <div onClick={() => setModal({ mode: "create" })}>
                                <ScreenTabButton lucideIcon={Plus} text={labels.addAccount} />
                            </div>
                        )
                    }
                    rightActions={
                        <div className="relative">
                            <button
                                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all duration-150 ${
                                    hasActiveFilters 
                                        ? "border-(--accent-2) text-(--accent-2) bg-(--accent-2)/10" 
                                        : "border-(--border) text-(--muted) bg-(--surface-muted) hover:border-(--accent-2) hover:text-(--accent-2)"
                                }`}
                            >
                                <Filter size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">
                                    {language === "en" ? "Filter" : "فلٹر"}
                                </span>
                                {hasActiveFilters && (
                                    <div className="w-2 h-2 rounded-full bg-(--accent-2)" />
                                )}
                            </button>

                            {/* Filter Dropdown */}
                            {showFilterDropdown && (
                                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-(--border) bg-(--surface) shadow-xl z-50 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold uppercase tracking-wider text-(--muted)">
                                            {language === "en" ? "Filters" : "فلٹرز"}
                                        </span>
                                        {hasActiveFilters && (
                                            <button
                                                onClick={clearFilters}
                                                className="flex items-center gap-1 text-xs text-(--accent-2) hover:underline"
                                            >
                                                <X size={12} />
                                                {language === "en" ? "Clear" : "صاف"}
                                            </button>
                                        )}
                                    </div>

                                    {/* Search */}
                                    <div className="mb-3">
                                        <label className="block text-xs font-semibold mb-1.5 text-(--muted)">
                                            {language === "en" ? "Search" : "تلاش"}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Search by name..."
                                            value={searchName}
                                            onChange={(e) => setSearchName(e.target.value)}
                                            className="w-full px-3 py-2 text-sm rounded-xl border-2 border-(--border) bg-(--surface-muted) outline-none focus:border-(--accent-2) transition-all"
                                        />
                                    </div>

                                    {/* Type Filter */}
                                    <div className="mb-3">
                                        <label className="block text-xs font-semibold mb-1.5 text-(--muted)">
                                            {language === "en" ? "Type" : "قسم"}
                                        </label>
                                        <select
                                            value={filterType}
                                            onChange={(e) => setFilterType(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border-2 border-(--border) bg-(--surface-muted) text-sm outline-none focus:border-(--accent-2) transition-all"
                                        >
                                            <option value="all">{language === "en" ? "All Types" : "تمام اقسام"}</option>
                                            <option value="personal">{language === "en" ? "Personal" : "ذاتی"}</option>
                                            <option value="others">{language === "en" ? "Others" : "دیگر"}</option>
                                        </select>
                                    </div>

                                    {/* Status Filter */}
                                    <div className="mb-3">
                                        <label className="block text-xs font-semibold mb-1.5 text-(--muted)">
                                            {language === "en" ? "Status" : "حیثیت"}
                                        </label>
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border-2 border-(--border) bg-(--surface-muted) text-sm outline-none focus:border-(--accent-2) transition-all"
                                        >
                                            <option value="all">{language === "en" ? "All Status" : "تمام حیثیت"}</option>
                                            <option value="active">{language === "en" ? "Active" : "فعال"}</option>
                                            <option value="inactive">{language === "en" ? "Inactive" : "غیر فعال"}</option>
                                        </select>
                                    </div>

                                    {/* Balance Filter */}
                                    <div>
                                        <label className="block text-xs font-semibold mb-1.5 text-(--muted)">
                                            {language === "en" ? "Balance" : "بیلنس"}
                                        </label>
                                        <select
                                            value={filterBalance}
                                            onChange={(e) => setFilterBalance(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border-2 border-(--border) bg-(--surface-muted) text-sm outline-none focus:border-(--accent-2) transition-all"
                                        >
                                            <option value="all">{language === "en" ? "All Balances" : "تمام بیلنس"}</option>
                                            <option value="to_pay">{language === "en" ? "To Pay" : "ادا کرنا ہے"}</option>
                                            <option value="to_receive">{language === "en" ? "To Receive" : "وصول کرنا ہے"}</option>
                                            <option value="balanced">{language === "en" ? "Balanced" : "متوازن"}</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    }
                />
            </div>

            <PaginatedList
                rtkQuery={useQarzaAccountsPaginated}
                limit={20}
                dataKey="data"
                filter={{
                    search: debouncedSearch,
                    filterType,
                    filterStatus,
                    filterBalance
                }}
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
                                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>{labels.actions}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map(acc => {
                                    const net = netBalance(acc);
                                    const initials = getInitials(acc.name);
                                    const formattedName = formatName(acc.name);
                                    const imageUrl = acc.qarzaProfileImage 
                                        ? toImageUrl(acc.qarzaProfileImage) 
                                        : null;
                                    
                                    // Balance status: positive net = need to pay, negative net = need to receive
                                    const balanceStatus = net > 0 ? "To Pay" : net < 0 ? "To Receive" : "Balanced";
                                    const balanceColor = net > 0 ? "#dc2626" : net < 0 ? "var(--accent-2)" : "var(--muted)";
                                    const balanceBg = net > 0 ? "rgba(220,38,38,0.1)" : net < 0 ? "rgba(15,118,110,0.1)" : "rgba(107,114,128,0.1)";
                                    
                                    return (
                                        <tr
                                            key={acc._id}
                                            className="border-t transition-colors"
                                            style={{ borderColor: "var(--border)" }}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center" style={{ border: "1px solid var(--border)", background: "var(--surface-muted)" }}>
                                                        {imageUrl ? (
                                                            <BigViewImage
                                                                src={imageUrl}
                                                                alt={acc.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-sm font-bold" style={{ color: "var(--accent-2)" }}>{initials}</span>
                                                        )}
                                                    </div>
                                                    <span className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{formattedName}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold tabular-nums" style={{ color: balanceColor }}>
                                                        Rs {Math.abs(net).toLocaleString()}
                                                    </span>
                                                    <span className="text-xs px-2 py-0.5 rounded-md font-semibold"
                                                        style={{
                                                            background: balanceBg,
                                                            color: balanceColor
                                                        }}>
                                                        {balanceStatus}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{ color: "var(--muted)" }}>{acc.phoneNo || "-"}</td>
                                            <td className="px-4 py-3 text-sm" style={{ color: "var(--muted)" }}>
                                                <span className="truncate block max-w-[200px]">{acc.address || "-"}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => navigate(`/EachQarzaAccountRecord/${acc._id}`)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg transition"
                                                        style={{ color: "var(--muted)" }}
                                                        onMouseEnter={e => { e.currentTarget.style.color = "var(--accent-2)"; e.currentTarget.style.background = "rgba(15,118,110,0.08)"; }}
                                                        onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}
                                                        title="View Payments"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                                    {(role === "admin" || hasPermission(permissions, "creditsAndDebitsAccounts.update")) && (
                                                        <PermissionGuard execute={() => setModal({ mode: "update", account: acc })} permission="creditsAndDebitsAccounts.update" isConfirmation={true}>
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
                                                    {(role === "admin" || hasPermission(permissions, "creditsAndDebitsAccounts.delete")) && (
                                                        <PermissionGuard execute={() => handleDelete(acc._id)} permission="creditsAndDebitsAccounts.delete" isConfirmation={true}>
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


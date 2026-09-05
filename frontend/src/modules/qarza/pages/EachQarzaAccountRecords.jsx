// src/modules/qarza/pages/EachQarzaAccountRecords.jsx
import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Plus, Edit2, Trash2, ArrowDownLeft, ArrowUpRight, Download, Filter, X, RefreshCw } from "lucide-react";
import { useSelector } from "react-redux";
import {
    useAccountPaymentsPaginated,
    useAccountPaymentsSummary,
    useDeleteQarzaPayment,
    useRecalculateGeneralBalance,
} from "../services/qarza.service.js";
import QarzaPaymentModal from "../components/QarzaPaymentModal.jsx";
import QarzaPaymentPdfTemplate from "../components/QarzaPaymentPdfTemplate.jsx";
import PdfModal from "../../../shared/components/PdfModal.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";
import { hasPermission } from "../../../shared/utilities/permissionUtils.js";
import ConfirmDialog from "../../../shared/components/ConfirmationDialog.jsx";

const STATUS_COLOR = {
    cashin: { bg: "rgba(16,185,129,0.1)", text: "#10b981", Icon: ArrowDownLeft },
    cashout: { bg: "rgba(239,68,68,0.1)", text: "#ef4444", Icon: ArrowUpRight },
};

const getPaymentType = (item) => {
    // Use creditType for transactions, fallback to type for old qarza payments
    return item.creditType || item.type || 'cashin';
};

export default function EachQarzaAccountRecords() {
    const { id } = useParams();
    console.log("the account id", id)
    const language = useSelector(s => s.auth?.user?.language ?? "en");
    const { permissions = [], role } = useSelector(s => s.auth) ?? {};

    const { data: summary } = useAccountPaymentsSummary(id);
    const [deletePayment] = useDeleteQarzaPayment();
    const [recalculateGeneralBalance] = useRecalculateGeneralBalance();
    const [isRecalculating, setIsRecalculating] = useState(false);
    const accountName = summary?.account?.name || "";
    const overallBalance = Number(summary?.overall || 0);
    const overallStatus = overallBalance > 0 ? "To Give" : overallBalance < 0 ? "To Receive" : "Balanced";

    const [modal, setModal] = useState(null);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [selectedPaymentForPdf, setSelectedPaymentForPdf] = useState(null);
    
    // Filter states
    const [filterType, setFilterType] = useState("all");
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    const refresh = useCallback(() => {}, []);

    const clearFilters = () => {
        setFilterType("all");
    };

    const hasActiveFilters = filterType !== "all";

    const handleDelete = async (paymentId) => {
        try {
            await deletePayment({ paymentId, qarzaAccountId: id }).unwrap();
            showSuccess("Payment deleted");
            refresh();
        } catch (e) {
            showError(e?.data?.message ?? "Delete failed");
        }
    };

    const handleRecalculateBalance = async () => {
        setIsRecalculating(true);
        try {
            await recalculateGeneralBalance(id).unwrap();
            showSuccess("Balance recalculated successfully");
            refresh();
        } catch (error) {
            showError(error?.data?.message || "Failed to recalculate balance");
        } finally {
            setIsRecalculating(false);
        }
    };

    const renderItems = (items) => {
        if (!items?.length) return null;

        return (
            <div className="flex flex-col gap-0">
                {/* Desktop header */}
                <div className="hidden lg:grid lg:grid-cols-7 gap-3 px-5 py-3 rounded-t-2xl text-xs font-bold uppercase tracking-wider"
                    style={{ background: "var(--surface-muted)", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                    <div className="col-span-1">{language === "en" ? "Type" : "قسم"}</div>
                    <div className="col-span-1">{language === "en" ? "Amount" : "رقم"}</div>
                    <div className="col-span-1">{language === "en" ? "Payment Method" : "ادائیگی کا طریقہ"}</div>
                    <div className="col-span-2">{language === "en" ? "Notes" : "نوٹس"}</div>
                    <div className="col-span-1">{language === "en" ? "Date" : "تاریخ"}</div>
                    <div className="col-span-1">{language === "en" ? "Actions" : "اقدامات"}</div>
                </div>

                {/* Desktop rows */}
                {items.map((item) => {
                    const paymentType = getPaymentType(item);
                    const { bg, text, Icon } = STATUS_COLOR[paymentType] ?? STATUS_COLOR.cashin;
                    return (
                        <div key={item._id}
                            className="hidden lg:grid lg:grid-cols-7 gap-3 px-5 py-3.5 items-center transition-all duration-150 hover:bg-(--surface-muted) group"
                            style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                            <div className="col-span-1 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
                                    <Icon className="w-4 h-4" style={{ color: text }} />
                                </div>
                                <span className="text-xs font-semibold uppercase" style={{ color: text }}>{paymentType}</span>
                            </div>
                            <div className="col-span-1">
                                <p className="font-bold text-sm tabular-nums" style={{ color: text }}>
                                    Rs {(item.amount || 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="col-span-1">
                                <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
                                    {item.paymentMethodName || item.paymentMethod?.name || "-"}
                                </p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-xs truncate max-w-[200px]" style={{ color: "var(--muted)" }}>
                                    {item.notes || "-"}
                                </p>
                            </div>
                            <div className="col-span-1 text-sm" style={{ color: "var(--muted)" }}>
                                {new Date(item.transactionDate || item.date).toLocaleDateString()}
                            </div>
                            <div onClick={e => e.stopPropagation()} className="col-span-1 flex items-center gap-1.5">
                                <button
                                    onClick={() => {
                                        setSelectedPaymentForPdf(item);
                                        setShowPdfModal(true);
                                    }}
                                    className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) transition-all duration-150 hover:scale-105 hover:border-(--accent-2) hover:text-(--accent-2)"
                                >
                                    <Download size={15} />
                                </button>
                                {(role === "admin" || hasPermission(permissions, "creditsAndDebitsAccounts.payment.update")) && (
                                    <button onClick={() => setModal({ mode: "update", payment: item })}
                                        className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) transition-all duration-150 hover:scale-105 hover:border-(--accent-2) hover:text-(--accent-2)">
                                        <Edit2 size={15} />
                                    </button>
                                )}
                                {(role === "admin" || hasPermission(permissions, "creditsAndDebitsAccounts.payment.delete")) && (
                                    <ConfirmDialog message="Delete this payment?" onConfirm={() => handleDelete(item._id)}>
                                        <button
                                            className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) transition-all duration-150 hover:scale-105 hover:border-red-400 hover:text-red-500">
                                            <Trash2 size={15} />
                                        </button>
                                    </ConfirmDialog>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Mobile / Tablet cards */}
                <div className="lg:hidden flex flex-col gap-3 pt-1">
                    {items.map((item) => {
                        const paymentType = getPaymentType(item);
                        const { bg, text, Icon } = STATUS_COLOR[paymentType] ?? STATUS_COLOR.cashin;
                        return (
                            <div key={`m-${item._id}`} className="rounded-2xl p-4 border transition-all duration-150 hover:shadow-md"
                                style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "0 2px 12px rgba(64,45,28,0.07)" }}>
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
                                        <Icon className="w-6 h-6" style={{ color: text }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-semibold uppercase" style={{ color: text }}>{paymentType}</span>
                                            <p className="font-bold text-sm tabular-nums" style={{ color: text }}>
                                                Rs {(item.amount || 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
                                            {item.paymentMethodName || item.paymentMethod?.name || "-"}
                                        </p>
                                        <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
                                            {item.notes || "-"}
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                                            {new Date(item.transactionDate || item.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div onClick={e => e.stopPropagation()} className="flex gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                                    <button
                                        onClick={() => {
                                            setSelectedPaymentForPdf(item);
                                            setShowPdfModal(true);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all border hover:border-(--accent-2) hover:text-(--accent-2)"
                                        style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--muted)" }}
                                    >
                                        <Download size={14} />
                                    </button>
                                    {(role === "admin" || hasPermission(permissions, "creditsAndDebitsAccounts.payment.update")) && (
                                        <button onClick={() => setModal({ mode: "update", payment: item })}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all border hover:border-(--accent-2) hover:text-(--accent-2)"
                                            style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--muted)" }}>
                                            <Edit2 size={14} />
                                        </button>
                                    )}
                                    {(role === "admin" || hasPermission(permissions, "creditsAndDebitsAccounts.payment.delete")) && (
                                        <ConfirmDialog message="Delete this payment?" onConfirm={() => handleDelete(item._id)}>
                                            <button
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all border hover:border-red-400 hover:text-red-500"
                                                style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--muted)" }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </ConfirmDialog>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden">
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
                    heading={`${language === "en" ? "Account Payments" : "اکاؤنٹ ادائیگیاں"} ${accountName ? `(${accountName})` : ''}`}
                    subheading={language === "en" ? "View and manage payment records" : "ادائیگی ریکارڈز دیکھیں اور انتظام کریں"}
                    leftActions={
                        <div className="flex gap-2">
                            <button
                                onClick={handleRecalculateBalance}
                                disabled={isRecalculating}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RefreshCw size={16} className={isRecalculating ? "animate-spin" : ""} />
                                {isRecalculating ? "Recalculating..." : "Recalculate Balance"}
                            </button>
                            {(role === "admin" || hasPermission(permissions, "creditsAndDebitsAccounts.payment.create")) && (
                                <PermissionGuard 
                                    execute={() => setModal({ mode: "create" })} 
                                    permission="creditsAndDebitsAccounts.payment.create" 
                                    isConfirmation={false}
                                >
                                    <div>
                                        <ScreenTabButton lucideIcon={Plus} text={language === "en" ? "Add Payment" : "ادائیگی شامل کریں"} />
                                    </div>
                                </PermissionGuard>
                            )}
                        </div>
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
                                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-(--border) bg-(--surface) shadow-xl z-50 p-4">
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

                                    {/* Type Filter */}
                                    <div>
                                        <label className="block text-xs font-semibold mb-1.5 text-(--muted)">
                                            {language === "en" ? "Type" : "قسم"}
                                        </label>
                                        <select
                                            value={filterType}
                                            onChange={(e) => setFilterType(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border-2 border-(--border) bg-(--surface-muted) text-sm outline-none focus:border-(--accent-2) transition-all"
                                        >
                                            <option value="all">{language === "en" ? "All Types" : "تمام اقسام"}</option>
                                            <option value="cashin">{language === "en" ? "Cash In" : "کیش ان"}</option>
                                            <option value="cashout">{language === "en" ? "Cash Out" : "کیش آؤٹ"}</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    }
                />
            </div>

            {/* summary cards */}
            {summary && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { 
                            label: "Cash In", 
                            value: summary.cashIn || 0, 
                            color: "#10b981", 
                            bg: "rgba(16,185,129,0.08)" 
                        },
                        { 
                            label: "Cash Out", 
                            value: summary.cashOut || 0, 
                            color: "#ef4444", 
                            bg: "rgba(239,68,68,0.08)" 
                        },
                        { 
                            label: "Overall", 
                            value: summary.overall || 0,
                            color: (summary.overall || 0) >= 0 ? "var(--accent-2)" : "#ef4444",
                            bg: (summary.overall || 0) >= 0 ? "rgba(15,118,110,0.08)" : "rgba(239,68,68,0.08)"
                        },
                    ].map(({ label, value, color, bg }) => (
                        <div key={label} className="rounded-2xl p-4"
                            style={{ background: bg, border: "1px solid var(--border)" }}>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>
                                {label}
                            </p>
                            <p className="text-xl font-black tabular-nums" style={{ color }}>
                                Rs {Math.abs(value).toLocaleString()}
                            </p>
                            {label === "Overall" && (
                                <p className="text-xs font-bold uppercase tracking-wider mt-2" style={{ color }}>
                                    {overallStatus}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* payments list */}
            <div className="flex-1 overflow-hidden">
                <PaginatedList
                    rtkQuery={useAccountPaymentsPaginated}
                    limit={20}
                    dataKey="data"
                    wrapperClassName="h-full"
                    renderItems={renderItems}
                    filter={{
                        type: filterType !== "all" ? filterType : undefined,
                    }}
                    queryArgs={{ qarzaAccountId: id }}
                />
            </div>
            {showPdfModal && selectedPaymentForPdf && (
                <PdfModal
                    isOpen={showPdfModal}
                    onClose={() => {
                        setShowPdfModal(false);
                        setSelectedPaymentForPdf(null);
                    }}
                    fileName={`Payment-${selectedPaymentForPdf._id}.pdf`}
                    labels={{}}
                >
                    <QarzaPaymentPdfTemplate 
                        payment={selectedPaymentForPdf} 
                        account={summary?.account || {}} 
                        summary={summary || {}} 
                        labels={{}} 
                    />
                </PdfModal>
            )}
        </div>
    );
}


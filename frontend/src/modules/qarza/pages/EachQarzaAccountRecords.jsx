// src/modules/qarza/pages/EachQarzaAccountRecords.jsx
import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Plus, Edit2, Trash2, ArrowDownLeft, ArrowUpRight, Download } from "lucide-react";
import { useSelector } from "react-redux";
import {
    useAccountPaymentsPaginated,
    useAccountPaymentsSummary,
    useDeleteQarzaPayment,
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

const STATUS_COLOR = {
    cashin: { bg: "rgba(16,185,129,0.1)", text: "#10b981", Icon: ArrowDownLeft },
    cashout: { bg: "rgba(239,68,68,0.1)", text: "#ef4444", Icon: ArrowUpRight },
};

export default function EachQarzaAccountRecords() {
    const { id } = useParams();
    console.log("the account id", id)
    const language = useSelector(s => s.auth?.user?.language ?? "en");
    const { permissions = [], role } = useSelector(s => s.auth) ?? {};

    const { data: summary } = useAccountPaymentsSummary(id);
    const [deletePayment] = useDeleteQarzaPayment();

    const [modal, setModal] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [selectedPaymentForPdf, setSelectedPaymentForPdf] = useState(null);

    const refresh = useCallback(() => { setCurrentPage(1); }, []);

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

    const renderItems = (items) => {
        if (!items?.length) return null;

        return (
            <div className="flex flex-col gap-0">
                {/* Desktop header */}
                <div className="hidden lg:grid lg:grid-cols-6 gap-3 px-5 py-3 rounded-t-2xl text-xs font-bold uppercase tracking-wider"
                    style={{ background: "var(--surface-muted)", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                    <div className="col-span-1">{language === "en" ? "Type" : "قسم"}</div>
                    <div className="col-span-1">{language === "en" ? "Amount" : "رقم"}</div>
                    <div className="col-span-2">{language === "en" ? "Notes" : "نوٹس"}</div>
                    <div className="col-span-1">{language === "en" ? "Date" : "تاریخ"}</div>
                    <div className="col-span-1">{language === "en" ? "Actions" : "اقدامات"}</div>
                </div>

                {/* Desktop rows */}
                {items.map((item) => {
                    const { bg, text, Icon } = STATUS_COLOR[item.type] ?? STATUS_COLOR.cashin;
                    return (
                        <div key={item._id}
                            className="hidden lg:grid lg:grid-cols-6 gap-3 px-5 py-3.5 items-center transition-all duration-150 hover:bg-(--surface-muted) group"
                            style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                            <div className="col-span-1 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
                                    <Icon className="w-4 h-4" style={{ color: text }} />
                                </div>
                                <span className="text-xs font-semibold uppercase" style={{ color: text }}>{item.type}</span>
                            </div>
                            <div className="col-span-1">
                                <p className="font-bold text-sm tabular-nums" style={{ color: text }}>
                                    Rs {(item.amount || 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-xs truncate max-w-[200px]" style={{ color: "var(--muted)" }}>
                                    {item.notes || "-"}
                                </p>
                            </div>
                            <div className="col-span-1 text-sm" style={{ color: "var(--muted)" }}>
                                {new Date(item.date).toLocaleDateString()}
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
                                    <button onClick={() => handleDelete(item._id)}
                                        className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) transition-all duration-150 hover:scale-105 hover:border-red-400 hover:text-red-500">
                                        <Trash2 size={15} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Mobile / Tablet cards */}
                <div className="lg:hidden flex flex-col gap-3 pt-1">
                    {items.map((item) => {
                        const { bg, text, Icon } = STATUS_COLOR[item.type] ?? STATUS_COLOR.cashin;
                        return (
                            <div key={`m-${item._id}`} className="rounded-2xl p-4 border transition-all duration-150 hover:shadow-md"
                                style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "0 2px 12px rgba(64,45,28,0.07)" }}>
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
                                        <Icon className="w-6 h-6" style={{ color: text }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-semibold uppercase" style={{ color: text }}>{item.type}</span>
                                            <p className="font-bold text-sm tabular-nums" style={{ color: text }}>
                                                Rs {(item.amount || 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
                                            {item.notes || "-"}
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                                            {new Date(item.date).toLocaleDateString()}
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
                                        <button onClick={() => handleDelete(item._id)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all border hover:border-red-400 hover:text-red-500"
                                            style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--muted)" }}>
                                            <Trash2 size={14} />
                                        </button>
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
                    heading={language === "en" ? "Account Payments" : "اکاؤنٹ ادائیگیاں"}
                    subheading={language === "en" ? "View and manage payment records" : "ادائیگی ریکارڈز دیکھیں اور انتظام کریں"}
                    leftActions={
                        (role === "admin" || hasPermission(permissions, "creditsAndDebitsAccounts.payment.create")) && (
                            <PermissionGuard 
                                execute={() => setModal({ mode: "create" })} 
                                permission="creditsAndDebitsAccounts.payment.create" 
                                isConfirmation={false}
                            >
                                <div>
                                    <ScreenTabButton lucideIcon={Plus} text={language === "en" ? "Add Payment" : "ادائیگی شامل کریں"} />
                                </div>
                            </PermissionGuard>
                        )
                    }
                />
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
                            style={{ background: bg, border: "1px solid var(--border)" }}>
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
            <div className="flex-1 overflow-hidden">
                <PaginatedList
                    rtkQuery={useAccountPaymentsPaginated}
                    limit={20}
                    dataKey="data"
                    wrapperClassName="h-full"
                    renderItems={renderItems}
                    queryArgs={{ qarzaAccountId: id, page: currentPage, limit: 20 }}
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


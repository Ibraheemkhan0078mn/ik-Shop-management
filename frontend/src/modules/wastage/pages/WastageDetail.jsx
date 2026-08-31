import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { getWastageLabels } from "../labels/wastageLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { useWastage } from "../services/wastage.service.js";
import { useState } from "react";
import WastageDetailPdfTemplate from "../components/WastageDetailPdfTemplate.jsx";
import PdfModal from "../../../shared/components/PdfModal.jsx";

const STATUS_STYLE = {
    draft:    { background: "rgba(107,114,128,0.1)", color: "#6b7280", text: "Draft" },
    pending:  { background: "rgba(180,83,9,0.1)", color: "#d97706", text: "Pending" },
    approved: { background: "rgba(15,118,110,0.1)", color: "var(--accent-2)", text: "Approved" },
    rejected: { background: "rgba(220,38,38,0.1)", color: "#dc2626", text: "Rejected" },
};

export default function WastageDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [showPdfModal, setShowPdfModal] = useState(false);
    
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getWastageLabels(language);
    
    const { data: wastageData, isLoading } = useWastage(id);
    const wastage = wastageData?.data || wastageData;

    if (isLoading) {
        return <div className="p-6 text-center">{labels.loading || "Loading..."}</div>;
    }

    if (!wastage) {
        return <div className="p-6 text-center">Wastage not found</div>;
    }

    const status = wastage?.status ?? "draft";
    const statusStyle = STATUS_STYLE[status] ?? STATUS_STYLE.draft;
    const date = new Date(wastage?.wastageDate ?? wastage?.createdAt).toLocaleDateString();

    return (
        <>
            <div className="min-h-screen bg-[var(--app-bg)]">
                <div className="max-w-5xl mx-auto px-6 py-8">

                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate("/wastage")}
                                className="p-2 -ml-2 hover:bg-[var(--hover)] rounded-lg transition-all"
                            >
                                <ArrowLeft size={20} className="text-[var(--ink)]" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-[var(--ink)] font-display leading-tight">
                                    {labels.wastageDetails || "Wastage Details"}
                                </h1>
                                <p className="text-sm text-[var(--muted)]">
                                    {wastage?.wastageNumber || "—"} · {date}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowPdfModal(true)}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--accent-2)] text-white rounded-lg hover:bg-[var(--accent-2)]/90 transition-all shadow-sm"
                            >
                                <Download size={15} />
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Paper sheet - Invoice-style layout */}
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm px-8 py-8">

                        {/* Company Header */}
                        <div className="text-center mb-6">
                            <div className="inline-flex flex-col items-center leading-none mb-2">
                                <span className="text-3xl font-extrabold tracking-wide text-[var(--ink)]" style={{ letterSpacing: "2px" }}>LOGIN</span>
                                <span className="text-xs font-semibold tracking-[0.3em] text-[var(--muted)] mt-1">LARAIB</span>
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-center text-[var(--ink)] mb-6">
                            Afrasiab Mobile Accesories
                        </h2>
                        <p className="text-center text-sm font-semibold text-[var(--muted)] -mt-4 mb-6 uppercase tracking-wide">
                            {labels.wastageDetails || "Wastage Details"}
                        </p>

                        {/* Wastage Meta Row */}
                        <div className="flex justify-between items-start mb-6 gap-6">
                            <div>
                                <p className="text-xs font-semibold text-[var(--muted)] mb-1">Reason:</p>
                                <p className="text-sm font-bold text-[var(--ink)] capitalize">{wastage?.reason?.replace(/_/g, " ") || "—"}</p>
                            </div>
                            <div className="flex flex-col gap-2 min-w-[240px]">
                                <div className="border border-[var(--border)] px-3 py-2 flex justify-between text-sm" style={{ background: "var(--surface-muted)" }}>
                                    <span className="font-semibold text-[var(--ink)]">Wastage #: {wastage?.wastageNumber || "—"}</span>
                                    <span className="font-semibold text-[var(--ink)]">Date: {date}</span>
                                </div>
                                <div className="border border-[var(--border)] px-3 py-2 flex justify-between text-sm" style={{ background: "var(--surface-muted)" }}>
                                    <span className="font-semibold text-[var(--ink)]">Status:</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                        status === "approved" ? "bg-green-100 text-green-700" :
                                        status === "pending" ? "bg-yellow-100 text-yellow-700" :
                                        status === "rejected" ? "bg-red-100 text-red-700" :
                                        "bg-gray-100 text-gray-700"
                                    }`}>{statusStyle.text}</span>
                                </div>
                            </div>
                        </div>

                        {wastage?.notes && (
                            <p className="text-sm text-[var(--muted)] mb-6 italic">
                                {wastage.notes}
                            </p>
                        )}

                    {/* Financial KPI row */}
                    <div className="flex flex-wrap items-start justify-between gap-6 mb-6">
                        <div>
                            <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Total Items</p>
                            <p className="text-2xl font-bold text-[var(--ink)]">{wastage?.totalItems || wastage?.items?.length || 0}</p>
                        </div>
                        <div>
                            <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Total Quantity</p>
                            <p className="text-2xl font-bold text-[var(--ink)]">{wastage?.totalQuantity || 0}</p>
                        </div>
                        <div>
                            <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Total Loss Amount</p>
                            <p className="text-2xl font-bold text-red-600">Rs {(wastage?.totalLossAmount ?? 0).toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Items Table - Invoice style */}
                    <table className="w-full border-collapse mb-4 text-sm">
                        <thead>
                            <tr className="text-[var(--ink)]" style={{ background: "var(--accent-2)" }}>
                                <th className="px-3 py-2 text-left font-semibold text-white">#</th>
                                <th className="px-3 py-2 text-left font-semibold text-white">Item &amp; Description</th>
                                <th className="px-3 py-2 text-right font-semibold text-white">Qty</th>
                                <th className="px-3 py-2 text-right font-semibold text-white">Cost Price</th>
                                <th className="px-3 py-2 text-right font-semibold text-white">Loss Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {wastage?.items?.map((item, index) => (
                                <React.Fragment key={index}>
                                    <tr className="border-b border-[var(--border)]">
                                        <td className="px-3 py-2 text-[var(--ink)]">{index + 1}</td>
                                        <td className="px-3 py-2 text-[var(--ink)]">
                                            {item.product?.name || item.productName || "—"}
                                            {item.product?._id && <span className="text-xs text-[var(--muted)] block">ID: {item.product._id}</span>}
                                            {item.batchNumber && <span className="text-xs text-[var(--muted)] block">Batch: {item.batchNumber}</span>}
                                        </td>
                                        <td className="px-3 py-2 text-right text-[var(--ink)]">{item.quantity || 0}</td>
                                        <td className="px-3 py-2 text-right text-[var(--ink)]">Rs {(item.costPrice || 0).toLocaleString()}</td>
                                        <td className="px-3 py-2 text-right font-semibold text-red-600">Rs {((item.quantity || 0) * (item.costPrice || 0)).toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan="5" className="px-2 sm:px-3 py-4" style={{ background: "var(--surface-muted)" }}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Item Details</p>
                                                    <div className="text-xs space-y-1">
                                                        <div className="flex justify-between">
                                                            <span style={{ color: "var(--ink)" }}>Product ID:</span>
                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>{item.product?._id || item.productId || "—"}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span style={{ color: "var(--ink)" }}>Product Name:</span>
                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>{item.product?.name || item.productName || "—"}</span>
                                                        </div>
                                                        {item.batchNumber && (
                                                            <div className="flex justify-between">
                                                                <span style={{ color: "var(--ink)" }}>Batch Number:</span>
                                                                <span className="font-mono" style={{ color: "var(--ink)" }}>{item.batchNumber}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between">
                                                            <span style={{ color: "var(--ink)" }}>Quantity:</span>
                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>{item.quantity || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Loss Calculation</p>
                                                    <div className="text-xs space-y-1">
                                                        <div className="flex justify-between">
                                                            <span style={{ color: "var(--ink)" }}>Cost Price:</span>
                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {(item.costPrice || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span style={{ color: "var(--ink)" }}>Quantity:</span>
                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>{item.quantity || 0}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span style={{ color: "var(--ink)" }}>Line Total:</span>
                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {((item.costPrice || 0) * (item.quantity || 0)).toLocaleString()}</span>
                                                        </div>
                                                        <div className="h-px bg-[var(--border)] my-1"></div>
                                                        <div className="flex justify-between font-semibold">
                                                            <span style={{ color: "var(--ink)" }}>Loss Amount:</span>
                                                            <span className="font-mono text-red-600">Rs {((item.quantity || 0) * (item.costPrice || 0)).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </React.Fragment>
                            ))}
                            <tr className="font-semibold" style={{ background: "var(--surface-muted)" }}>
                                <td className="px-3 py-2 text-[var(--ink)]" colSpan={4}>Total Loss</td>
                                <td className="px-3 py-2 text-right font-bold text-red-600">Rs {(wastage?.totalLossAmount ?? 0).toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Sign-off Bar */}
                    <div className="border border-[var(--border)] mt-6 mb-4">
                        <div className="flex text-sm">
                            <div className="w-1/2 text-center py-3 border-r border-[var(--border)]">
                                <p>Prepared By</p>
                                <p className="font-semibold mt-1 text-[var(--ink)]">SyedSoft</p>
                            </div>
                            <div className="w-1/2 text-center py-3">
                                <p>Approved By</p>
                                <p className="font-semibold mt-1 text-[var(--ink)]">Afrasiab Mobile Accesories</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-start text-xs text-[var(--muted)]">
                        <p className="italic max-w-[70%]">This is a computer generated document, does not required any signature</p>
                        <p>Print Time: {new Date().toLocaleString()}</p>
                    </div>
                    </div>
                </div>
            </div>

            {showPdfModal && (
                <PdfModal
                    isOpen={showPdfModal}
                    onClose={() => setShowPdfModal(false)}
                    fileName={`Wastage-${wastage?.wastageNumber || 'details'}.pdf`}
                    labels={labels}
                >
                    <WastageDetailPdfTemplate wastage={wastage} labels={labels} />
                </PdfModal>
            )}
        </>
    );
}

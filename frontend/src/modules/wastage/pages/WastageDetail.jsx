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
        <div className="h-screen flex flex-col bg-[var(--app-bg)]">
            {/* Header */}
            <div className="flex-none px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/wastage")}
                            className="p-2 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--ink)]"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-[var(--ink)]">{wastage?.wastageNumber}</h1>
                            <p className="text-sm text-[var(--muted)]">{labels.wastageDetails || "Wastage Details"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowPdfModal(true)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--hover)] rounded-lg transition-all"
                            title="Export PDF"
                        >
                            <Download size={15} />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-6xl mx-auto">
                    {/* Status row */}
                    <div className="flex items-center justify-between mb-6">
                        <span
                            className="px-4 py-2 rounded-full text-sm font-medium"
                            style={{ background: statusStyle.background, color: statusStyle.color }}
                        >
                            {statusStyle.text}
                        </span>
                    </div>

                    <div className="border-b border-[var(--border)] my-6" />

                    {/* Wastage Information */}
                    <div className="mb-6">
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Wastage Information</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-wider text-[var(--muted)] mb-1">Wastage Number</p>
                                <p className="text-sm font-semibold text-[var(--ink)]">{wastage?.wastageNumber}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider text-[var(--muted)] mb-1">Reason</p>
                                <p className="text-sm font-semibold text-[var(--ink)] capitalize">{wastage?.reason?.replace(/_/g, " ") || "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider text-[var(--muted)] mb-1">Wastage Date</p>
                                <p className="text-sm font-semibold text-[var(--ink)]">{date}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider text-[var(--muted)] mb-1">Status</p>
                                <p className="text-sm font-semibold text-[var(--ink)] capitalize">{statusStyle.text}</p>
                            </div>
                        </div>
                        {wastage?.notes && (
                            <p className="text-sm text-[var(--muted)] mt-4 italic">{wastage.notes}</p>
                        )}
                    </div>

                    <div className="border-b border-[var(--border)] my-6" />

                    {/* Financial Details */}
                    <div className="mb-6">
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Financial Details</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-wider text-[var(--muted)] mb-1">Total Items</p>
                                <p className="text-sm font-semibold text-[var(--ink)]">{wastage?.totalItems || wastage?.items?.length || 0}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider text-[var(--muted)] mb-1">Total Quantity</p>
                                <p className="text-sm font-semibold text-[var(--ink)]">{wastage?.totalQuantity || 0}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider text-[var(--muted)] mb-1">Total Loss Amount</p>
                                <p className="text-sm font-semibold text-red-600">Rs {(wastage?.totalLossAmount ?? 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-b border-[var(--border)] my-6" />

                    {/* Items - Single Sheet Preview */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                                Wasted Items ({wastage?.items?.length || 0})
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--border)]">
                                        <th className="px-4 py-3 text-left text-[var(--muted)] font-medium">{labels.productName || "Product"}</th>
                                        <th className="px-4 py-3 text-center text-[var(--muted)] font-medium">{labels.quantity || "Qty"}</th>
                                        <th className="px-4 py-3 text-right text-[var(--muted)] font-medium">{labels.costPrice || "Cost Price"}</th>
                                        <th className="px-4 py-3 text-right text-[var(--muted)] font-medium">{labels.lossAmount || "Loss Amount"}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {wastage?.items?.map((item, index) => (
                                        <React.Fragment key={index}>
                                            <tr className="border-b border-[var(--border)]">
                                                <td className="px-4 py-3 text-[var(--ink)]">
                                                    <p className="font-medium">{item.product?.name || item.productName || "—"}</p>
                                                    {item.product?._id && <p className="text-xs text-[var(--muted)]">ID: {item.product._id}</p>}
                                                    {item.batchNumber && <p className="text-xs text-[var(--muted)]">Batch: {item.batchNumber}</p>}
                                                </td>
                                                <td className="px-4 py-3 text-center text-[var(--ink)]">{item.quantity || 0}</td>
                                                <td className="px-4 py-3 text-right text-[var(--ink)]">Rs {(item.costPrice || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right font-semibold text-red-600">Rs {((item.quantity || 0) * (item.costPrice || 0)).toLocaleString()}</td>
                                            </tr>
                                            <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)]">
                                                <td colSpan="4" className="px-4 py-3">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div className="p-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
                                                            <p className="text-xs font-semibold text-[var(--muted)] mb-2">Item Details</p>
                                                            <div className="text-xs space-y-1">
                                                                <div className="flex justify-between">
                                                                    <span className="text-[var(--muted)]">Product ID:</span>
                                                                    <span className="font-mono text-[var(--ink)]">{item.product?._id || item.productId || "—"}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-[var(--muted)]">Product Name:</span>
                                                                    <span className="font-mono text-[var(--ink)]">{item.product?.name || item.productName || "—"}</span>
                                                                </div>
                                                                {item.batchNumber && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-[var(--muted)]">Batch Number:</span>
                                                                        <span className="font-mono text-[var(--ink)]">{item.batchNumber}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex justify-between">
                                                                    <span className="text-[var(--muted)]">Quantity:</span>
                                                                    <span className="font-mono text-[var(--ink)]">{item.quantity || 0}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="p-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
                                                            <p className="text-xs font-semibold text-[var(--muted)] mb-2">Loss Calculation</p>
                                                            <div className="text-xs space-y-1">
                                                                <div className="flex justify-between">
                                                                    <span className="text-[var(--muted)]">Cost Price:</span>
                                                                    <span className="font-mono text-[var(--ink)]">Rs {(item.costPrice || 0).toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-[var(--muted)]">Quantity:</span>
                                                                    <span className="font-mono text-[var(--ink)]">{item.quantity || 0}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-[var(--muted)]">Line Total:</span>
                                                                    <span className="font-mono text-[var(--ink)]">Rs {((item.costPrice || 0) * (item.quantity || 0)).toLocaleString()}</span>
                                                                </div>
                                                                <div className="h-px bg-[var(--border)] my-1"></div>
                                                                <div className="flex justify-between font-semibold">
                                                                    <span className="text-[var(--ink)]">Loss Amount:</span>
                                                                    <span className="font-mono text-red-600">Rs {((item.quantity || 0) * (item.costPrice || 0)).toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                </tbody>
                                <tfoot style={{ background: "var(--surface-muted)", borderTop: "2px solid var(--border)" }}>
                                    <tr>
                                        <td colSpan="3" className="px-4 py-3 text-right font-bold text-[var(--ink)]">
                                            {labels.totalLoss || "Total Loss"}:
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-red-600 text-lg">
                                            Rs {(wastage?.totalLossAmount ?? 0).toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
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
        </div>
    );
}

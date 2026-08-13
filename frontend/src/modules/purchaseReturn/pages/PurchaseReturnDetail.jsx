import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Eye, EyeOff } from "lucide-react";
import { getPurchaseReturnLabels } from "../labels/purchaseReturnLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getPurchaseReturnByIdApi } from "../api/purchaseReturnApi.js";
import PurchaseReturnDetailPdfTemplate from "../components/PurchaseReturnDetailPdfTemplate.jsx";
import PdfModal from "../../../shared/components/PdfModal.jsx";

const STATUS_STYLE = {
    draft: { background: "rgba(107,114,128,0.1)", color: "#6b7280", text: "Draft" },
    pending: { background: "rgba(180,83,9,0.1)", color: "#d97706", text: "Pending" },
    approved: { background: "rgba(15,118,110,0.1)", color: "var(--accent-2)", text: "Approved" },
    rejected: { background: "rgba(220,38,38,0.1)", color: "#dc2626", text: "Rejected" },
};

export default function PurchaseReturnDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [expandedItems, setExpandedItems] = useState({});
    const [purchaseReturn, setPurchaseReturn] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getPurchaseReturnLabels(language);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await getPurchaseReturnByIdApi(id);
                setPurchaseReturn(result.data);
            } catch (error) {
                console.error("Error fetching purchase return:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (isLoading) {
        return <div className="p-6 text-center">{labels.loading || "Loading..."}</div>;
    }

    if (!purchaseReturn) {
        return <div className="p-6 text-center">Purchase Return not found</div>;
    }

    const status = purchaseReturn?.status ?? "draft";
    const statusStyle = STATUS_STYLE[status] ?? STATUS_STYLE.draft;
    const date = new Date(purchaseReturn?.returnDate ?? purchaseReturn?.createdAt).toLocaleDateString();

    return (
        <>
            <div className="min-h-screen bg-[var(--app-bg)]">
                <div className="max-w-5xl mx-auto px-6 py-8">

                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 -ml-2 hover:bg-[var(--hover)] rounded-lg transition-all"
                            >
                                <ArrowLeft size={20} className="text-[var(--ink)]" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-[var(--ink)] font-display leading-tight">
                                    {labels.purchaseReturnDetails || "Purchase Return Details"}
                                </h1>
                                <p className="text-sm text-[var(--muted)]">
                                    {purchaseReturn.purchaseReturnNumber || purchaseReturn.returnNumber || "—"} · {date}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowPdfModal(true)}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--accent-2)] text-white rounded-lg hover:bg-[var(--accent-2)]/90 transition-all shadow-sm"
                            >
                                <Download size={15} />
                                {labels.exportDetails || "Export"}
                            </button>
                        </div>
                    </div>

                    {/* Paper sheet */}
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm px-8 py-8">

                        {/* Return info row */}
                        <div className="flex flex-wrap items-start justify-between gap-6">
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Return Number</p>
                                <p className="text-base font-semibold text-[var(--ink)]">{purchaseReturn.purchaseReturnNumber || purchaseReturn.returnNumber || "—"}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Supplier</p>
                                <p className="text-base font-semibold text-[var(--ink)]">{purchaseReturn.supplierName || purchaseReturn.supplier?.name || "—"}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Date</p>
                                <p className="text-base font-semibold text-[var(--ink)]">{date}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Status</p>
                                <span
                                    className="inline-block px-3 py-1 rounded-lg text-sm font-semibold"
                                    style={{ background: statusStyle.background, color: statusStyle.color }}
                                >
                                    {statusStyle.text}
                                </span>
                            </div>
                        </div>

                        {purchaseReturn?.reason && (
                            <p className="text-sm text-[var(--muted)] mt-6 italic">
                                Reason: {purchaseReturn.reason.replace(/_/g, " ")}
                            </p>
                        )}

                        {purchaseReturn?.notes && (
                            <p className="text-sm text-[var(--muted)] mt-2 italic">
                                Notes: {purchaseReturn.notes}
                            </p>
                        )}

                        <div className="h-px bg-[var(--border)] my-8" />

                        {/* Refund KPI row */}
                        <div className="flex flex-wrap items-start justify-between gap-6">
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Total Refund Amount</p>
                                <p className="text-2xl font-bold text-red-600">Rs {(purchaseReturn?.totalRefundAmount ?? purchaseReturn?.totalAmount ?? 0).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Total Items</p>
                                <p className="text-2xl font-bold text-[var(--ink)]">{purchaseReturn?.items?.length || 0}</p>
                            </div>
                            {/* <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Total Quantity</p>
                                <p className="text-2xl font-bold text-[var(--accent-2)]">{Number(purchaseReturn?.totalQuantity || 0).toLocaleString()}</p>
                            </div> */}
                        </div>

                        <div className="h-px bg-[var(--border)] my-7" />

                        {/* Items */}
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
                                Items ({purchaseReturn?.items?.length || 0})
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[var(--border)]">
                                        <th className="py-2 text-left text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Product</th>
                                        <th className="py-2 text-center text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Return Qty</th>
                                        <th className="py-2 text-right text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Cost Price</th>
                                        <th className="py-2 text-right text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Cut Amount</th>
                                        <th className="py-2 text-right text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Refund Amount</th>
                                        <th className="py-2 text-center text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {purchaseReturn?.items?.map((item, index) => {
                                        const price = item.costPrice || item.purchasePrice || 0;
                                        const quantity = item.quantity || 0;
                                        const cutAmount = item.cut || 0;
                                        const refundAmount = (quantity * price) - cutAmount;

                                        const isExpanded = expandedItems[index];

                                        return (
                                            <React.Fragment key={index}>
                                                <tr>
                                                    <td className="py-3">
                                                        <p className="font-medium text-[var(--ink)]">
                                                            {item.productName || item.product?.name || "—"}
                                                        </p>
                                                        {item.product?.productCode && (
                                                            <p className="text-xs text-[var(--muted)]">{item.product.productCode}</p>
                                                        )}
                                                        {item.batchNumber && (
                                                            <p className="text-xs text-[var(--muted)]">Batch: {item.batchNumber}</p>
                                                        )}
                                                    </td>
                                                    <td className="py-3 text-center text-[var(--ink)]">{quantity}</td>
                                                    <td className="py-3 text-right text-[var(--ink)]">Rs {price.toLocaleString()}</td>
                                                    <td className="py-3 text-right text-red-600">Rs {cutAmount.toLocaleString()}</td>
                                                    <td className="py-3 text-right font-semibold text-red-600">Rs {refundAmount.toLocaleString()}</td>
                                                    <td className="py-3 text-center">
                                                        <button
                                                            onClick={() => setExpandedItems(prev => ({ ...prev, [index]: !prev[index] }))}
                                                            className="p-1 rounded hover:bg-[var(--surface-muted)] transition"
                                                            style={{ color: "var(--muted)" }}
                                                            title={isExpanded ? "Hide calculations" : "Show calculations"}
                                                        >
                                                            {isExpanded ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan="6" className="px-2 sm:px-3 py-4" style={{ background: "var(--surface-muted)" }}>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                {/* Total Price Calculation */}
                                                                <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Refund Calculation</p>
                                                                    <div className="text-xs space-y-1">
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Return Quantity:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>{quantity}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Cost Price:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {price.toFixed(2)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                                            <span style={{ color: "var(--accent-2)" }}>Base Total:</span>
                                                                            <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {(quantity * price).toFixed(2)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Cut Calculation */}
                                                                <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Cut Amount</p>
                                                                    <div className="text-xs space-y-1">
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Cut Amount:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {cutAmount.toFixed(2)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                                            <span style={{ color: "var(--accent-2)" }}>After Cut:</span>
                                                                            <span className="font-mono text-red-600" style={{ color: "var(--accent-2)" }}>-Rs {cutAmount.toFixed(2)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Final Refund */}
                                                                <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Final Refund</p>
                                                                    <div className="text-xs space-y-1">
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Base Total:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {(quantity * price).toFixed(2)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Cut Amount:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {cutAmount.toFixed(2)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                                            <span style={{ color: "var(--accent-2)" }}>Refund Amount:</span>
                                                                            <span className="font-mono text-red-600" style={{ color: "var(--accent-2)" }}>Rs {refundAmount.toFixed(2)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="h-px bg-[var(--border)] my-10" />

                        {/* Summary Section */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
                                Summary
                            </h3>
                        </div>
                        
                        {/* Calculate summary values */}
                        {(() => {
                            const totalBaseAmount = (purchaseReturn?.items || []).reduce((sum, it) => {
                                const price = it.costPrice || it.purchasePrice || 0;
                                const quantity = it.quantity || 0;
                                return sum + (quantity * price);
                            }, 0);
                            
                            const totalCutAmount = (purchaseReturn?.items || []).reduce((sum, it) => {
                                return sum + (it.cut || 0);
                            }, 0);
                            
                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Base Amount Card */}
                                    <div className="p-4 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                        <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Base Amount</p>
                                        <div className="text-xs space-y-1">
                                            <div className="flex justify-between">
                                                <span style={{ color: "var(--ink)" }}>Items Base Total:</span>
                                                <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {totalBaseAmount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                <span style={{ color: "var(--accent-2)" }}>Base Amount:</span>
                                                <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {totalBaseAmount.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cut Amount Card */}
                                    <div className="p-4 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                        <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Total Cut Amount</p>
                                        <div className="text-xs space-y-1">
                                            <div className="flex justify-between">
                                                <span style={{ color: "var(--ink)" }}>Total Cut:</span>
                                                <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {totalCutAmount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                <span style={{ color: "var(--accent-2)" }}>After Cut:</span>
                                                <span className="font-mono text-red-600" style={{ color: "var(--accent-2)" }}>-Rs {totalCutAmount.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Final Total Card */}
                        <div className="mt-4 p-4 rounded-lg" style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)" }}>
                            <p className="text-xs font-semibold mb-2" style={{ color: "#dc2626" }}>Total Refund Amount</p>
                            <div className="text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Final Refund:</span>
                                    <span className="text-lg font-bold font-mono text-red-600">Rs {(purchaseReturn?.totalRefundAmount ?? purchaseReturn?.totalAmount ?? 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {showPdfModal && (
                <PdfModal
                    isOpen={showPdfModal}
                    onClose={() => setShowPdfModal(false)}
                    fileName={`PurchaseReturn-${purchaseReturn?.purchaseReturnNumber || purchaseReturn?.returnNumber || 'details'}.pdf`}
                    labels={labels}
                >
                    <PurchaseReturnDetailPdfTemplate purchaseReturn={purchaseReturn} labels={labels} />
                </PdfModal>
            )}
        </>
    );
}

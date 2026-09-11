import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Eye, EyeOff, RefreshCw, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { getPurchaseReturnLabels } from "../labels/purchaseReturnLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getPurchaseReturnByIdApi } from "../api/purchaseReturnApi.js";
import { useGetPurchaseReturnPaymentsQuery, useRecalculatePurchaseReturnMutation } from "../services/purchaseReturn.service.js";
import PurchaseReturnDetailPdfTemplate from "../components/PurchaseReturnDetailPdfTemplate.jsx";
import PurchaseReturnPaymentModal from "../components/PurchaseReturnPaymentModal.jsx";
import PdfModal from "../../../shared/components/PdfModal.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";

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
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [expandedItems, setExpandedItems] = useState({});
    const [expandedPayments, setExpandedPayments] = useState({});
    const [purchaseReturn, setPurchaseReturn] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getPurchaseReturnLabels(language);

    // Transaction/Refund hooks
    const { data: paymentsData, refetch: refetchPayments } = useGetPurchaseReturnPaymentsQuery(id);
    const [recalculatePurchaseReturn] = useRecalculatePurchaseReturnMutation();

    const payments = paymentsData?.data || paymentsData || [];

    // Calculate payment status
    const totalRefundAmount = purchaseReturn?.totalRefundAmount || 0;
    const refundedAmount = purchaseReturn?.refundedAmount || 0;
    const remainingAmount = totalRefundAmount - refundedAmount;
    const refundStatus = purchaseReturn?.refundStatus || 'pending';


    const handleRecalculate = async () => {
        try {
            await recalculatePurchaseReturn(id).unwrap();
            showSuccess("Purchase return recalculated successfully");
            refetchPayments();
            // Refetch purchase return to get updated refunded amount
            const result = await getPurchaseReturnByIdApi(id);
            setPurchaseReturn(result.data);
        } catch (error) {
            showError(error?.data?.message || "Failed to recalculate");
        }
    };

    const handlePaymentSuccess = async () => {
        setShowPaymentModal(false);
        refetchPayments();
        // Refetch purchase return to get updated refunded amount
        const result = await getPurchaseReturnByIdApi(id);
        setPurchaseReturn(result.data);
    };

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
                                onClick={handleRecalculate}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--hover)] rounded-lg transition-all"
                                title="Recalculate Refund"
                            >
                                <RefreshCw size={15} />
                                Recalculate
                            </button>
                            <button
                                onClick={() => setShowPdfModal(true)}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--accent-2)] text-white rounded-lg hover:bg-[var(--accent-2)]/90 transition-all shadow-sm"
                            >
                                <Download size={15} />
                                {labels.exportDetails || "Export"}
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
                            {labels.purchaseReturnDetails || "Purchase Return"}
                        </p>

                        {/* Returned To / Return Meta Row */}
                        <div className="flex justify-between items-start mb-6 gap-6">
                            <div>
                                <p className="text-xs font-semibold text-[var(--muted)] mb-1">Returned To:</p>
                                <p className="text-sm font-bold text-[var(--ink)] uppercase">{purchaseReturn?.supplierName || purchaseReturn?.supplier?.name || "—"}</p>
                                {purchaseReturn?.reason && (
                                    <p className="text-xs text-[var(--muted)] capitalize">Reason: {purchaseReturn.reason.replace(/_/g, " ")}</p>
                                )}
                            </div>
                            <div className="flex flex-col gap-2 min-w-[240px]">
                                <div className="border border-[var(--border)] px-3 py-2 flex justify-between text-sm" style={{ background: "var(--surface-muted)" }}>
                                    <span className="font-semibold text-[var(--ink)]">Return #: {purchaseReturn?.returnNumber || purchaseReturn?.purchaseReturnNumber || "—"}</span>
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

                        {purchaseReturn?.notes && (
                            <p className="text-sm text-[var(--muted)] mb-6 italic">
                                {purchaseReturn.notes}
                            </p>
                        )}

                        {/* Items Table - Invoice style */}
                        <table className="w-full border-collapse mb-4 text-sm">
                            <thead>
                                <tr className="text-[var(--ink)]" style={{ background: "var(--accent-2)" }}>
                                    <th className="px-3 py-2 text-left font-semibold text-white">#</th>
                                    <th className="px-3 py-2 text-left font-semibold text-white">Item &amp; Description</th>
                                    <th className="px-3 py-2 text-right font-semibold text-white">Qty</th>
                                    <th className="px-3 py-2 text-right font-semibold text-white">Unit Costing</th>
                                    <th className="px-3 py-2 text-right font-semibold text-white">Cut Amount</th>
                                    <th className="px-3 py-2 text-right font-semibold text-white">Refund Amount</th>
                                    <th className="px-3 py-2 text-center font-semibold text-white">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchaseReturn?.items?.map((item, index) => {
                                    const rawPrice = Number(item.costPrice || item.purchasePrice) || 0;
                                    const quantity = Number(item.quantity) || 0;
                                    const cutAmount = Number(item.cut) || 0;

                                    // ── Use stored costing if available (set by CRUD form) ──
                                    const costing = item.costing;
                                    const unitCosting = (costing && typeof costing.totalCostingAmount === 'number')
                                        ? costing.totalCostingAmount
                                        : rawPrice;
                                    const discountAmount = costing?.purchasedDiscountAmount ?? 0;
                                    const taxAmount = costing?.purchasedTaxAmount ?? 0;
                                    const discountValue = costing?.purchasedDiscount ?? 0;
                                    const discountType = costing?.purchaseDiscountType ?? 'percentage';
                                    const taxValue = costing?.purchasedTax ?? 0;
                                    const taxType = costing?.purchasedTaxType ?? 'percentage';

                                    const itemTotal = unitCosting * quantity;       // costing × qty
                                    const refundAmount = itemTotal - cutAmount;     // − cut

                                    const isExpanded = expandedItems[index];

                                    return (
                                        <React.Fragment key={index}>
                                            <tr className="border-b border-[var(--border)]">
                                                <td className="px-3 py-2 text-[var(--ink)]">{index + 1}</td>
                                                <td className="px-3 py-2 text-[var(--ink)]">
                                                    {item.productName || item.product?.name || "—"}
                                                    {item.product?.productCode && <span className="text-xs text-[var(--muted)] block">{item.product.productCode}</span>}
                                                    {item.batchNumber && <span className="text-xs text-[var(--muted)] block">Batch: {item.batchNumber}</span>}
                                                </td>
                                                <td className="px-3 py-2 text-right text-[var(--ink)]">{quantity}</td>
                                                <td className="px-3 py-2 text-right text-[var(--ink)] font-mono">Rs {unitCosting.toFixed(2)}</td>
                                                <td className="px-3 py-2 text-right text-red-600">Rs {cutAmount.toFixed(2)}</td>
                                                <td className="px-3 py-2 text-right font-semibold" style={{ color: "var(--accent-2)" }}>Rs {refundAmount.toFixed(2)}</td>
                                                <td className="px-3 py-2 text-center">
                                                    <button
                                                        onClick={() => setExpandedItems(prev => ({ ...prev, [index]: !prev[index] }))}
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg transition"
                                                        style={{ background: isExpanded ? "var(--accent)" : "var(--surface-muted)", color: isExpanded ? "#fff" : "var(--muted)" }}
                                                        title={isExpanded ? "Hide calculations" : "Show calculations"}
                                                    >
                                                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                                        {isExpanded ? "Hide" : "Details"}
                                                    </button>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan="7" className="px-4 py-4" style={{ background: "var(--surface-muted)" }}>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {/* Panel 1: Costing & Total — mirrors CRUD form */}
                                                            <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                                <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Costing &amp; Total</p>
                                                                <div className="text-xs space-y-1">
                                                                    <div className="flex justify-between">
                                                                        <span style={{ color: "var(--ink)" }}>Cost Price:</span>
                                                                        <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {rawPrice.toFixed(2)}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span style={{ color: "var(--ink)" }}>Less Discount ({discountType}):</span>
                                                                        <span className="font-mono" style={{ color: "#dc2626" }}>-Rs {discountAmount.toFixed(2)}</span>
                                                                    </div>
                                                                    <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
                                                                        <span>Original: {discountType === 'fixed' ? `Rs ${Number(discountValue).toFixed(2)}` : `${Number(discountValue).toFixed(2)}%`}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span style={{ color: "var(--ink)" }}>Plus Tax ({taxType}):</span>
                                                                        <span className="font-mono" style={{ color: "#16a34a" }}>+Rs {taxAmount.toFixed(2)}</span>
                                                                    </div>
                                                                    <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
                                                                        <span>Original: {taxType === 'fixed' ? `Rs ${Number(taxValue).toFixed(2)}` : `${Number(taxValue).toFixed(2)}%`}</span>
                                                                    </div>
                                                                    <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                                        <span style={{ color: "var(--accent-2)" }}>Per-Unit Costing:</span>
                                                                        <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {unitCosting.toFixed(2)}</span>
                                                                    </div>
                                                                    <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                                        <span style={{ color: "var(--accent-2)" }}>Total (Costing × Qty):</span>
                                                                        <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {itemTotal.toFixed(2)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Panel 2: Refund Calculation — mirrors CRUD form */}
                                                            <div className="p-3 rounded-lg" style={{ background: "rgba(15,118,110,0.08)", border: "1px solid rgba(15,118,110,0.25)" }}>
                                                                <p className="text-xs font-semibold mb-2" style={{ color: "var(--accent-2)" }}>Refund Calculation</p>
                                                                <div className="text-xs space-y-1">
                                                                    <div className="flex justify-between">
                                                                        <span style={{ color: "var(--ink)" }}>Total:</span>
                                                                        <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {itemTotal.toFixed(2)}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span style={{ color: "var(--ink)" }}>Less Cut:</span>
                                                                        <span className="font-mono" style={{ color: "#dc2626" }}>-Rs {cutAmount.toFixed(2)}</span>
                                                                    </div>
                                                                    <div className="flex justify-between font-bold text-sm pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                                                                        <span style={{ color: "var(--accent-2)" }}>Refund:</span>
                                                                        <span className="font-mono text-base" style={{ color: "var(--accent-2)" }}>Rs {refundAmount.toFixed(2)}</span>
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

                        {/* Refund KPI row */}
                        <div className="flex flex-wrap items-start justify-between gap-6 mb-6">
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Total Refund Amount</p>
                                <p className="text-2xl font-bold text-red-600">Rs {totalRefundAmount.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Total Refunded</p>
                                <p className="text-2xl font-bold text-blue-600">Rs {refundedAmount.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Remaining</p>
                                <p className="text-2xl font-bold text-orange-600">Rs {remainingAmount.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Refund Status</p>
                                <p className="text-2xl font-bold text-[var(--ink)] capitalize">{refundStatus}</p>
                            </div>
                        </div>

                        {/* Summary Section */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
                                Summary
                            </h3>
                        </div>
                        
                        {/* Calculate summary values using stored costing (matches CRUD form) */}
                        {(() => {
                            const items = purchaseReturn?.items || [];

                            // Per-item: use costing.totalCostingAmount × qty, else rawPrice × qty
                            const totalCostingAmount = items.reduce((sum, it) => {
                                const rawPrice = Number(it.costPrice || it.purchasePrice) || 0;
                                const unitCosting = (it.costing && typeof it.costing.totalCostingAmount === 'number')
                                    ? it.costing.totalCostingAmount : rawPrice;
                                return sum + (unitCosting * (Number(it.quantity) || 0));
                            }, 0);

                            const totalDiscountAmount = items.reduce((sum, it) => sum + (Number(it.costing?.purchasedDiscountAmount) || 0), 0);
                            const totalTaxAmount = items.reduce((sum, it) => sum + (Number(it.costing?.purchasedTaxAmount) || 0), 0);
                            const totalCutAmount = items.reduce((sum, it) => sum + (Number(it.cut) || 0), 0);
                            const computedRefund = totalCostingAmount - totalCutAmount;

                            return (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Costing Breakdown */}
                                    <div className="p-4 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                        <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Costing Breakdown</p>
                                        <div className="text-xs space-y-1">
                                            <div className="flex justify-between">
                                                <span style={{ color: "var(--ink)" }}>Total Discount:</span>
                                                <span className="font-mono" style={{ color: "#dc2626" }}>-Rs {totalDiscountAmount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span style={{ color: "var(--ink)" }}>Total Tax:</span>
                                                <span className="font-mono" style={{ color: "#16a34a" }}>+Rs {totalTaxAmount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                <span style={{ color: "var(--accent-2)" }}>Total Costing:</span>
                                                <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {totalCostingAmount.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cut Amount */}
                                    <div className="p-4 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                        <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Total Cut Amount</p>
                                        <div className="text-xs space-y-1">
                                            <div className="flex justify-between">
                                                <span style={{ color: "var(--ink)" }}>Total Cut:</span>
                                                <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {totalCutAmount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                <span style={{ color: "#dc2626" }}>Less Cut:</span>
                                                <span className="font-mono" style={{ color: "#dc2626" }}>-Rs {totalCutAmount.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Final Refund */}
                                    <div className="p-4 rounded-lg" style={{ background: "rgba(15,118,110,0.08)", border: "1px solid rgba(15,118,110,0.25)" }}>
                                        <p className="text-xs font-semibold mb-2" style={{ color: "var(--accent-2)" }}>Computed Refund</p>
                                        <div className="text-xs space-y-1">
                                            <div className="flex justify-between">
                                                <span style={{ color: "var(--ink)" }}>Total Costing:</span>
                                                <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {totalCostingAmount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span style={{ color: "var(--ink)" }}>Less Cut:</span>
                                                <span className="font-mono" style={{ color: "#dc2626" }}>-Rs {totalCutAmount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between font-bold text-sm pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                <span style={{ color: "var(--accent-2)" }}>Refund:</span>
                                                <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {computedRefund.toFixed(2)}</span>
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

                        <div className="h-px bg-[var(--border)] my-10" />

                        {/* Refunds/Transactions */}
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
                                Refunds ({payments.length})
                            </h3>
                            {purchaseReturn?.status === 'approved' && remainingAmount > 0 && (
                                <button
                                    onClick={() => setShowPaymentModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--accent-2)] text-white rounded-lg hover:bg-[var(--accent-2)]/90 transition-all"
                                >
                                    <Plus size={15} />
                                    Record Refund
                                </button>
                            )}
                        </div>

                        {payments.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-[var(--border)]">
                                            <th className="py-2 text-left text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Date</th>
                                            <th className="py-2 text-left text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Method</th>
                                            <th className="py-2 text-right text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Amount</th>
                                            <th className="py-2 text-center text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Notes</th>
                                            <th className="py-2 text-center text-[11px] font-semibold uppercase text-[var(--muted)] tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]">
                                        {payments.map((payment, index) => {
                                            const isPaymentExpanded = expandedPayments[index];
                                            return (
                                                <React.Fragment key={index}>
                                                    <tr>
                                                        <td className="py-3 text-sm text-[var(--ink)]">
                                                            {new Date(payment.transactionDate || payment.paymentDate).toLocaleDateString()}
                                                        </td>
                                                        <td className="py-3">
                                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                                                payment.method === 'cash' ? 'bg-green-100 text-green-800' :
                                                                payment.method === 'credit' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-purple-100 text-purple-800'
                                                            }`}>
                                                                {payment.method === 'cash' ? (payment.paymentMethodName || 'Cash') :
                                                                 payment.method === 'credit' ? `Credit (${payment.creditAccount?.name || 'Account'})` :
                                                                 payment.method || "—"}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-right font-semibold text-red-600">Rs {(payment.amount || 0).toLocaleString()}</td>
                                                        <td className="py-3 text-sm text-center text-[var(--muted)]">{payment.notes || "—"}</td>
                                                        <td className="py-3">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button
                                                                    onClick={() => setExpandedPayments(prev => ({ ...prev, [index]: !prev[index] }))}
                                                                    className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-lg"
                                                                    title={isPaymentExpanded ? "Hide details" : "Show details"}
                                                                >
                                                                    {isPaymentExpanded ? <EyeOff size={15} /> : <Eye size={15} />}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {isPaymentExpanded && (
                                                        <tr>
                                                            <td colSpan="5" className="px-2 sm:px-3 py-4" style={{ background: "var(--surface-muted)" }}>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                                        <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Refund Details</p>
                                                                        <div className="text-xs space-y-1">
                                                                            <div className="flex justify-between">
                                                                                <span style={{ color: "var(--ink)" }}>Refund ID:</span>
                                                                                <span className="font-mono" style={{ color: "var(--ink)" }}>{payment._id || "—"}</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span style={{ color: "var(--ink)" }}>Transaction Date:</span>
                                                                                <span className="font-mono" style={{ color: "var(--ink)" }}>{new Date(payment.transactionDate || payment.paymentDate).toLocaleString()}</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span style={{ color: "var(--ink)" }}>Payment Method:</span>
                                                                                <span className="font-mono" style={{ color: "var(--ink)" }}>{payment.method || "—"}</span>
                                                                            </div>
                                                                            {payment.creditAccount && (
                                                                                <div className="flex justify-between">
                                                                                    <span style={{ color: "var(--ink)" }}>Credit Account:</span>
                                                                                    <span className="font-mono" style={{ color: "var(--ink)" }}>{payment.creditAccount.name || "—"}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                                        <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Amount Information</p>
                                                                        <div className="text-xs space-y-1">
                                                                            <div className="flex justify-between">
                                                                                <span style={{ color: "var(--ink)" }}>Amount:</span>
                                                                                <span className="font-mono font-semibold" style={{ color: "var(--accent-2)" }}>Rs {(payment.amount || 0).toLocaleString()}</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span style={{ color: "var(--ink)" }}>Cash Amount:</span>
                                                                                <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {(payment.cashAmount || 0).toLocaleString()}</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span style={{ color: "var(--ink)" }}>Credit Amount:</span>
                                                                                <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {(payment.creditAmount || 0).toLocaleString()}</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span style={{ color: "var(--ink)" }}>Notes:</span>
                                                                                <span className="font-mono" style={{ color: "var(--ink)" }}>{payment.notes || "—"}</span>
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
                        ) : (
                            <p className="text-sm text-[var(--muted)] py-6 text-center">No refunds recorded yet</p>
                        )}

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
                    fileName={`PurchaseReturn-${purchaseReturn?.purchaseReturnNumber || purchaseReturn?.returnNumber || 'details'}.pdf`}
                    labels={labels}
                >
                    <PurchaseReturnDetailPdfTemplate purchaseReturn={purchaseReturn} labels={labels} />
                </PdfModal>
            )}
            {showPaymentModal && (
                <PurchaseReturnPaymentModal
                    purchaseReturn={purchaseReturn}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </>
    );
}

import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Package, DollarSign, User, FileText, RotateCcw } from "lucide-react";
import { getPurchaseReturnLabels } from "../labels/purchaseReturnLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getPurchaseReturnByIdApi } from "../api/purchaseReturnApi.js";
import { useEffect, useState } from "react";

const STATUS_STYLE = {
    draft: { background: "rgba(107,114,128,0.1)", color: "#6b7280", text: "Draft" },
    pending: { background: "rgba(180,83,9,0.1)", color: "#d97706", text: "Pending" },
    approved: { background: "rgba(15,118,110,0.1)", color: "var(--accent-2)", text: "Approved" },
    rejected: { background: "rgba(220,38,38,0.1)", color: "#dc2626", text: "Rejected" },
};

export default function PurchaseReturnDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getPurchaseReturnLabels(language);
    
    const [purchaseReturn, setPurchaseReturn] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
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
        <div className="p-6 bg-[var(--app-bg)] min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate("/purchase-returns")}
                    className="p-2 hover:bg-[var(--hover)] rounded-md transition-all"
                >
                    <ArrowLeft size={20} className="text-[var(--ink)]" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-[var(--ink)] font-display">
                        {labels.returnDetails || "Purchase Return Details"}
                    </h1>
                    <p className="text-sm text-[var(--muted)]">
                        {purchaseReturn?.returnNumber || "—"}
                    </p>
                </div>
                <span 
                    className="px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: statusStyle.background, color: statusStyle.color }}
                >
                    {statusStyle.text}
                </span>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Calendar size={20} className="text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.date || "Date"}</p>
                                <p className="font-semibold text-[var(--ink)]">{date}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                <Package size={20} className="text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.totalItems || "Total Items"}</p>
                                <p className="font-semibold text-[var(--ink)]">
                                    {purchaseReturn?.items?.length || 0} items
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                <DollarSign size={20} className="text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.totalAmount || "Total Amount"}</p>
                                <p className="font-semibold text-red-600">
                                    Rs {(purchaseReturn?.totalAmount ?? 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Return Information */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
                        <FileText size={20} />
                        {labels.returnInformation || "Return Information"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs text-[var(--muted)] uppercase font-bold">
                                {labels.returnNumber || "Return #"}
                            </label>
                            <p className="font-semibold text-[var(--ink)] mt-1">
                                {purchaseReturn?.returnNumber || "—"}
                            </p>
                        </div>
                        <div>
                            <label className="text-xs text-[var(--muted)] uppercase font-bold">
                                {labels.supplier || "Supplier"}
                            </label>
                            <p className="font-semibold text-[var(--ink)] mt-1">
                                {purchaseReturn?.supplierName || purchaseReturn?.supplier?.name || "—"}
                            </p>
                        </div>
                        <div>
                            <label className="text-xs text-[var(--muted)] uppercase font-bold">
                                {labels.returnDate || "Return Date"}
                            </label>
                            <p className="font-semibold text-[var(--ink)] mt-1">{date}</p>
                        </div>
                        <div>
                            <label className="text-xs text-[var(--muted)] uppercase font-bold">
                                {labels.reason || "Reason"}
                            </label>
                            <p className="font-semibold text-[var(--ink)] mt-1 capitalize">
                                {purchaseReturn?.reason?.replace(/_/g, " ") || "—"}
                            </p>
                        </div>
                        <div>
                            <label className="text-xs text-[var(--muted)] uppercase font-bold">
                                {labels.status || "Status"}
                            </label>
                            <p className="font-semibold text-[var(--ink)] mt-1">
                                <span 
                                    className="px-3 py-1 rounded-lg text-xs font-semibold"
                                    style={{ background: statusStyle.background, color: statusStyle.color }}
                                >
                                    {statusStyle.text}
                                </span>
                            </p>
                        </div>
                        {purchaseReturn?.notes && (
                            <div className="md:col-span-2">
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">
                                    {labels.notes || "Notes"}
                                </label>
                                <p className="text-[var(--ink)] mt-1">{purchaseReturn.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Items Table */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
                        <Package size={20} />
                        {labels.items || "Items"}
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead style={{ background: "var(--surface-muted)" }}>
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">
                                        {labels.productName || "Product"}
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">
                                        {labels.quantity || "Quantity"}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">
                                        {labels.costPrice || "Cost Price"}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">
                                        {labels.subtotal || "Subtotal"}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                                {purchaseReturn?.items?.map((item, index) => (
                                    <tr key={index} className="hover:bg-[var(--surface-muted)] transition-all">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-[var(--ink)]">
                                                {item.productName || item.product?.name || "—"}
                                            </p>
                                            {item.variant && (
                                                <p className="text-xs text-[var(--muted)]">{item.variant}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center font-medium text-[var(--ink)]">
                                            {item.quantity || 0}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-[var(--ink)]">
                                            Rs {(item.costPrice || 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-red-600">
                                            Rs {((item.quantity || 0) * (item.costPrice || 0)).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot style={{ background: "var(--surface-muted)", borderTop: "2px solid var(--border)" }}>
                                <tr>
                                    <td colSpan="3" className="px-4 py-3 text-right font-bold text-[var(--ink)]">
                                        {labels.totalAmount || "Total Amount"}:
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-red-600 text-lg">
                                        Rs {(purchaseReturn?.totalAmount ?? 0).toLocaleString()}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

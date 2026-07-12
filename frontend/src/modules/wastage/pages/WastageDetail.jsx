import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Package, DollarSign, AlertTriangle, FileText, User } from "lucide-react";
import { useWastage } from "../services/wastage.service.js";
import { getWastageLabels } from "../labels/wastageLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";

const STATUS_STYLE = {
    draft:    { background: "rgba(107,114,128,0.1)", color: "#6b7280", text: "Draft" },
    pending:  { background: "rgba(180,83,9,0.1)", color: "#d97706", text: "Pending" },
    approved: { background: "rgba(15,118,110,0.1)", color: "var(--accent-2)", text: "Approved" },
    rejected: { background: "rgba(220,38,38,0.1)", color: "#dc2626", text: "Rejected" },
};

export default function WastageDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    
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
        <div className="p-6 bg-[var(--app-bg)] min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate("/wastage")}
                    className="p-2 hover:bg-[var(--hover)] rounded-md transition-all"
                >
                    <ArrowLeft size={20} className="text-[var(--ink)]" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-[var(--ink)] font-display">
                        {labels.wastageDetails || "Wastage Details"}
                    </h1>
                    <p className="text-sm text-[var(--muted)]">
                        {wastage?.wastageNumber || "—"}
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
                                    {wastage?.totalItems || wastage?.items?.length || 0} items
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
                                <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.totalLoss || "Total Loss"}</p>
                                <p className="font-semibold text-red-600">
                                    Rs {(wastage?.totalLossAmount ?? 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wastage Information */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
                        <FileText size={20} />
                        {labels.wastageInformation || "Wastage Information"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs text-[var(--muted)] uppercase font-bold">{labels.wastageNumber || "Wastage #"}</label>
                            <p className="font-semibold text-[var(--ink)] mt-1">{wastage?.wastageNumber || "—"}</p>
                        </div>
                        <div>
                            <label className="text-xs text-[var(--muted)] uppercase font-bold">{labels.reason || "Reason"}</label>
                            <p className="font-semibold text-[var(--ink)] mt-1 capitalize">
                                {wastage?.reason?.replace(/_/g, " ") || "—"}
                            </p>
                        </div>
                        <div>
                            <label className="text-xs text-[var(--muted)] uppercase font-bold">{labels.totalQuantity || "Total Quantity"}</label>
                            <p className="font-semibold text-[var(--ink)] mt-1">{wastage?.totalQuantity || 0}</p>
                        </div>
                        <div>
                            <label className="text-xs text-[var(--muted)] uppercase font-bold">{labels.status || "Status"}</label>
                            <p className="font-semibold text-[var(--ink)] mt-1">
                                <span 
                                    className="px-3 py-1 rounded-lg text-xs font-semibold"
                                    style={{ background: statusStyle.background, color: statusStyle.color }}
                                >
                                    {statusStyle.text}
                                </span>
                            </p>
                        </div>
                        {wastage?.notes && (
                            <div className="md:col-span-2">
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">{labels.notes || "Notes"}</label>
                                <p className="text-[var(--ink)] mt-1">{wastage.notes}</p>
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
                                        {labels.lossAmount || "Loss Amount"}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                                {wastage?.items?.map((item, index) => (
                                    <tr key={index} className="hover:bg-[var(--surface-muted)] transition-all">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-[var(--ink)]">{item.productName || "—"}</p>
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
    );
}

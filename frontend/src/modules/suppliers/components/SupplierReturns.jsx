import React, { useState } from "react";
import { Eye, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetSupplierPurchaseReturnsQuery } from "../../purchaseReturn/services/purchaseReturn.service.js";
import { useSupplierPurchaseReturnKPIs } from "../services/suppliers.service.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";

export default function SupplierReturns({ supplierId }) {
    const navigate = useNavigate();
    const [startDate, setStartDate] = useState(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        return firstDay.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    // Fetch KPIs from backend
    const { data: kpiData } = useSupplierPurchaseReturnKPIs({ supplierId, startDate, endDate });

    const getStatusColor = (status) => {
        switch (status) {
            case 'draft': return 'bg-gray-100 text-gray-800 border-gray-300';
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'approved': return 'bg-green-100 text-green-800 border-green-300';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    return (
        <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--ink)]">Purchase Returns</h3>
                <div className="flex gap-2">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
                    />
                </div>
            </div>

            {/* KPI Section */}
            {kpiData && (
                <div className="grid grid-cols-5 gap-4 mb-6">
                    <div className="card p-4" style={{ background: "rgba(15,118,110,0.08)", border: "1px solid var(--border)" }}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Total Returns</p>
                        <p className="text-xl font-black tabular-nums text-[var(--accent-2)]">{kpiData.totalReturns || 0}</p>
                    </div>
                    <div className="card p-4" style={{ background: "rgba(15,118,110,0.08)", border: "1px solid var(--border)" }}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Total Refund</p>
                        <p className="text-xl font-black tabular-nums text-[var(--accent-2)]">Rs {(kpiData.totalRefundAmount || 0).toLocaleString()}</p>
                    </div>
                    <div className="card p-4" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid var(--border)" }}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Refunded</p>
                        <p className="text-xl font-black tabular-nums text-[#10b981]">Rs {(kpiData.totalRefundedAmount || 0).toLocaleString()}</p>
                    </div>
                    <div className="card p-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid var(--border)" }}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Remaining</p>
                        <p className="text-xl font-black tabular-nums text-[#ef4444]">Rs {(kpiData.totalRemainingAmount || 0).toLocaleString()}</p>
                    </div>
                    <div className="card p-4" style={{ background: "rgba(180,83,9,0.08)", border: "1px solid var(--border)" }}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Pending</p>
                        <p className="text-xl font-black tabular-nums text-[#d97706]">{kpiData.statusBreakdown?.pending || 0}</p>
                    </div>
                </div>
            )}

            <PaginatedList
                rtkQuery={useGetSupplierPurchaseReturnsQuery}
                limit={20}
                dataKey="data"
                queryArgs={{ supplierId, startDate, endDate }}
                renderItems={(items) => {
                    if (!items?.length) return null;
                    return (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead style={{ background: "var(--surface-muted)" }}>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Return #</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">Items</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Refund Amount</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Refunded</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Remaining</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Status</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                                    {items.map((returnItem) => {
                                        const status = returnItem.status || 'draft';
                                        const dateStr = returnItem.returnDate || returnItem.createdAt || "";
                                        const date = dateStr ? new Date(dateStr).toLocaleDateString() : "—";
                                        const totalRefund = returnItem.totalRefundAmount || returnItem.totalAmount || 0;
                                        const refunded = returnItem.refundedAmount || 0;
                                        const remaining = totalRefund - refunded;

                                        return (
                                            <tr key={returnItem._id} className="hover:bg-[var(--surface-muted)]">
                                                <td className="px-4 py-3 font-mono text-xs text-[var(--muted)]">
                                                    {returnItem.purchaseReturnNumber || returnItem.returnNumber || "—"}
                                                </td>
                                                <td className="px-4 py-3 text-center text-[var(--ink)]">{returnItem.items?.length || 0}</td>
                                                <td className="px-4 py-3 text-right font-semibold tabular-nums text-[var(--accent-2)]">
                                                    Rs {totalRefund.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold tabular-nums text-[#10b981]">
                                                    Rs {refunded.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold tabular-nums text-[#ef4444]">
                                                    Rs {remaining.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-[var(--muted)]">{date}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(status)}`}>
                                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button 
                                                            onClick={() => navigate(`/purchase-returns/${returnItem._id}`)}
                                                            className="px-3 py-1 text-xs rounded-lg font-medium transition bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 flex items-center gap-1"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    );
                }}
                emptyState={
                    <div className="text-center py-12">
                        <RotateCcw size={48} className="text-[var(--muted)] mb-4 mx-auto" />
                        <p className="text-[var(--muted)]">No purchase returns found for this supplier</p>
                    </div>
                }
            />
        </div>
    );
}

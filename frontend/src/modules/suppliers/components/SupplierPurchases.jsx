import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Edit, Trash2, RotateCcw, Check, X, Copy, ShoppingCart } from "lucide-react";
import { usePurchasesBySupplier, useDeletePurchase, useUpdatePurchaseStatus } from "../../productPurchases/services/purchases.service.js";
import { useSupplierPurchaseKPIs } from "../services/suppliers.service.js";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import { getPurchaseLabels } from "../../productPurchases/labels/purchaseLabels.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import PurchaseReturnModal from "../../purchaseReturn/components/PurchaseReturnModal.jsx";
import PurchaseModal from "../../productPurchases/components/PurchaseModal.jsx";

export default function SupplierPurchases({ supplierId }) {
    const navigate = useNavigate();
    const [startDate, setStartDate] = useState(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        return firstDay.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [returnModal, setReturnModal] = useState(null);
    const [purchaseModal, setPurchaseModal] = useState(null);

    const [deletePurchase] = useDeletePurchase();
    const [updateStatus] = useUpdatePurchaseStatus();
    const language = "en";
    const purchaseLabels = getPurchaseLabels(language);

    // Fetch KPIs from backend
    const { data: kpiData } = useSupplierPurchaseKPIs({ supplierId, startDate, endDate });

    const handleDeletePurchase = async (purchaseId) => {
        try {
            await deletePurchase(purchaseId).unwrap();
            showSuccess(purchaseLabels.purchaseDeleted);
        } catch (error) {
            showError(error?.data?.message || purchaseLabels.failedToDelete);
        }
    };

    const handleStatusUpdate = async (purchaseId, status) => {
        try {
            await updateStatus({ id: purchaseId, status }).unwrap();
            showSuccess(`Purchase marked as ${status}`);
        } catch (error) {
            showError(error?.data?.message || purchaseLabels.failedToUpdate);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ordered': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'delivered': return 'bg-green-100 text-green-800 border-green-300';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'ordered': return purchaseLabels.ordered || 'Ordered';
            case 'delivered': return purchaseLabels.delivered || 'Delivered';
            case 'rejected': return purchaseLabels.rejected || 'Rejected';
            default: return status;
        }
    };

    return (
        <>
            <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[var(--ink)]">Supplier Purchases</h3>
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
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="card p-4" style={{ background: "rgba(15,118,110,0.08)", border: "1px solid var(--border)" }}>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Total Purchases</p>
                            <p className="text-xl font-black tabular-nums text-[var(--accent-2)]">{kpiData.totalPurchases || 0}</p>
                        </div>
                        <div className="card p-4" style={{ background: "rgba(15,118,110,0.08)", border: "1px solid var(--border)" }}>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Total Amount</p>
                            <p className="text-xl font-black tabular-nums text-[var(--accent-2)]">Rs {(kpiData.totalPurchaseAmount || 0).toLocaleString()}</p>
                        </div>
                        <div className="card p-4" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid var(--border)" }}>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Paid Amount</p>
                            <p className="text-xl font-black tabular-nums text-[#10b981]">Rs {(kpiData.totalPaidAmount || 0).toLocaleString()}</p>
                        </div>
                        <div className="card p-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid var(--border)" }}>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Remaining</p>
                            <p className="text-xl font-black tabular-nums text-[#ef4444]">Rs {(kpiData.totalRemainingAmount || 0).toLocaleString()}</p>
                        </div>
                    </div>
                )}

                <PaginatedList
                    rtkQuery={usePurchasesBySupplier}
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
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Invoice</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">Items</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Total</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Paid</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Remaining</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Status</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                                        {items.map((purchase) => {
                                            const totalAmount = purchase.totalAmount || 0;
                                            const paidAmount = purchase.paidAmount || 0;
                                            const remainingAmount = totalAmount - paidAmount;
                                            const status = purchase.status || 'ordered';
                                            const dateStr = purchase.date || purchase.createdAt || "";
                                            const date = dateStr ? new Date(dateStr).toLocaleDateString() : "—";

                                            return (
                                                <tr key={purchase._id} className="hover:bg-[var(--surface-muted)]">
                                                    <td className="px-4 py-3 font-mono text-xs text-[var(--muted)]">
                                                        <div className="flex items-center gap-2">
                                                            <span>{purchase.invoiceNumber || "—"}</span>
                                                            {purchase.invoiceNumber && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        navigator.clipboard.writeText(purchase.invoiceNumber);
                                                                        showSuccess("Invoice number copied");
                                                                    }}
                                                                    className="hover:text-[var(--accent-2)] transition-colors"
                                                                    title="Copy invoice number"
                                                                >
                                                                    <Copy className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-[var(--ink)]">
                                                        <div className="text-sm font-medium">{purchase.items?.length ?? 0}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-[var(--accent-2)]">
                                                        Rs {totalAmount.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-[#10b981]">
                                                        Rs {paidAmount.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-[#ef4444]">
                                                        Rs {remainingAmount.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-[var(--muted)]">{date}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(status)}`}>
                                                            {getStatusLabel(status)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex justify-center gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                                                            <button 
                                                                onClick={() => navigate(`/purchases/${purchase._id}`)}
                                                                className="px-3 py-1 text-xs rounded-lg font-medium transition bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 flex items-center gap-1"
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-3 h-3" />
                                                            </button>
                                                            {status === 'ordered' && (
                                                                <>
                                                                    <button 
                                                                        onClick={() => handleStatusUpdate(purchase._id, 'delivered')}
                                                                        className="px-3 py-1 text-xs rounded-lg font-medium transition bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 flex items-center gap-1"
                                                                        title={purchaseLabels.delivered || "Delivered"}
                                                                    >
                                                                        <Check className="w-3 h-3" />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleStatusUpdate(purchase._id, 'rejected')}
                                                                        className="px-3 py-1 text-xs rounded-lg font-medium transition bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 flex items-center gap-1"
                                                                        title={purchaseLabels.rejected || "Rejected"}
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {status === 'delivered' && (
                                                                <button 
                                                                    onClick={() => setReturnModal({ purchaseId: purchase._id })}
                                                                    className="px-3 py-1 text-xs rounded-lg font-medium transition bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 flex items-center gap-1"
                                                                    title={purchaseLabels.return || "Return"}
                                                                >
                                                                    <RotateCcw className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                            <button 
                                                                onClick={() => setPurchaseModal({ mode: "update", id: purchase._id })}
                                                                className="px-3 py-1 text-xs rounded-lg font-medium transition bg-[var(--accent-2)]/10 text-[var(--accent-2)] border border-[var(--accent-2)] hover:bg-[var(--accent-2)]/20"
                                                                title={purchaseLabels.edit || "Edit"}
                                                            >
                                                                <Edit className="w-3 h-3" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeletePurchase(purchase._id)}
                                                                className="px-3 py-1 text-xs rounded-lg font-medium transition bg-red-50 text-red-500 border border-red-200 hover:bg-red-100"
                                                                title={purchaseLabels.delete || "Delete"}
                                                            >
                                                                <Trash2 className="w-3 h-3" />
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
                            <ShoppingCart size={48} className="text-[var(--muted)] mb-4 mx-auto" />
                            <p className="text-[var(--muted)]">No purchases found for this supplier</p>
                        </div>
                    }
                />
            </div>

            {returnModal && (
                <PurchaseReturnModal
                    mode="create"
                    purchaseId={returnModal.purchaseId}
                    onClose={() => setReturnModal(null)}
                    onSuccess={() => setReturnModal(null)}
                />
            )}
            {purchaseModal && (
                <PurchaseModal
                    mode={purchaseModal.mode}
                    purchaseId={purchaseModal.id}
                    onClose={() => setPurchaseModal(null)}
                />
            )}
        </>
    );
}

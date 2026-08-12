import React, { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, ShoppingCart, Phone, Mail, MapPin, Building2, Plus } from "lucide-react";
import { useSupplier } from "../services/suppliers.service.js";
import { getSupplierLabels } from "../labels/supplierLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { usePurchasesBySupplier } from "../../productPurchases/services/purchases.service.js";
import { useAccountPaymentsSummary, useAccountPaymentsPaginated, useDeleteQarzaPayment } from "../../qarza/services/qarza.service.js";
import BigViewImage from "../../../shared/components/BigViewImage.jsx";
import QarzaPaymentModal from "../../qarza/components/QarzaPaymentModal.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";

const IMAGE_BASE = "http://localhost:5001/uploads";

export default function SupplierDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getSupplierLabels(language);
    
    const [activeTab, setActiveTab] = useState("details");
    const [modal, setModal] = useState(null);
    const [startDate, setStartDate] = useState(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        return firstDay.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    
    const { data: supplierData, isLoading } = useSupplier(id);
    const { data: purchasesData } = usePurchasesBySupplier({ 
        supplierId: id, 
        startDate, 
        endDate 
    });

    const supplier = supplierData;
    const purchases = purchasesData?.data || [];
    
    const qarzaAccountId = supplier?.qarzaAccountId;
    const { data: summary } = useAccountPaymentsSummary(qarzaAccountId);
    const [deletePayment] = useDeleteQarzaPayment();

    const refresh = useCallback(() => {}, []);

    const handleDelete = async (paymentId) => {
        if (!window.confirm("Delete this payment?")) return;
        try {
            await deletePayment({ paymentId, qarzaAccountId }).unwrap();
            showSuccess("Payment deleted");
            refresh();
        } catch (e) {
            showError(e?.data?.message ?? "Delete failed");
        }
    };

    if (isLoading) {
        return <div className="p-6 text-center">{labels.loading || "Loading..."}</div>;
    }

    if (!supplier) {
        return <div className="p-6 text-center">Supplier not found</div>;
    }

    return (
        <div className="p-6 bg-[var(--app-bg)] min-h-screen">
            {modal && (
                <QarzaPaymentModal
                    mode={modal.mode}
                    qarzaAccountId={qarzaAccountId}
                    payment={modal.payment}
                    onClose={() => setModal(null)}
                    onSuccess={refresh}
                />
            )}

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate("/suppliers")}
                    className="p-2 hover:bg-[var(--hover)] rounded-md transition-all"
                >
                    <ArrowLeft size={20} className="text-[var(--ink)]" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-[var(--ink)] font-display">{supplier.name}</h1>
                    <p className="text-sm text-[var(--muted)]">{supplier.type || "Supplier"}</p>
                </div>
                <button
                    onClick={() => navigate(-1)} 
                    className="btn-add"
                >
                    <Edit size={16} /> {labels.edit || "Edit"}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-[var(--border)]">
                {["details", "purchases", "credits"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 capitalize font-semibold transition-all ${
                            activeTab === tab
                                ? "border-b-2 border-[var(--accent-2)] text-[var(--accent-2)]"
                                : "text-[var(--muted)] hover:text-[var(--ink)]"
                        }`}
                    >
                        {tab === "details" ? labels.details || "Details" : 
                         tab === "purchases" ? labels.purchases || "Purchases" : 
                         "Credits & Debits"}
                    </button>
                ))}
            </div>

            {/* Details Tab */}
            {activeTab === "details" && (
                <div className="card p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 flex items-start gap-4 p-4 bg-[var(--surface-muted)] rounded-xl">
                            {supplier.image ? (
                                <BigViewImage 
                                    src={`${IMAGE_BASE}/${supplier.image}`} 
                                    alt={supplier.name} 
                                    className="w-16 h-16 rounded-xl object-cover"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-[#0d8a7e] flex items-center justify-center text-2xl font-bold text-white">
                                    {supplier.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-[var(--ink)]">{supplier.name}</h3>
                                <p className="text-sm text-[var(--muted)] mt-1">{supplier.type || "Supplier"}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Phone size={18} className="text-primary" />
                            </div>
                            <div>
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">Phone</label>
                                <p className="font-medium text-[var(--ink)]">{supplier.phone || "—"}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Mail size={18} className="text-primary" />
                            </div>
                            <div>
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">Email</label>
                                <p className="font-medium text-[var(--ink)]">{supplier.email || "—"}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <MapPin size={18} className="text-primary" />
                            </div>
                            <div>
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">Address</label>
                                <p className="font-medium text-[var(--ink)]">{supplier.address || "—"}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Building2 size={18} className="text-primary" />
                            </div>
                            <div>
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">Type</label>
                                <p className="font-medium text-[var(--ink)] capitalize">{supplier.type || "—"}</p>
                            </div>
                        </div>

                        <div className="md:col-span-2 flex items-start gap-3">
                            <div>
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">Status</label>
                                <div className="mt-1">
                                    <span className={`px-3 py-1 text-xs rounded-full font-semibold ${supplier.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {supplier.isActive ? labels.active || "Active" : labels.inactive || "Inactive"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Credits & Debits Tab */}
            {activeTab === "credits" && supplier.qarzaAccountId && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    {summary && (
                        <div className="grid grid-cols-3 gap-4">
                            <div className="card p-4" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid var(--border)" }}>
                                <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Cash In</p>
                                <p className="text-xl font-black tabular-nums text-[#10b981]">Rs {(summary.cashIn || 0).toLocaleString()}</p>
                            </div>
                            <div className="card p-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid var(--border)" }}>
                                <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Cash Out</p>
                                <p className="text-xl font-black tabular-nums text-[#ef4444]">Rs {(summary.cashOut || 0).toLocaleString()}</p>
                            </div>
                            <div className="card p-4" style={{ background: (summary.overall || 0) >= 0 ? "rgba(15,118,110,0.08)" : "rgba(239,68,68,0.08)", border: "1px solid var(--border)" }}>
                                <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Overall</p>
                                <p className="text-xl font-black tabular-nums" style={{ color: (summary.overall || 0) >= 0 ? "var(--accent-2)" : "#ef4444" }}>
                                    Rs {Math.abs(summary.overall || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Payment List */}
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[var(--ink)]">Payment History</h3>
                            <button
                                onClick={() => setModal({ mode: "create" })}
                                className="btn-add"
                            >
                                <Plus size={16} /> Add Payment
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <PaginatedList
                                rtkQuery={useAccountPaymentsPaginated}
                                limit={20}
                                dataKey="data"
                                wrapperClassName="h-full"
                                renderItems={(items) => {
                                    if (!items?.length) return null;
                                    return (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead style={{ background: "var(--surface-muted)" }}>
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Type</th>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Amount</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Notes</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Date</th>
                                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                                                    {items.map((item) => {
                                                        const paymentType = item.creditType || item.type || 'cashin';
                                                        const color = paymentType === 'cashin' ? '#10b981' : '#ef4444';
                                                        return (
                                                            <tr key={item._id} className="hover:bg-[var(--surface-muted)]">
                                                                <td className="px-4 py-3">
                                                                    <span className="text-xs font-semibold uppercase" style={{ color }}>
                                                                        {paymentType}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-semibold" style={{ color }}>
                                                                    Rs {(item.amount || 0).toLocaleString()}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-[var(--muted)]">
                                                                    {item.notes || "-"}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-[var(--muted)]">
                                                                    {new Date(item.transactionDate || item.date).toLocaleDateString()}
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <button
                                                                        onClick={() => setModal({ mode: "update", payment: item })}
                                                                        className="p-2 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] hover:border-[var(--accent-2)] hover:text-[var(--accent-2)]"
                                                                    >
                                                                        <Edit size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDelete(item._id)}
                                                                        className="p-2 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] hover:border-red-400 hover:text-red-500 ml-2"
                                                                    >
                                                                        <ShoppingCart size={14} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                }}
                                queryArgs={{ qarzaAccountId }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Credits & Debits Tab - No Account */}
            {activeTab === "credits" && !supplier.qarzaAccountId && (
                <div className="card p-6">
                    <div className="text-center py-8">
                        <p className="text-[var(--muted)]">No credits/debits account associated with this supplier</p>
                    </div>
                </div>
            )}

            {/* Purchases Tab */}
            {activeTab === "purchases" && (
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-[var(--ink)]">{labels.supplierPurchases || "Supplier Purchases"}</h3>
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
                    {purchases.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead style={{ background: "var(--surface-muted)" }}>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Purchase #</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Date</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">Items</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Total Amount</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                                    {purchases.map((purchase) => (
                                        <tr 
                                            key={purchase._id} 
                                            className="hover:bg-[var(--surface-muted)] cursor-pointer transition-all"
                                            onClick={() => navigate(`/purchases/${purchase._id}`)}
                                        >
                                            <td className="px-4 py-3 text-sm font-medium text-[var(--ink)]">{purchase.purchaseNumber || "—"}</td>
                                            <td className="px-4 py-3 text-sm text-[var(--muted)]">
                                                {new Date(purchase.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-center text-[var(--ink)]">
                                                {purchase.items?.length || 0}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-right text-[var(--accent-2)]">
                                                Rs {purchase.totalAmount?.toLocaleString() || 0}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                                    purchase.status === 'completed' 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : purchase.status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {purchase.status || "N/A"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <ShoppingCart size={48} className="text-[var(--muted)] mb-4 mx-auto" />
                            <p className="text-[var(--muted)]">{labels.noPurchasesFound || "No purchases found for this supplier"}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

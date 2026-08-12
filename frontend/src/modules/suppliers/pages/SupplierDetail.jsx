import React, { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, ShoppingCart, Phone, Mail, MapPin, Building2, Plus, DollarSign, Eye, Copy, RotateCcw, Check, X, Trash2 } from "lucide-react";
import { useSupplier } from "../services/suppliers.service.js";
import { getSupplierLabels } from "../labels/supplierLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { usePurchasesBySupplier } from "../../productPurchases/services/purchases.service.js";
import { useAccountPaymentsSummary, useAccountPaymentsPaginated, useDeleteQarzaPayment } from "../../qarza/services/qarza.service.js";
import { useDeletePurchase, useUpdatePurchaseStatus } from "../../productPurchases/services/purchases.service.js";
import { useCreateQarzaAccount } from "../../qarza/services/qarza.service.js";
import { useUpdateSupplier } from "../services/suppliers.service.js";
import BigViewImage from "../../../shared/components/BigViewImage.jsx";
import QarzaPaymentModal from "../../qarza/components/QarzaPaymentModal.jsx";
import PurchaseModal from "../../productPurchases/components/PurchaseModal.jsx";
import PurchasePaymentModal from "../../productPurchases/components/PurchasePaymentModal.jsx";
import PurchaseReturnModal from "../../purchaseReturn/components/PurchaseReturnModal.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import { getPurchaseLabels } from "../../productPurchases/labels/purchaseLabels.js";

const IMAGE_BASE = "http://localhost:5001/uploads";

export default function SupplierDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getSupplierLabels(language);
    const purchaseLabels = getPurchaseLabels(language);
    
    const [activeTab, setActiveTab] = useState("details");
    const [modal, setModal] = useState(null);
    const [purchaseModal, setPurchaseModal] = useState(null);
    const [paymentModal, setPaymentModal] = useState(null);
    const [returnModal, setReturnModal] = useState(null);
    const [startDate, setStartDate] = useState(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        return firstDay.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    
    const { data: supplierData, isLoading, refetch: refetchSupplier } = useSupplier(id);
    const { data: purchasesData } = usePurchasesBySupplier({ 
        supplierId: id, 
        startDate, 
        endDate 
    });

    const supplier = supplierData;
    const purchases = purchasesData?.data || [];
    
    const qarzaAccountId = supplier?.qarzaAccountId;
    const { data: summary } = useAccountPaymentsSummary(qarzaAccountId);
    const accountExists = summary?.accountExists !== false;
    const [deletePayment] = useDeleteQarzaPayment();
    const [deletePurchase] = useDeletePurchase();
    const [updateStatus] = useUpdatePurchaseStatus();
    const [createQarzaAccount] = useCreateQarzaAccount();
    const [updateSupplier] = useUpdateSupplier();
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);

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

    const handleCreateQarzaAccount = async () => {
        if (!supplier) return;
        setIsCreatingAccount(true);
        try {
            const formData = new FormData();
            formData.append("name", supplier.name || "");
            formData.append("type", "supplier");
            formData.append("phoneNo", supplier.phoneNo || "");
            formData.append("address", supplier.address || "");
            formData.append("notes", `Auto-created for supplier: ${supplier.name}`);
            formData.append("isActive", "true");

            const result = await createQarzaAccount(formData).unwrap();
            
            if (result.success && result.accounts) {
                const newAccount = result.accounts.find(acc => acc.name === supplier.name && acc.type === 'supplier');
                if (newAccount) {
                    await updateSupplier({ 
                        id: supplier._id, 
                        data: { qarzaAccountId: newAccount._id } 
                    }).unwrap();
                    showSuccess("Qarza account created and linked successfully");
                    await refetchSupplier();
                }
            }
        } catch (error) {
            showError(error?.data?.message || "Failed to create qarza account");
        } finally {
            setIsCreatingAccount(false);
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
            {purchaseModal && (
                <PurchaseModal
                    mode={purchaseModal.mode}
                    purchaseId={purchaseModal.id}
                    onClose={() => setPurchaseModal(null)}
                />
            )}
            {paymentModal && (
                <PurchasePaymentModal
                    purchase={paymentModal}
                    onClose={() => setPaymentModal(null)}
                    onSuccess={() => {
                        setPaymentModal(null);
                        refresh();
                    }}
                />
            )}
            {returnModal && (
                <PurchaseReturnModal
                    mode="create"
                    purchaseId={returnModal.purchaseId}
                    onClose={() => setReturnModal(null)}
                    onSuccess={() => {
                        setReturnModal(null);
                        refresh();
                    }}
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
            {activeTab === "credits" && qarzaAccountId && accountExists && (
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
            {activeTab === "credits" && (!qarzaAccountId || !accountExists) && (
                <div className="card p-6">
                    <div className="text-center py-8">
                        <p className="text-[var(--muted)] mb-4">
                            {qarzaAccountId && !accountExists 
                                ? "Qarza account has been deleted. Please create a new account." 
                                : "No credits/debits account associated with this supplier"}
                        </p>
                        <button
                            onClick={handleCreateQarzaAccount}
                            disabled={isCreatingAccount}
                            className="btn-add"
                        >
                            <Plus size={16} /> {isCreatingAccount ? "Creating..." : "Create Account"}
                        </button>
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
                    
                    {/* KPI Cards */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="card p-4" style={{ background: "rgba(15,118,110,0.08)", border: "1px solid var(--border)" }}>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Total Purchases</p>
                            <p className="text-xl font-black tabular-nums text-[var(--accent-2)]">{purchases.length}</p>
                        </div>
                        <div className="card p-4" style={{ background: "rgba(15,118,110,0.08)", border: "1px solid var(--border)" }}>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Total Amount</p>
                            <p className="text-xl font-black tabular-nums text-[var(--accent-2)]">Rs {purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0).toLocaleString()}</p>
                        </div>
                        <div className="card p-4" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid var(--border)" }}>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Paid Amount</p>
                            <p className="text-xl font-black tabular-nums text-[#10b981]">Rs {purchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0).toLocaleString()}</p>
                        </div>
                        <div className="card p-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid var(--border)" }}>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--muted)]">Remaining</p>
                            <p className="text-xl font-black tabular-nums text-[#ef4444]">Rs {purchases.reduce((sum, p) => sum + ((p.totalAmount || 0) - (p.paidAmount || 0)), 0).toLocaleString()}</p>
                        </div>
                    </div>

                    {purchases.length > 0 ? (
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
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Payment</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                                    {purchases.map((purchase) => {
                                        const totalAmount = purchase.totalAmount || 0;
                                        const paidAmount = purchase.paidAmount || 0;
                                        const remainingAmount = totalAmount - paidAmount;
                                        const status = purchase.status || 'ordered';
                                        const paymentStatus = purchase.paymentStatus || 'pending';
                                        
                                        const getStatusColor = (status) => {
                                            switch (status) {
                                                case 'ordered': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
                                                case 'delivered': return 'bg-green-100 text-green-800 border-green-300';
                                                case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
                                                default: return 'bg-gray-100 text-gray-800 border-gray-300';
                                            }
                                        };

                                        const getPaymentStatusColor = (status) => {
                                            switch (status) {
                                                case 'pending': return 'bg-gray-100 text-gray-800 border-gray-300';
                                                case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
                                                case 'full': return 'bg-green-100 text-green-800 border-green-300';
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

                                        const getPaymentStatusLabel = (status) => {
                                            switch (status) {
                                                case 'pending': return purchaseLabels.paymentPending || 'Pending';
                                                case 'partial': return purchaseLabels.paymentPartial || 'Partial';
                                                case 'full': return purchaseLabels.paymentFull || 'Full';
                                                default: return status;
                                            }
                                        };

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
                                                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getPaymentStatusColor(paymentStatus)}`}>
                                                        {getPaymentStatusLabel(paymentStatus)}
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
                                                        {status === 'delivered' && remainingAmount > 0 && (
                                                            <button 
                                                                onClick={() => setPaymentModal(purchase)}
                                                                className="px-3 py-1 text-xs rounded-lg font-medium transition bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 flex items-center gap-1"
                                                                title={purchaseLabels.pay || "Pay"}
                                                            >
                                                                <DollarSign className="w-3 h-3" />
                                                            </button>
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

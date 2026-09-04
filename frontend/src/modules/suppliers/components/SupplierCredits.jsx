import React, { useState } from "react";
import { Edit, Trash2, RefreshCw, Plus } from "lucide-react";
import { useSupplierPaymentsSummary, useSupplierPayments, useDeleteQarzaPayment, useRecalculateSupplierBalance, useCreateQarzaAccount } from "../../qarza/services/qarza.service.js";
import { useUpdateSupplier } from "../services/suppliers.service.js";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import QarzaPaymentModal from "../../qarza/components/QarzaPaymentModal.jsx";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import ConfirmDialog from "../../../shared/components/ConfirmationDialog.jsx";

export default function SupplierCredits({ supplier, qarzaAccountId, onSupplierUpdate }) {
    const [modal, setModal] = useState(null);
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);
    const [isRecalculating, setIsRecalculating] = useState(false);
    const [transactionSource, setTransactionSource] = useState("all");

    const { data: summary } = useSupplierPaymentsSummary(qarzaAccountId);
    const accountExists = summary?.accountExists !== false;
    const [deletePayment] = useDeleteQarzaPayment();
    const [createQarzaAccount] = useCreateQarzaAccount();
    const [updateSupplier] = useUpdateSupplier();
    const [recalculateSupplierBalance] = useRecalculateSupplierBalance();

    const handleDelete = async (paymentId) => {
        try {
            await deletePayment({ paymentId, qarzaAccountId }).unwrap();
            showSuccess("Payment deleted");
        } catch (e) {
            showError(e?.data?.message ?? "Delete failed");
        }
    };

    const handleRecalculateBalance = async () => {
        if (!qarzaAccountId) return;
        setIsRecalculating(true);
        try {
            await recalculateSupplierBalance(qarzaAccountId).unwrap();
            showSuccess("Balance recalculated successfully");
            if (onSupplierUpdate) onSupplierUpdate();
        } catch (error) {
            showError(error?.data?.message || "Failed to recalculate balance");
        } finally {
            setIsRecalculating(false);
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
                    if (onSupplierUpdate) onSupplierUpdate();
                }
            }
        } catch (error) {
            showError(error?.data?.message || "Failed to create qarza account");
        } finally {
            setIsCreatingAccount(false);
        }
    };

    if (!qarzaAccountId || !accountExists) {
        return (
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
        );
    }

    return (
        <>
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
                        <div className="flex gap-2">
                            <select
                                value={transactionSource}
                                onChange={(e) => setTransactionSource(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
                            >
                                <option value="all">All</option>
                                <option value="purchase">Purchases</option>
                                <option value="purchaseReturn">Purchase Returns</option>
                                <option value="manual">Manual</option>
                            </select>
                            <button
                                onClick={handleRecalculateBalance}
                                disabled={isRecalculating}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RefreshCw size={16} className={isRecalculating ? "animate-spin" : ""} />
                                {isRecalculating ? "Recalculating..." : "Recalculate Balance"}
                            </button>
                            <button
                                onClick={() => setModal({ mode: "create" })}
                                className="btn-add"
                            >
                                <Plus size={16} /> Add Payment
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <PaginatedList
                            rtkQuery={useSupplierPayments}
                            limit={20}
                            dataKey="data"
                            wrapperClassName="h-full"
                            queryArgs={{ qarzaAccountId, source: transactionSource }}
                            renderItems={(items) => {
                                if (!items?.length) return null;
                                return (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead style={{ background: "var(--surface-muted)" }}>
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Type</th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Amount</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Payment Method</th>
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
                                                                {item.paymentMethodName || item.paymentMethod?.name || "-"}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-[var(--muted)]">
                                                                {item.notes || "-"}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-[var(--muted)]">
                                                                {new Date(item.transactionDate || item.date).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                {item.sourceType !== 'purchase' && item.sourceType !== 'purchaseReturn' && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => setModal({ mode: "update", payment: item })}
                                                                            className="p-2 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] hover:border-[var(--accent-2)] hover:text-[var(--accent-2)]"
                                                                        >
                                                                            <Edit size={14} />
                                                                        </button>
                                                                        <ConfirmDialog message="Delete this payment?" onConfirm={() => handleDelete(item._id)}>
                                                                            <button
                                                                                className="p-2 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] hover:border-red-400 hover:text-red-500 ml-2"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        </ConfirmDialog>
                                                                    </>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            }}
                        />
                    </div>
                </div>
            </div>

            {modal && (
                <QarzaPaymentModal
                    mode={modal.mode}
                    qarzaAccountId={qarzaAccountId}
                    payment={modal.payment}
                    onClose={() => setModal(null)}
                    onSuccess={() => setModal(null)}
                />
            )}
        </>
    );
}

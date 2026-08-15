import { useState, useEffect } from "react";
import { DollarSign, Calendar, X, Plus } from "lucide-react";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import { useQarzaAccounts } from "../../qarza/services/qarza.service.js";
import { usePaymentMethods } from "../../settings/services/paymentMethod.service.js";
import QarzaAccountModal from "../../qarza/components/QarzaAccountModal.jsx";
import PaymentMethodModal from "../../settings/components/PaymentMethodModal.jsx";

export default function OrderReturnRefundModal({ orderReturn, refund, onClose, onSuccess }) {
    const isEditing = Boolean(refund);
    const [refundDate, setRefundDate] = useState(refund?.refundDate ? new Date(refund.refundDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [refundMethod, setRefundMethod] = useState(refund?.refundMethod || "cash");
    const [creditAccountId, setCreditAccountId] = useState(refund?.creditAccount?._id || "");
    const [cashAmount, setCashAmount] = useState(refund?.cashAmount?.toString() || "");
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(refund?.paymentMethodId || "");
    const [showQarzaModal, setShowQarzaModal] = useState(false);
    const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);

    const { data: creditAccounts, refetch: refetchAccounts } = useQarzaAccounts();
    const { data: paymentMethodsData = [] } = usePaymentMethods();

    const remainingAmount = orderReturn?.totalRefundAmount - (orderReturn?.refundedAmount || 0);
    const editingAmount = refund?.amount || remainingAmount;

    // Auto-set cash amount based on refund method
    useEffect(() => {
        if (refundMethod === 'cash') {
            setCashAmount(remainingAmount.toString());
        } else {
            setCashAmount("");
        }
    }, [refundMethod, remainingAmount]);

    const handleQarzaAccountCreated = () => {
        setShowQarzaModal(false);
        refetchAccounts();
    };

    const handlePaymentMethodCreated = () => {
        setShowPaymentMethodModal(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let refundData = {
            orderReturn: orderReturn._id,
            refundDate,
            refundMethod,
            paymentMethodId: selectedPaymentMethodId,
            paymentMethodName: selectedPaymentMethodId ? paymentMethodsData?.find(pm => pm._id === selectedPaymentMethodId)?.name || "" : "",
            creditAccount: null,
            cashAmount: 0,
            creditAmount: 0,
        };

        if (refundMethod === 'cash') {
            // Cash mode: full refund automatically
            refundData.amount = editingAmount;
            refundData.cashAmount = editingAmount;
        } else if (refundMethod === 'credit') {
            // Credit mode: full refund automatically
            if (!creditAccountId) {
                showError("Please select a credit account");
                return;
            }
            refundData.amount = editingAmount;
            refundData.creditAccount = creditAccountId;
            refundData.creditAmount = editingAmount;
        } else if (refundMethod === 'hybrid') {
            // Hybrid mode: user enters cash, rest goes to credit
            const cash = parseFloat(cashAmount) || 0;
            if (cash <= 0 || cash > editingAmount) {
                showError("Cash amount must be greater than 0 and less than or equal to remaining amount");
                return;
            }
            if (!creditAccountId) {
                showError("Please select a credit account");
                return;
            }
            const credit = editingAmount - cash;
            refundData.amount = editingAmount;
            refundData.cashAmount = cash;
            refundData.creditAccount = creditAccountId;
            refundData.creditAmount = credit;
        }

        try {
            let response;
            if (isEditing) {
                response = await fetch(`http://localhost:5001/api/product-returns/${orderReturn._id}/refunds/${refund._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(refundData),
                });
            } else {
                response = await fetch(`http://localhost:5001/api/product-returns/${orderReturn._id}/refunds`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(refundData),
                });
            }

            const data = await response.json();
            if (data.success) {
                showSuccess(isEditing ? "Refund updated successfully" : "Refund recorded successfully");
                onSuccess();
            } else {
                showError(data.message || "Failed to record refund");
            }
        } catch (error) {
            showError("Failed to record refund");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4">
            <div className="bg-[var(--app-bg)] rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-[var(--accent-2)]" />
                        <h2 className="text-lg font-semibold text-[var(--ink)]">{isEditing ? "Edit Refund" : "Record Refund"}</h2>
                    </div>
                    <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--ink)]">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="bg-[var(--hover)] p-3 rounded-lg">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-[var(--muted)]">Total Return Amount:</span>
                            <span className="font-medium text-[var(--ink)]">Rs {orderReturn?.totalRefundAmount?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-[var(--muted)]">Refunded Amount:</span>
                            <span className="font-medium text-[var(--ink)]">Rs {(orderReturn?.refundedAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold">
                            <span className="text-[var(--muted)]">Remaining:</span>
                            <span className="text-[var(--accent-2)]">Rs {remainingAmount.toLocaleString()}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-[var(--muted)] mb-1">Refund Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                            <input
                                type="date"
                                value={refundDate}
                                onChange={(e) => setRefundDate(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-[var(--muted)] mb-2">Refund Method</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setRefundMethod("cash")}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${refundMethod === 'cash'
                                    ? 'bg-green-500 text-white border-green-600'
                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                    } border`}
                            >
                                Cash
                            </button>
                            <button
                                type="button"
                                onClick={() => setRefundMethod("credit")}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${refundMethod === 'credit'
                                    ? 'bg-blue-500 text-white border-blue-600'
                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                    } border`}
                            >
                                Credit
                            </button>
                            <button
                                type="button"
                                onClick={() => setRefundMethod("hybrid")}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${refundMethod === 'hybrid'
                                    ? 'bg-purple-500 text-white border-purple-600'
                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                    } border`}
                            >
                                Hybrid
                            </button>
                        </div>
                    </div>

                    {refundMethod === 'cash' && (
                        <>
                            <div>
                                <label className="block text-sm text-[var(--muted)] mb-1">Payment Method</label>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedPaymentMethodId}
                                        onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                                        required
                                    >
                                        <option value="">Select payment method</option>
                                        {paymentMethodsData.map(pm => (
                                            <option key={pm._id} value={pm._id}>{pm.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setShowPaymentMethodModal(true)}
                                        className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
                                        title="Create new payment method"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                                <p className="text-sm text-green-800">Full refund of Rs {remainingAmount.toLocaleString()} will be recorded as cash.</p>
                            </div>
                        </>
                    )}

                    {refundMethod === 'credit' && (
                        <div>
                            <label className="block text-sm text-[var(--muted)] mb-1">Select Credit Account</label>
                            <div className="flex gap-2">
                                <select
                                    value={creditAccountId}
                                    onChange={(e) => setCreditAccountId(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                                    required
                                >
                                    <option value="">Select credit account</option>
                                    {creditAccounts?.accounts?.map(account => (
                                        <option key={account._id} value={account._id}>
                                            {account.name} (Type: {account.type})
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowQarzaModal(true)}
                                    className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
                                    title="Create new account"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                            <p className="text-xs text-[var(--muted)] mt-1">Full refund of Rs {remainingAmount.toLocaleString()} will be charged to this account.</p>
                        </div>
                    )}

                    {refundMethod === 'hybrid' && (
                        <>
                            <div>
                                <label className="block text-sm text-[var(--muted)] mb-1">Payment Method</label>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedPaymentMethodId}
                                        onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                                        required
                                    >
                                        <option value="">Select payment method</option>
                                        {paymentMethodsData.map(pm => (
                                            <option key={pm._id} value={pm._id}>{pm.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setShowPaymentMethodModal(true)}
                                        className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
                                        title="Create new payment method"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--muted)] mb-1">Cash Amount</label>
                                <input
                                    type="number"
                                    value={cashAmount}
                                    onChange={(e) => setCashAmount(e.target.value)}
                                    placeholder="Enter cash amount"
                                    max={remainingAmount}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                                    required
                                />
                                <p className="text-xs text-[var(--muted)] mt-1">Maximum: Rs {remainingAmount.toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--muted)] mb-1">Select Credit Account</label>
                                <div className="flex gap-2">
                                    <select
                                        value={creditAccountId}
                                        onChange={(e) => setCreditAccountId(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                                        required
                                    >
                                        <option value="">Select credit account</option>
                                        {creditAccounts?.accounts?.map(account => (
                                            <option key={account._id} value={account._id}>
                                                {account.name} (Type: {account.type})
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setShowQarzaModal(true)}
                                        className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
                                        title="Create new account"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <p className="text-xs text-[var(--muted)] mt-1">
                                    Remaining Rs {(remainingAmount - (parseFloat(cashAmount) || 0)).toLocaleString()} will be charged to this account.
                                </p>
                            </div>
                        </>
                    )}

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--hover)] text-[var(--ink)]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-[var(--accent-2)] text-white rounded-lg hover:bg-[var(--accent-2)]/90"
                        >
                            Record Refund
                        </button>
                    </div>
                </form>
            </div>
            {showQarzaModal && (
                <QarzaAccountModal
                    mode="create"
                    onClose={() => setShowQarzaModal(false)}
                    onSuccess={handleQarzaAccountCreated}
                />
            )}
            {showPaymentMethodModal && (
                <PaymentMethodModal
                    mode="create"
                    onClose={() => setShowPaymentMethodModal(false)}
                    onSuccess={handlePaymentMethodCreated}
                    labels={{ addPaymentMethod: "Add Payment Method", paymentMethodName: "Payment Method Name", paymentMethodNameRequired: "Payment method name is required", paymentMethodPlaceholder: "e.g., Cash, Bank Transfer", active: "Active", cancel: "Cancel", add: "Add", saving: "Saving..." }}
                />
            )}
        </div>
    );
}

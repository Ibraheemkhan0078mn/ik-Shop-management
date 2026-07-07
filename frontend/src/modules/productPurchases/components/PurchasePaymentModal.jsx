import { useState, useEffect } from "react";
import { DollarSign, Calendar, X, Plus } from "lucide-react";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import { useQarzaAccounts } from "../../qarza/services/qarza.service.js";
import QarzaAccountModal from "../../qarza/components/QarzaAccountModal.jsx";

export default function PurchasePaymentModal({ purchase, payment, onClose, onSuccess }) {
    const isEditing = Boolean(payment);
    const [paymentDate, setPaymentDate] = useState(payment?.paymentDate ? new Date(payment.paymentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState(payment?.paymentMethod || "cash");
    const [creditAccountId, setCreditAccountId] = useState(payment?.creditAccount?._id || "");
    const [cashAmount, setCashAmount] = useState(payment?.cashAmount?.toString() || "");
    const [showQarzaModal, setShowQarzaModal] = useState(false);

    const { data: creditAccounts, refetch: refetchAccounts } = useQarzaAccounts();

    const remainingAmount = purchase?.totalAmount - (purchase?.paidAmount || 0);
    const editingAmount = payment?.amount || remainingAmount;

    // Auto-set cash amount based on payment method
    useEffect(() => {
        if (paymentMethod === 'cash') {
            setCashAmount(remainingAmount.toString());
        } else {
            setCashAmount("");
        }
    }, [paymentMethod, remainingAmount]);

    const handleQarzaAccountCreated = () => {
        setShowQarzaModal(false);
        refetchAccounts();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let paymentData = {
            purchase: purchase._id,
            paymentDate,
            paymentMethod,
            creditAccount: null,
            cashAmount: 0,
            creditAmount: 0,
        };

        if (paymentMethod === 'cash') {
            // Cash mode: full payment automatically
            paymentData.amount = editingAmount;
            paymentData.cashAmount = editingAmount;
        } else if (paymentMethod === 'credit') {
            // Credit mode: full payment automatically
            if (!creditAccountId) {
                showError("Please select a credit account");
                return;
            }
            paymentData.amount = editingAmount;
            paymentData.creditAccount = creditAccountId;
            paymentData.creditAmount = editingAmount;
        } else if (paymentMethod === 'hybrid') {
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
            paymentData.amount = editingAmount;
            paymentData.cashAmount = cash;
            paymentData.creditAccount = creditAccountId;
            paymentData.creditAmount = credit;
        }

        try {
            let response;
            if (isEditing) {
                response = await fetch(`http://localhost:5001/api/purchases/payments/${payment._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(paymentData),
                });
            } else {
                response = await fetch(`http://localhost:5001/api/purchases/${purchase._id}/payments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(paymentData),
                });
            }

            const data = await response.json();
            console.log('Payment response:', data); // Debug log
            if (data.success) {
                showSuccess(isEditing ? "Payment updated successfully" : "Payment recorded successfully");
                onSuccess();
            } else {
                showError(data.message || "Failed to record payment");
            }
        } catch (error) {
            console.error('Payment error:', error); // Debug log
            showError("Failed to record payment");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4">
            <div className="bg-[var(--app-bg)] rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-[var(--accent-2)]" />
                        <h2 className="text-lg font-semibold text-[var(--ink)]">{isEditing ? "Edit Payment" : "Record Payment"}</h2>
                    </div>
                    <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--ink)]">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="bg-[var(--hover)] p-3 rounded-lg">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-[var(--muted)]">Total Amount:</span>
                            <span className="font-medium text-[var(--ink)]">Rs {purchase?.totalAmount?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-[var(--muted)]">Paid Amount:</span>
                            <span className="font-medium text-[var(--ink)]">Rs {(purchase?.paidAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold">
                            <span className="text-[var(--muted)]">Remaining:</span>
                            <span className="text-[var(--accent-2)]">Rs {remainingAmount.toLocaleString()}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-[var(--muted)] mb-1">Payment Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                            <input
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-[var(--muted)] mb-2">Payment Method</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod("cash")}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${paymentMethod === 'cash'
                                    ? 'bg-green-500 text-white border-green-600'
                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                    } border`}
                            >
                                Cash
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentMethod("credit")}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${paymentMethod === 'credit'
                                    ? 'bg-blue-500 text-white border-blue-600'
                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                    } border`}
                            >
                                Credit
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentMethod("hybrid")}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${paymentMethod === 'hybrid'
                                    ? 'bg-purple-500 text-white border-purple-600'
                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                    } border`}
                            >
                                Hybrid
                            </button>
                        </div>
                    </div>

                    {paymentMethod === 'cash' && (
                        <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                            <p className="text-sm text-green-800">Full payment of Rs {remainingAmount.toLocaleString()} will be recorded as cash.</p>
                        </div>
                    )}

                    {paymentMethod === 'credit' && (
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
                            <p className="text-xs text-[var(--muted)] mt-1">Full payment of Rs {remainingAmount.toLocaleString()} will be charged to this account.</p>
                        </div>
                    )}

                    {paymentMethod === 'hybrid' && (
                        <>
                            <div>
                                <label className="block text-sm text-[var(--muted)] mb-1">Cash Amount</label>
                                <input
                                    type="number"
                                    value={cashAmount}
                                    onChange={(e) => setCashAmount(e.target.value)}
                                    placeholder="Enter cash amount"
                                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                                    required
                                />
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
                            Record Payment
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
        </div>
    );
}

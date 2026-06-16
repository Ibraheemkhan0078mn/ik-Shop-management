
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import {
    useCreateClassPartnershipPaymentMutation,
    useUpdateClassPartnershipPaymentMutation,
} from '../api/member.rtk.api';

export function ClassPartnershipPaymentModel({ classPartnershipId, operation = "create", paymentData = null, setVisibility }) {
    const [amount, setAmount] = useState("");
    const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [error, setError] = useState("");
console.log("The class partnership id", classPartnershipId, operation, paymentData)
    // ── RTK Mutations ────────────────────────────────────────────────────────
    const [createPayment, { isLoading: isCreating }] = useCreateClassPartnershipPaymentMutation();
    const [updatePayment, { isLoading: isUpdating }] = useUpdateClassPartnershipPaymentMutation();

    const isLoading = isCreating || isUpdating;

    // ── Hydrate on Update ────────────────────────────────────────────────────
    useEffect(() => {
        if (operation === "update" && paymentData) {
            setAmount(paymentData?.amount ?? "");
            setPaymentDate(
                paymentData?.paymentDate
                    ? new Date(paymentData.paymentDate).toISOString().split("T")[0]
                    : new Date().toISOString().split("T")[0]
            );
        }
    }, [operation, paymentData]);

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            setError("Enter a valid amount.");
            return;
        }
        setError("");

        try {
            if (operation === "create") {
                await createPayment({
                    classPartnershipId,
                    amount: Number(amount),
                    paymentDate,
                }).unwrap();
                toast.success("Payment added successfully");
            } else {
                await updatePayment({
                    id: paymentData?._id,
                    payload: { amount: Number(amount), paymentDate },
                    classPartnershipId
                }).unwrap();
                toast.success("Payment updated successfully");
            }
            setVisibility(false);
        } catch (err) {
            setError(err?.data?.message ?? "Something went wrong.");
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 app-backdrop px-4"
            onClick={() => setVisibility(false)}
        >
            <div
                className="w-full max-w-sm bg-surface rounded-2xl shadow-2xl border border-edge-brand overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 app-gradient-soft border-b border-edge-brand">
                    <div>
                        <h3 className="text-sm font-black text-ink">
                            {operation === "create" ? "Add Payment" : "Update Payment"}
                        </h3>
                        <p className="text-[10px] font-bold text-ink-subtle mt-0.5">Partnership ID: {classPartnershipId}</p>
                    </div>
                    <button
                        onClick={() => setVisibility(false)}
                        className="p-1.5 rounded-xl hover:bg-primary-muted text-ink-subtle hover:text-primary transition-all"
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Form */}
                <div className="px-5 py-5 flex flex-col gap-4">
                    <div>
                        <label className="text-[10px] font-black text-primary uppercase tracking-tight block mb-1.5">Amount (PKR)</label>
                        <input
                            type="number"
                            min={1}
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="e.g. 5000"
                            className="w-full px-3 py-2.5 rounded-xl border border-edge-brand bg-primary-muted/40 text-sm font-bold text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:bg-surface transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-primary uppercase tracking-tight block mb-1.5">Payment Date</label>
                        <input
                            type="date"
                            value={paymentDate}
                            onChange={e => setPaymentDate(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-edge-brand bg-primary-muted/40 text-sm font-bold text-ink focus:outline-none focus:border-accent focus:bg-surface transition-all"
                        />
                    </div>

                    {error && (
                        <p className="text-[11px] font-bold text-danger bg-danger-muted px-3 py-2 rounded-xl border border-danger">
                            {error}
                        </p>
                    )}

                    <div className="flex gap-2 mt-1">
                        <button
                            onClick={() => setVisibility(false)}
                            className="flex-1 py-2.5 rounded-xl border border-edge text-sm font-black text-ink-muted hover:bg-surface-muted transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="flex-1 py-2.5 rounded-xl bg-primary-muted hover:bg-primary text-sm font-black text-primary-foreground transition-all disabled:opacity-50"
                        >
                            {isLoading
                                ? "Saving..."
                                : operation === "create" ? "Add Payment" : "Update"
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}





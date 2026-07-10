import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { usePaymentMethod, useCreatePaymentMethod, useUpdatePaymentMethod } from "../services/paymentMethod.service.js";

export default function PaymentMethodModal({ mode, paymentMethodId, onClose }) {
    const [formData, setFormData] = useState({
        name: "",
        isActive: true,
    });
    const [errors, setErrors] = useState({});

    const { data: paymentMethodData, isLoading } = usePaymentMethod(paymentMethodId, { skip: mode === "create" });
    const [createPaymentMethod, { isLoading: isCreating }] = useCreatePaymentMethod();
    const [updatePaymentMethod, { isLoading: isUpdating }] = useUpdatePaymentMethod();

    useEffect(() => {
        if (mode === "update" && paymentMethodData) {
            setFormData({
                name: paymentMethodData.name || "",
                isActive: paymentMethodData.isActive ?? true,
            });
        } else if (mode === "create") {
            setFormData({ name: "", isActive: true });
            setErrors({});
        }
    }, [mode, paymentMethodData]);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = "Payment method name is required";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            if (mode === "create") {
                await createPaymentMethod({
                    name: formData.name.trim(),
                    isActive: formData.isActive,
                }).unwrap();
                onClose();
            } else {
                await updatePaymentMethod({
                    id: paymentMethodId,
                    name: formData.name.trim(),
                    isActive: formData.isActive,
                }).unwrap();
                onClose();
            }
        } catch (error) {
            setErrors({ submit: error?.data?.message || "Failed to save payment method" });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl shadow-2xl bg-[var(--surface)] border border-[var(--border)]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-bold text-[var(--ink)]">
                        {mode === "create" ? "Add Payment Method" : "Edit Payment Method"}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-[var(--hover)] rounded-lg">
                        <X size={20} className="text-[var(--muted)]" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {errors.submit && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{errors.submit}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">
                            Payment Method Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={`w-full px-4 py-2.5 rounded-lg border ${
                                errors.name ? 'border-red-500 bg-red-500/5' : 'border-[var(--border)] bg-[var(--app-bg)]'
                            } text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent-2)] focus:ring-1 focus:ring-[var(--accent-2)] transition-all`}
                            placeholder="e.g., Cash, Bank Transfer, JazzCash"
                        />
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent-2)] focus:ring-[var(--accent-2)]"
                        />
                        <label htmlFor="isActive" className="text-sm text-[var(--ink)]">
                            Active
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--ink)] hover:bg-[var(--hover)] transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isCreating || isUpdating || isLoading}
                            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-[var(--accent-2)] text-white hover:bg-[var(--accent-2)]/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreating || isUpdating || isLoading ? "Saving..." : mode === "create" ? "Add" : "Update"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

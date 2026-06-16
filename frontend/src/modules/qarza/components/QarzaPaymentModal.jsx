// src/modules/qarza/components/QarzaPaymentModal.jsx
// Props: mode "create"|"update", qarzaAccountId, payment (for update), onClose, onSuccess
import { useState, useEffect } from "react";
import { X, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { showError, showSuccess } from "../../../utils/toastHelpers";
import { useCreateQarzaPayment, useUpdateQarzaPayment } from "../services/qarza.service.js";

const today = () => new Date().toISOString().split("T")[0];

const emptyForm = () => ({ amount: "", type: "cashin", date: today(), notes: "" });

// ─── atoms ────────────────────────────────────────────────────────────────────
const Label = ({ children }) => (
    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--muted)" }}>
        {children}
    </label>
);
const Field = ({ children, className = "" }) => <div className={`flex flex-col ${className}`}>{children}</div>;
const Inp = ({ className = "", ...p }) => (
    <input {...p} className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition focus:ring-2 ${className}`}
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" }} />
);
const Txt = ({ className = "", ...p }) => (
    <textarea {...p} className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition resize-none focus:ring-2 ${className}`}
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" }} />
);
const Btn = ({ children, variant = "primary", className = "", ...p }) => {
    const styles = {
        primary:   { background: "var(--accent-2)", color: "#fff" },
        secondary: { background: "var(--surface-muted)", color: "var(--ink)", border: "1px solid var(--border)" },
    };
    return (
        <button {...p} style={p.disabled ? { ...styles[variant], opacity: 0.45, cursor: "not-allowed" } : styles[variant]}
            className={`inline-flex items-center justify-center gap-2 font-semibold rounded-xl px-4 py-2 text-sm transition-all active:scale-95 disabled:pointer-events-none cursor-pointer ${className}`}>
            {children}
        </button>
    );
};

export default function QarzaPaymentModal({ mode = "create", qarzaAccountId, payment, onClose, onSuccess }) {
    const isUpdate = mode === "update";

    const [createPayment, { isLoading: isCreating }] = useCreateQarzaPayment();
    const [updatePayment, { isLoading: isUpdating }] = useUpdateQarzaPayment();
    const isSubmitting = isCreating || isUpdating;

    const [form, setForm] = useState(emptyForm());
    const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

    useEffect(() => {
        if (!isUpdate || !payment) return;
        setForm({
            amount: payment.amount ?? "",
            type:   payment.type   ?? "cashin",
            date:   payment.date   ? new Date(payment.date).toISOString().split("T")[0] : today(),
            notes:  payment.notes  ?? "",
        });
    }, [payment, isUpdate]);

    const handleSubmit = async () => {
        if (!form.amount || Number(form.amount) <= 0) return showError("Enter valid amount");
        if (!form.date) return showError("Date is required");

        try {
            if (isUpdate) {
                await updatePayment({ _id: payment._id, qarzaAccountId, ...form, amount: Number(form.amount) }).unwrap();
                showSuccess("Payment updated!");
            } else {
                await createPayment({ qarzaAccountId, ...form, amount: Number(form.amount) }).unwrap();
                showSuccess("Payment recorded!");
                setForm(emptyForm());
            }
            onSuccess?.();
            onClose();
        } catch (e) {
            showError(e?.data?.message ?? "Operation failed");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-3 overflow-y-auto"
            onClick={onClose}>
            <div className="relative w-full max-w-md my-4 rounded-3xl shadow-2xl overflow-hidden"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                onClick={e => e.stopPropagation()}>

                {/* header */}
                <div className="flex items-center justify-between px-5 py-4"
                    style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--border)" }}>
                    <h2 className="text-base font-bold" style={{ color: "var(--ink)" }}>
                        {isUpdate ? "Edit Payment" : "New Payment"}
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl"
                        style={{ background: "var(--surface)", color: "var(--muted)" }}>
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* type toggle */}
                    <Field>
                        <Label>Type</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { val: "cashin",  label: "Cash In",  Icon: ArrowDownLeft,  color: "#10b981" },
                                { val: "cashout", label: "Cash Out", Icon: ArrowUpRight,  color: "#ef4444" },
                            ].map(({ val, label, Icon, color }) => (
                                <button key={val} type="button" onClick={() => update("type", val)}
                                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all"
                                    style={{
                                        border: form.type === val ? `2px solid ${color}` : "1px solid var(--border)",
                                        background: form.type === val ? `${color}15` : "var(--surface)",
                                        color: form.type === val ? color : "var(--muted)",
                                        fontWeight: form.type === val ? 700 : 500,
                                    }}>
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field>
                            <Label>Amount *</Label>
                            <Inp type="number" min={0} placeholder="0.00"
                                value={form.amount} onChange={e => update("amount", e.target.value)}
                                onWheel={e => e.target.blur()} />
                        </Field>
                        <Field>
                            <Label>Date *</Label>
                            <Inp type="date" value={form.date} onChange={e => update("date", e.target.value)} />
                        </Field>
                    </div>

                    <Field>
                        <Label>Notes</Label>
                        <Txt rows={2} placeholder="Optional notes…"
                            value={form.notes} onChange={e => update("notes", e.target.value)} />
                    </Field>

                    <div className="flex justify-end gap-3 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
                        <Btn variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? "Saving…" : isUpdate ? "Update" : "Record Payment"}
                        </Btn>
                    </div>
                </div>
            </div>
        </div>
    );
}

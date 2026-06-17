// src/modules/expense/components/ExpenseModal.jsx
// Props: mode "create"|"update", expense (for update), onClose, onSuccess
import { useState, useEffect } from "react";
import { X, DollarSign } from "lucide-react";
import { showError, showSuccess } from "@shared/utilities/toastHelpers";
import { useCreateExpense, useUpdateExpense, useExpenseCategories } from "../services/expense.service.js";
import { useSelector } from "react-redux";

const today = () => new Date().toISOString().split("T")[0];
const emptyForm = () => ({ amount: "", category: "general", date: today(), notes: "" });

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
const Sel = ({ className = "", ...p }) => (
    <select {...p} className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition ${className}`}
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

export default function ExpenseModal({ mode = "create", expense, onClose, onSuccess }) {
    const language  = useSelector(s => s.auth?.user?.language ?? "en");
    const isUpdate  = mode === "update";

    const { data: categories = [] } = useExpenseCategories();
    const [createExpense, { isLoading: isCreating }] = useCreateExpense();
    const [updateExpense, { isLoading: isUpdating }] = useUpdateExpense();
    const isSubmitting = isCreating || isUpdating;

    const [form, setForm] = useState(emptyForm());
    const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

    useEffect(() => {
        if (!isUpdate || !expense) return;
        setForm({
            amount:   expense.amount   ?? "",
            category: expense.category ?? "general",
            date:     expense.date ? new Date(expense.date).toISOString().split("T")[0] : today(),
            notes:    expense.notes    ?? "",
        });
    }, [expense, isUpdate]);

    const handleSubmit = async () => {
        if (!form.amount || Number(form.amount) <= 0) return showError("Enter valid amount");
        if (!form.date) return showError("Date is required");

        const payload = { ...form, amount: Number(form.amount), type: "purchase" };
        if (isUpdate) payload._id = expense._id;

        try {
            if (isUpdate) {
                await updateExpense(payload).unwrap();
                showSuccess("Expense updated!");
            } else {
                await createExpense(payload).unwrap();
                showSuccess("Expense recorded!");
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
                <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
                    style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: "var(--accent)" }}>
                            <DollarSign className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold" style={{ color: "var(--ink)" }}>
                                {isUpdate ? "Edit Expense" : "New Expense"}
                            </h2>
                            <p className="text-xs" style={{ color: "var(--muted)" }}>
                                {language === "en" ? "Record spending" : "اخراجات ریکارڈ کریں"}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl"
                        style={{ background: "var(--surface-muted)", color: "var(--muted)" }}>
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <Field>
                        <Label>Amount *</Label>
                        <Inp type="number" min={0} placeholder="0.00"
                            value={form.amount} onChange={e => update("amount", e.target.value)}
                            onWheel={e => e.target.blur()} autoFocus />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field>
                            <Label>Category</Label>
                            <Sel value={form.category} onChange={e => update("category", e.target.value)}>
                                <option value="general">General</option>
                                {categories.map((c, i) => (
                                    <option key={c._id ?? i} value={c.name}>{c.name}</option>
                                ))}
                            </Sel>
                        </Field>
                        <Field>
                            <Label>Date *</Label>
                            <Inp type="date" value={form.date} onChange={e => update("date", e.target.value)} />
                        </Field>
                    </div>

                    <Field>
                        <Label>Notes</Label>
                        <Txt rows={3} placeholder="Optional details…"
                            value={form.notes} onChange={e => update("notes", e.target.value)} />
                    </Field>

                    <div className="flex justify-end gap-3 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
                        <Btn variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? "Saving…" : isUpdate ? "Update" : "Save Expense"}
                        </Btn>
                    </div>
                </div>
            </div>
        </div>
    );
}


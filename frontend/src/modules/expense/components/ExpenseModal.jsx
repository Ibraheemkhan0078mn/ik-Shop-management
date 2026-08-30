// src/modules/expense/components/ExpenseModal.jsx
// Props: mode "create"|"update", expense (for update), onClose, onSuccess
import { useState, useEffect, useMemo, useRef } from "react";
import { X, DollarSign, ChevronDown } from "lucide-react";
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getExpenseLabels } from "../labels/expenseLabels.js";
import { useCreateExpense, useUpdateExpense } from "../services/expense.service.js";
import { ExpenseCategoryService } from "../api/expenseCategoriesApi.js";
 
const today = () => new Date().toISOString().split("T")[0];
const emptyForm = () => ({ amount: "", category: "", date: today(), notes: "" });

// ─── API-based searchable select for expense categories ─────────────────────────────
const ApiExpenseCategorySelect = ({ value, onChange, placeholder = "Search categories..." }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState([]);
    const ref = useRef();

    // Add current value to options if not already present (for update mode)
    const selected = useMemo(() => {
        const found = options.find(o => o.value === value);
        if (found) return found;
        // If value exists but not in options, create a temporary option
        if (value) return { label: value, value: value, data: { name: value } };
        return null;
    }, [options, value]);

    const searchCategories = async (query) => {
        if (!query || query.length < 1) {
            setOptions([]);
            return;
        }
        setLoading(true);
        try {
            const results = await ExpenseCategoryService.search(query, 20);
            setOptions(results.map(c => ({ label: c.name, value: c.name, data: c })));
        } catch (error) {
            console.error("Error searching expense categories:", error);
            setOptions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (open && search) {
                searchCategories(search);
            }
        }, 300);
        return () => clearTimeout(debounceTimer);
    }, [search, open]);

    return (
        <div ref={ref} className="relative w-full">
            <button type="button" onClick={() => setOpen(p => !p)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl transition text-left"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: selected ? "var(--ink)" : "var(--muted)" }}>
                <span className="truncate">{selected?.label || placeholder}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "var(--muted)" }} />
            </button>
            {open && (
                <div className="absolute z-50 w-full mt-1 rounded-xl shadow-xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div className="p-2" style={{ borderBottom: "1px solid var(--border)" }}>
                        <input 
                            autoFocus 
                            type="text" 
                            placeholder="Search categories..." 
                            value={search} 
                            onChange={e => setSearch(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm rounded-lg outline-none"
                            style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", color: "var(--ink)" }} 
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {loading ? (
                            <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
                        ) : search.length < 1 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">Type at least 1 character to search</div>
                        ) : options.length > 0 ? (
                            options.map(o => (
                                <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); setSearch(""); }}
                                    className="px-3 py-2 text-sm cursor-pointer transition"
                                    style={{ background: value === o.value ? "rgba(15,118,110,0.08)" : "transparent", color: value === o.value ? "var(--accent-2)" : "var(--ink)", fontWeight: value === o.value ? 600 : 400 }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(15,118,110,0.06)"}
                                    onMouseLeave={e => e.currentTarget.style.background = value === o.value ? "rgba(15,118,110,0.08)" : "transparent"}>
                                    {o.label}
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">No categories found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

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

export default function ExpenseModal({ mode = "create", expense, onClose, onSuccess }) {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getExpenseLabels(language);
    
    const isUpdate = mode === "update";

    const [createExpense, { isLoading: isCreating }] = useCreateExpense();
    const [updateExpense, { isLoading: isUpdating }] = useUpdateExpense();
    const isSubmitting = isCreating || isUpdating;

    const [form, setForm] = useState(emptyForm());
    const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

    useEffect(() => {
        if (!isUpdate || !expense) return;
        setForm({
            amount:   expense.amount   ?? "",
            category: expense.expenseCategory ?? expense.category ?? "",
            date:     expense.transactionDate ? new Date(expense.transactionDate).toISOString().split("T")[0] : (expense.date ? new Date(expense.date).toISOString().split("T")[0] : today()),
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
                showSuccess(labels.expenseUpdated);
            } else {
                await createExpense(payload).unwrap();
                showSuccess(labels.expenseCreated);
                setForm(emptyForm());
            }
            onSuccess?.();
            onClose();
        } catch (e) {
            showError(e?.data?.message ?? labels.failedToUpdate);
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
                                {isUpdate ? labels.editExpense : labels.addExpense}
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
                        <Label>{labels.amount} *</Label>
                        <Inp type="number" min={0} placeholder="0.00"
                            value={form.amount} onChange={e => update("amount", e.target.value)}
                            onWheel={e => e.target.blur()} autoFocus />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field>
                            <Label>{labels.category}</Label>
                            <ApiExpenseCategorySelect
                                value={form.category}
                                onChange={(value) => update("category", value)}
                                placeholder="Select category"
                            />
                        </Field>
                        <Field>
                            <Label>{labels.date} *</Label>
                            <Inp type="date" value={form.date} onChange={e => update("date", e.target.value)} />
                        </Field>
                    </div>

                    <Field>
                        <Label>{labels.description}</Label>
                        <Txt rows={3} placeholder={language === "en" ? "Optional details…" : "اختیاری تفصیلات…"}
                            value={form.notes} onChange={e => update("notes", e.target.value)} />
                    </Field>

                    <div className="flex justify-end gap-3 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                        <Btn variant="secondary" onClick={onClose}>{labels.cancel}</Btn>
                        <Btn variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? (language === "en" ? "Saving…" : "محفوظ ہو رہا ہے…") : isUpdate ? labels.edit : labels.addExpense}
                        </Btn>
                    </div>
                </div>
            </div>
        </div>
    );
}


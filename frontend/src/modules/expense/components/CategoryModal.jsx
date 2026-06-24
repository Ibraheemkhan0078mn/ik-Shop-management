// src/modules/expense/components/CategoryModal.jsx
// Manages expense categories: list + create + delete
import { useState } from "react";
import { X, Plus, Trash2, Tag } from "lucide-react";
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
import { useExpenseCategories, useCreateExpenseCategory, useDeleteExpenseCategory } from "../services/expense.service.js";

const Btn = ({ children, variant = "primary", size = "md", className = "", ...p }) => {
    const sz = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" }[size];
    const styles = {
        primary:   { background: "var(--accent-2)", color: "#fff" },
        secondary: { background: "var(--surface-muted)", color: "var(--ink)", border: "1px solid var(--border)" },
        danger:    { background: "rgba(220,38,38,0.08)", color: "#dc2626" },
    };
    return (
        <button {...p} style={p.disabled ? { ...styles[variant], opacity: 0.45, cursor: "not-allowed" } : styles[variant]}
            className={`inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-95 disabled:pointer-events-none cursor-pointer ${sz} ${className}`}>
            {children}
        </button>
    );
};

export default function CategoryModal({ onClose }) {
    const { data: categories = [], refetch } = useExpenseCategories();
    const [createCategory, { isLoading: isCreating }] = useCreateExpenseCategory();
    const [deleteCategory] = useDeleteExpenseCategory();
    const [newCat, setNewCat] = useState("");

    const handleCreate = async () => {
        const name = newCat.trim();
        if (!name) return showError("Category name required");
        try {
            await createCategory(name).unwrap();
            showSuccess("Category created!");
            setNewCat("");
            refetch();
        } catch (e) {
            showError(e?.data?.message ?? "Failed");
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteCategory(id).unwrap();
            showSuccess("Category deleted");
            refetch();
        } catch (e) {
            showError(e?.data?.message ?? "Failed");
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
                    <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4" style={{ color: "var(--accent-2)" }} />
                        <h2 className="text-base font-bold" style={{ color: "var(--ink)" }}>Expense Categories</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl"
                        style={{ background: "var(--surface)", color: "var(--muted)" }}>
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* add new */}
                    <div className="flex gap-2">
                        <input
                            value={newCat}
                            onChange={e => setNewCat(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleCreate()}
                            placeholder="New category name…"
                            className="flex-1 px-3 py-2 text-sm rounded-xl outline-none transition focus:ring-2"
                            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" }}
                            autoFocus
                        />
                        <Btn variant="primary" size="md" onClick={handleCreate} disabled={isCreating || !newCat.trim()}>
                            <Plus className="w-4 h-4" />
                        </Btn>
                    </div>

                    {/* list */}
                    {categories.length === 0 ? (
                        <p className="text-sm text-center py-6" style={{ color: "var(--muted)" }}>No categories yet.</p>
                    ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto">
                            {categories.map((c, i) => (
                                <div key={c._id ?? i}
                                    className="flex items-center justify-between px-4 py-2.5 rounded-xl"
                                    style={{ background: "var(--surface-muted)", border: "1px solid var(--border)" }}>
                                    <span className="text-sm font-medium capitalize" style={{ color: "var(--ink)" }}>
                                        {c.name}
                                    </span>
                                    <button onClick={() => handleDelete(c._id)}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg transition"
                                        style={{ color: "var(--muted)" }}
                                        onMouseEnter={e => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.background = "rgba(220,38,38,0.08)"; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                        <Btn variant="secondary" onClick={onClose}>Done</Btn>
                    </div>
                </div>
            </div>
        </div>
    );
}


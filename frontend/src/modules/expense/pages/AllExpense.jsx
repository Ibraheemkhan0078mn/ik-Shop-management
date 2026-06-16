// src/modules/expense/pages/AllExpense.jsx
import { useState, useCallback, useMemo } from "react";
import { Plus, Tag, Calendar, Edit2, Trash2 } from "lucide-react";
import { useSelector }      from "react-redux";
import {
    useExpenses,
    useDeleteExpense,
} from "../services/expense.service.js";
import ExpenseModal          from "../components/ExpenseModal.jsx";
import CategoryModal         from "../components/CategoryModal.jsx";

// ─── highlight helper ───────────────────────────────────────────────────────
const highlightMatch = (text, search) => {
    if (!search || !text) return text;
    const str = String(text);
    const i   = str.toLowerCase().indexOf(search.toLowerCase());
    if (i === -1) return str;
    return (
        <>
            {str.slice(0, i)}
            <mark className="rounded-sm px-0"
                style={{ background: "rgba(180,83,9,0.2)", color: "var(--accent)" }}>
                {str.slice(i, i + search.length)}
            </mark>
            {str.slice(i + search.length)}
        </>
    );
};

export default function AllExpense() {
    const language        = useSelector(s => s.auth?.user?.language ?? "en");
    const [deleteExpense] = useDeleteExpense();

    const [modal,      setModal]      = useState(null);   // null | "create" | { expense }
    const [catModal,   setCatModal]   = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [dateFilter, setDateFilter] = useState("none");
    const [catSearch,  setCatSearch]  = useState("");

    const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

    // RTK Query — refetch when refreshKey or dateFilter changes
    const { data: expenses = [], isLoading, refetch } = useExpenses(
        { skip: 0, limit: 200, date: dateFilter },
        { refetchOnMountOrArgChange: true }
    );

    // re-trigger refetch when refreshKey increments
    const [prevKey, setPrevKey] = useState(refreshKey);
    if (prevKey !== refreshKey) { setPrevKey(refreshKey); refetch(); }

    const filtered = useMemo(() =>
        catSearch
            ? expenses.filter(e => e.category?.toLowerCase().includes(catSearch.toLowerCase()))
            : expenses,
    [expenses, catSearch]);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this expense?")) return;
        await deleteExpense(id);
        refresh();
    };

    // totals for the current view
    const total = useMemo(() =>
        filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0),
    [filtered]);

    return (
        <div>
            {/* modals */}
            {modal === "create" && (
                <ExpenseModal mode="create" onClose={() => setModal(null)} onSuccess={refresh} />
            )}
            {modal && typeof modal === "object" && (
                <ExpenseModal mode="update" expense={modal.expense} onClose={() => setModal(null)} onSuccess={refresh} />
            )}
            {catModal && <CategoryModal onClose={() => setCatModal(false)} />}

            {/* toolbar */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
                <button className="btn-add" onClick={() => setModal("create")}>
                    <Plus className="w-4 h-4" />
                    {language === "en" ? "Add Expense" : "اخراجات شامل کریں"}
                </button>
                <button className="btn-add" onClick={() => setCatModal(true)}>
                    <Tag className="w-4 h-4" />
                    {language === "en" ? "Categories" : "زمرے"}
                </button>

                {/* category search */}
                <input
                    type="text"
                    value={catSearch}
                    onChange={e => setCatSearch(e.target.value)}
                    placeholder={language === "en" ? "Search by category…" : "زمرے سے تلاش…"}
                    className="input-search"
                    style={{ maxWidth: "200px" }}
                />

                {/* month filter */}
                <input
                    type="month"
                    value={dateFilter === "none" ? "" : dateFilter}
                    onChange={e => {
                        setDateFilter(e.target.value || "none");
                        refresh();
                    }}
                    className="px-3 py-2 text-sm rounded-xl outline-none transition"
                    style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--ink)",
                    }}
                />

                {/* total badge */}
                {filtered.length > 0 && (
                    <div className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                        style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", color: "var(--ink)" }}>
                        <span style={{ color: "var(--muted)" }}>Total:</span>
                        <span style={{ color: "var(--accent-2)" }}>Rs {total.toLocaleString()}</span>
                        <span className="text-xs" style={{ color: "var(--muted)" }}>({filtered.length})</span>
                    </div>
                )}
            </div>

            {/* loading */}
            {isLoading && (
                <div className="flex justify-center items-center py-12">
                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                        style={{ borderColor: "var(--accent-2)", borderTopColor: "transparent" }} />
                </div>
            )}

            {/* empty */}
            {!isLoading && filtered.length === 0 && (
                <div className="flex justify-center items-center py-12 text-sm"
                    style={{ color: "var(--muted)" }}>
                    {dateFilter === "none"
                        ? "No expenses found."
                        : `No expenses for ${dateFilter}.`}
                </div>
            )}

            {/* table */}
            {!isLoading && filtered.length > 0 && (
                <div className="overflow-x-auto rounded-2xl overflow-hidden"
                    style={{ border: "1px solid var(--border)" }}>
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="text-xs uppercase tracking-wider"
                                style={{
                                    background: "var(--surface-muted)",
                                    borderBottom: "1px solid var(--border)",
                                    color: "var(--muted)",
                                }}>
                                <th className="px-4 py-3 font-semibold">Amount</th>
                                <th className="px-4 py-3 font-semibold">Date</th>
                                <th className="px-4 py-3 font-semibold">Category</th>
                                <th className="px-4 py-3 font-semibold">Notes</th>
                                <th className="px-4 py-3 font-semibold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((exp, i) => (
                                <ExpenseRow
                                    key={exp._id ?? i}
                                    expense={exp}
                                    catSearch={catSearch}
                                    onEdit={e => { e.stopPropagation(); setModal({ expense: exp }); }}
                                    onDelete={e => handleDelete(exp._id, e)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function ExpenseRow({ expense: exp, catSearch, onEdit, onDelete }) {
    return (
        <tr className="transition" style={{ borderBottom: "1px solid var(--border)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--surface-muted)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

            <td className="px-4 py-3 font-bold tabular-nums" style={{ color: "var(--accent-2)" }}>
                <span className="text-xs mr-1 font-normal" style={{ color: "var(--muted)" }}>Rs</span>
                {(exp.amount ?? 0).toLocaleString()}
            </td>

            <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    {new Date(exp.date).toLocaleDateString()}
                </div>
            </td>

            <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: "var(--accent-2)" }} />
                    <span className="text-xs font-semibold uppercase tracking-tight"
                        style={{ color: "var(--ink)" }}>
                        {highlightMatch(exp.category || "General", catSearch)}
                    </span>
                </div>
            </td>

            <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>
                {exp.notes
                    ? <span className="italic truncate max-w-xs block">"{highlightMatch(exp.notes, catSearch)}"</span>
                    : "—"}
            </td>

            <td className="px-4 py-3">
                <div className="flex justify-center gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={onEdit}
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition"
                        style={{ color: "var(--muted)" }}
                        onMouseEnter={e => { e.currentTarget.style.color = "var(--accent-2)"; e.currentTarget.style.background = "rgba(15,118,110,0.08)"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}>
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={onDelete}
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition"
                        style={{ color: "var(--muted)" }}
                        onMouseEnter={e => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.background = "rgba(220,38,38,0.08)"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}>
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

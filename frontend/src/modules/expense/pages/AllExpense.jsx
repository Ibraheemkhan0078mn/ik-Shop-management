// src/modules/expense/pages/AllExpense.jsx
import { useState, useCallback } from "react";
import { Plus, Tag, Edit2, Trash2 } from "lucide-react";
import { useSelector }      from "react-redux";
import { useDeleteExpense } from "../services/expense.service.js";
import ExpenseModal          from "../components/ExpenseModal.jsx";
import CategoryModal         from "../components/CategoryModal.jsx";
import PaginatedList         from "@shared/components/PaginatedList.jsx";
import PageHeading           from "@shared/components/PageHeading.jsx";

export default function AllExpense() {
    const language        = useSelector(s => s.auth?.user?.language ?? "en");
    const [deleteExpense] = useDeleteExpense();

    const [modal,      setModal]      = useState(null);   // null | "create" | { expense }
    const [catModal,   setCatModal]   = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this expense?")) return;
        await deleteExpense(id);
        refresh();
    };

    return (
        <div className="h-screen flex flex-col">
            {/* modals */}
            {modal === "create" && (
                <ExpenseModal mode="create" onClose={() => setModal(null)} onSuccess={refresh} />
            )}
            {modal && typeof modal === "object" && (
                <ExpenseModal mode="update" expense={modal.expense} onClose={() => setModal(null)} onSuccess={refresh} />
            )}
            {catModal && <CategoryModal onClose={() => setCatModal(false)} />}

            <div className="flex-none">
                <PageHeading
                    heading={language === "en" ? "Expenses" : "اخراجات"}
                    subheading={language === "en" ? "Manage your expenses" : "اپنی اخراجات کا انتظام کریں"}
                >
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                        <button className="btn-add" onClick={() => setModal("create")}>
                            <Plus className="w-4 h-4" />
                            {language === "en" ? "Add Expense" : "اخراجات شامل کریں"}
                        </button>
                        <button className="btn-add" onClick={() => setCatModal(true)}>
                            <Tag className="w-4 h-4" />
                            {language === "en" ? "Categories" : "زمرے"}
                        </button>
                    </div>
                </PageHeading>
            </div>

            <PaginatedList
                key={refreshKey}
                endpoint="/expenses/pagination"
                limit={20}
                dataKey="data"
                wrapperClassName="flex-1"
                renderItems={(expenses) => (
                    <div className="overflow-x-auto rounded-2xl overflow-hidden border-edge">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="text-xs uppercase tracking-wider bg-surface-muted border-b border-edge text-ink-muted">
                                    <th className="px-4 py-3 font-semibold">Amount</th>
                                    <th className="px-4 py-3 font-semibold">Date</th>
                                    <th className="px-4 py-3 font-semibold">Category</th>
                                    <th className="px-4 py-3 font-semibold">Notes</th>
                                    <th className="px-4 py-3 font-semibold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((exp, i) => (
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
                renderEmpty={() => (
                    <p className="text-center py-12 text-sm text-ink-muted">
                        No expenses found.
                    </p>
                )}
            />
        </div>
    );
}

function ExpenseRow({ expense: exp, catSearch, onEdit, onDelete }) {
    return (
        <tr className="transition border-b border-edge hover:bg-surface-muted">

            <td className="px-4 py-3 font-bold tabular-nums text-primary">
                <span className="text-xs mr-1 font-normal text-ink-muted">Rs</span>
                {(exp.amount ?? 0).toLocaleString()}
            </td>

            <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    {new Date(exp.date).toLocaleDateString()}
                </div>
            </td>

            <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-primary" />
                    <span className="text-xs font-semibold uppercase tracking-tight text-ink">
                        {highlightMatch(exp.category || "General", catSearch)}
                    </span>
                </div>
            </td>

            <td className="px-4 py-3 text-xs text-ink-muted">
                {exp.notes
                    ? <span className="italic truncate max-w-xs block">"{highlightMatch(exp.notes, catSearch)}"</span>
                    : "—"}
            </td>

            <td className="px-4 py-3">
                <div className="flex justify-center gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={onEdit}
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition text-ink-muted hover:text-primary hover:bg-primary-hover/80">
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={onDelete}
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition text-ink-muted hover:text-red-500 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

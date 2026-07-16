// src/modules/expense/pages/AllExpense.jsx
import { useState } from "react";
import { Plus, Tag, Edit2, Trash2 } from "lucide-react";
import { useSelector } from "react-redux";
import { useDeleteExpense, useExpensesPaginated } from "../services/expense.service.js";
import { getExpenseLabels } from "../labels/expenseLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import ExpenseModal from "../components/ExpenseModal.jsx";
import CategoryModal from "../components/CategoryModal.jsx";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";

export default function AllExpense() {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getExpenseLabels(language);
    
    const [deleteExpense] = useDeleteExpense();

    const [modal,      setModal]      = useState(null);
    const [catModal,   setCatModal]   = useState(false);

    const handleDelete = async (id, e) => {
        e?.stopPropagation();
        try {
            await deleteExpense(id).unwrap();
            showSuccess(labels.expenseDeleted);
        } catch (error) {
            showError(error?.data?.message || labels.failedToDelete);
        }
    };

    return (
        <div className="h-screen flex flex-col">
            {/* modals */}
            {modal === "create" && (
                <ExpenseModal mode="create" onClose={() => setModal(null)} />
            )}
            {modal && typeof modal === "object" && (
                <ExpenseModal mode="update" expense={modal.expense} onClose={() => setModal(null)} />
            )}
            {catModal && <CategoryModal onClose={() => setCatModal(false)} />}

            <div className="flex-none">
                <PageHeading
                    heading={labels.expenseManagement}
                    subheading={labels.manageExpenses}
                    leftActions={
                        <>
                            <div onClick={() => setModal("create")}>
                                <ScreenTabButton lucideIcon={Plus} text={labels.addExpense} />
                            </div>
                            <div onClick={() => setCatModal(true)}>
                                <ScreenTabButton lucideIcon={Tag} text={labels.category} />
                            </div>
                        </>
                    }
                />
            </div>

            <PaginatedList
                rtkQuery={useExpensesPaginated}
                limit={20}
                dataKey="data"
                wrapperClassName="flex-1"
                renderItems={(expenses) => (
                    <div className="overflow-x-auto rounded-2xl overflow-hidden border-edge">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="text-xs uppercase tracking-wider bg-surface-muted border-b border-edge text-ink-muted">
                                    <th className="px-4 py-3 font-semibold">{labels.amount}</th>
                                    <th className="px-4 py-3 font-semibold">{labels.date}</th>
                                    <th className="px-4 py-3 font-semibold">{labels.category}</th>
                                    <th className="px-4 py-3 font-semibold">{labels.description}</th>
                                    <th className="px-4 py-3 font-semibold text-center">{labels.actions}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((exp, i) => (
                                    <ExpenseRow
                                        key={exp._id ?? i}
                                        expense={exp}
                                        onEdit={e => { e?.stopPropagation(); setModal({ expense: exp }); }}
                                        onDelete={e => handleDelete(exp._id, e)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                renderEmpty={() => (
                    <p className="text-center py-12 text-sm text-ink-muted">
                        {labels.noExpensesFound}
                    </p>
                )}
            />
        </div>
    );
}

function ExpenseRow({ expense: exp, onEdit, onDelete }) {
    return (
        <tr className="transition border-b border-edge hover:bg-surface-muted">

            <td className="px-4 py-3 font-bold tabular-nums text-primary">
                <span className="text-xs mr-1 font-normal text-ink-muted">Rs</span>
                {(exp.amount ?? 0).toLocaleString()}
            </td>

            <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                    {new Date(exp.date).toLocaleDateString()}
                </div>
            </td>

            <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-primary" />
                    <span className="text-xs font-semibold uppercase tracking-tight text-ink">
                        {exp.category || "General"}
                    </span>
                </div>
            </td>

            <td className="px-4 py-3 text-xs text-ink-muted">
                {exp.notes
                    ? <span className="italic truncate max-w-xs block">"{exp.notes}"</span>
                    : "—"}
            </td>

            <td className="px-4 py-3">
                <div className="flex justify-center gap-2" onClick={e => e.stopPropagation()}>
                    <PermissionGuard execute={() => onEdit?.()} permission="expenses.update" isConfirmation={true}>
                        <button
                            className="w-7 h-7 flex items-center justify-center rounded-lg transition text-ink-muted hover:text-primary hover:bg-primary-hover/80">
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                    </PermissionGuard>
                    <PermissionGuard execute={() => onDelete?.()} permission="expenses.delete" isConfirmation={true}>
                        <button
                            className="w-7 h-7 flex items-center justify-center rounded-lg transition text-ink-muted hover:text-red-500 hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </PermissionGuard>
                </div>
            </td>
        </tr>
    );
}

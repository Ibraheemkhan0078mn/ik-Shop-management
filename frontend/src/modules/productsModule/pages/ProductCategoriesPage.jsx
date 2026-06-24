// features/productsModule/pages/ProductCategoriesPage.jsx
import { useMemo, useState } from "react";
import { Plus, Edit, Trash2, FolderTree, AlertTriangle } from "lucide-react";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import { useDeleteCategoryMutation, useGetCategoriesQuery } from "../services/category.service";
import CategoryFormCard from "../components/CategoryFormCard";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";

export default function ProductCategoriesPage() {
    const [mode, setMode] = useState("list");
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteCategory] = useDeleteCategoryMutation();

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await deleteCategory(deleteTarget.id).unwrap();
            showSuccess("Category deleted successfully");
            setDeleteTarget(null);
        } catch (error) {
            showError(error?.data?.message || "Unable to delete category");
            setDeleteTarget(null);
        }
        setDeleteLoading(false);
    };

    const renderItems = (items) => {
        if (!items?.length) return null;
        return (
            <div className="flex flex-col">
                {/* Desktop Header */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 bg-(--surface-muted) rounded-t-xl border-b border-(--border) text-xs font-semibold text-(--muted)">
                    <div className="col-span-1">Icon</div>
                    <div className="col-span-4">Name</div>
                    <div className="col-span-5">Description</div>
                    <div className="col-span-2">Actions</div>
                </div>

                {/* Desktop Rows */}
                {items.map((item) => (
                    <div key={item._id} className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 bg-(--surface) border-b border-(--border) hover:bg-(--surface-muted) transition-all items-center">
                        <div className="col-span-1">
                            <div className="w-10 h-10 rounded-lg bg-(--surface-muted) border border-(--border) flex items-center justify-center text-(--accent-2)">
                                <FolderTree size={18} />
                            </div>
                        </div>
                        <div className="col-span-4 font-medium text-(--ink) truncate">{item.name}</div>
                        <div className="col-span-5 text-sm text-(--muted) truncate">{item.description || "—"}</div>
                        <div className="col-span-2 flex items-center gap-2">
                            <button onClick={() => { setSelectedCategoryId(item._id); setMode("edit"); }} className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-(--accent-2) hover:text-(--accent-2) transition-all">
                                <Edit size={16} />
                            </button>
                            <button onClick={() => setDeleteTarget({ id: item._id, name: item.name })} className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-red-500 hover:text-red-500 transition-all">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Mobile Cards */}
                {items.map((item) => (
                    <div key={`m-${item._id}`} className="md:hidden bg-(--surface) rounded-xl p-4 border border-(--border) mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-(--surface-muted) border border-(--border) flex items-center justify-center text-(--accent-2) shrink-0">
                                <FolderTree size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-(--ink) truncate">{item.name}</h3>
                                <p className="text-sm text-(--muted) truncate">{item.description || "—"}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-3 pt-3 border-t border-(--border)">
                            <button onClick={() => { setSelectedCategoryId(item._id); setMode("edit"); }} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-(--accent-2) hover:text-(--accent-2) transition-all text-sm">
                                <Edit size={16} /> Edit
                            </button>
                            <button onClick={() => setDeleteTarget({ id: item._id, name: item.name })} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-red-500 hover:text-red-500 transition-all text-sm">
                                <Trash2 size={16} /> Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Delete Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-[var(--surface)] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                        <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-2">
                            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
                                <AlertTriangle className="w-7 h-7 text-red-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-[var(--ink)]">Delete Category?</h3>
                            <p className="text-sm text-[var(--muted)] text-center">
                                Are you sure you want to delete <strong className="text-[var(--ink)]">{deleteTarget.name}</strong>? This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-3 px-6 py-5">
                            <button onClick={() => setDeleteTarget(null)} disabled={deleteLoading} className="flex-1 py-2.5 rounded-xl bg-[var(--app-bg)] text-[var(--muted)] font-medium text-sm hover:opacity-80 transition-all">Cancel</button>
                            <button onClick={handleDelete} disabled={deleteLoading} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-all disabled:opacity-60">
                                {deleteLoading ? "Deleting…" : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Form mode */}
            {(mode === "create" || mode === "edit") ? (
                <>
                    <div className="flex-none">
                        <PageHeading heading="Product Categories" subheading="Create and organize your product categories" />
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <CategoryFormCard
                            mode={mode}
                            categoryId={selectedCategoryId}
                            onClose={() => { setMode("list"); setSelectedCategoryId(null); }}
                            onSaved={() => { setMode("list"); setSelectedCategoryId(null); }}
                        />
                    </div>
                </>
            ) : (
                <>
                    <div className="flex-none">
                        <PageHeading heading="Product Categories" subheading="Create and organize your product categories">
                            <div className="flex flex-wrap items-center gap-3 mt-4">
                                <button onClick={() => setMode("create")} className="btn-add">
                                    <Plus size={16} /> Add Category
                                </button>
                            </div>
                        </PageHeading>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <PaginatedList
                            rtkQuery={useGetCategoriesQuery}
                            limit={10}
                            dataKey="data"
                            wrapperClassName="h-full"
                            renderItems={renderItems}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
// features/productsModule/pages/ProductCategoriesPage.jsx
import { useMemo, useState } from "react";
import { Plus, Edit, Trash2, FolderTree } from "lucide-react";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";
import { useDeleteCategoryMutation, useGetCategoriesQuery } from "../services/category.service";
import CategoryCRUDModal from "../components/CategoryCRUDModal";
import { getProductLabels } from "../labels/productLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";

export default function ProductCategoriesPage() {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getProductLabels(language);
    
    const [mode, setMode] = useState("list");
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [deleteCategory] = useDeleteCategoryMutation();
    const [showModal, setShowModal] = useState(false);

    const handleDelete = async (id) => {
        try {
            await deleteCategory(id).unwrap();
            showSuccess(labels.categoryDeleted);
        } catch (error) {
            showError(error?.data?.message || labels.failedToDelete);
        }
    };

    const handleCreate = () => {
        setSelectedCategoryId(null);
        setMode("create");
        setShowModal(true);
    };

    const handleEdit = (id) => {
        setSelectedCategoryId(id);
        setMode("edit");
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setMode("list");
        setSelectedCategoryId(null);
    };

    const renderItems = (items) => {
        if (!items?.length) return null;
        return (
            <div className="flex flex-col">
                {/* Desktop Header */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 bg-(--surface-muted) rounded-t-xl border-b border-(--border) text-xs font-semibold text-(--muted)">
                    <div className="col-span-1">{labels.image}</div>
                    <div className="col-span-4">{labels.name}</div>
                    <div className="col-span-5">{labels.description}</div>
                    <div className="col-span-2">{labels.actions}</div>
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
                            <PermissionGuard 
                                execute={() => handleEdit(item._id)} 
                                permission="categories.update" 
                                isConfirmation={true}
                            >
                                <button className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-(--accent-2) hover:text-(--accent-2) transition-all">
                                    <Edit size={16} />
                                </button>
                            </PermissionGuard>
                            <PermissionGuard 
                                execute={() => handleDelete(item._id)} 
                                permission="categories.delete" 
                                isConfirmation={true}
                            >
                                <button className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-red-500 hover:text-red-500 transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </PermissionGuard>
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
                            <PermissionGuard 
                                execute={() => handleEdit(item._id)} 
                                permission="categories.update" 
                                isConfirmation={true}
                            >
                                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-(--accent-2) hover:text-(--accent-2) transition-all text-sm">
                                    <Edit size={16} /> {labels.edit}
                                </button>
                            </PermissionGuard>
                            <PermissionGuard 
                                execute={() => handleDelete(item._id)} 
                                permission="categories.delete" 
                                isConfirmation={true}
                            >
                                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-red-500 hover:text-red-500 transition-all text-sm">
                                    <Trash2 size={16} /> {labels.delete}
                                </button>
                            </PermissionGuard>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Category CRUD Modal */}
            <CategoryCRUDModal
                mode={mode}
                categoryId={selectedCategoryId}
                open={showModal}
                onClose={handleCloseModal}
            />

            {/* List mode */}
            <div className="flex-none">
                <PageHeading
                    heading={labels.productCategories}
                    subheading={labels.manageProducts}
                    leftActions={
                        <div onClick={handleCreate}>
                            <ScreenTabButton lucideIcon={Plus} text={labels.add} />
                        </div>
                    }
                />
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
        </div>
    );
}
import { useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import { useDeleteCategoryMutation, useGetCategoriesQuery } from "../services/category.service";
import CategoryCRUDModal from "./CategoryCRUDModal";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";

const Categories = ({ setVisibility }) => {
    const [deleteCategory] = useDeleteCategoryMutation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create");
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this category?")) return;
        try {
            await deleteCategory(id).unwrap();
            showSuccess("Category deleted successfully");
        } catch (error) {
            showError(error?.data?.message || "Failed to delete category");
        }
    };

    const renderItems = (items) => {
        if (!items || items.length === 0) return null;

        return (
            <div className="flex flex-col">
                {/* Header - Desktop */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 bg-(--surface-muted) rounded-t-xl border-b border-(--border) text-xs font-semibold text-(--muted)">
                    <div className="col-span-8">Name</div>
                    <div className="col-span-2">Description</div>
                    <div className="col-span-2">Actions</div>
                </div>

                {/* Rows - Desktop */}
                {items.map((item) => (
                    <div
                        key={item._id}
                        className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 bg-(--surface) border-b border-(--border) hover:bg-(--surface-muted) transition-all items-center"
                    >
                        <div className="col-span-8">
                            <h3 className="font-medium text-(--ink) truncate">{item.name}</h3>
                        </div>
                        <div className="col-span-2 text-sm text-(--muted) truncate">{item.description || "No description"}</div>
                        <div className="col-span-2 flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setSelectedCategoryId(item._id);
                                    setModalMode("update");
                                    setIsModalOpen(true);
                                }}
                                className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-(--accent-2) hover:text-(--accent-2) transition-all"
                            >
                                <Edit size={16} />
                            </button>
                            <button
                                onClick={() => handleDelete(item._id)}
                                className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-red-500 hover:text-red-500 transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Mobile Card View */}
                {items.map((item) => (
                    <div
                        key={`mobile-${item._id}`}
                        className="md:hidden bg-(--surface) rounded-xl p-4 border border-(--border) mb-3"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-(--ink) truncate">{item.name}</h3>
                                <div className="text-sm text-(--muted) mt-1">{item.description || "No description"}</div>
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                                <button
                                    onClick={() => {
                                        setSelectedCategoryId(item._id);
                                        setModalMode("update");
                                        setIsModalOpen(true);
                                    }}
                                    className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-(--accent-2) hover:text-(--accent-2) transition-all"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(item._id)}
                                    className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-red-500 hover:text-red-500 transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setVisibility(false)}
        >
            {/* CRUD Modal */}
            {isModalOpen && (
                <CategoryCRUDModal
                    mode={modalMode}
                    categoryId={selectedCategoryId}
                    open={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setModalMode("create");
                        setSelectedCategoryId(null);
                    }}
                />
            )}

            {/* Main Modal */}
            <div
                className="bg-(--surface) rounded-2xl shadow-xl w-full max-w-4xl mx-4 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-(--ink)">Categories</h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                setModalMode("create");
                                setIsModalOpen(true);
                            }}
                            className="btn-add"
                        >
                            + Create Category
                        </button>
                        <button
                            onClick={() => setVisibility(false)}
                            className="text-(--muted) hover:text-(--ink) text-xl"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="h-[60vh] overflow-hidden">
                    <PaginatedList
                        rtkQuery={useGetCategoriesQuery}
                        limit={10}
                        dataKey="data"
                        wrapperClassName="h-full"
                        renderItems={renderItems}
                    />
                </div>
            </div>
        </div>
    );
};

export default Categories;

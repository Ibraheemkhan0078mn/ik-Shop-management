import { useMemo, useState } from "react";
import { Plus, Edit, Trash2, Layers3 } from "lucide-react";
import PageHeading from "@shared/components/PageHeading.jsx";
import PaginatedList from "@shared/components/PaginatedList.jsx";
import { useDeleteSubCategoryMutation, useGetSubCategoriesQuery } from "../services/subCategories.service";
import SubCategoryFormCard from "../components/SubCategoryFormCard";
import { showSuccess, showError } from "@shared/utilities/toastHelpers.js";

export default function ProductSubCategoriesPage() {
    const [mode, setMode] = useState("list");
    const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);
    const [deleteSubCategory] = useDeleteSubCategoryMutation();

    const renderItems = (items) => {
        if (!items?.length) return null;
        return (
            <div className="flex flex-col gap-3">
                {items.map((item) => (
                    <div key={item._id} className="rounded-2xl border border-(--border) bg-(--surface) p-4 shadow-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Layers3 className="h-4 w-4 text-(--accent-2)" />
                                    <h3 className="font-semibold text-(--ink)">{item.name}</h3>
                                </div>
                                <p className="mt-1 text-sm text-(--muted)">{item.description || "No description yet."}</p>
                                <p className="mt-1 text-xs text-(--muted)">Category: {item.category?.name || "N/A"}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedSubCategoryId(item._id);
                                        setMode("edit");
                                    }}
                                    className="rounded-lg border border-(--border) bg-(--surface-muted) p-2 text-(--muted) transition hover:border-(--accent-2) hover:text-(--accent-2)"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            await deleteSubCategory(item._id).unwrap();
                                            showSuccess("Subcategory deleted successfully");
                                        } catch (error) {
                                            showError(error?.data?.message || error?.message || "Unable to delete subcategory");
                                        }
                                    }}
                                    className="rounded-lg border border-(--border) bg-(--surface-muted) p-2 text-(--muted) transition hover:border-red-500 hover:text-red-500"
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

    const content = useMemo(() => {
        if (mode === "create" || mode === "edit") {
            return (
                <SubCategoryFormCard
                    mode={mode}
                    subCategoryId={selectedSubCategoryId}
                    onClose={() => {
                        setMode("list");
                        setSelectedSubCategoryId(null);
                    }}
                    onSaved={() => {
                        setMode("list");
                        setSelectedSubCategoryId(null);
                    }}
                />
            );
        }

        return (
            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--border) bg-(--surface) p-4 shadow-sm">
                    <div>
                        <h3 className="font-semibold text-(--ink)">Subcategories</h3>
                        <p className="text-sm text-(--muted)">Group products under a parent category with more control.</p>
                    </div>
                    <button onClick={() => setMode("create")} className="btn-add">
                        <Plus size={16} /> Add Subcategory
                    </button>
                </div>

                <PaginatedList
                    rtkQuery={useGetSubCategoriesQuery}
                    limit={10}
                    dataKey="data"
                    wrapperClassName="h-full"
                    renderItems={renderItems}
                />
            </div>
        );
    }, [mode, selectedSubCategoryId, deleteSubCategory]);

    return (
        <div className="flex h-screen flex-col overflow-hidden">
            <PageHeading heading="Product Subcategories" subheading="Manage subcategories for better product organization" />
            <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4 sm:px-6">
                {content}
            </div>
        </div>
    );
}

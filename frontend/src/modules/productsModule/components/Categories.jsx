import { useState } from "react";
import PaginatedTable from "@shared/components/PaginatedTable";
import { useDeleteCategoryMutation, useGetCategoriesQuery } from "../services/category.service";
import AddCategories from "./AddCategories";
import UpdateCategory from "./UpdateCategory"; // Apna actual path use karo

const Categories = ({ setVisibility }) => {
    const [deleteCategory] = useDeleteCategoryMutation();
    const [showAdd, setShowAdd] = useState(false);

    const handleDelete = async (id) => {
        await deleteCategory(id);
    };

    const handleUpdate = (row) => {
        // update logic ya modal open karo
    };

    const columns = {
        "Category Name": "name",
        "Notes": "description",
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setVisibility(false)}
        >
            {/* Add Category Modal */}
            {showAdd && (
                <AddCategories setVisibility={setShowAdd} />
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
                            onClick={() => setShowAdd(true)}
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

                {/* Table */}
                <PaginatedTable
                    endpoint="/categories/getPaginationCategories"
                    columns={columns}
                    limit={10}
                    isUpdate={true}
                    isDelete={true}
                    UpdateComp={UpdateCategory}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                    rtkGetDataQuery={useGetCategoriesQuery}
                />
            </div>
        </div>
    );
};

export default Categories;

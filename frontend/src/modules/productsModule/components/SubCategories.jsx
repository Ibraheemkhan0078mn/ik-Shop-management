import { useState } from "react";
import PaginatedTable from "../../../components/common/PaginatedTable";
import { useDeleteSubCategoryMutation, useGetSubCategoriesQuery } from "../services/subCategories.service";
import SubCategoryCrudModel from "./SubCategoryCrudModel";

const SubCategories = ({ setVisibility }) => {
    const [deleteSubCategory] = useDeleteSubCategoryMutation();
    const [showAdd, setShowAdd] = useState(false);

    const handleDelete = async (id) => {
        await deleteSubCategory(id);
    };

    const handleUpdate = (row) => {
        // update logic ya modal open karo
    };

    const columns = {
        "SubCategory Name": "name",
        "Notes": "description",
        "Category": "category.name"
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setVisibility(false)}
        >
            {/* Add Category Modal */}
            {showAdd && (
                <SubCategoryCrudModel setVisibility={setShowAdd} />
            )}

            {/* Main Modal */}
            <div
                className="bg-(--surface) rounded-2xl shadow-xl w-full max-w-4xl mx-4 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-(--ink)">Sub Categories</h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowAdd(true)}
                            className="btn-add"
                        >
                            + Create SubCategory
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
                    UpdateComp={SubCategoryCrudModel}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                    rtkGetDataQuery={useGetSubCategoriesQuery}
                />
            </div>
        </div>
    );
};

export default SubCategories;
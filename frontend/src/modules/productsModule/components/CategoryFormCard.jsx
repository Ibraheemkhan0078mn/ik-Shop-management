import { useEffect, useState } from "react";
import { PlusCircle } from "lucide-react";
import FormLayout from "@shared/components/FormLayout";
import { useCreateCategoryMutation, useUpdateCategoryMutation, useGetCategoryByIdQuery } from "../services/category.service";
import { showSuccess, showError } from "@shared/utilities/toastHelpers.js";

export default function CategoryFormCard({ mode = "create", categoryId = null, onClose, onSaved }) {
    const isCreate = mode === "create";
    const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
    const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
    const { data: categoryData, isLoading: isFetching } = useGetCategoryByIdQuery(categoryId, {
        skip: !categoryId || isCreate,
    });

    const [formData, setFormData] = useState({ name: "", description: "" });

    useEffect(() => {
        if (!isCreate && categoryData) {
            setFormData({ name: categoryData.name || "", description: categoryData.description || "" });
        }
    }, [isCreate, categoryData]);

    useEffect(() => {
        if (isCreate) {
            setFormData({ name: "", description: "" });
        }
    }, [isCreate]);

    const onSubmit = async () => {
        try {
            if (isCreate) {
                await createCategory(formData).unwrap();
                showSuccess("Category created successfully");
            } else {
                await updateCategory({ id: categoryId, ...formData }).unwrap();
                showSuccess("Category updated successfully");
            }
            if (onSaved) onSaved();
            if (onClose) onClose();
        } catch (error) {
            const errorMessage = error?.data?.message || error?.message || "Unable to save category";
            showError(errorMessage);
        }
    };

    const config = {
        title: isCreate ? "Create Category" : "Edit Category",
        columns: 1,
        submitLabel: isCreating || isUpdating ? "Saving..." : isCreate ? "Save Category" : "Update Category",
        fields: [
            {
                name: "name",
                label: "Category Name",
                type: "text",
                required: true,
                placeholder: "Enter category name",
            },
            {
                name: "description",
                label: "Description",
                type: "textarea",
                placeholder: "Add a short description",
                rows: 4,
                span: "full",
            },
        ],
    };

    return (
        <div className="rounded-2xl border border-(--border) bg-(--surface) p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
                <div className="rounded-xl bg-(--accent-2)/10 p-2 text-(--accent-2)">
                    <PlusCircle size={18} />
                </div>
                <div>
                    <h3 className="font-semibold text-(--ink)">{isCreate ? "Add new category" : "Update category"}</h3>
                    <p className="text-sm text-(--muted)">Keep category details organized and easy to find.</p>
                </div>
            </div>

            {(!isCreate && isFetching && !categoryData) ? (
                <div className="rounded-xl border border-dashed border-(--border) p-6 text-center text-sm text-(--muted)">
                    Loading category...
                </div>
            ) : (
                <FormLayout
                    setVisibility={onClose || (() => {})}
                    config={config}
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={onSubmit}
                    zIndex={20}
                />
            )}
        </div>
    );
}

import { useState, useEffect } from "react";
import { useCreateCategoryMutation, useUpdateCategoryMutation, useGetCategoryByIdQuery } from "../services/category.service";
import FormLayout from "../../../shared/components/FormLayout.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";

export default function CategoryCRUDModal({ mode = "create", categoryId = null, open, onClose }) {
    const isCreate = mode === "create";
    const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
    const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();

    // Fetch category data for update mode
    const { data: categoryData, isLoading: isFetching } = useGetCategoryByIdQuery(categoryId, {
        skip: !categoryId || isCreate,
    });

    const [formData, setFormData] = useState({
        name: "",
        description: "",
    });

    // Prefill form data for update mode
    useEffect(() => {
        if (!isCreate && categoryData) {
            setFormData({
                name: categoryData.name || "",
                description: categoryData.description || "",
            });
        }
    }, [isCreate, categoryData]);

    // Reset form for create mode
    useEffect(() => {
        if (isCreate && open) {
            setFormData({
                name: "",
                description: "",
            });
        }
    }, [isCreate, open]);

    const onSubmit = async () => {
        try {
            if (isCreate) {
                await createCategory(formData).unwrap();
                showSuccess("Category created successfully");
            } else {
                await updateCategory({ id: categoryId, ...formData }).unwrap();
                showSuccess("Category updated successfully");
            }
            onClose();
        } catch (error) {
            const errorMessage = error?.data?.message || error?.message || "Something went wrong while saving the category.";
            showError(errorMessage);
        }
    };

    const config = {
        title: isCreate ? "Add New Category" : "Edit Category",
        columns: 1,
        submitLabel: isCreating || isUpdating ? "Saving..." : isCreate ? "Save Category" : "Update Category",
        fields: [
            {
                name: "name",
                label: "* Category Name",
                type: "text",
                placeholder: "Category ka naam likhein",
                required: true,
            },
            {
                name: "description",
                label: "Description",
                type: "textarea",
                placeholder: "Category description likhein",
                rows: 4,
                span: "full",
            },
        ],
    };

    if (!open) return null;

    if (!isCreate && isFetching && !categoryData) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
                <div className="bg-(--surface) rounded-2xl p-8 text-(--muted) text-sm">
                    Category load ho raha hai...
                </div>
            </div>
        );
    }

    return (
        <FormLayout
            setVisibility={onClose}
            config={config}
            formData={formData}
            setFormData={setFormData}
            onSubmit={onSubmit}
            zIndex={100}
        />
    );
}

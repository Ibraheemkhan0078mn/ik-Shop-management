import { useState, useEffect } from "react";
import { useCreateSubCategoryMutation, useUpdateSubCategoryMutation, useGetSubCategoryByIdQuery } from "../services/subCategories.service";
import { useGetCategoriesQuery } from "../services/category.service";
import FormLayout from "@shared/components/FormLayout";
import { showSuccess, showError } from "@shared/utilities/toastHelpers.js";

export default function SubCategoryCRUDModal({ mode = "create", subCategoryId = null, categoryId = null, open, onClose }) {
    const isCreate = mode === "create";
    const [createSubCategory, { isLoading: isCreating }] = useCreateSubCategoryMutation();
    const [updateSubCategory, { isLoading: isUpdating }] = useUpdateSubCategoryMutation();

    // Fetch subcategory data for update mode
    const { data: subCategoryData, isLoading: isFetching } = useGetSubCategoryByIdQuery(subCategoryId, {
        skip: !subCategoryId || isCreate,
    });

    const { data: categories = [] } = useGetCategoriesQuery();

    const [formData, setFormData] = useState({
        name: "",
        category: categoryId || "",
        description: "",
    });

    // Prefill form data for update mode
    useEffect(() => {
        if (!isCreate && subCategoryData) {
            setFormData({
                name: subCategoryData.name || "",
                category: subCategoryData.category?._id || subCategoryData.category || "",
                description: subCategoryData.description || "",
            });
        }
    }, [isCreate, subCategoryData]);

    // Reset form for create mode
    useEffect(() => {
        if (isCreate && open) {
            setFormData({
                name: "",
                category: categoryId || "",
                description: "",
            });
        }
    }, [isCreate, open, categoryId]);

    const onSubmit = async () => {
        try {
            if (isCreate) {
                await createSubCategory(formData).unwrap();
                showSuccess("Subcategory created successfully");
            } else {
                await updateSubCategory({ id: subCategoryId, ...formData }).unwrap();
                showSuccess("Subcategory updated successfully");
            }
            onClose();
        } catch (error) {
            const errorMessage = error?.data?.message || error?.message || "Something went wrong while saving the subcategory.";
            showError(errorMessage);
        }
    };

    const config = {
        title: isCreate ? "Add New SubCategory" : "Edit SubCategory",
        columns: 1,
        submitLabel: isCreating || isUpdating ? "Saving..." : isCreate ? "Save SubCategory" : "Update SubCategory",
        fields: [
            {
                name: "category",
                label: "* Category",
                type: "select",
                placeholder: "Category chunein...",
                required: true,
                options: categories.map((c) => ({ label: c.name, value: c._id })),
                disabled: !!categoryId,
            },
            {
                name: "name",
                label: "* SubCategory Name",
                type: "text",
                placeholder: "SubCategory ka naam likhein",
                required: true,
            },
            {
                name: "description",
                label: "Description",
                type: "textarea",
                placeholder: "SubCategory description likhein",
                rows: 4,
                span: "full",
            },
        ],
    };

    if (!open) return null;

    if (!isCreate && isFetching && !subCategoryData) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
                <div className="bg-(--surface) rounded-2xl p-8 text-(--muted) text-sm">
                    SubCategory load ho raha hai...
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

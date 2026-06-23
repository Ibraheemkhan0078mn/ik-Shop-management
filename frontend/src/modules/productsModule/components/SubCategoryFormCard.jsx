import { useEffect, useState } from "react";
import { PlusCircle } from "lucide-react";
import FormLayout from "@shared/components/FormLayout";
import { useCreateSubCategoryMutation, useUpdateSubCategoryMutation, useGetSubCategoryByIdQuery } from "../services/subCategories.service";
import { useGetCategoriesQuery } from "../services/category.service";
import { showSuccess, showError } from "@shared/utilities/toastHelpers.js";

export default function SubCategoryFormCard({ mode = "create", subCategoryId = null, categoryId = null, onClose, onSaved }) {
    const isCreate = mode === "create";
    const [createSubCategory, { isLoading: isCreating }] = useCreateSubCategoryMutation();
    const [updateSubCategory, { isLoading: isUpdating }] = useUpdateSubCategoryMutation();
    const { data: subCategoryData, isLoading: isFetching } = useGetSubCategoryByIdQuery(subCategoryId, {
        skip: !subCategoryId || isCreate,
    });
    const { data: categoriesData = {} } = useGetCategoriesQuery();
    let categories = categoriesData?.data ?? categoriesData ?? []
    const [formData, setFormData] = useState({ name: "", category: categoryId || "", description: "" });

    useEffect(() => {
        if (!isCreate && subCategoryData) {
            setFormData({
                name: subCategoryData.name || "",
                category: subCategoryData.category?._id || subCategoryData.category || "",
                description: subCategoryData.description || "",
            });
        }
    }, [isCreate, subCategoryData]);

    useEffect(() => {
        if (isCreate) {
            setFormData({ name: "", category: categoryId || "", description: "" });
        }
    }, [isCreate, categoryId]);

    const onSubmit = async () => {
        try {
            if (isCreate) {
                await createSubCategory(formData).unwrap();
                showSuccess("Subcategory created successfully");
            } else {
                await updateSubCategory({ id: subCategoryId, ...formData }).unwrap();
                showSuccess("Subcategory updated successfully");
            }
            if (onSaved) onSaved();
            if (onClose) onClose();
        } catch (error) {
            const errorMessage = error?.data?.message || error?.message || "Unable to save subcategory";
            showError(errorMessage);
        }
    };

    const config = {
        title: isCreate ? "Create Subcategory" : "Edit Subcategory",
        columns: 1,
        submitLabel: isCreating || isUpdating ? "Saving..." : isCreate ? "Save Subcategory" : "Update Subcategory",
        fields: [
            {
                name: "category",
                label: "Category",
                type: "select",
                required: true,
options: Array.isArray(categories) ? categories.map((c) => ({ label: c.name, value: c._id })) : [],
                placeholder: "Select a category",
                disabled: !!categoryId,
            },
            {
                name: "name",
                label: "Subcategory Name",
                type: "text",
                required: true,
                placeholder: "Enter subcategory name",
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
                    <h3 className="font-semibold text-(--ink)">{isCreate ? "Add new subcategory" : "Update subcategory"}</h3>
                    <p className="text-sm text-(--muted)">Organize products under a specific category.</p>
                </div>
            </div>

            {(!isCreate && isFetching && !subCategoryData) ? (
                <div className="rounded-xl border border-dashed border-(--border) p-6 text-center text-sm text-(--muted)">
                    Loading subcategory...
                </div>
            ) : (
                <FormLayout
                    setVisibility={onClose || (() => { })}
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

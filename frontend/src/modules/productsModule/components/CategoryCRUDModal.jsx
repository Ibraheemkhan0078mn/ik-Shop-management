import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useCreateCategoryMutation, useUpdateCategoryMutation, useGetCategoryByIdQuery } from "../services/category.service";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import { getProductLabels } from "../labels/productLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";

export default function CategoryCRUDModal({ mode = "create", categoryId = null, open, onClose, onCategoryCreated }) {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getProductLabels(language);
    
    const isCreate = mode === "create";
    const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
    const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();

    // Fetch category data for update mode
    const { data: categoryData, isLoading: isFetching } = useGetCategoryByIdQuery(categoryId, {
        skip: !categoryId || isCreate,
    });

    const [formData, setFormData] = useState({
        name: "",
    });

    const [errors, setErrors] = useState({});

    // Prefill form data for update mode
    useEffect(() => {
        if (!isCreate && categoryData) {
            setFormData({
                name: categoryData.name || "",
            });
        }
    }, [isCreate, categoryData]);

    // Reset form for create mode
    useEffect(() => {
        if (isCreate && open) {
            setFormData({
                name: "",
            });
            setErrors({});
        }
    }, [isCreate, open]);

    const updateField = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => (prev[name] ? { ...prev, [name]: undefined } : prev));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name?.trim()) {
            newErrors.name = labels.categoryNameRequired;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const onSubmit = async () => {
        if (!validateForm()) return;

        try {
            let result;
            if (isCreate) {
                result = await createCategory(formData).unwrap();
                showSuccess(labels.categoryCreated);
            } else {
                result = await updateCategory({ id: categoryId, ...formData }).unwrap();
                showSuccess(labels.categoryUpdated);
            }
            onClose();
            // Callback to notify parent that category was created
            if (onCategoryCreated && result) {
                onCategoryCreated(result);
            }
        } catch (error) {
            const errorMessage = error?.data?.message || error?.message || labels.somethingWentWrong;
            showError(errorMessage);
        }
    };

    if (!open) return null;

    if (!isCreate && isFetching && !categoryData) {
        return (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-md">
                <div className="bg-[var(--surface)] rounded-2xl p-8 text-[var(--muted)] text-sm">
                    {labels.categoryLoading}
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-md p-4"
            onClick={() => onClose()}
        >
            <div
                className="rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-[var(--border)] bg-[var(--surface)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-[var(--border)] shrink-0 bg-[var(--surface-muted)]">
                    <h2 className="text-xl font-bold text-[var(--ink)] tracking-tight">
                        {isCreate ? labels.addNewCategory : labels.editCategory}
                    </h2>
                    <button
                        type="button"
                        onClick={() => onClose()}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--surface)] text-[var(--muted)] transition-colors duration-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable form area */}
                <div className="overflow-y-auto flex-1 px-6 py-6 custom-scrollbar">
                    <div className="w-full grid grid-cols-1 gap-x-5 gap-y-4">
                        {/* Category Name */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--ink)] mb-1.5">
                                * {labels.categoryName}
                            </label>
                            <input
                                type="text"
                                placeholder={labels.categoryPlaceholder}
                                value={formData.name}
                                onChange={(e) => updateField('name', e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-lg border ${
                                    errors.name 
                                        ? 'border-red-500 bg-red-500/5' 
                                        : 'border-[var(--border)] bg-[var(--app-bg)]'
                                } text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent-2)] focus:ring-1 focus:ring-[var(--accent-2)] transition-all`}
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="mt-6">
                        <button
                            onClick={onSubmit}
                            disabled={isCreating || isUpdating}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium
                                       rounded-lg bg-[var(--accent-2)] text-[var(--surface)] hover:bg-[var(--accent-2)]/80
                                       active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreating || isUpdating ? labels.saving : (isCreate ? labels.saveCategory : labels.updateCategory)} →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

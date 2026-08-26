import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useCreateBrandMutation, useUpdateBrandMutation, useGetBrandByIdQuery } from "../services/brand.service";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import { getProductLabels } from "../labels/productLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";

export default function BrandCRUDModal({ mode = "create", brandId = null, open, onClose, onBrandCreated }) {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getProductLabels(language);
    
    const isCreate = mode === "create";
    const [createBrand, { isLoading: isCreating }] = useCreateBrandMutation();
    const [updateBrand, { isLoading: isUpdating }] = useUpdateBrandMutation();

    // Fetch brand data for update mode
    const { data: brandData, isLoading: isFetching } = useGetBrandByIdQuery(brandId, {
        skip: !brandId || isCreate,
    });

    const [formData, setFormData] = useState({
        name: "",
        isActive: true,
    });

    const [errors, setErrors] = useState({});

    // Prefill form data for update mode
    useEffect(() => {
        if (!isCreate && brandData) {
            setFormData({
                name: brandData.name || "",
                isActive: brandData.isActive !== undefined ? brandData.isActive : true,
            });
        }
    }, [isCreate, brandData]);

    // Reset form for create mode
    useEffect(() => {
        if (isCreate && open) {
            setFormData({
                name: "",
                isActive: true,
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
            newErrors.name = labels.brandNameRequired;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const onSubmit = async () => {
        if (!validateForm()) return;

        try {
            let result;
            if (isCreate) {
                result = await createBrand(formData).unwrap();
                showSuccess(labels.brandCreated);
            } else {
                result = await updateBrand({ id: brandId, ...formData }).unwrap();
                showSuccess(labels.brandUpdated);
            }
            onClose();
            // Callback to notify parent that brand was created
            if (onBrandCreated && result) {
                onBrandCreated(result);
            }
        } catch (error) {
            const errorMessage = error?.data?.message || error?.message || labels.somethingWentWrong;
            showError(errorMessage);
        }
    };

    if (!open) return null;

    if (!isCreate && isFetching && !brandData) {
        return (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-md">
                <div className="bg-[var(--surface)] rounded-2xl p-8 text-[var(--muted)] text-sm">
                    {labels.brandLoading}
                </div>
            </div>
        );
    }

    return (
        <div
            id="brand-modal"
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-md p-4"
            onClick={() => onClose()}
        >
            <div
                className="rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-[var(--border)] bg-[var(--surface)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-[var(--border)] shrink-0 bg-[var(--surface-muted)]">
                    <h2 id="brand-modal-title" className="text-xl font-bold text-[var(--ink)] tracking-tight">
                        {isCreate ? labels.addNewBrand : labels.editBrand}
                    </h2>
                    <button
                        id="brand-modal-close"
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
                        {/* Brand Name */}
                        <div>
                            <label htmlFor="brand-name-input" className="block text-sm font-medium text-[var(--ink)] mb-1.5">
                                * {labels.brandName}
                            </label>
                            <input
                                id="brand-name-input"
                                type="text"
                                placeholder={labels.brandPlaceholder}
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


                        {/* Active Status */}
                        <div>
                            <label htmlFor="brand-active-checkbox" data-testid="brand-active-label" className="flex items-center gap-3 cursor-pointer">
                                <div className="relative">
                                    <input
                                        id="brand-active-checkbox"
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => updateField('isActive', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                                        formData.isActive ? 'bg-[var(--accent-2)]' : 'bg-[var(--muted)]'
                                    }`}></div>
                                    <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 ${
                                        formData.isActive ? 'translate-x-5' : ''
                                    }`}></div>
                                </div>
                                <span className="text-sm font-medium text-[var(--ink)]">{labels.active}</span>
                            </label>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="mt-6">
                        <PermissionGuard
                            execute={onSubmit}
                            permission={isCreate ? "brands.create" : "brands.update"}
                            isConfirmation={false}
                        >
                            <button
                                id="brand-modal-submit"
                                disabled={isCreating || isUpdating}
                                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium
                                           rounded-lg bg-[var(--accent-2)] text-[var(--surface)] hover:bg-[var(--accent-2)]/80
                                           active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreating || isUpdating ? labels.saving : (isCreate ? labels.saveBrand : labels.updateBrand)} →
                            </button>
                        </PermissionGuard>
                    </div>
                </div>
            </div>
        </div>
    );
}

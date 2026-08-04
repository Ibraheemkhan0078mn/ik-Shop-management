import { useState, useCallback } from "react";
import { AlertCircle, Check } from "lucide-react";
import { useCreateStaffRoleMutation } from "../api/staff.api.js";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";

const EMPTY_FORM = {
    name: "",
};

export default function StaffRoleModal({ mode = "create", open, onClose }) {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    
    const isCreate = mode === "create";
    const [createStaffRole, { isLoading: isCreating }] = useCreateStaffRoleMutation();
    const isSaving = isCreating;

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [banner, setBanner] = useState(null);

    const updateField = useCallback((name, value) => {
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
    }, []);

    const validateForm = useCallback(() => {
        const newErrors = {};
        if (!form.name?.trim()) newErrors.name = "Role name is required";
        setErrors(newErrors);
        const count = Object.keys(newErrors).length;
        if (count > 0) {
            setBanner(`Please fix ${count} error(s)`);
            return false;
        }
        setBanner(null);
        return true;
    }, [form]);

    const onSubmit = useCallback(async () => {
        if (!validateForm()) return;
        try {
            await createStaffRole({ name: form.name.trim() }).unwrap();
            showSuccess("Role created successfully 🎉");
            onClose();
        } catch (error) {
            const msg = error?.data?.msg || error?.message || "Something went wrong.";
            showError(msg);
            setBanner(`❌ ${msg}`);
        }
    }, [form, createStaffRole, onClose, validateForm]);

    // Reset form when modal opens
    if (open && isCreate && form.name !== "") {
        setForm(EMPTY_FORM);
        setErrors({});
        setBanner(null);
    }

    if (!open) return null;

    return (
        <div 
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div 
                className="bg-[var(--surface)] rounded-2xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
                    <h2 className="text-base font-semibold text-[var(--ink)]">
                        {language === "en" ? "Add New Role" : "نیا کردار شامل کریں"}
                    </h2>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors hover:rotate-90 duration-200 text-lg"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* Banner */}
                {banner && (
                    <div className="mx-5 mt-3 flex items-start gap-2 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-500 animate-in slide-in-from-top-1 duration-200">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{banner}</span>
                    </div>
                )}

                {/* Form */}
                <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar space-y-5">
                    <Field
                        label={language === "en" ? "Role Name" : "کردار کا نام"}
                        name="name"
                        value={form.name}
                        onChange={updateField}
                        error={errors.name}
                        required
                        placeholder={language === "en" ? "Enter role name" : "کردار کا نام درج کریں"}
                    />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[var(--border)] bg-[var(--app-bg)] shrink-0 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm text-[var(--muted)] hover:bg-[var(--surface)] transition-colors"
                    >
                        {language === "en" ? "Cancel" : "منسوخ کریں"}
                    </button>
                    <PermissionGuard 
                        execute={onSubmit}
                        permission="staff.create"
                        isConfirmation={false}
                    >
                        <button
                            type="button"
                            disabled={isSaving}
                            className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm bg-[var(--accent-2)] text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
                        >
                            <Check className="h-4 w-4" />
                            {isSaving ? (language === "en" ? "Saving..." : "محفوظ ہو رہا ہے...") : (language === "en" ? "Create" : "بنائیں")}
                        </button>
                    </PermissionGuard>
                </div>
            </div>
        </div>
    );
}

// ─── Sub Component ────────────────────────────────────────────────────

function Field({ label, name, value, onChange, error, required, type = "text", placeholder }) {
    const base = `w-full rounded-lg border px-3 py-2 text-sm bg-[var(--app-bg)] text-[var(--ink)] placeholder:text-[var(--muted)] outline-none transition-colors`;
    const state = error
        ? "border-red-500 focus:border-red-500 ring-1 ring-red-500/20"
        : "border-[var(--border)] focus:border-[var(--accent-2)] focus:ring-1 focus:ring-[var(--accent-2)]/20";

    return (
        <div>
            <label className="flex items-center justify-between text-xs font-medium text-[var(--muted)] mb-1">
                <span>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</span>
            </label>
            <input 
                type={type} 
                className={`${base} ${state}`} 
                value={value || ""} 
                placeholder={placeholder}
                onChange={(e) => onChange(name, e.target.value)}
                autoFocus
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

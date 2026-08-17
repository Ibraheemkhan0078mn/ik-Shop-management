// src/modules/qarza/components/QarzaAccountModal.jsx
// Props: mode "create"|"update", account (full object for update), onClose, onSuccess
import { useState, useEffect, useCallback, useRef } from "react";
import { Wallet, Check, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getQarzaLabels } from "../labels/qarzaLabels.js";
import { useCreateQarzaAccount, useUpdateQarzaAccount } from "../services/qarza.service.js";

const IMAGE_BASE = "http://localhost:5001/uploads";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

const EMPTY_FORM = {
    name: "",
    type: "general",
    phoneNo: "",
    address: "",
    notes: "",
    isActive: true,
    image: "",
};

function Field({ label, name, value, onChange, error, required, type = "text", placeholder, rows, className = "" }) {
    const base = `w-full rounded-lg border px-3 py-2 text-sm bg-[var(--app-bg)] text-[var(--ink)] placeholder:text-[var(--muted)] outline-none transition-colors ${className}`;
    const state = error
        ? "border-red-500 focus:border-red-500 ring-1 ring-red-500/20"
        : "border-[var(--border)] focus:border-[var(--accent-2)] focus:ring-1 focus:ring-[var(--accent-2)]/20";

    return (
        <div>
            <label className="flex items-center justify-between text-xs font-medium text-[var(--muted)] mb-1">
                <span>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</span>
            </label>
            {type === "textarea" ? (
                <textarea rows={rows || 3} className={`${base} ${state}`} value={value || ""} placeholder={placeholder}
                    onChange={(e) => onChange(name, e.target.value)} />
            ) : (
                <input type={type} className={`${base} ${state}`} value={value || ""} placeholder={placeholder}
                    onChange={(e) => onChange(name, e.target.value)} />
            )}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

function SelectField({ label, name, value, onChange, options, error, required, placeholder, className = "" }) {
    const base = `w-full rounded-lg border px-3 py-2 text-sm bg-[var(--app-bg)] text-[var(--ink)] outline-none transition-colors ${className}`;
    const state = error
        ? "border-red-500 focus:border-red-500 ring-1 ring-red-500/20"
        : "border-[var(--border)] focus:border-[var(--accent-2)] focus:ring-1 focus:ring-[var(--accent-2)]/20";

    return (
        <div>
            <label className="flex items-center justify-between text-xs font-medium text-[var(--muted)] mb-1">
                <span>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</span>
            </label>
            <select className={`${base} ${state}`}
                value={value || ""} onChange={(e) => onChange(name, e.target.value)}>
                <option value="">{placeholder}</option>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

function ToggleField({ label, name, value, onChange }) {
    return (
        <label className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--app-bg)] px-3 py-2.5 cursor-pointer hover:border-[var(--accent-2)]/50 transition-colors">
            <span className="text-sm text-[var(--ink)]">{label}</span>
            <div className="relative">
                <input type="checkbox" checked={!!value} onChange={(e) => onChange(name, e.target.checked)} className="sr-only peer" />
                <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${value ? 'bg-[var(--accent-2)]' : 'bg-[var(--muted)]'}`}></div>
                <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 ${value ? 'translate-x-5' : ''}`}></div>
            </div>
        </label>
    );
}

export default function QarzaAccountModal({ mode = "create", account, onClose, onSuccess }) {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getQarzaLabels(language);
    
    const isCreate = mode === "create";
    const [createAccount, { isLoading: isCreating }] = useCreateQarzaAccount();
    const [updateAccount, { isLoading: isUpdating }] = useUpdateQarzaAccount();
    const isSaving = isCreating || isUpdating;

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [banner, setBanner] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!isCreate && account) {
            setForm({
                ...EMPTY_FORM,
                ...account,
                id: account._id || "",
            });
            setImagePreview(account.qarzaProfileImage ? `${IMAGE_BASE}/${account.qarzaProfileImage}` : null);
        }
    }, [isCreate, account]);

    useEffect(() => {
        if (isCreate && !account) {
            setForm(EMPTY_FORM);
            setImagePreview(null);
            setErrors({});
            setBanner(null);
        }
    }, [isCreate, account]);

    const updateField = useCallback((name, value) => {
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
    }, []);

    const handleImageChange = useCallback(
        (file) => {
            if (!file) return;
            if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                setErrors((prev) => ({ ...prev, image: "Only PNG, JPG, WebP allowed" }));
                return;
            }
            if (file.size > MAX_IMAGE_SIZE) {
                setErrors((prev) => ({ ...prev, image: "Max file size is 5MB" }));
                return;
            }
            updateField("image", file);
            setImagePreview(URL.createObjectURL(file));
        },
        [updateField]
    );

    const validateForm = useCallback(() => {
        const newErrors = {};
        if (!form.name?.trim()) newErrors.name = labels.nameRequired || "Name is required";
        setErrors(newErrors);
        const count = Object.keys(newErrors).length;
        if (count > 0) {
            setBanner(`Please fix ${count} error(s)`);
            return false;
        }
        setBanner(null);
        return true;
    }, [form, labels]);

    const onSubmit = useCallback(async () => {
        if (!validateForm()) return;
        const payload = new FormData();
        const exclude = ["createdAt", "updatedAt", "__v", "_id", "id"];
        Object.entries(form).forEach(([key, value]) => {
            if (key === "image" || exclude.includes(key)) return;
            if (value === undefined || value === null) return;
            payload.append(key, value);
        });
        if (form.image instanceof File) payload.append("qarzaProfileImage", form.image);
        
        // For update mode, append the _id to the FormData
        if (!isCreate && account?._id) {
            payload.append("_id", account._id);
        }
        
        try {
            if (isCreate) {
                await createAccount(payload).unwrap();
                showSuccess("Account created successfully 🎉");
            } else {
                await updateAccount(payload).unwrap();
                showSuccess("Account updated successfully ✅");
            }
            onSuccess?.();
            onClose();
        } catch (error) {
            const msg = error?.data?.message || error?.message || "Something went wrong.";
            showError(msg);
            setBanner(`❌ ${msg}`);
        }
    }, [form, isCreate, account, createAccount, updateAccount, onClose, validateForm, onSuccess]);

    if (!account && !isCreate) return null;

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
                className="bg-[var(--surface)] rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-2)" }}>
                            <Wallet className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-[var(--ink)]">
                                {isCreate ? labels.newAccount : labels.editAccount}
                            </h2>
                            <p className="text-xs text-[var(--muted)]">{labels.creditDebitLedger}</p>
                        </div>
                    </div>
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
                    <div className="mx-5 mt-3 flex items-start gap-2 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-500 animate-in slide-in-from-top-1 duration-200 group hover:bg-red-500/20 transition-colors">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span className="flex-1">{banner}</span>
                        <button
                            onClick={() => { setBanner(null); toast.dismiss(); }}
                            className="text-red-400 hover:text-red-600 transition-colors p-0.5 shrink-0"
                            aria-label="Close banner"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}

                {/* Form */}
                <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Image Upload */}
                        <div className="sm:col-span-2">
                            <label className="text-xs font-medium text-[var(--muted)] mb-1.5 block">
                                {labels.profilePhoto}
                            </label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => { e.preventDefault(); handleImageChange(e.dataTransfer.files?.[0]); }}
                                className={`flex items-center gap-4 rounded-xl border-2 border-dashed px-4 py-3 cursor-pointer transition-all
                                    ${errors.image
                                        ? "border-red-500 bg-red-500/5"
                                        : "border-[var(--border)] hover:border-[var(--accent-2)] hover:bg-[var(--accent-2)]/5"
                                    } bg-[var(--app-bg)]`}
                            >
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="h-14 w-14 rounded-lg object-cover ring-2 ring-[var(--accent-2)]/30" />
                                ) : (
                                    <div className="h-14 w-14 rounded-lg bg-[var(--surface)] flex items-center justify-center text-2xl shrink-0">
                                        📷
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-medium text-[var(--ink)]">
                                        {imagePreview ? "Change Image" : "Click or drag image here"}
                                    </p>
                                    <p className="text-xs text-[var(--muted)] mt-0.5">PNG, JPG, WebP (max 5MB)</p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                    className="hidden"
                                    onChange={(e) => handleImageChange(e.target.files?.[0])}
                                />
                            </div>
                            {errors.image && <p className="mt-1 text-xs text-red-500">{errors.image}</p>}
                        </div>

                        {/* Name */}
                        <Field
                            label={labels.name}
                            name="name"
                            value={form.name}
                            onChange={updateField}
                            error={errors.name}
                            required
                            placeholder="e.g., John Doe"
                        />

                        {/* Phone */}
                        <Field
                            label={labels.phone}
                            name="phoneNo"
                            value={form.phoneNo}
                            onChange={updateField}
                            type="number"
                            placeholder="e.g., 0300-1234567"
                            min="0"
                            onWheel={e => e.target.blur()}
                        />

                        {/* Address */}
                        <Field
                            label={labels.address}
                            name="address"
                            value={form.address}
                            onChange={updateField}
                            placeholder="e.g., City, Area"
                        />

                        {/* Active Status */}
                        {!isCreate && (
                            <div className="sm:col-span-2">
                                <ToggleField
                                    label={labels.active}
                                    name="isActive"
                                    value={form.isActive}
                                    onChange={updateField}
                                />
                            </div>
                        )}

                        {/* Notes */}
                        <div className="sm:col-span-2">
                            <Field
                                label={labels.notes}
                                name="notes"
                                value={form.notes}
                                onChange={updateField}
                                placeholder={labels.internalNotes}
                                type="textarea"
                                rows={3}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[var(--border)] bg-[var(--app-bg)] shrink-0 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm text-[var(--muted)] hover:bg-[var(--surface)] transition-colors"
                    >
                        {labels.cancel}
                    </button>
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm bg-[var(--accent-2)] text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
                    >
                        <Check className="h-4 w-4" />
                        {isSaving ? "Saving..." : isCreate ? labels.createAccount : labels.updateAccount}
                    </button>
                </div>
            </div>
        </div>
    );
}



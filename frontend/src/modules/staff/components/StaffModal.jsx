import { useState, useEffect, useCallback, useRef } from "react";
import { AlertCircle, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useCreateStaffMutation, useUpdateStaffMutation, useGetStaffRolesQuery, useGetStaffByIdQuery } from "../api/staff.api.js";
import { getStaffLabels } from "../labels/staffLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { toImageUrl } from "../../../shared/utilities/image.utility.js";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

const EMPTY_FORM = {
    fullName: "",
    cnic: "",
    phone: "",
    role: "other",
    salaryType: "fixed",
    joinDate: new Date().toISOString().split('T')[0],
    address: "",
    emergencyContact: "",
    photo: "",
    notes: "",
    monthlySalary: 0,
    percentage: 0,
    status: "active",
};

const safeArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === "object" && data.data) return Array.isArray(data.data) ? data.data : [];
    return [];
};

export default function StaffModal({ mode = "create", staffId = null, open, onClose }) {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getStaffLabels(language);
    
    const isCreate = mode === "create";
    const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
    const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();
    const isSaving = isCreating || isUpdating;

    const { data: staffData, isLoading: isFetching, error: staffError } = useGetStaffByIdQuery(staffId, {
        skip: !staffId || isCreate,
    });
    const { data: rolesRaw } = useGetStaffRolesQuery({});

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [banner, setBanner] = useState(null);
    const fileInputRef = useRef(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const roles = safeArray(rolesRaw);

    useEffect(() => {
        if (!isCreate && staffData) {
            const s = staffData.data;
            setForm({
                ...EMPTY_FORM,
                ...s,
                id: s._id || staffData._id || "",
            });
            if (s.photo) setImagePreview(toImageUrl(s.photo));
        }
    }, [isCreate, staffData]);

    useEffect(() => {
        if (isCreate && open) {
            setForm(EMPTY_FORM);
            setImagePreview(null);
            setErrors({});
            setBanner(null);
            setImageFile(null);
        }
    }, [isCreate, open]);

    useEffect(() => {
        return () => {
            if (imagePreview?.startsWith?.("blob:")) URL.revokeObjectURL(imagePreview);
        };
    }, [imagePreview]);

    useEffect(() => {
        const apiError = staffError;
        if (apiError) {
            setBanner(`⚠️ ${apiError?.data?.message || apiError?.message || "Failed to load data"}`);
        }
    }, [staffError]);

    const updateField = useCallback((name, value) => {
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
    }, []);

    const handleImageChange = useCallback(
        (file) => {
            if (!file) return;
            if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                setErrors((prev) => ({ ...prev, photo: "Only PNG, JPG, and WebP images are allowed" }));
                return;
            }
            if (file.size > MAX_IMAGE_SIZE) {
                setErrors((prev) => ({ ...prev, photo: "Image size should be less than 5MB" }));
                return;
            }
            updateField("photo", file);
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        },
        [updateField]
    );

    const removeImage = useCallback(() => {
        setImageFile(null);
        setImagePreview(null);
        updateField("photo", "");
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [updateField]);

    const validateForm = useCallback(() => {
        const newErrors = {};

        // Always required
        if (!form.fullName?.trim()) newErrors.fullName = "Full name is required";
        if (!form.cnic?.trim()) newErrors.cnic = "CNIC is required";
        if (!form.phone?.trim()) newErrors.phone = "Phone is required";
        if (!form.role?.trim()) newErrors.role = "Role is required";
        if (!form.joinDate) newErrors.joinDate = "Join date is required";

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
        const payload = new FormData();
        const exclude = ["batches", "createdAt", "updatedAt", "__v", "_id", "id", "documents"];
        Object.entries(form).forEach(([key, value]) => {
            if (exclude.includes(key)) return;
            if (key === "photo" && typeof value === "string") return; // Don't send string photo, only file
            if (value === undefined || value === null) return;
            payload.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
        });
        if (imageFile) payload.append("photo", imageFile);
        
        try {
            if (isCreate) {
                await createStaff(payload).unwrap();
                showSuccess("Staff created successfully 🎉");
            } else {
                await updateStaff({ id: staffId, data: payload }).unwrap();
                showSuccess("Staff updated successfully ✅");
            }
            onClose();
        } catch (error) {
            const msg = error?.data?.message || error?.message || "Something went wrong.";
            showError(msg);
            setBanner(`❌ ${msg}`);
        }
    }, [form, isCreate, staffId, createStaff, updateStaff, onClose, validateForm, imageFile]);

    if (!open) return null;

    if (!isCreate && isFetching && !staffData) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
                <div className="bg-[var(--surface)] rounded-2xl p-8 text-[var(--muted)] text-sm animate-pulse">
                    {labels.loading || "Loading..."}
                </div>
            </div>
        );
    }

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
                    <h2 className="text-base font-semibold text-[var(--ink)]">
                        {isCreate ? (labels.addStaff || "Add Staff") : (labels.editStaff || "Edit Staff")}
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

                    {/* ── Core Section ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        {/* Image Upload */}
                        <div className="sm:col-span-2">
                            <label className="text-xs font-medium text-[var(--muted)] mb-1.5 block">
                                {labels.photo || "Staff Photo"}
                            </label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => { e.preventDefault(); handleImageChange(e.dataTransfer.files?.[0]); }}
                                className={`flex items-center gap-4 rounded-xl border-2 border-dashed px-4 py-3 cursor-pointer transition-all
                                    ${errors.photo
                                        ? "border-red-500 bg-red-500/5"
                                        : "border-[var(--border)] hover:border-[var(--accent-2)] hover:bg-[var(--accent-2)]/5"
                                    } bg-[var(--app-bg)]`}
                            >
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="h-14 w-14 rounded-lg object-cover ring-2 ring-[var(--accent-2)]/30" />
                                ) : (
                                    <div className="h-14 w-14 rounded-lg bg-[var(--surface)] flex items-center justify-center text-2xl shrink-0">
                                        �
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-medium text-[var(--ink)]">
                                        {imagePreview ? (labels.changeImage || "Change Photo") : (labels.clickOrDrag || "Click or drag to upload")}
                                    </p>
                                    <p className="text-xs text-[var(--muted)] mt-0.5">{labels.pngJpgWebp || "PNG, JPG, WebP — max 5MB"} (optional)</p>
                                </div>
                                {imagePreview && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeImage();
                                        }}
                                        className="ml-auto text-[var(--muted)] hover:text-red-500 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                    className="hidden"
                                    onChange={(e) => handleImageChange(e.target.files?.[0])}
                                />
                            </div>
                            {errors.photo && <p className="mt-1 text-xs text-red-500">{errors.photo}</p>}
                        </div>

                        {/* Full Name */}
                        <Field
                            label={labels.fullName || "Full Name"}
                            name="fullName"
                            value={form.fullName}
                            onChange={updateField}
                            error={errors.fullName}
                            required
                            placeholder="Enter full name"
                        />

                        {/* CNIC */}
                        <Field
                            label={labels.cnic || "CNIC"}
                            name="cnic"
                            value={form.cnic}
                            onChange={updateField}
                            error={errors.cnic}
                            required
                            placeholder="XXXXX-XXXXXXX-X"
                        />

                        {/* Phone */}
                        <Field
                            label={labels.phone || "Phone"}
                            name="phone"
                            value={form.phone}
                            onChange={updateField}
                            error={errors.phone}
                            required
                            placeholder="+92 XXX XXXXXXX"
                        />
                    </div>

                    {/* ── Role & Join Date Section ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">

                        {/* Role */}
                        <SelectField
                            label={labels.role || "Role"}
                            name="role"
                            value={form.role}
                            onChange={updateField}
                            options={roles.map((r) => ({ label: r.name, value: r.name }))}
                            error={errors.role}
                            required
                            placeholder="Select role"
                        />

                        {/* Join Date */}
                        <Field
                            label={labels.joinDate || "Join Date"}
                            name="joinDate"
                            value={form.joinDate}
                            onChange={updateField}
                            error={errors.joinDate}
                            type="date"
                            required
                        />
                    </div>

                    {/* ── Optional Fields ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">

                            {/* Address */}
                            <div className="sm:col-span-2">
                                <Field
                                    label={labels.address || "Address"}
                                    name="address"
                                    value={form.address}
                                    onChange={updateField}
                                    error={errors.address}
                                    placeholder="Enter complete address"
                                />
                            </div>

                            {/* Salary Type */}
                            <SelectField
                                label={labels.salaryType || "Salary Type"}
                                name="salaryType"
                                value={form.salaryType}
                                onChange={updateField}
                                options={[
                                    { label: "Fixed Monthly Salary", value: "fixed" },
                                    { label: "Percentage Based", value: "percentage" },
                                ]}
                                placeholder="Select salary type"
                            />

                            {/* Monthly Salary or Percentage */}
                            {form.salaryType === "fixed" ? (
                                <Field
                                    label={labels.monthlySalary || "Monthly Salary (Rs)"}
                                    name="monthlySalary"
                                    value={form.monthlySalary}
                                    onChange={updateField}
                                    error={errors.monthlySalary}
                                    type="number"
                                    placeholder="0.00"
                                />
                            ) : (
                                <Field
                                    label={labels.commissionRate || "Commission Percentage (%)"}
                                    name="percentage"
                                    value={form.percentage}
                                    onChange={updateField}
                                    error={errors.percentage}
                                    type="number"
                                    placeholder="0.00"
                                />
                            )}

                            {/* Notes */}
                            <div className="sm:col-span-2">
                                <Field
                                    label={labels.notes || "Notes"}
                                    name="notes"
                                    value={form.notes}
                                    onChange={updateField}
                                    placeholder="Add any additional notes or comments..."
                                    type="textarea"
                                    rows={3}
                                />
                            </div>

                            {/* Status Toggle */}
                            <div className="sm:col-span-2 flex items-center justify-between px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--app-bg)]">
                                <span className="text-sm text-[var(--muted)]">{labels.status || "Status"}</span>
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        checked={form.status === "active"} 
                                        onChange={(e) => updateField("status", e.target.checked ? "active" : "inactive")} 
                                        className="sr-only peer" 
                                    />
                                    <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${form.status === "active" ? 'bg-[var(--accent-2)]' : 'bg-[var(--muted)]'}`}></div>
                                    <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 ${form.status === "active" ? 'translate-x-5' : ''}`}></div>
                                </div>
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
                        {labels.cancel || "Cancel"}
                    </button>
                    <PermissionGuard 
                        execute={onSubmit}
                        permission={isCreate ? "staff.create" : "staff.update"}
                        isConfirmation={false}
                    >
                        <button
                            type="button"
                            disabled={isSaving}
                            className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm bg-[var(--accent-2)] text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
                        >
                            <Check className="h-4 w-4" />
                            {isSaving ? (labels.saving || "Saving...") : (isCreate ? (labels.saveStaff || "Save Staff") : (labels.updateStaff || "Update Staff"))}
                        </button>
                    </PermissionGuard>
                </div>
            </div>
        </div>
    );
}

// ─── Sub Components ────────────────────────────────────────────────────

function Field({ label, name, value, onChange, error, required, type = "text", placeholder, rows }) {
    const base = `w-full rounded-lg border px-3 py-2 text-sm bg-[var(--app-bg)] text-[var(--ink)] placeholder:text-[var(--muted)] outline-none transition-colors`;
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
            ) : type === "number" ? (
                <input type="number" min={0} step="any" className={`${base} ${state}`} value={value ?? 0} placeholder={placeholder}
                    onChange={(e) => onChange(name, e.target.valueAsNumber ?? 0)} onWheel={e => e.target.blur()} />
            ) : type === "date" ? (
                <input type="date" className={`${base} ${state}`} value={value || ""} placeholder={placeholder}
                    onChange={(e) => onChange(name, e.target.value)} />
            ) : (
                <input type="text" className={`${base} ${state}`} value={value || ""} placeholder={placeholder}
                    onChange={(e) => onChange(name, e.target.value)} />
            )}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

function SelectField({ label, name, value, onChange, options, error, required, placeholder, disabled }) {
    const base = `w-full rounded-lg border px-3 py-2 text-sm bg-[var(--app-bg)] text-[var(--ink)] outline-none transition-colors`;
    const state = error
        ? "border-red-500 focus:border-red-500 ring-1 ring-red-500/20"
        : "border-[var(--border)] focus:border-[var(--accent-2)] focus:ring-1 focus:ring-[var(--accent-2)]/20";

    return (
        <div>
            <label className="flex items-center justify-between text-xs font-medium text-[var(--muted)] mb-1">
                <span>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</span>
            </label>
            <select disabled={disabled} className={`${base} ${state} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                value={value || ""} onChange={(e) => onChange(name, e.target.value)}>
                <option value="">{placeholder}</option>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

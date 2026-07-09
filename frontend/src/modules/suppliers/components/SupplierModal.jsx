// src/modules/suppliers/components/SupplierModal.jsx
// Props:
//   mode        "create" | "update"
//   supplierId  string  (required when mode="update")
//   onClose     fn
//   onSuccess   fn

import { useState, useEffect, useRef } from "react";
import { X, Truck } from "lucide-react";
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getSupplierLabels } from "../labels/supplierLabels.js";
import { useCreateSupplier, useUpdateSupplier, useSupplier, useAllSuppliers } from "../services/suppliers.service.js";

const TYPES = ["Distributor", "Wholesaler", "Manufacturer", "Other"];

const getLocalizedTypes = (labels) => [
    labels.distributor,
    labels.wholesaler,
    labels.manufacturer,
    labels.other,
];

const emptyForm = () => ({
    name: "", type: "Other",
    phone: "", email: "", address: "",
    taxId: "", notes: "", isActive: true,
});

// ─── theme atoms ───────────────────────────────────────────────────────────
const Label = ({ children, required }) => (
    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
        style={{ color: "var(--muted)" }}>
        {children}{required && <span style={{ color: "var(--accent)" }}> *</span>}
    </label>
);

const Field = ({ children, className = "" }) => (
    <div className={`flex flex-col ${className}`}>{children}</div>
);

const Inp = ({ className = "", error, ...p }) => (
    <input {...p}
        className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition focus:ring-2 ${className}`}
        style={{
            background: "var(--surface)",
            border: `1px solid ${error ? "#dc2626" : "var(--border)"}`,
            color: "var(--ink)",
        }} />
);

const Txt = ({ className = "", ...p }) => (
    <textarea {...p}
        className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition resize-none focus:ring-2 ${className}`}
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" }} />
);

const Sel = ({ className = "", ...p }) => (
    <select {...p}
        className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition ${className}`}
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" }} />
);

const Btn = ({ children, variant = "primary", size = "md", className = "", ...p }) => {
    const sz = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-sm" }[size];
    const styles = {
        primary:   { background: "var(--accent-2)", color: "#fff" },
        secondary: { background: "var(--surface-muted)", color: "var(--ink)", border: "1px solid var(--border)" },
    };
    return (
        <button {...p} style={p.disabled ? { ...styles[variant], opacity: 0.45, cursor: "not-allowed" } : styles[variant]}
            className={`inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-95 disabled:pointer-events-none cursor-pointer ${sz} ${className}`}>
            {children}
        </button>
    );
};

// ─── main component ────────────────────────────────────────────────────────
export default function SupplierModal({ mode = "create", supplierId, onClose, onSuccess }) {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getSupplierLabels(language);
    
    const isUpdate = mode === "update";

    const { data: existingSupplier, isLoading: isFetching } =
        useSupplier(supplierId, { skip: !isUpdate || !supplierId });
    const { data: allSuppliersRaw } = useAllSuppliers();
    const allSuppliers = allSuppliersRaw ?? [];

    const [createSupplier, { isLoading: isCreating }] = useCreateSupplier();
    const [updateSupplier, { isLoading: isUpdating }] = useUpdateSupplier();
    const isSubmitting = isCreating || isUpdating;

    const [form,      setForm]      = useState(emptyForm());
    const [nameError, setNameError] = useState(false);

    const localizedTypes = getLocalizedTypes(labels);

    const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

    // prefill
    useEffect(() => {
        if (!isUpdate || !existingSupplier) return;
        setForm({
            name:          existingSupplier.name          ?? "",
            type:          existingSupplier.type          ?? "Other",
            phone:         existingSupplier.phone         ?? "",
            email:         existingSupplier.email         ?? "",
            address:       existingSupplier.address       ?? "",
            taxId:         existingSupplier.taxId         ?? "",
            notes:         existingSupplier.notes         ?? "",
            isActive:      existingSupplier.isActive      ?? true,
        });
    }, [existingSupplier, isUpdate]);

    const handleNameChange = (val) => {
        update("name", val);
        const exists = allSuppliers.some(
            s => s.name.toLowerCase() === val.toLowerCase() && s._id !== supplierId
        );
        setNameError(exists);
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) return showError(labels.nameRequired);
        if (nameError)          return showError(labels.nameAlreadyTaken);

        const payload = {
            ...form,
            name:          form.name.trim(),
            phone:         form.phone.trim(),
            email:         form.email.trim(),
            address:       form.address.trim(),
            taxId:         form.taxId.trim(),
            notes:         form.notes.trim(),
        };

        try {
            if (isUpdate) {
                await updateSupplier({ id: supplierId, ...payload }).unwrap();
                showSuccess(labels.supplierUpdated);
            } else {
                await createSupplier(payload).unwrap();
                showSuccess(labels.supplierCreated);
                setForm(emptyForm());
            }
            onSuccess?.();
            onClose();
        } catch (e) {
            showError(e?.data?.message || labels.operationFailed);
        }
    };

    if (isUpdate && isFetching && !existingSupplier) return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded-2xl p-8 text-sm" style={{ background: "var(--surface)", color: "var(--muted)" }}>
                {labels.loading}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-3 overflow-y-auto"
            onClick={onClose}>
            <div className="relative w-full max-w-2xl my-4 rounded-3xl shadow-2xl overflow-hidden"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                onClick={e => e.stopPropagation()}>

                {/* header */}
                <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-30"
                    style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "var(--accent-2)" }}>
                            <Truck className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold leading-tight" style={{ color: "var(--ink)" }}>
                                {isUpdate ? labels.updateSupplier : labels.newSupplier}
                            </h2>
                            <p className="text-xs" style={{ color: "var(--muted)" }}>
                                {labels.supplierManagementShort}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-xl transition"
                        style={{ background: "var(--surface-muted)", color: "var(--muted)" }}>
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* body */}
                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        <Field>
                            <Label required>{labels.name}</Label>
                            <Inp value={form.name} placeholder={labels.namePlaceholder}
                                error={nameError}
                                onChange={e => handleNameChange(e.target.value)} />
                            {nameError && (
                                <span className="text-xs mt-1" style={{ color: "#dc2626" }}>
                                    {labels.nameAlreadyInUse}
                                </span>
                            )}
                        </Field>

                        <Field>
                            <Label>{labels.type}</Label>
                            <Sel value={form.type} onChange={e => update("type", e.target.value)}>
                                {TYPES.map((tp, idx) => <option key={tp} value={tp}>{localizedTypes[idx]}</option>)}
                            </Sel>
                        </Field>

                        <Field>
                            <Label>{labels.phone}</Label>
                            <Inp value={form.phone} placeholder={labels.phonePlaceholder}
                                onChange={e => update("phone", e.target.value)} />
                        </Field>

                        <Field>
                            <Label>{labels.email}</Label>
                            <Inp type="email" value={form.email} placeholder={labels.emailPlaceholder}
                                onChange={e => update("email", e.target.value)} />
                        </Field>

                        <Field>
                            <Label>{labels.taxId}</Label>
                            <Inp value={form.taxId} placeholder={labels.taxIdPlaceholder}
                                onChange={e => update("taxId", e.target.value)} />
                        </Field>

                        {/* status toggle */}
                        <Field className="sm:col-span-2">
                            <Label>{labels.status}</Label>
                            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                                style={{ background: "var(--surface-muted)", border: "1px solid var(--border)" }}>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={form.isActive}
                                        onChange={e => update("isActive", e.target.checked)} />
                                    <div className="w-10 h-5 rounded-full peer transition-colors"
                                        style={{ background: form.isActive ? "var(--accent-2)" : "#d1d5db" }}>
                                        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                                            style={{ transform: form.isActive ? "translateX(20px)" : "translateX(0)" }} />
                                    </div>
                                </label>
                                <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                                    {form.isActive ? labels.active : labels.inactive}
                                </span>
                            </div>
                        </Field>

                        <Field className="sm:col-span-2">
                            <Label>{labels.address}</Label>
                            <Txt rows={2} value={form.address} placeholder={labels.addressPlaceholder}
                                onChange={e => update("address", e.target.value)} />
                        </Field>

                        <Field className="sm:col-span-2">
                            <Label>{labels.notes}</Label>
                            <Txt rows={2} value={form.notes} placeholder={labels.notesPlaceholder}
                                onChange={e => update("notes", e.target.value)} />
                        </Field>
                    </div>

                    {/* footer */}
                    <div className="flex justify-end gap-3 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                        <Btn variant="secondary" onClick={onClose}>{labels.cancel}</Btn>
                        <Btn variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting
                                ? (isUpdate ? labels.updating : labels.creating)
                                : isUpdate ? labels.updateSupplier : labels.createSupplier
                            }
                        </Btn>
                    </div>
                </div>
            </div>
        </div>
    );
}


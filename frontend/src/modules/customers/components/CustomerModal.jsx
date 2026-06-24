import { useEffect, useState } from "react";
import { X, Users } from "lucide-react";
import { useSelector } from "react-redux";
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
import { useCreateCustomer, useUpdateCustomer, useCustomer, useAllCustomers } from "../services/customers.service.js";

const emptyForm = () => ({
    name: "",
    image: "",
    phoneNo: "",
    cnic: "",
    address: "",
    isActive: true,
});

const Label = ({ children, required }) => (
    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--muted)" }}>
        {children}{required && <span style={{ color: "var(--accent)" }}> *</span>}
    </label>
);

const Field = ({ children, className = "" }) => <div className={`flex flex-col ${className}`}>{children}</div>;
const Inp = ({ className = "", error, ...p }) => (
    <input {...p} className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition focus:ring-2 ${className}`} style={{ background: "var(--surface)", border: `1px solid ${error ? "#dc2626" : "var(--border)"}`, color: "var(--ink)" }} />
);
const Txt = ({ className = "", ...p }) => (
    <textarea {...p} className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition resize-none focus:ring-2 ${className}`} style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" }} />
);
const Btn = ({ children, variant = "primary", size = "md", className = "", ...p }) => {
    const sz = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-sm" }[size];
    const styles = {
        primary: { background: "var(--accent-2)", color: "#fff" },
        secondary: { background: "var(--surface-muted)", color: "var(--ink)", border: "1px solid var(--border)" },
    };
    return <button {...p} style={p.disabled ? { ...styles[variant], opacity: 0.45, cursor: "not-allowed" } : styles[variant]} className={`inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-95 disabled:pointer-events-none cursor-pointer ${sz} ${className}`}>{children}</button>;
};

export default function CustomerModal({ mode = "create", customerId, onClose, onSuccess }) {
    const language = useSelector((s) => s.auth?.user?.language ?? "en");
    const t = (en, ur) => (language === "en" ? en : ur);
    const isUpdate = mode === "update";

    const { data: existingCustomer, isLoading: isFetching } = useCustomer(customerId, { skip: !isUpdate || !customerId });
    const { data: allCustomersRaw } = useAllCustomers();
    const allCustomers = allCustomersRaw ?? [];

    const [createCustomer, { isLoading: isCreating }] = useCreateCustomer();
    const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomer();
    const isSubmitting = isCreating || isUpdating;

    const [form, setForm] = useState(emptyForm());
    const [nameError, setNameError] = useState(false);

    const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

    useEffect(() => {
        if (!isUpdate || !existingCustomer) return;
        setForm({
            name: existingCustomer.name ?? "",
            image: existingCustomer.image ?? "",
            phoneNo: existingCustomer.phoneNo ?? "",
            cnic: existingCustomer.cnic ?? "",
            address: existingCustomer.address ?? "",
            isActive: existingCustomer.isActive ?? true,
        });
    }, [existingCustomer, isUpdate]);

    const handleNameChange = (val) => {
        update("name", val);
        const exists = allCustomers.some((customer) => customer.name?.toLowerCase() === val.toLowerCase() && customer._id !== customerId);
        setNameError(exists);
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) return showError(t("Customer name is required.", "گاہک کا نام ضروری ہے۔"));
        if (nameError) return showError(t("Name already taken.", "نام پہلے سے موجود ہے۔"));

        const payload = {
            ...form,
            name: form.name.trim(),
            image: form.image?.trim() ?? "",
            phoneNo: form.phoneNo?.trim() ?? "",
            cnic: form.cnic?.trim() ?? "",
            address: form.address?.trim() ?? "",
        };

        try {
            if (isUpdate) {
                await updateCustomer({ id: customerId, ...payload }).unwrap();
                showSuccess(t("Customer updated!", "گاہک اپڈیٹ ہو گیا۔"));
            } else {
                await createCustomer(payload).unwrap();
                showSuccess(t("Customer created!", "گاہک شامل ہو گیا۔"));
                setForm(emptyForm());
            }
            onSuccess?.();
            onClose();
        } catch (error) {
            showError(error?.data?.message ?? t("Operation failed.", "ناکام۔"));
        }
    };

    if (isUpdate && isFetching && !existingCustomer) {
        return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="rounded-2xl p-8 text-sm" style={{ background: "var(--surface)", color: "var(--muted)" }}>Loading…</div></div>;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-3 overflow-y-auto" onClick={onClose}>
            <div className="relative w-full max-w-2xl my-4 rounded-3xl shadow-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-30" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent-2)" }}>
                            <Users className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold leading-tight" style={{ color: "var(--ink)" }}>{isUpdate ? t("Update Customer", "گاہک اپڈیٹ") : t("New Customer", "نیا گاہک")}</h2>
                            <p className="text-xs" style={{ color: "var(--muted)" }}>{t("Customer management", "گاہک")}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl transition" style={{ background: "var(--surface-muted)", color: "var(--muted)" }}>
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field>
                            <Label required>Name</Label>
                            <Inp value={form.name} placeholder="Ali Khan" error={nameError} onChange={(e) => handleNameChange(e.target.value)} />
                            {nameError && <span className="text-xs mt-1" style={{ color: "#dc2626" }}>{t("Name already in use", "نام پہلے سے موجود ہے")}</span>}
                        </Field>

                        <Field>
                            <Label>Image URL</Label>
                            <Inp value={form.image} placeholder="https://..." onChange={(e) => update("image", e.target.value)} />
                        </Field>

                        <Field>
                            <Label>Phone Number</Label>
                            <Inp value={form.phoneNo} placeholder="0300-1234567" onChange={(e) => update("phoneNo", e.target.value)} />
                        </Field>

                        <Field>
                            <Label>CNIC</Label>
                            <Inp value={form.cnic} placeholder="35201-1234567-8" onChange={(e) => update("cnic", e.target.value)} />
                        </Field>

                        <Field className="sm:col-span-2">
                            <Label>Address</Label>
                            <Txt rows={2} value={form.address} placeholder="House 1, Street 2, City" onChange={(e) => update("address", e.target.value)} />
                        </Field>

                        <Field className="sm:col-span-2">
                            <Label>Status</Label>
                            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: "var(--surface-muted)", border: "1px solid var(--border)" }}>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)} />
                                    <div className="w-10 h-5 rounded-full peer transition-colors" style={{ background: form.isActive ? "var(--accent-2)" : "#d1d5db" }}>
                                        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform" style={{ transform: form.isActive ? "translateX(20px)" : "translateX(0)" }} />
                                    </div>
                                </label>
                                <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>{form.isActive ? t("Active", "فعال") : t("Inactive", "غیر فعال")}</span>
                            </div>
                        </Field>
                    </div>

                    <div className="flex justify-end gap-3 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
                        <Btn variant="primary" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? (isUpdate ? "Updating…" : "Creating…") : isUpdate ? t("Update Customer", "اپڈیٹ") : t("Create Customer", "شامل کریں")}</Btn>
                    </div>
                </div>
            </div>
        </div>
    );
}

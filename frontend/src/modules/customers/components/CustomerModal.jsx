import { useEffect, useState, useRef } from "react";
import { X, Users, ImagePlus } from "lucide-react";
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getCustomerLabels } from "../labels/customerLabels.js";
import { useCreateCustomer, useUpdateCustomer, useCustomer, useAllCustomers } from "../services/customers.service.js";

const IMAGE_BASE_URL = "http://localhost:5001";

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
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getCustomerLabels(language);
    
    const isUpdate = mode === "update";

    const { data: existingCustomer, isLoading: isFetching } = useCustomer(customerId, { skip: !isUpdate || !customerId });
    const { data: allCustomersRaw } = useAllCustomers();
    const allCustomers = allCustomersRaw ?? [];

    const [createCustomer, { isLoading: isCreating }] = useCreateCustomer();
    const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomer();
    const isSubmitting = isCreating || isUpdating;

    const [form, setForm] = useState(emptyForm());
    const [nameError, setNameError] = useState(false);
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const fileInputRef = useRef(null);

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
        setSelectedImageFile(null);
        setImagePreview(existingCustomer.image ? `${IMAGE_BASE_URL}/uploads/${existingCustomer.image}` : "");
    }, [existingCustomer, isUpdate]);

    const handleNameChange = (val) => {
        update("name", val);
        const exists = allCustomers.some((customer) => customer.name?.toLowerCase() === val.toLowerCase() && customer._id !== customerId);
        setNameError(exists);
    };

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setSelectedImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) return showError(labels.nameRequired);
        if (nameError) return showError(labels.nameAlreadyTaken);

        const formData = new FormData();
        formData.append("name", form.name.trim());
        formData.append("phoneNo", form.phoneNo?.trim() ?? "");
        formData.append("cnic", form.cnic?.trim() ?? "");
        formData.append("address", form.address?.trim() ?? "");
        formData.append("isActive", String(form.isActive));

        if (selectedImageFile) {
            formData.append("image", selectedImageFile);
        }

        try {
            if (isUpdate) {
                await updateCustomer({ id: customerId, formData }).unwrap();
                showSuccess(labels.customerUpdated);
            } else {
                await createCustomer(formData).unwrap();
                showSuccess(labels.customerCreated);
                setForm(emptyForm());
                setSelectedImageFile(null);
                setImagePreview("");
            }
            onSuccess?.();
            onClose();
        } catch (error) {
            showError(error?.data?.message || labels.operationFailed);
        }
    };

    if (isUpdate && isFetching && !existingCustomer) {
        return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="rounded-2xl p-8 text-sm" style={{ background: "var(--surface)", color: "var(--muted)" }}>{labels.loading}</div></div>;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 overflow-y-auto" onClick={onClose}>
            <div className="relative w-full max-w-2xl my-4 rounded-3xl shadow-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-(--border) bg-(--surface)">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent-2)" }}>
                            <Users className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-(--ink)">{isUpdate ? labels.updateCustomer : labels.newCustomer}</h2>
                            <p className="text-xs text-(--muted)">{labels.customerManagementShort}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl transition" style={{ background: "var(--surface-muted)", color: "var(--muted)" }}>
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="text-xs font-medium text-(--muted) mb-2 block">{labels.customerImage}</label>
                            <div
                                className="flex items-center gap-4 rounded-xl border-2 border-dashed px-4 py-3 cursor-pointer transition-all hover:border-(--accent-2) hover:bg-(--accent-2)/5 bg-(--app-bg)"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Customer preview" className="h-16 w-16 rounded-lg object-cover ring-2 ring-(--accent-2)/30" />
                                ) : (
                                    <div className="h-16 w-16 rounded-lg bg-(--surface) flex items-center justify-center text-2xl text-(--muted)">
                                        📷
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-(--ink)">{imagePreview ? labels.chooseImage : labels.chooseImage}</p>
                                    <p className="text-xs text-(--muted) mt-1">{selectedImageFile ? selectedImageFile.name : labels.imageFormats}</p>
                                </div>
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} ref={fileInputRef} />
                            </div>
                        </div>

                        <Field>
                            <Label required>{labels.name}</Label>
                            <Inp value={form.name} placeholder={labels.namePlaceholder} error={nameError} onChange={(e) => handleNameChange(e.target.value)} />
                            {nameError && <span className="text-xs mt-1" style={{ color: "#dc2626" }}>{labels.nameAlreadyInUse}</span>}
                        </Field>

                        <Field>
                            <Label>{labels.phoneNo}</Label>
                            <Inp type="number" value={form.phoneNo} placeholder={labels.phonePlaceholder} onChange={(e) => update("phoneNo", e.target.value)} min="0" onWheel={e => e.target.blur()} />
                        </Field>

                        <Field>
                            <Label>{labels.cnic}</Label>
                            <Inp type="number" value={form.cnic} placeholder={labels.cnicPlaceholder} onChange={(e) => update("cnic", e.target.value)} min="0" onWheel={e => e.target.blur()} />
                        </Field>

                        <Field className="sm:col-span-2">
                            <Label>{labels.address}</Label>
                            <Txt rows={2} value={form.address} placeholder={labels.addressPlaceholder} onChange={(e) => update("address", e.target.value)} />
                        </Field>

                        <Field className="sm:col-span-2">
                            <Label>{labels.status}</Label>
                            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-(--border) bg-(--app-bg)">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)} />
                                    <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${form.isActive ? 'bg-(--accent-2)' : 'bg-(--muted)'}`}>
                                        <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 ${form.isActive ? 'translate-x-5' : ''}`} />
                                    </div>
                                </label>
                                <span className="text-sm font-medium text-(--ink)">{form.isActive ? labels.active : labels.inactive}</span>
                            </div>
                        </Field>
                    </div>

                    <div className="flex justify-end gap-3 pt-1 border-t border-(--border)">
                        <Btn variant="secondary" onClick={onClose}>{labels.cancel}</Btn>
                        <Btn variant="primary" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? (isUpdate ? labels.updating : labels.creating) : isUpdate ? labels.updateCustomer : labels.createCustomer}</Btn>
                    </div>
                </div>
            </div>
        </div>
    );
}

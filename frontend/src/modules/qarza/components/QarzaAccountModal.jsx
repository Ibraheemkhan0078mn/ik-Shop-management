// src/modules/qarza/components/QarzaAccountModal.jsx
// Props: mode "create"|"update", account (full object for update), onClose, onSuccess
import { useState, useEffect } from "react";
import { X, Wallet } from "lucide-react";
import { showError, showSuccess } from "../../../utils/toastHelpers";
import { useCreateQarzaAccount, useUpdateQarzaAccount } from "../services/qarza.service.js";
import { useSelector } from "react-redux";
import emptyImage from "../../../assets/images/boy-user.jpg";
import { backendBaseUrl } from "../../../common/constants/constants.js";

// ─── atoms ────────────────────────────────────────────────────────────────────
const Label = ({ children }) => (
    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--muted)" }}>
        {children}
    </label>
);
const Field = ({ children, className = "" }) => <div className={`flex flex-col ${className}`}>{children}</div>;
const Inp = ({ className = "", ...p }) => (
    <input {...p} className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition focus:ring-2 ${className}`}
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" }} />
);
const Txt = ({ className = "", ...p }) => (
    <textarea {...p} className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition resize-none focus:ring-2 ${className}`}
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" }} />
);
const Sel = ({ className = "", ...p }) => (
    <select {...p} className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition ${className}`}
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" }} />
);
const Btn = ({ children, variant = "primary", className = "", ...p }) => {
    const styles = {
        primary:   { background: "var(--accent-2)", color: "#fff" },
        secondary: { background: "var(--surface-muted)", color: "var(--ink)", border: "1px solid var(--border)" },
    };
    return (
        <button {...p} style={p.disabled ? { ...styles[variant], opacity: 0.45, cursor: "not-allowed" } : styles[variant]}
            className={`inline-flex items-center justify-center gap-2 font-semibold rounded-xl px-4 py-2 text-sm transition-all active:scale-95 disabled:pointer-events-none cursor-pointer ${className}`}>
            {children}
        </button>
    );
};

const emptyForm = () => ({ name: "", type: "personal", phoneNo: "", address: "", notes: "", isActive: true });

export default function QarzaAccountModal({ mode = "create", account, onClose, onSuccess }) {
    const language   = useSelector(s => s.auth?.user?.language ?? "en");
    const isUpdate   = mode === "update";

    const [createAccount, { isLoading: isCreating }] = useCreateQarzaAccount();
    const [updateAccount, { isLoading: isUpdating }] = useUpdateQarzaAccount();
    const isSubmitting = isCreating || isUpdating;

    const [form,    setForm]    = useState(emptyForm());
    const [imgFile, setImgFile] = useState(null);
    const [preview, setPreview] = useState(null);

    const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

    useEffect(() => {
        if (!isUpdate || !account) return;
        setForm({
            name:     account.name     ?? "",
            type:     account.type     ?? "personal",
            phoneNo:  account.phoneNo  ?? "",
            address:  account.address  ?? "",
            notes:    account.notes    ?? "",
            isActive: account.isActive ?? true,
        });
        if (account.qarzaProfileImage) {
            setPreview(`${backendBaseUrl}/uploads/${account.qarzaProfileImage}`);
        }
    }, [account, isUpdate]);

    const handleFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImgFile(file);
        setPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) return showError("Name is required");

        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        if (imgFile) fd.append("qarzaProfileImage", imgFile);
        if (isUpdate) fd.append("_id", account._id);

        try {
            if (isUpdate) {
                await updateAccount(fd).unwrap();
                showSuccess("Account updated!");
            } else {
                await createAccount(fd).unwrap();
                showSuccess("Account created!");
                setForm(emptyForm());
                setImgFile(null);
                setPreview(null);
            }
            onSuccess?.();
            onClose();
        } catch (e) {
            showError(e?.data?.message ?? "Operation failed");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-3 overflow-y-auto"
            onClick={onClose}>
            <div className="relative w-full max-w-lg my-4 rounded-3xl shadow-2xl overflow-hidden"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                onClick={e => e.stopPropagation()}>

                {/* header */}
                <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
                    style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-2)" }}>
                            <Wallet className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold" style={{ color: "var(--ink)" }}>
                                {isUpdate ? "Edit Account" : "New Account"}
                            </h2>
                            <p className="text-xs" style={{ color: "var(--muted)" }}>Credit / Debit ledger</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl transition"
                        style={{ background: "var(--surface-muted)", color: "var(--muted)" }}>
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* profile image */}
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0"
                            style={{ borderColor: "var(--border)" }}>
                            <img src={preview ?? emptyImage} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--muted)" }}>PROFILE PHOTO</p>
                            <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl cursor-pointer font-semibold transition"
                                style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", color: "var(--ink)" }}>
                                Choose Photo
                                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field>
                            <Label>Name *</Label>
                            <Inp value={form.name} placeholder="Full name" onChange={e => update("name", e.target.value)} />
                        </Field>
                        <Field>
                            <Label>Type</Label>
                            <Sel value={form.type} onChange={e => update("type", e.target.value)}>
                                <option value="personal">Personal</option>
                                <option value="others">Others</option>
                            </Sel>
                        </Field>
                        <Field>
                            <Label>Phone</Label>
                            <Inp value={form.phoneNo} placeholder="03xx-xxxxxxx" onChange={e => update("phoneNo", e.target.value)} />
                        </Field>
                        <Field>
                            <Label>Address</Label>
                            <Inp value={form.address} placeholder="City / Area" onChange={e => update("address", e.target.value)} />
                        </Field>
                        {isUpdate && (
                            <Field className="sm:col-span-2">
                                <Label>Status</Label>
                                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                                    style={{ background: "var(--surface-muted)", border: "1px solid var(--border)" }}>
                                    <div className="relative inline-flex items-center cursor-pointer"
                                        onClick={() => update("isActive", !form.isActive)}>
                                        <div className="w-10 h-5 rounded-full transition-colors"
                                            style={{ background: form.isActive ? "var(--accent-2)" : "#d1d5db" }}>
                                            <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                                                style={{ transform: form.isActive ? "translateX(20px)" : "translateX(0)" }} />
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                                        {form.isActive ? "Active" : "Inactive"}
                                    </span>
                                </div>
                            </Field>
                        )}
                        <Field className="sm:col-span-2">
                            <Label>Notes</Label>
                            <Txt rows={2} value={form.notes} placeholder="Internal notes…" onChange={e => update("notes", e.target.value)} />
                        </Field>
                    </div>

                    <div className="flex justify-end gap-3 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
                        <Btn variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? (isUpdate ? "Updating…" : "Creating…") : (isUpdate ? "Update Account" : "Create Account")}
                        </Btn>
                    </div>
                </div>
            </div>
        </div>
    );
}

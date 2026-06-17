// src/modules/purchaseReturn/components/PurchaseReturnModal.jsx
// Props:
//   mode       "create" | "update"
//   purchaseReturnId  string  (required when mode="update")
//   onClose    fn
//   onSuccess  fn

import { useState, useEffect, useMemo } from "react";
import { X, Plus, CheckCircle, Pencil, Trash2 } from "lucide-react";
import { showError, showSuccess } from "@shared/utilities/toastHelpers";
import {
    useCreatePurchaseReturnMutation,
    useUpdatePurchaseReturnMutation,
    useGetPurchaseReturnByIdQuery,
    useSubmitPurchaseReturnMutation,
    useApprovePurchaseReturnMutation,
    useRejectPurchaseReturnMutation,
    useGeneratePurchaseReturnNumberQuery,
} from "../services/purchaseReturn.service.js";
import { useProducts } from "../../productsModule/services/product.service.js";
import { useSelector } from "react-redux";
import api from "@shared/services/api.js";

const REASONS = [
    { label: "Damaged", value: "damaged" },
    { label: "Expired", value: "expired" },
    { label: "Wrong Item", value: "wrong_item" },
    { label: "Excess", value: "excess" },
    { label: "Quality Issue", value: "quality_issue" },
    { label: "Other", value: "other" },
];

const blankItem = () => ({
    product: "",
    productName: "",
    batch: "",
    batchNumber: "",
    quantity: "",
    purchasePrice: "",
    returnReason: "",
    notes: "",
});

const emptyForm = () => ({
    purchase: "",
    supplier: "",
    returnDate: new Date().toISOString().split("T")[0],
    notes: "",
});

const Label = ({ children }) => (
    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--muted)" }}>
        {children}
    </label>
);

const Field = ({ children, className = "" }) => <div className={`flex flex-col ${className}`}>{children}</div>;

const Inp = ({ className = "", ...p }) => (
    <input
        {...p}
        className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition focus:ring-2 ${className}`}
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" }}
    />
);

const Txt = ({ className = "", ...p }) => (
    <textarea
        {...p}
        className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition resize-none focus:ring-2 ${className}`}
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" }}
    />
);

const SSelect = ({ options = [], value, onChange, placeholder = "Select…", zIndex = 60 }) => {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const selected = options.find((o) => o.value === value);
    const filtered = options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));

    useEffect(() => {
        const h = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const ref = { current: null };

    return (
        <div ref={ref} className="relative w-full">
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl transition text-left"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: selected ? "var(--ink)" : "var(--muted)" }}
            >
                <span className="truncate">{selected?.label ?? placeholder}</span>
                <span className="ml-2 shrink-0" style={{ color: "var(--muted)" }}>▾</span>
            </button>
            {open && (
                <div
                    className="absolute w-full mt-1 rounded-xl shadow-2xl overflow-hidden"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", zIndex }}
                >
                    <div className="p-2" style={{ borderBottom: "1px solid var(--border)" }}>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search…"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm rounded-lg outline-none"
                            style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", color: "var(--ink)" }}
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filtered.length ? (
                            filtered.map((o) => (
                                <div
                                    key={o.value}
                                    onClick={() => {
                                        onChange(o.value);
                                        setOpen(false);
                                        setQ("");
                                    }}
                                    className="px-3 py-2 text-sm cursor-pointer transition"
                                    style={{
                                        background: value === o.value ? "rgba(15,118,110,0.08)" : "transparent",
                                        color: value === o.value ? "var(--accent-2)" : "var(--ink)",
                                        fontWeight: value === o.value ? 600 : 400,
                                    }}
                                    onMouseEnter={(e) => {
                                        if (value !== o.value) e.currentTarget.style.background = "var(--surface-muted)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = value === o.value ? "rgba(15,118,110,0.08)" : "transparent";
                                    }}
                                >
                                    {o.label}
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-sm text-center" style={{ color: "var(--muted)" }}>No results</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const Btn = ({ children, variant = "primary", size = "md", className = "", ...p }) => {
    const sz = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-sm" }[size];
    const styles = {
        primary: { background: "var(--accent-2)", color: "#fff" },
        secondary: { background: "var(--surface-muted)", color: "var(--ink)", border: "1px solid var(--border)" },
        ghost: { background: "transparent", color: "var(--muted)" },
        danger: { background: "rgba(220,38,38,0.08)", color: "#dc2626" },
    };
    return (
        <button
            {...p}
            style={p.disabled ? { ...styles[variant], opacity: 0.45, cursor: "not-allowed" } : styles[variant]}
            className={`inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-95 disabled:pointer-events-none cursor-pointer ${sz} ${className}`}
        >
            {children}
        </button>
    );
};

const Card = ({ title, children, className = "" }) => (
    <div
        className={`rounded-2xl overflow-hidden ${className}`}
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
        {title && (
            <div
                className="px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-muted)", color: "var(--muted)" }}
            >
                {title}
            </div>
        )}
        <div className="p-4">{children}</div>
    </div>
);

export default function PurchaseReturnModal({ mode = "create", purchaseReturnId, onClose, onSuccess }) {
    const language = useSelector((s) => s.auth?.user?.language ?? "en");
    const t = (en, ur) => (language === "en" ? en : ur);
    const isUpdate = mode === "update";

    const { data: existingPurchaseReturn, isLoading: isFetching } = useGetPurchaseReturnByIdQuery(purchaseReturnId, {
        skip: !isUpdate || !purchaseReturnId,
    });

    const [createPurchaseReturn, { isLoading: isCreating }] = useCreatePurchaseReturnMutation();
    const [updatePurchaseReturn, { isLoading: isUpdating }] = useUpdatePurchaseReturnMutation();
    const [submitPurchaseReturn] = useSubmitPurchaseReturnMutation();
    const [approvePurchaseReturn] = useApprovePurchaseReturnMutation();
    const [rejectPurchaseReturn] = useRejectPurchaseReturnMutation();
    const isSubmitting = isCreating || isUpdating;

    const { data: productsRaw = [] } = useProducts();
    const products = productsRaw?.data ?? productsRaw ?? [];

    const [form, setForm] = useState(emptyForm());
    const [currentItem, setCurrentItem] = useState(blankItem());
    const [items, setItems] = useState([]);
    const [editingIndex, setEditingIndex] = useState(-1);

    const update = (f, v) => setForm((p) => ({ ...p, [f]: v }));
    const updateCurrent = (f, v) => setCurrentItem((p) => ({ ...p, [f]: v }));

    // Prefill for update
    useEffect(() => {
        if (!isUpdate || !existingPurchaseReturn) return;
        setForm({
            purchase: existingPurchaseReturn.purchase?._id ?? existingPurchaseReturn.purchase ?? "",
            supplier: existingPurchaseReturn.supplier?._id ?? existingPurchaseReturn.supplier ?? "",
            returnDate: existingPurchaseReturn.returnDate ? new Date(existingPurchaseReturn.returnDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            notes: existingPurchaseReturn.notes ?? "",
        });
        setItems(
            (existingPurchaseReturn.items ?? []).map((it) => ({
                product: it.product?._id ?? it.product ?? "",
                productName: it.product?.name ?? "",
                batch: it.batch?._id ?? it.batch ?? "",
                batchNumber: it.batchNumber ?? "",
                quantity: it.quantity ?? "",
                purchasePrice: it.purchasePrice ?? "",
                returnReason: it.returnReason ?? "",
                notes: it.notes ?? "",
            }))
        );
    }, [existingPurchaseReturn, isUpdate]);

    // Fetch purchases for dropdown
    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [purchasesRes, suppliersRes] = await Promise.all([
                    api.get("/purchases"),
                    api.get("/suppliers"),
                ]);
                setPurchases(purchasesRes.data?.data ?? purchasesRes.data ?? []);
                setSuppliers(suppliersRes.data?.data ?? suppliersRes.data ?? []);
            } catch (err) {
                console.error("Failed to fetch data:", err);
            }
        };
        fetchData();
    }, []);

    const purchaseOptions = useMemo(() => purchases.map((p) => ({ label: p.invoiceNumber, value: p._id })), [purchases]);
    const supplierOptions = useMemo(() => suppliers.map((s) => ({ label: s.name, value: s._id })), [suppliers]);
    const productOptions = useMemo(() => products.map((p) => ({ label: p.name, value: p._id })), [products]);

    const batchOptions = useMemo(() => {
        const prod = products.find((p) => p._id === currentItem.product);
        return (prod?.batches ?? []).map((b) => ({
            label: `${b.batchNumber} — Exp: ${b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : "N/A"}`,
            value: b._id,
            batchNumber: b.batchNumber,
            purchasePrice: b.purchasePrice,
        }));
    }, [currentItem.product, products]);

    const reasonOptions = REASONS;

    const totalRefund = useMemo(() => items.reduce((s, it) => s + Number(it.quantity) * Number(it.purchasePrice || 0), 0), [items]);

    const handleAddItem = () => {
        if (!currentItem.product) return showError("Select a product");
        if (!currentItem.batch) return showError("Select a batch");
        if (!currentItem.quantity) return showError("Enter quantity");
        if (!currentItem.returnReason) return showError("Select return reason");

        const prod = products.find((p) => p._id === currentItem.product);
        const batch = batchOptions.find((b) => b.value === currentItem.batch);
        const row = {
            ...currentItem,
            productName: prod?.name ?? currentItem.productName,
            purchasePrice: batch?.purchasePrice ?? currentItem.purchasePrice,
        };

        if (editingIndex >= 0) {
            setItems((p) => p.map((it, i) => (i === editingIndex ? row : it)));
            setEditingIndex(-1);
        } else {
            setItems((p) => [...p, row]);
        }
        setCurrentItem(blankItem());
    };

    const handleEditItem = (i) => {
        setCurrentItem(items[i]);
        setEditingIndex(i);
    };
    const cancelEdit = () => {
        setCurrentItem(blankItem());
        setEditingIndex(-1);
    };
    const removeItem = (i) => {
        setItems((p) => p.filter((_, idx) => idx !== i));
        if (editingIndex === i) cancelEdit();
    };

    const handleSubmit = async () => {
        if (!items.length) return showError("Add at least one item");

        const payload = { ...form, items };
        try {
            if (isUpdate) {
                await updatePurchaseReturn({ id: purchaseReturnId, ...payload }).unwrap();
                showSuccess(t("Purchase return updated!", "خریداری واپسی اپڈیٹ ہو گیا۔"));
            } else {
                await createPurchaseReturn(payload).unwrap();
                showSuccess(t("Purchase return recorded!", "خریداری واپسی محفوظ ہو گیا۔"));
                setForm(emptyForm());
                setItems([]);
            }
            onSuccess?.();
            onClose();
        } catch (e) {
            showError(e?.data?.message ?? t("Operation failed.", "ناکام۔"));
        }
    };

    const handleSubmitForApproval = async () => {
        if (!purchaseReturnId) return;
        try {
            await submitPurchaseReturn(purchaseReturnId).unwrap();
            showSuccess(t("Submitted for approval", "منظوری کے لیے پیش کیا گیا"));
            onSuccess?.();
            onClose();
        } catch (e) {
            showError(e?.data?.message ?? t("Operation failed.", "ناکام۔"));
        }
    };

    const handleApprove = async () => {
        if (!purchaseReturnId) return;
        try {
            await approvePurchaseReturn(purchaseReturnId).unwrap();
            showSuccess(t("Purchase return approved", "خریداری واپسی منظور ہو گئی"));
            onSuccess?.();
            onClose();
        } catch (e) {
            showError(e?.data?.message ?? t("Operation failed.", "ناکام۔"));
        }
    };

    const handleReject = async () => {
        if (!purchaseReturnId) return;
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;
        try {
            await rejectPurchaseReturn({ id: purchaseReturnId, rejectionReason: reason }).unwrap();
            showSuccess(t("Purchase return rejected", "خریداری واپسی مسترد ہو گئی"));
            onSuccess?.();
            onClose();
        } catch (e) {
            showError(e?.data?.message ?? t("Operation failed.", "ناکام۔"));
        }
    };

    if (isUpdate && isFetching && !existingPurchaseReturn)
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="rounded-2xl p-8 text-sm" style={{ background: "var(--surface)", color: "var(--muted)" }}>Loading…</div>
            </div>
        );

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-3 overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-3xl my-4 rounded-3xl shadow-2xl overflow-hidden"
                style={{ background: "var(--app-bg)", border: "1px solid var(--border)" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* header */}
                <div
                    className="flex items-center justify-between px-6 py-4 sticky top-0 z-30"
                    style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent)" }}>
                            <Pencil className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold leading-tight" style={{ color: "var(--ink)" }}>
                                {isUpdate ? t("Update Purchase Return", "خریداری واپسی اپڈیٹ") : t("Record Purchase Return", "خریداری واپسی ریکارڈ")}
                            </h2>
                            <p className="text-xs" style={{ color: "var(--muted)" }}>
                                {t("Return items to supplier", "آئٹمز سپلائر کو واپس کریں")}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-xl transition"
                        style={{ background: "var(--surface-muted)", color: "var(--muted)" }}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* purchase + supplier + date */}
                    <Card>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Field>
                                <Label>Purchase *</Label>
                                <SSelect options={purchaseOptions} value={form.purchase} onChange={(v) => update("purchase", v)} placeholder="Select purchase…" zIndex={70} />
                            </Field>
                            <Field>
                                <Label>Supplier *</Label>
                                <SSelect options={supplierOptions} value={form.supplier} onChange={(v) => update("supplier", v)} placeholder="Select supplier…" zIndex={70} />
                            </Field>
                            <Field>
                                <Label>Return Date *</Label>
                                <Inp type="date" value={form.returnDate} onChange={(e) => update("returnDate", e.target.value)} />
                            </Field>
                        </div>
                        <Field className="mt-4">
                            <Label>Notes</Label>
                            <Inp placeholder="Optional notes…" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
                        </Field>
                    </Card>

                    {/* item form */}
                    <Card title={editingIndex >= 0 ? `Editing Item #${editingIndex + 1}` : "Add Item"}>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field>
                                    <Label>Product *</Label>
                                    <SSelect
                                        options={productOptions}
                                        value={currentItem.product}
                                        onChange={(val) => {
                                            const prod = products.find((p) => p._id === val);
                                            setCurrentItem({ ...blankItem(), product: val, productName: prod?.name ?? "" });
                                        }}
                                        placeholder="Select product…"
                                        zIndex={70}
                                    />
                                </Field>
                                <Field>
                                    <Label>Return Reason *</Label>
                                    <SSelect options={reasonOptions} value={currentItem.returnReason} onChange={(v) => updateCurrent("returnReason", v)} placeholder="Select reason…" zIndex={70} />
                                </Field>
                            </div>

                            {currentItem.product && (
                                <>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        <Field>
                                            <Label>Batch *</Label>
                                            <SSelect
                                                options={batchOptions}
                                                value={currentItem.batch}
                                                onChange={(val) => {
                                                    const b = batchOptions.find((o) => o.value === val);
                                                    updateCurrent("batch", val);
                                                    if (b) {
                                                        updateCurrent("batchNumber", b.batchNumber);
                                                        updateCurrent("purchasePrice", b.purchasePrice);
                                                    }
                                                }}
                                                placeholder="Select batch…"
                                                zIndex={70}
                                            />
                                        </Field>
                                        <Field>
                                            <Label>Quantity *</Label>
                                            <Inp type="number" min={1} placeholder="0" value={currentItem.quantity} onChange={(e) => updateCurrent("quantity", e.target.value)} />
                                        </Field>
                                        <Field>
                                            <Label>Purchase Price</Label>
                                            <Inp type="number" min={0} placeholder="0.00" value={currentItem.purchasePrice} onChange={(e) => updateCurrent("purchasePrice", e.target.value)} />
                                        </Field>
                                    </div>

                                    <Field>
                                        <Label>Notes {currentItem.returnReason === "other" ? "*" : ""}</Label>
                                        <Txt rows={2} placeholder="Item-level notes…" value={currentItem.notes} onChange={(e) => updateCurrent("notes", e.target.value)} />
                                    </Field>

                                    <div className="flex gap-2 justify-end">
                                        {editingIndex >= 0 && <Btn variant="secondary" size="sm" onClick={cancelEdit}>Cancel Edit</Btn>}
                                        <Btn variant="primary" size="sm" onClick={handleAddItem} disabled={!currentItem.product || !currentItem.batch || !currentItem.quantity || !currentItem.returnReason}>
                                            {editingIndex >= 0 ? (
                                                <>
                                                    <CheckCircle className="w-3.5 h-3.5" /> Update Item
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="w-3.5 h-3.5" /> Add Item
                                                </>
                                            )}
                                        </Btn>
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>

                    {/* confirmed items */}
                    {items.length > 0 && (
                        <Card title={`Items (${items.length})`}>
                            <div className="space-y-2">
                                {items.map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl transition"
                                        style={{
                                            border: editingIndex === i ? "1.5px solid var(--accent-2)" : "1px solid var(--border)",
                                            background: editingIndex === i ? "rgba(15,118,110,0.04)" : "var(--surface)",
                                        }}
                                    >
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                            <span className="text-sm font-semibold truncate" style={{ color: "var(--ink)" }}>{item.productName || item.product}</span>
                                            <span className="text-xs" style={{ color: "var(--muted)" }}>
                                                Qty: {item.quantity} · Batch: {item.batchNumber} · {REASONS.find((r) => r.value === item.returnReason)?.label ?? item.returnReason}
                                                {item.purchasePrice ? ` · Refund: Rs. ${(Number(item.quantity) * Number(item.purchasePrice)).toFixed(2)}` : ""}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button onClick={() => handleEditItem(i)} className="p-1.5 rounded-lg transition" style={{ color: "var(--muted)" }} onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-2)"; e.currentTarget.style.background = "rgba(15,118,110,0.08)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}>
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => removeItem(i)} className="p-1.5 rounded-lg transition" style={{ color: "var(--muted)" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.background = "rgba(220,38,38,0.08)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <div className="flex justify-between items-center pt-3 mt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                    <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Total Refund</span>
                                    <span className="text-base font-black tabular-nums" style={{ color: "var(--accent)" }}>Rs. {totalRefund.toFixed(2)}</span>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* footer */}
                    <div className="flex justify-between gap-3 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                        <div className="flex gap-2">
                            {isUpdate && existingPurchaseReturn?.status === "draft" && <Btn variant="secondary" onClick={handleSubmitForApproval}>Submit for Approval</Btn>}
                            {isUpdate && existingPurchaseReturn?.status === "pending" && (
                                <>
                                    <Btn variant="secondary" onClick={handleApprove}>Approve</Btn>
                                    <Btn variant="danger" onClick={handleReject}>Reject</Btn>
                                </>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
                            <Btn variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? (isUpdate ? "Updating…" : "Saving…") : isUpdate ? t(`Update (${items.length} items)`, `اپڈیٹ`) : t(`Save Purchase Return (${items.length} items)`, `محفوظ`)}
                            </Btn>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


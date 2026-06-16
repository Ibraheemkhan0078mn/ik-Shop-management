// src/modules/wastage/components/WastageModal.jsx
// Props:
//   mode       "create" | "update"
//   wastageId  string  (required when mode="update")
//   onClose    fn
//   onSuccess  fn

import { useState, useEffect, useMemo, useRef } from "react";
import { X, Plus, CheckCircle, Pencil, Trash2, Trash } from "lucide-react";
import { showError, showSuccess } from "../../../utils/toastHelpers";
import { useCreateWastage, useUpdateWastage, useWastage } from "../services/wastage.service.js";
import { useProducts } from "../../productsModule/services/product.service.js";
import { useSelector } from "react-redux";

// ─── constants ─────────────────────────────────────────────────────────────
const REASONS = [
    { label: "Expired",       value: "expired" },
    { label: "Damaged",       value: "damaged" },
    { label: "Stolen",        value: "stolen" },
    { label: "Spillage",      value: "spillage" },
    { label: "Quality Issue", value: "quality_issue" },
    { label: "Other",         value: "other" },
];

const UNITS = ["Tablet","Strip","Bottle","Box","Piece","Sachet","Vial","ml","g","kg","unit"];

const blankItem = () => ({
    product: "", productName: "", batchNumber: "",
    expiryDate: "", quantity: "", unit: "", costPrice: "",
    reason: "", notes: "",
});

const emptyForm = () => ({
    wastageDate: new Date().toISOString().split("T")[0],
    notes: "",
});

// ─── theme atoms ───────────────────────────────────────────────────────────
const Label = ({ children }) => (
    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
        style={{ color: "var(--muted)" }}>
        {children}
    </label>
);

const Field = ({ children, className = "" }) => (
    <div className={`flex flex-col ${className}`}>{children}</div>
);

const Inp = ({ className = "", ...p }) => (
    <input {...p}
        className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition focus:ring-2 ${className}`}
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" }} />
);

const Txt = ({ className = "", ...p }) => (
    <textarea {...p}
        className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition resize-none focus:ring-2 ${className}`}
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" }} />
);

const SSelect = ({ options = [], value, onChange, placeholder = "Select…", zIndex = 60 }) => {
    const [open, setOpen] = useState(false);
    const [q,    setQ]    = useState("");
    const ref             = useRef();
    const selected        = options.find(o => o.value === value);
    const filtered        = options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()));

    useEffect(() => {
        const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    return (
        <div ref={ref} className="relative w-full">
            <button type="button" onClick={() => setOpen(p => !p)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl transition text-left"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: selected ? "var(--ink)" : "var(--muted)" }}>
                <span className="truncate">{selected?.label ?? placeholder}</span>
                <span className="ml-2 shrink-0" style={{ color: "var(--muted)" }}>▾</span>
            </button>
            {open && (
                <div className="absolute w-full mt-1 rounded-xl shadow-2xl overflow-hidden"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", zIndex }}>
                    <div className="p-2" style={{ borderBottom: "1px solid var(--border)" }}>
                        <input autoFocus type="text" placeholder="Search…" value={q}
                            onChange={e => setQ(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm rounded-lg outline-none"
                            style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", color: "var(--ink)" }} />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filtered.length
                            ? filtered.map(o => (
                                <div key={o.value}
                                    onClick={() => { onChange(o.value); setOpen(false); setQ(""); }}
                                    className="px-3 py-2 text-sm cursor-pointer transition"
                                    style={{
                                        background: value === o.value ? "rgba(15,118,110,0.08)" : "transparent",
                                        color: value === o.value ? "var(--accent-2)" : "var(--ink)",
                                        fontWeight: value === o.value ? 600 : 400,
                                    }}
                                    onMouseEnter={e => { if (value !== o.value) e.currentTarget.style.background = "var(--surface-muted)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = value === o.value ? "rgba(15,118,110,0.08)" : "transparent"; }}>
                                    {o.label}
                                </div>
                            ))
                            : <div className="px-3 py-4 text-sm text-center" style={{ color: "var(--muted)" }}>No results</div>
                        }
                    </div>
                </div>
            )}
        </div>
    );
};

const Btn = ({ children, variant = "primary", size = "md", className = "", ...p }) => {
    const sz = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-sm" }[size];
    const styles = {
        primary:   { background: "var(--accent-2)", color: "#fff" },
        secondary: { background: "var(--surface-muted)", color: "var(--ink)", border: "1px solid var(--border)" },
        ghost:     { background: "transparent", color: "var(--muted)" },
        danger:    { background: "rgba(220,38,38,0.08)", color: "#dc2626" },
    };
    return (
        <button {...p} style={p.disabled ? { ...styles[variant], opacity: 0.45, cursor: "not-allowed" } : styles[variant]}
            className={`inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-95 disabled:pointer-events-none cursor-pointer ${sz} ${className}`}>
            {children}
        </button>
    );
};

const Card = ({ title, children, className = "" }) => (
    <div className={`rounded-2xl overflow-hidden ${className}`}
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {title && (
            <div className="px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-muted)", color: "var(--muted)" }}>
                {title}
            </div>
        )}
        <div className="p-4">{children}</div>
    </div>
);

// ─── main modal ─────────────────────────────────────────────────────────────
export default function WastageModal({ mode = "create", wastageId, onClose, onSuccess }) {
    const language  = useSelector(s => s.auth?.user?.language ?? "en");
    const t         = (en, ur) => language === "en" ? en : ur;
    const isUpdate  = mode === "update";

    const { data: existingWastage, isLoading: isFetching } =
        useWastage(wastageId, { skip: !isUpdate || !wastageId });

    const [createWastage, { isLoading: isCreating }] = useCreateWastage();
    const [updateWastage, { isLoading: isUpdating }] = useUpdateWastage();
    const isSubmitting = isCreating || isUpdating;

    const { data: productsRaw = [] } = useProducts();
    const products = productsRaw?.data ?? productsRaw ?? [];

    const [form,         setForm]         = useState(emptyForm());
    const [currentItem,  setCurrentItem]  = useState(blankItem());
    const [items,        setItems]        = useState([]);
    const [editingIndex, setEditingIndex] = useState(-1);

    const update        = (f, v) => setForm(p => ({ ...p, [f]: v }));
    const updateCurrent = (f, v) => setCurrentItem(p => ({ ...p, [f]: v }));

    // prefill for update
    useEffect(() => {
        if (!isUpdate || !existingWastage) return;
        setForm({
            wastageDate: existingWastage.wastageDate
                ? new Date(existingWastage.wastageDate).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0],
            notes: existingWastage.notes ?? "",
        });
        setItems((existingWastage.items ?? []).map(it => ({
            product:     it.product?._id ?? it.product ?? "",
            productName: it.product?.name ?? "",
            batchNumber: it.batchNumber ?? "",
            expiryDate:  it.expiryDate ? new Date(it.expiryDate).toISOString().split("T")[0] : "",
            quantity:    it.quantity ?? "",
            unit:        it.unit ?? "",
            costPrice:   it.costPrice ?? "",
            reason:      it.reason ?? "",
            notes:       it.notes ?? "",
        })));
    }, [existingWastage, isUpdate]);

    // product options
    const productOptions = useMemo(() =>
        products.map(p => ({ label: p.name, value: p._id })),
    [products]);

    // batch options for selected product
    const batchOptions = useMemo(() => {
        const prod = products.find(p => p._id === currentItem.product);
        return (prod?.batches ?? []).map(b => ({
            label: `${b.batchNumber} — Exp: ${b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : "N/A"}`,
            value: b.batchNumber,
            expiryDate: b.expiryDate ?? "",
        }));
    }, [currentItem.product, products]);

    const unitOptions   = UNITS.map(u => ({ label: u, value: u }));
    const reasonOptions = REASONS;

    const totalLoss = useMemo(() =>
        items.reduce((s, it) => s + (Number(it.quantity) * Number(it.costPrice || 0)), 0),
    [items]);

    // handlers
    const handleAddItem = () => {
        if (!currentItem.product)  return showError("Select a product");
        if (!currentItem.quantity) return showError("Enter quantity");
        if (!currentItem.reason)   return showError("Select reason");

        const prod = products.find(p => p._id === currentItem.product);
        const row  = { ...currentItem, productName: prod?.name ?? currentItem.productName };

        if (editingIndex >= 0) {
            setItems(p => p.map((it, i) => i === editingIndex ? row : it));
            setEditingIndex(-1);
        } else {
            setItems(p => [...p, row]);
        }
        setCurrentItem(blankItem());
    };

    const handleEditItem  = (i) => { setCurrentItem(items[i]); setEditingIndex(i); };
    const cancelEdit      = () =>   { setCurrentItem(blankItem()); setEditingIndex(-1); };
    const removeItem      = (i) => {
        setItems(p => p.filter((_, idx) => idx !== i));
        if (editingIndex === i) cancelEdit();
    };

    const handleSubmit = async () => {
        if (!items.length) return showError("Add at least one item");

        const payload = { ...form, items };
        try {
            if (isUpdate) {
                await updateWastage({ id: wastageId, ...payload }).unwrap();
                showSuccess(t("Wastage updated!", "ضیاع اپڈیٹ ہو گیا۔"));
            } else {
                await createWastage(payload).unwrap();
                showSuccess(t("Wastage recorded!", "ضیاع محفوظ ہو گیا۔"));
                setForm(emptyForm());
                setItems([]);
            }
            onSuccess?.();
            onClose();
        } catch (e) {
            showError(e?.data?.message ?? t("Operation failed.", "ناکام۔"));
        }
    };

    if (isUpdate && isFetching && !existingWastage) return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded-2xl p-8 text-sm" style={{ background: "var(--surface)", color: "var(--muted)" }}>
                Loading…
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-3 overflow-y-auto"
            onClick={onClose}>
            <div className="relative w-full max-w-3xl my-4 rounded-3xl shadow-2xl overflow-hidden"
                style={{ background: "var(--app-bg)", border: "1px solid var(--border)" }}
                onClick={e => e.stopPropagation()}>

                {/* header */}
                <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-30"
                    style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "var(--accent)" }}>
                            <Trash className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold leading-tight" style={{ color: "var(--ink)" }}>
                                {isUpdate ? t("Update Wastage", "ضیاع اپڈیٹ") : t("Record Wastage", "ضیاع ریکارڈ")}
                            </h2>
                            <p className="text-xs" style={{ color: "var(--muted)" }}>
                                {t("Track product losses", "مصنوعات کا نقصان")}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-xl transition"
                        style={{ background: "var(--surface-muted)", color: "var(--muted)" }}>
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 space-y-5">

                    {/* date + global notes */}
                    <Card>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field>
                                <Label>Wastage Date *</Label>
                                <Inp type="date" value={form.wastageDate}
                                    onChange={e => update("wastageDate", e.target.value)} />
                            </Field>
                            <Field>
                                <Label>Notes</Label>
                                <Inp placeholder="Optional overall notes…" value={form.notes}
                                    onChange={e => update("notes", e.target.value)} />
                            </Field>
                        </div>
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
                                        onChange={val => {
                                            const prod = products.find(p => p._id === val);
                                            setCurrentItem({ ...blankItem(), product: val, productName: prod?.name ?? "" });
                                        }}
                                        placeholder="Select product…"
                                        zIndex={70}
                                    />
                                </Field>
                                <Field>
                                    <Label>Reason *</Label>
                                    <SSelect
                                        options={reasonOptions}
                                        value={currentItem.reason}
                                        onChange={v => updateCurrent("reason", v)}
                                        placeholder="Select reason…"
                                        zIndex={70}
                                    />
                                </Field>
                            </div>

                            {currentItem.product && (
                                <>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        <Field>
                                            <Label>Quantity *</Label>
                                            <Inp type="number" min={1} placeholder="0"
                                                value={currentItem.quantity}
                                                onChange={e => updateCurrent("quantity", e.target.value)} />
                                        </Field>
                                        <Field>
                                            <Label>Unit</Label>
                                            <SSelect options={unitOptions} value={currentItem.unit}
                                                onChange={v => updateCurrent("unit", v)}
                                                placeholder="Unit…" zIndex={70} />
                                        </Field>
                                        <Field>
                                            <Label>Cost Price</Label>
                                            <Inp type="number" min={0} placeholder="0.00"
                                                value={currentItem.costPrice}
                                                onChange={e => updateCurrent("costPrice", e.target.value)} />
                                        </Field>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Field>
                                            <Label>Batch</Label>
                                            <SSelect
                                                options={batchOptions}
                                                value={currentItem.batchNumber}
                                                onChange={val => {
                                                    const b = batchOptions.find(o => o.value === val);
                                                    updateCurrent("batchNumber", val);
                                                    if (b?.expiryDate) updateCurrent("expiryDate", new Date(b.expiryDate).toISOString().split("T")[0]);
                                                }}
                                                placeholder="Select batch…"
                                                zIndex={70}
                                            />
                                        </Field>
                                        <Field>
                                            <Label>Expiry Date</Label>
                                            <Inp type="date" value={currentItem.expiryDate}
                                                onChange={e => updateCurrent("expiryDate", e.target.value)} />
                                        </Field>
                                    </div>

                                    <Field>
                                        <Label>Notes {currentItem.reason === "other" ? "*" : ""}</Label>
                                        <Txt rows={2} placeholder="Item-level notes…"
                                            value={currentItem.notes}
                                            onChange={e => updateCurrent("notes", e.target.value)} />
                                    </Field>

                                    <div className="flex gap-2 justify-end">
                                        {editingIndex >= 0 && (
                                            <Btn variant="secondary" size="sm" onClick={cancelEdit}>Cancel Edit</Btn>
                                        )}
                                        <Btn variant="primary" size="sm" onClick={handleAddItem}
                                            disabled={!currentItem.product || !currentItem.quantity || !currentItem.reason}>
                                            {editingIndex >= 0
                                                ? <><CheckCircle className="w-3.5 h-3.5" /> Update Item</>
                                                : <><Plus className="w-3.5 h-3.5" /> Add Item</>
                                            }
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
                                    <div key={i}
                                        className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl transition"
                                        style={{
                                            border: editingIndex === i ? "1.5px solid var(--accent-2)" : "1px solid var(--border)",
                                            background: editingIndex === i ? "rgba(15,118,110,0.04)" : "var(--surface)",
                                        }}>
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                            <span className="text-sm font-semibold truncate" style={{ color: "var(--ink)" }}>
                                                {item.productName || item.product}
                                            </span>
                                            <span className="text-xs" style={{ color: "var(--muted)" }}>
                                                Qty: {item.quantity}
                                                {item.unit       ? ` · ${item.unit}`       : ""}
                                                {item.batchNumber? ` · Batch: ${item.batchNumber}` : ""}
                                                {" · "}{REASONS.find(r => r.value === item.reason)?.label ?? item.reason}
                                                {item.costPrice  ? ` · Loss: Rs. ${(Number(item.quantity) * Number(item.costPrice)).toFixed(2)}` : ""}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button onClick={() => handleEditItem(i)}
                                                className="p-1.5 rounded-lg transition" style={{ color: "var(--muted)" }}
                                                onMouseEnter={e => { e.currentTarget.style.color = "var(--accent-2)"; e.currentTarget.style.background = "rgba(15,118,110,0.08)"; }}
                                                onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}>
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => removeItem(i)}
                                                className="p-1.5 rounded-lg transition" style={{ color: "var(--muted)" }}
                                                onMouseEnter={e => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.background = "rgba(220,38,38,0.08)"; }}
                                                onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <div className="flex justify-between items-center pt-3 mt-1"
                                    style={{ borderTop: "1px solid var(--border)" }}>
                                    <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Total Loss</span>
                                    <span className="text-base font-black tabular-nums" style={{ color: "var(--accent)" }}>
                                        Rs. {totalLoss.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* footer */}
                    <div className="flex justify-end gap-3 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
                        <Btn variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting
                                ? (isUpdate ? "Updating…" : "Saving…")
                                : isUpdate
                                    ? t(`Update (${items.length} items)`, `اپڈیٹ`)
                                    : t(`Save Wastage (${items.length} items)`, `محفوظ`)
                            }
                        </Btn>
                    </div>
                </div>
            </div>
        </div>
    );
}

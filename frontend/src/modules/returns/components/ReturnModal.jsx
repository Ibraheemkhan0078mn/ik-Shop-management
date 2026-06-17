// src/modules/returns/components/ReturnModal.jsx
// Props:
//   mode        "create" | "update"   default "create"
//   returnId    string                required when mode="update"
//   onClose     fn
//   onSuccess   fn                    called after successful submit

import { useState, useEffect, useMemo, useRef } from "react";
import { X, Search, Plus, CheckCircle, Pencil, Trash2, RotateCcw } from "lucide-react";
import { showError, showSuccess } from "@shared/utilities/toastHelpers";
import { useCreateReturn, useUpdateReturn, useReturn } from "../services/return.service.js";
import { usePurchaseByInvoiceNumber } from "../../productPurchases/services/purchases.service.js";
import { useSelector } from "react-redux";

// ─── constants ────────────────────────────────────────────────────────────────
const RETURN_REASONS = [
    { label: "Defective",           value: "defective" },
    { label: "Wrong Item",          value: "wrong_item" },
    { label: "Expired",             value: "expired" },
    { label: "Damaged in Transit",  value: "damaged_in_transit" },
    { label: "Supplier Request",    value: "customer_request" },
    { label: "Other",               value: "other" },
];

const CONDITIONS = [
    { label: "Resalable", value: "resalable" },
    { label: "Damaged",   value: "damaged" },
    { label: "Expired",   value: "expired" },
];

const blankItem = () => ({
    product: "", productName: "", invoiceItem: "",
    batch: "", expiryDate: "", originalQty: "",
    returnQuantity: "", condition: "", cut: 0,
    costPrice: "", notes: "",
});

const emptyForm = () => ({
    returnDate:   new Date().toISOString().split("T")[0],
    returnReason: "",
    returnType:   "invoice_based",
});

// ─── theme-aware atoms ────────────────────────────────────────────────────────
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

// Themed searchable select — higher z-index for nested use inside modals
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

// Section card
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

// Step badge
const Step = ({ n, label }) => (
    <div className="flex items-center gap-2 mb-3">
        <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white shrink-0"
            style={{ background: "var(--accent-2)" }}>{n}</span>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>{label}</span>
    </div>
);

// ─── main component ───────────────────────────────────────────────────────────
export default function ReturnModal({ mode = "create", returnId, onClose, onSuccess }) {
    const language  = useSelector(s => s.auth?.user?.language ?? "en");
    const t         = (en, ur) => language === "en" ? en : ur;
    const isUpdate  = mode === "update";

    // ─── data hooks ────────────────────────────────────────────
    const { data: existingReturn, isLoading: isFetching } =
        useReturn(returnId, { skip: !isUpdate || !returnId });

    const [createReturn, { isLoading: isCreating }] = useCreateReturn();
    const [updateReturn, { isLoading: isUpdating }] = useUpdateReturn();
    const isSubmitting = isCreating || isUpdating;

    // ─── invoice search ────────────────────────────────────────
    const [searchInput,  setSearchInput]  = useState("");
    const [invoiceQuery, setInvoiceQuery] = useState("");

    const { data: purchase, isLoading: isSearching, isError: searchError } =
        usePurchaseByInvoiceNumber(invoiceQuery, { skip: !invoiceQuery });

    // ─── local state ───────────────────────────────────────────
    const [form,         setForm]         = useState(emptyForm());
    const [currentItem,  setCurrentItem]  = useState(blankItem());
    const [items,        setItems]        = useState([]);
    const [editingIndex, setEditingIndex] = useState(-1);

    const update        = (f, v) => setForm(p => ({ ...p, [f]: v }));
    const updateCurrent = (f, v) => setCurrentItem(p => ({ ...p, [f]: v }));

    // ─── prefill for update ────────────────────────────────────
    useEffect(() => {
        if (!isUpdate || !existingReturn) return;
        setForm({
            returnDate:   existingReturn.returnDate
                ? new Date(existingReturn.returnDate).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0],
            returnReason: existingReturn.returnReason ?? "",
            returnType:   existingReturn.returnType   ?? "invoice_based",
        });
        const invNum = existingReturn.invoice?.invoiceNumber ?? "";
        if (invNum) { setSearchInput(invNum); setInvoiceQuery(invNum); }

        setItems((existingReturn.items ?? []).map(it => ({
            product:        it.product?._id  ?? it.product  ?? "",
            productName:    it.product?.name ?? it.productName ?? "",
            invoiceItem:    it.invoiceItem   ?? "",
            batch:          it.batch         ?? "",
            expiryDate:     it.expiryDate ? new Date(it.expiryDate).toISOString().split("T")[0] : "",
            originalQty:    it.originalQty   ?? "",
            returnQuantity: it.returnQuantity ?? "",
            condition:      it.condition     ?? "",
            cut:            it.cut           ?? 0,
            costPrice:      it.costPrice     ?? "",
            notes:          it.notes         ?? "",
            refundAmount:   it.refundAmount  ?? 0,
        })));
    }, [existingReturn, isUpdate]);

    // ─── derived ───────────────────────────────────────────────
    const purchaseItemOptions = useMemo(() =>
        (purchase?.items ?? []).map(it => ({
            label: `${it.product?.name ?? "Unknown"} — Qty: ${it.quantity} — Rs. ${it.price}`,
            value: it._id,
            data:  it,
        })),
    [purchase]);

    const refundPreview = useMemo(() =>
        Number(currentItem.returnQuantity) * Number(currentItem.costPrice || 0)
        - Number(currentItem.cut || 0),
    [currentItem.returnQuantity, currentItem.costPrice, currentItem.cut]);

    const totalRefund = useMemo(() =>
        items.reduce((s, it) => s + (it.refundAmount ?? 0), 0),
    [items]);

    // ─── handlers ──────────────────────────────────────────────
    const handleSearch = () => {
        const q = searchInput.trim();
        if (!q) return;
        setInvoiceQuery(q);
        setCurrentItem(blankItem());
        if (!isUpdate) setItems([]);
    };

    const handleSelectItem = (val) => {
        const found = purchaseItemOptions.find(o => o.value === val);
        if (!found?.data) return;
        const it = found.data;
        setCurrentItem({
            ...blankItem(),
            invoiceItem:    val,
            product:        it.product?._id   ?? it.product   ?? "",
            productName:    it.product?.name  ?? "",
            batch:          it.batch?.batchNumber ?? it.batchNumber ?? "",
            expiryDate:     it.batch?.expiryDate  ?? it.expiryDate  ?? "",
            originalQty:    it.quantity ?? "",
            costPrice:      it.price    ?? "",
        });
    };

    const handleAddItem = () => {
        if (!currentItem.product)        return showError("Select a product");
        if (!currentItem.returnQuantity) return showError("Enter return quantity");
        if (!currentItem.condition)      return showError("Select condition");

        const row = { ...currentItem, refundAmount: Math.max(0, refundPreview) };

        if (editingIndex >= 0) {
            setItems(p => p.map((it, i) => i === editingIndex ? row : it));
            setEditingIndex(-1);
        } else {
            setItems(p => [...p, row]);
        }
        setCurrentItem(blankItem());
    };

    const handleEditItem = (i) => { setCurrentItem(items[i]); setEditingIndex(i); };
    const cancelEdit     = () => { setCurrentItem(blankItem()); setEditingIndex(-1); };
    const removeItem     = (i) => {
        setItems(p => p.filter((_, idx) => idx !== i));
        if (editingIndex === i) cancelEdit();
    };

    const handleSubmit = async () => {
        if (!form.returnReason) return showError("Select return reason");
        if (!items.length)      return showError("Add at least one item");
        if (!purchase)          return showError("Search and select a purchase first");

        const payload = {
            returnType:   form.returnType,
            returnDate:   form.returnDate,
            returnReason: form.returnReason,
            invoice:      purchase._id,
            supplier:     purchase.supplier?._id ?? purchase.supplier,
            items,
        };

        try {
            if (isUpdate) {
                await updateReturn({ id: returnId, ...payload }).unwrap();
                showSuccess(t("Return updated!", "واپسی اپڈیٹ ہو گئی۔"));
            } else {
                await createReturn(payload).unwrap();
                showSuccess(t("Return created!", "واپسی محفوظ ہو گئی۔"));
                setForm(emptyForm());
                setItems([]);
                setSearchInput("");
                setInvoiceQuery("");
            }
            onSuccess?.();
            onClose();
        } catch (e) {
            showError(e?.data?.message ?? t("Operation failed.", "ناکام۔"));
        }
    };

    if (isUpdate && isFetching && !existingReturn) return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded-2xl p-8 text-sm" style={{ background: "var(--surface)", color: "var(--muted)" }}>
                Loading…
            </div>
        </div>
    );

    // ─── render ────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-3 overflow-y-auto"
            onClick={onClose}>
            <div className="relative w-full max-w-3xl my-4 rounded-3xl shadow-2xl overflow-hidden"
                style={{ background: "var(--app-bg)", border: "1px solid var(--border)" }}
                onClick={e => e.stopPropagation()}>

                {/* ── header ─────────────────────────────── */}
                <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-30"
                    style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "var(--accent-2)" }}>
                            <RotateCcw className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold leading-tight" style={{ color: "var(--ink)" }}>
                                {isUpdate ? t("Update Return", "واپسی اپڈیٹ") : t("New Return", "نئی واپسی")}
                            </h2>
                            <p className="text-xs" style={{ color: "var(--muted)" }}>
                                {t("Purchase return management", "خریداری واپسی")}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-xl transition"
                        style={{ background: "var(--surface-muted)", color: "var(--muted)" }}>
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* ── body ────────────────────────────────── */}
                <div className="p-5 space-y-5">

                    {/* Step 1 — search purchase ──────────── */}
                    <Card>
                        <Step n="1" label="Search Purchase Invoice" />
                        <div className="flex gap-2">
                            <Inp
                                placeholder="Invoice number e.g. INV-SUPPLIER-..."
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleSearch()}
                            />
                            <Btn variant="primary" size="md" className="shrink-0"
                                onClick={handleSearch} disabled={isSearching || !searchInput.trim()}>
                                <Search className="w-4 h-4" />
                                {isSearching ? "…" : "Search"}
                            </Btn>
                        </div>

                        {searchError && invoiceQuery && (
                            <p className="mt-2 text-xs font-medium"
                                style={{ color: "var(--accent)" }}>
                                No purchase found for "{invoiceQuery}"
                            </p>
                        )}

                        {/* purchase preview */}
                        {purchase && (
                            <div className="mt-4 rounded-2xl p-4 space-y-3"
                                style={{ background: "rgba(15,118,110,0.05)", border: "1px solid rgba(15,118,110,0.2)" }}>
                                <p className="text-xs font-semibold uppercase tracking-wider"
                                    style={{ color: "var(--accent-2)" }}>
                                    ✓ Purchase found
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                    {[
                                        ["Invoice",  purchase.invoiceNumber],
                                        ["Supplier", purchase.supplier?.name ?? "—"],
                                        ["Date",     new Date(purchase.date).toLocaleDateString()],
                                        ["Total",    `Rs. ${purchase.totalAmount?.toLocaleString()}`],
                                    ].map(([k, v]) => (
                                        <div key={k}>
                                            <span className="text-xs block mb-0.5" style={{ color: "var(--muted)" }}>{k}</span>
                                            <span className="font-medium" style={{ color: "var(--ink)" }}>{v}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-1 mt-1">
                                    {purchase.items?.map((it, i) => (
                                        <div key={i} className="flex justify-between text-xs px-3 py-2 rounded-xl"
                                            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                            <span className="font-medium" style={{ color: "var(--ink)" }}>
                                                {it.product?.name}
                                            </span>
                                            <span style={{ color: "var(--muted)" }}>
                                                Qty: {it.quantity} &nbsp;·&nbsp; Rs. {it.price} &nbsp;·&nbsp;
                                                Batch: {it.batch?.batchNumber ?? it.batchNumber ?? "—"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Step 2 — return details ───────────── */}
                    {purchase && (
                        <Card>
                            <Step n="2" label="Return Details" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field>
                                    <Label>Return Date *</Label>
                                    <Inp type="date" value={form.returnDate}
                                        onChange={e => update("returnDate", e.target.value)} />
                                </Field>
                                <Field>
                                    <Label>Return Reason *</Label>
                                    <SSelect
                                        options={RETURN_REASONS}
                                        value={form.returnReason}
                                        onChange={v => update("returnReason", v)}
                                        placeholder="Select reason…"
                                        zIndex={70}
                                    />
                                </Field>
                            </div>
                        </Card>
                    )}

                    {/* Step 3 — item selection ───────────── */}
                    {purchase && form.returnReason && (
                        <Card>
                            <Step n="3" label={editingIndex >= 0 ? `Editing item #${editingIndex + 1}` : "Select Item to Return"} />

                            <Field className="mb-4">
                                <Label>Item from Purchase *</Label>
                                <SSelect
                                    options={purchaseItemOptions}
                                    value={currentItem.invoiceItem}
                                    onChange={handleSelectItem}
                                    placeholder="Select item…"
                                    zIndex={70}
                                />
                            </Field>

                            {currentItem.product && (
                                <>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                                        <Field>
                                            <Label>Return Qty * {currentItem.originalQty ? `(max ${currentItem.originalQty})` : ""}</Label>
                                            <Inp type="number" min={1} max={currentItem.originalQty || undefined}
                                                value={currentItem.returnQuantity}
                                                onChange={e => updateCurrent("returnQuantity", e.target.value)}
                                                placeholder="0" />
                                        </Field>
                                        <Field>
                                            <Label>Condition *</Label>
                                            <SSelect options={CONDITIONS} value={currentItem.condition}
                                                onChange={v => updateCurrent("condition", v)}
                                                placeholder="Select…" zIndex={70} />
                                        </Field>
                                        <Field>
                                            <Label>Cut (Rs.)</Label>
                                            <Inp type="number" min={0} value={currentItem.cut}
                                                onChange={e => updateCurrent("cut", e.target.value)}
                                                placeholder="0.00" />
                                        </Field>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <Field>
                                            <Label>Notes</Label>
                                            <Txt rows={2} value={currentItem.notes}
                                                onChange={e => updateCurrent("notes", e.target.value)}
                                                placeholder="Optional…" />
                                        </Field>

                                        {/* item preview */}
                                        <div className="rounded-2xl p-3 space-y-1.5 text-sm"
                                            style={{ background: "var(--surface-muted)", border: "1px solid var(--border)" }}>
                                            <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Preview</p>
                                            {[
                                                ["Product",      currentItem.productName],
                                                ["Batch",        currentItem.batch || "—"],
                                                ["Original Qty", currentItem.originalQty],
                                                ["Rate",         `Rs. ${currentItem.costPrice}`],
                                            ].map(([k, v]) => (
                                                <div key={k} className="flex justify-between">
                                                    <span className="text-xs" style={{ color: "var(--muted)" }}>{k}</span>
                                                    <span className="font-medium text-xs" style={{ color: "var(--ink)" }}>{v}</span>
                                                </div>
                                            ))}
                                            {currentItem.returnQuantity && currentItem.costPrice && (
                                                <div className="flex justify-between pt-1.5 mt-1"
                                                    style={{ borderTop: "1px solid var(--border)" }}>
                                                    <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Refund</span>
                                                    <span className="font-bold text-xs" style={{ color: "var(--accent-2)" }}>
                                                        Rs. {Math.max(0, refundPreview).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 justify-end">
                                        {editingIndex >= 0 && (
                                            <Btn variant="secondary" size="sm" onClick={cancelEdit}>Cancel Edit</Btn>
                                        )}
                                        <Btn variant="primary" size="sm" onClick={handleAddItem}
                                            disabled={!currentItem.product || !currentItem.returnQuantity || !currentItem.condition}>
                                            {editingIndex >= 0
                                                ? <><CheckCircle className="w-3.5 h-3.5" /> Update Item</>
                                                : <><Plus className="w-3.5 h-3.5" /> Confirm Item</>
                                            }
                                        </Btn>
                                    </div>
                                </>
                            )}
                        </Card>
                    )}

                    {/* confirmed items list ──────────────── */}
                    {items.length > 0 && (
                        <Card title={`Confirmed Items (${items.length})`}>
                            <div className="space-y-2">
                                {items.map((item, i) => (
                                    <div key={i}
                                        className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl transition"
                                        style={{
                                            border: editingIndex === i
                                                ? "1.5px solid var(--accent-2)"
                                                : "1px solid var(--border)",
                                            background: editingIndex === i
                                                ? "rgba(15,118,110,0.04)"
                                                : "var(--surface)",
                                        }}>
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                            <span className="text-sm font-semibold truncate" style={{ color: "var(--ink)" }}>
                                                {item.productName || item.product}
                                            </span>
                                            <span className="text-xs" style={{ color: "var(--muted)" }}>
                                                Qty: {item.returnQuantity} &nbsp;·&nbsp; {item.condition}
                                                {Number(item.cut) > 0 ? ` · Cut: Rs.${item.cut}` : ""}
                                                &nbsp;·&nbsp; Refund: Rs.{item.refundAmount?.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button onClick={() => handleEditItem(i)}
                                                className="p-1.5 rounded-lg transition"
                                                style={{ color: "var(--muted)" }}
                                                onMouseEnter={e => { e.currentTarget.style.color = "var(--accent-2)"; e.currentTarget.style.background = "rgba(15,118,110,0.08)"; }}
                                                onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}>
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => removeItem(i)}
                                                className="p-1.5 rounded-lg transition"
                                                style={{ color: "var(--muted)" }}
                                                onMouseEnter={e => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.background = "rgba(220,38,38,0.08)"; }}
                                                onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* totals row */}
                                <div className="flex justify-between items-center pt-3 mt-1"
                                    style={{ borderTop: "1px solid var(--border)" }}>
                                    <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                                        Total Refund
                                    </span>
                                    <span className="text-base font-black" style={{ color: "var(--accent-2)" }}>
                                        Rs. {totalRefund.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* footer ────────────────────────────── */}
                    <div className="flex justify-end gap-3 pt-1"
                        style={{ borderTop: "1px solid var(--border)" }}>
                        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
                        <Btn variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting
                                ? (isUpdate ? "Updating…" : "Saving…")
                                : isUpdate
                                    ? t(`Update Return (${items.length})`, `اپڈیٹ (${items.length})`)
                                    : t(`Save Return (${items.length})`, `محفوظ کریں (${items.length})`)
                            }
                        </Btn>
                    </div>
                </div>
            </div>
        </div>
    );
}


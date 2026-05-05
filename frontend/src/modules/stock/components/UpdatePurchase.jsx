
import { showError, showSuccess } from "../../../utils/toastHelpers";
import { Plus, X, Package, FileText, DollarSign, Truck, Calendar, ChevronDown } from "lucide-react";
import { useEffect, useState, useMemo, useRef } from "react";
import { useAllSuppliers } from "../services/suppliers.service";
import { useAllPurchases, usePurchase, useUpdatePurchase } from "../services/purchases.service";
import { useProducts } from "../../../modules/productsModule/services/product.service";
import { useBatches } from "../services/batch.service";
import { useSelector } from "react-redux";
import { SearchableSelect } from "../../../components/common/FormFields";

// ── Helpers ──────────────────────────────────────────────────
const toInputDate = (v) => v ? new Date(v).toISOString().slice(0, 10) : "";
const sanitize = (v) => String(v || "").trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "").toUpperCase();
const makeBatch = (stamp, custom) => `BAT-${stamp}-${sanitize(custom || "GEN")}`;
const getStamp = (bn) => { const m = /^BAT-([^-]+)-/.exec(bn || ""); return m?.[1] || Date.now().toString(); };

const emptyItem = () => ({
    item: "", name: "", quantity: "", unit: "", perItemPrice: "",
    mfgDate: "", expiryDate: "", batchNumber: "", batchMode: "new",
    batchCustom: "", batchSelection: "",
    discount: "", discountType: "percentage", tax: "", taxType: "percentage",
});

// ── Atoms ────────────────────────────────────────────────────
const Label = ({ children }) => <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{children}</label>;
const Field = ({ children }) => <div className="flex flex-col gap-0.5">{children}</div>;
const Inp = ({ className = "", ...p }) => <input {...p} className={`w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-300 ${className}`} />;
const Txt = ({ ...p }) => <textarea {...p} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-300 resize-none" />;
const Sel = ({ ...p }) => <select {...p} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500" />;

const Btn = ({ children, variant = "primary", size = "md", className = "", ...p }) => {
    const sz = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-sm" }[size];
    const vr = {
        primary: "bg-teal-600 hover:bg-teal-700 text-white",
        secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700",
        ghost: "hover:bg-slate-100 text-slate-600",
        danger: "bg-rose-50 hover:bg-rose-100 text-rose-600",
        active: "bg-teal-600 text-white",
        inactive: "bg-slate-100 text-slate-600 hover:bg-slate-200",
    }[variant];
    return <button {...p} className={`inline-flex items-center justify-center gap-1.5 font-semibold rounded-xl transition active:scale-95 disabled:opacity-50 ${sz} ${vr} ${className}`}>{children}</button>;
};

const SSelect = ({ options = [], value, onChange, placeholder = "Select..." }) => {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const ref = useRef();
    const selected = options.find(o => o.value === value);
    const filtered = options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()));

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    return (
        <div ref={ref} className="relative w-full">
            <button type="button" onClick={() => setOpen(p => !p)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl hover:border-teal-400 transition text-left">
                <span className={selected ? "text-slate-800" : "text-slate-300"}>{selected?.label || placeholder}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                        <input autoFocus type="text" placeholder="Search..." value={q} onChange={e => setQ(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filtered.length
                            ? filtered.map(o => (
                                <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); setQ(""); }}
                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-teal-50 transition ${value === o.value ? "bg-teal-50 text-teal-700 font-medium" : "text-slate-700"}`}>
                                    {o.label}
                                </div>
                            ))
                            : <div className="px-3 py-4 text-sm text-slate-400 text-center">No results</div>
                        }
                    </div>
                </div>
            )}
        </div>
    );
};

const Card = ({ title, icon: Icon, children }) => (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {title && (
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50">
                {Icon && <Icon className="w-4 h-4 text-teal-600" />}
                <span className="text-sm font-semibold text-slate-700">{title}</span>
            </div>
        )}
        <div className="p-5">{children}</div>
    </div>
);

// ── Main ─────────────────────────────────────────────────────
export default function UpdatePurchaseModal({ open, onClose, id }) {
    const lang = useSelector(s => s.auth.user?.language || "en");
    const t = (en, ur) => lang === "en" ? en : ur;

    const { data: purchaseData, isLoading: isFetching } = usePurchase(id, { skip: !id });
    const [updatePurchase, { isLoading: isSubmitting }] = useUpdatePurchase();

    const { data: suppliersRaw } = useAllSuppliers();
    const { data: productsRaw } = useProducts();
    const { data: purchasesRaw } = useAllPurchases();

    const suppliers = suppliersRaw?.data || suppliersRaw || [];
    const products = productsRaw?.data || productsRaw || [];
    const allBills = purchasesRaw?.data || purchasesRaw || [];

    const [bill, setBill] = useState({
        supplier: "", purchaseDate: new Date().toISOString().slice(0, 10),
        invoiceNumber: "", notes: "", discount: 0, discountType: "percentage",
        gst: 0, shippingCost: 0,
    });
    const [items, setItems] = useState([]);
    const [form, setForm] = useState(emptyItem());
    const [editIdx, setEditIdx] = useState(null);
    const [stamp, setStamp] = useState(() => Date.now().toString());

    const { data: batchesRaw = [] } = useBatches(form.item, { skip: !form.item });
    const batches = Array.isArray(batchesRaw) ? batchesRaw : [];

    // ── Prefill on load ──────────────────────────────────────
    useEffect(() => {
        if (!purchaseData) return;

        setBill({
            supplier: purchaseData.supplier?._id || purchaseData.supplier || "",
            purchaseDate: purchaseData.date ? new Date(purchaseData.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            invoiceNumber: purchaseData.invoiceNumber || "",
            notes: purchaseData.notes || "",
            discount: purchaseData.discount ?? 0,
            discountType: purchaseData.discountType || "percentage",
            gst: purchaseData.gst ?? 0,
            shippingCost: purchaseData.shippingCost ?? 0,
        });

        setItems((purchaseData.items || []).map(it => ({
            item: it.product?._id || it.product || "",
            name: it.product?.name || "",
            quantity: it.quantity ?? 0,
            unit: it.unit || "",
            pricePerUnit: it.price ?? 0,
            totalPurchasePrice: (it.quantity ?? 0) * (it.price ?? 0),
            mfgDate: toInputDate(it.mfgDate),
            expiryDate: toInputDate(it.expiryDate),
            batchNumber: it.batchNumber || "",
            batchMode: it.batchId ? "existing" : "new",
            batchCustom: "",
            batchSelection: it.batchId || "",
            batchId: it.batchId || "",
            discount: it.discount ?? 0,
            discountType: it.discountType || "percentage",
            tax: it.tax ?? 0,
            taxType: it.taxType || "percentage",
        })));
    }, [purchaseData]);

    // ── Batch number auto-build ──────────────────────────────
    useEffect(() => {
        if (form.batchMode !== "new") return;
        const bn = makeBatch(stamp, form.batchCustom);
        setForm(p => p.batchNumber === bn ? p : { ...p, batchNumber: bn, batchSelection: "" });
    }, [form.batchMode, form.batchCustom, stamp]);

    // ── Existing batch autofill ──────────────────────────────
    useEffect(() => {
        if (form.batchMode !== "existing" || !form.batchSelection) return;
        const b = batches.find(b => b._id === form.batchSelection);
        if (!b) return;
        setForm(p => ({
            ...p,
            batchNumber: b.batchNumber || p.batchNumber,
            perItemPrice: b.purchasePrice != null ? String(b.purchasePrice) : p.perItemPrice,
            mfgDate: toInputDate(b.mfgDate),
            expiryDate: toInputDate(b.expiryDate),
        }));
    }, [form.batchSelection, form.batchMode]);

    // ── Calculations ─────────────────────────────────────────
    const calc = useMemo(() => {
        const subtotal = items.reduce((s, it) => s + (Number(it.totalPurchasePrice) || 0), 0);
        const discount = bill.discountType === "percentage" ? (subtotal * Number(bill.discount || 0)) / 100 : Number(bill.discount || 0);
        const afterDiscount = subtotal - discount;
        const gst = (afterDiscount * Number(bill.gst || 0)) / 100;
        const shipping = Number(bill.shippingCost || 0);
        return { subtotal, discount, gst, shipping, total: afterDiscount + gst + shipping };
    }, [items, bill]);

    // ── Add / Update item ────────────────────────────────────
    const handleAddItem = () => {
        if (!bill.supplier) return showError("Select supplier first");
        if (!form.item) return showError("Select a product");
        if (!form.quantity || Number(form.quantity) <= 0) return showError("Enter valid quantity");
        if (form.perItemPrice === "" || Number(form.perItemPrice) < 0) return showError("Enter valid price");
        if (form.batchMode === "existing" && !form.batchSelection) return showError("Select an existing batch");

        const prod = products.find(p => p._id === form.item);
        const total = Number(form.quantity) * Number(form.perItemPrice);
        const batchNo = form.batchMode === "new" ? makeBatch(stamp, form.batchCustom) : form.batchNumber?.trim();
        if (!batchNo) return showError("Batch number required");

        const row = {
            item: form.item, name: prod?.name || "Unknown",
            quantity: Number(form.quantity), unit: form.unit,
            pricePerUnit: Number(form.perItemPrice), totalPurchasePrice: total,
            mfgDate: form.mfgDate, expiryDate: form.expiryDate,
            batchNumber: batchNo, batchMode: form.batchMode,
            batchCustom: form.batchCustom, batchSelection: form.batchSelection,
            batchId: form.batchMode === "existing" ? form.batchSelection : "",
            discount: Number(form.discount) || 0, discountType: form.discountType,
            tax: Number(form.tax) || 0, taxType: form.taxType,
        };

        if (editIdx !== null) {
            setItems(p => p.map((it, i) => i === editIdx ? row : it));
            setEditIdx(null);
        } else {
            setItems(p => [...p, row]);
        }

        setForm(emptyItem());
        setStamp(Date.now().toString());
    };

    const handleEdit = (it, idx) => {
        setStamp(getStamp(it.batchNumber));
        setForm({
            item: it.item, name: it.name, quantity: it.quantity, unit: it.unit,
            perItemPrice: it.pricePerUnit, mfgDate: it.mfgDate, expiryDate: it.expiryDate,
            batchNumber: it.batchNumber, batchMode: it.batchMode || (it.batchId ? "existing" : "new"),
            batchCustom: it.batchCustom || "", batchSelection: it.batchId || "",
            discount: it.discount, discountType: it.discountType,
            tax: it.tax, taxType: it.taxType,
        });
        setEditIdx(idx);
    };

    // ── Submit ───────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!bill.supplier) return showError("Select supplier");
        if (!items.length) return showError("Add at least one item");

        const payload = {
            supplier: bill.supplier,
            date: bill.purchaseDate,
            invoiceNumber: bill.invoiceNumber,
            subtotal: calc.subtotal,
            discount: Number(bill.discount),
            discountType: bill.discountType,
            gst: Number(bill.gst),
            shippingCost: Number(bill.shippingCost),
            totalAmount: calc.total,
            notes: bill.notes || "",
            items: items.map(it => ({
                product: it.item,
                batchNumber: it.batchNumber,
                quantity: it.quantity,
                price: it.pricePerUnit,
                discount: it.discount,
                discountType: it.discountType,
                tax: it.tax,
                taxType: it.taxType,
                mfgDate: it.mfgDate ? new Date(it.mfgDate).toISOString() : undefined,
                expiryDate: it.expiryDate ? new Date(it.expiryDate).toISOString() : undefined,
            })),
        };

        try {
            await updatePurchase({ id, ...payload }).unwrap();
            showSuccess(t("Purchase updated!", "خرید اپڈیٹ ہو گئی۔"));
            onClose();
        } catch (e) {
            showError(e?.data?.message || t("Update failed.", "اپڈیٹ ناکام۔"));
        }
    };

    if (isFetching && !purchaseData) return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl p-8 text-slate-500 text-sm">Loading...</div>
        </div>
    );

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
            <div className="relative w-full max-w-5xl my-4 bg-slate-50 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
                            <Package className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-800">{t("Update Purchase", "خرید اپڈیٹ کریں")}</h2>
                            <p className="text-xs text-slate-400">{t("Edit purchase details", "خریداری تفصیلات")}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-4 flex gap-4">
                    {/* Left */}
                    <div className="flex-1 space-y-4">

                        {/* Supplier + Invoice */}
                        <Card title={t("Supplier", "سپلائر")} icon={Package}>
                            <div className="grid grid-cols-2 gap-3">
                                <Field>
                                    <Label>{t("Supplier", "سپلائر")} *</Label>
                                    <SearchableSelect
                                        options={suppliers.map(s => ({ label: s.name, value: s._id }))}
                                        value={bill.supplier}
                                        onChange={val => setBill(p => ({ ...p, supplier: val }))}
                                        placeholder="Select supplier..."
                                    />
                                </Field>
                                <Field>
                                    <Label>{t("Invoice No", "انوائس")}</Label>
                                    <Inp value={bill.invoiceNumber} readOnly className="bg-slate-50 cursor-not-allowed text-slate-400" />
                                </Field>
                            </div>
                        </Card>

                        {/* Add Item */}
                        {bill.supplier && (
                            <Card title={editIdx !== null ? t("Edit Item", "آئٹم ایڈٹ کریں") : t("Add Item", "آئٹم شامل کریں")} icon={Plus}>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field>
                                            <Label>{t("Product", "پروڈکٹ")} *</Label>
                                            <SSelect
                                                options={products.map(p => ({ label: p.name, value: p._id }))}
                                                value={form.item}
                                                onChange={val => {
                                                    const p = products.find(p => p._id === val);
                                                    if (p) { setStamp(Date.now().toString()); setForm({ ...emptyItem(), item: p._id, name: p.name, unit: p.unit || "unit" }); }
                                                }}
                                                placeholder="Search product..."
                                            />
                                        </Field>
                                        <Field>
                                            <Label>Batch Mode</Label>
                                            <div className="flex gap-2">
                                                <Btn variant={form.batchMode === "new" ? "active" : "inactive"} size="sm" className="flex-1"
                                                    onClick={() => { setStamp(Date.now().toString()); setForm(p => ({ ...p, batchMode: "new", batchSelection: "", batchCustom: "" })); }}>
                                                    New
                                                </Btn>
                                                <Btn variant={form.batchMode === "existing" ? "active" : "inactive"} size="sm" className="flex-1"
                                                    disabled={!form.item || batches.length === 0}
                                                    onClick={() => setForm(p => ({ ...p, batchMode: "existing" }))}>
                                                    Existing
                                                </Btn>
                                            </div>
                                            {form.batchMode === "existing" && (
                                                <Sel className="mt-2" value={form.batchSelection}
                                                    onChange={e => setForm(p => ({ ...p, batchSelection: e.target.value }))}>
                                                    <option value="">Select batch</option>
                                                    {batches.map(b => <option key={b._id} value={b._id}>{b.batchNumber} (Qty: {b.quantity})</option>)}
                                                </Sel>
                                            )}
                                        </Field>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Field>
                                            <Label>Batch No</Label>
                                            <Inp value={form.batchNumber} readOnly className="bg-slate-50 text-slate-400 text-xs cursor-not-allowed" />
                                            {form.batchMode === "new" && (
                                                <Inp className="mt-1" placeholder="Custom suffix..." value={form.batchCustom}
                                                    onChange={e => setForm(p => ({ ...p, batchCustom: e.target.value }))} />
                                            )}
                                        </Field>
                                        <Field>
                                            <Label>{t("Quantity", "مقدار")} *</Label>
                                            <div className="flex gap-2 items-center">
                                                <Inp type="number" placeholder="0" value={form.quantity}
                                                    onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} />
                                                <span className="shrink-0 px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded-xl">{form.unit || "unit"}</span>
                                            </div>
                                        </Field>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <Field>
                                            <Label>Price *</Label>
                                            <Inp type="number" placeholder="0.00" value={form.perItemPrice}
                                                onChange={e => setForm(p => ({ ...p, perItemPrice: e.target.value }))} />
                                        </Field>
                                        <Field>
                                            <Label>Discount</Label>
                                            <Inp type="number" placeholder="0" value={form.discount}
                                                onChange={e => setForm(p => ({ ...p, discount: e.target.value }))} />
                                        </Field>
                                        <Field>
                                            <Label>Disc. Type</Label>
                                            <Sel value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}>
                                                <option value="percentage">%</option>
                                                <option value="fixed">Fixed</option>
                                            </Sel>
                                        </Field>
                                        <Field>
                                            <Label>GST (%)</Label>
                                            <Inp type="number" placeholder="0" value={form.tax}
                                                onChange={e => setForm(p => ({ ...p, tax: e.target.value }))} />
                                        </Field>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Field>
                                            <Label>Mfg Date</Label>
                                            <Inp type="date" value={form.mfgDate} onChange={e => setForm(p => ({ ...p, mfgDate: e.target.value }))} />
                                        </Field>
                                        <Field>
                                            <Label>Expiry Date</Label>
                                            <Inp type="date" value={form.expiryDate} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))} />
                                        </Field>
                                    </div>

                                    <Btn variant="primary" className="w-full" onClick={handleAddItem}>
                                        <Plus className="w-4 h-4" />
                                        {editIdx !== null ? t("Update Item", "آئٹم اپڈیٹ کریں") : t("Add Item", "آئٹم شامل کریں")}
                                    </Btn>
                                </div>
                            </Card>
                        )}

                        {/* Items Table */}
                        {items.length > 0 && (
                            <Card title={`${t("Items", "آئٹمز")} (${items.length})`} icon={FileText}>
                                <div className="overflow-x-auto -mx-5 -mb-5">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-y border-slate-200 text-xs text-slate-500">
                                            <tr>
                                                <th className="text-left px-5 py-3 font-semibold">Item</th>
                                                <th className="text-left px-3 py-3 font-semibold">Batch</th>
                                                <th className="text-right px-3 py-3 font-semibold">Qty</th>
                                                <th className="text-right px-3 py-3 font-semibold">Price</th>
                                                <th className="text-right px-3 py-3 font-semibold">Total</th>
                                                <th className="text-center px-3 py-3 font-semibold">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {items.map((it, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50">
                                                    <td className="px-5 py-3 font-medium text-slate-800">{it.name}</td>
                                                    <td className="px-3 py-3 text-xs text-slate-400 font-mono">{it.batchNumber}</td>
                                                    <td className="px-3 py-3 text-right">{it.quantity} <span className="text-xs text-slate-400">{it.unit}</span></td>
                                                    <td className="px-3 py-3 text-right">{Number(it.pricePerUnit).toFixed(2)}</td>
                                                    <td className="px-3 py-3 text-right font-semibold">{Number(it.totalPurchasePrice).toFixed(2)}</td>
                                                    <td className="px-3 py-3">
                                                        <div className="flex justify-center gap-1">
                                                            <Btn variant="ghost" size="sm" onClick={() => handleEdit(it, idx)}>Edit</Btn>
                                                            <Btn variant="danger" size="sm" onClick={() => setItems(p => p.filter((_, i) => i !== idx))}>Remove</Btn>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Right */}
                    <div className="w-72 space-y-4 shrink-0">
                        <Card title={t("Bill Details", "بل تفصیل")} icon={FileText}>
                            <div className="space-y-3">
                                <Field>
                                    <Label><Calendar className="inline w-3 h-3 mr-1" />Date</Label>
                                    <Inp type="date" value={bill.purchaseDate} onChange={e => setBill(p => ({ ...p, purchaseDate: e.target.value }))} />
                                </Field>
                                <Field>
                                    <Label>Discount</Label>
                                    <div className="flex gap-2">
                                        <Inp type="number" value={bill.discount} placeholder="0" onChange={e => setBill(p => ({ ...p, discount: e.target.value }))} />
                                        <Sel className="w-20 shrink-0" value={bill.discountType} onChange={e => setBill(p => ({ ...p, discountType: e.target.value }))}>
                                            <option value="percentage">%</option>
                                            <option value="fixed">Fixed</option>
                                        </Sel>
                                    </div>
                                </Field>
                                <Field>
                                    <Label>GST (%)</Label>
                                    <Inp type="number" value={bill.gst} placeholder="0" onChange={e => setBill(p => ({ ...p, gst: e.target.value }))} />
                                </Field>
                                <Field>
                                    <Label><Truck className="inline w-3 h-3 mr-1" />Shipping</Label>
                                    <Inp type="number" value={bill.shippingCost} placeholder="0" onChange={e => setBill(p => ({ ...p, shippingCost: e.target.value }))} />
                                </Field>
                                <Field>
                                    <Label>Notes</Label>
                                    <Txt rows={3} value={bill.notes} placeholder="..." onChange={e => setBill(p => ({ ...p, notes: e.target.value }))} />
                                </Field>
                            </div>
                        </Card>

                        <Card title={t("Summary", "خلاصہ")} icon={DollarSign}>
                            <div className="space-y-2 text-sm">
                                {[
                                    ["Subtotal", calc.subtotal.toFixed(2), ""],
                                    ["Discount", calc.discount.toFixed(2), "text-rose-500"],
                                    ["GST", calc.gst.toFixed(2), "text-teal-600"],
                                    ["Shipping", calc.shipping.toFixed(2), ""],
                                ].map(([label, val, cls]) => (
                                    <div key={label} className="flex justify-between text-slate-600">
                                        <span>{label}</span><span className={`font-medium tabular-nums ${cls}`}>{val}</span>
                                    </div>
                                ))}
                                <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                                    <span className="font-bold text-slate-800">Total</span>
                                    <span className="text-lg font-bold text-teal-700">Rs {calc.total.toFixed(2)}</span>
                                </div>
                            </div>
                            <Btn variant="primary" className="w-full mt-4" onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? "Updating..." : t("Update Bill →", "اپڈیٹ کریں →")}
                            </Btn>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
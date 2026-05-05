// AddPurchaseModal.jsx
import { showError, showSuccess } from "../../../utils/toastHelpers";
import { Plus, Upload, Download, TrendingUp, Package, Calendar, FileText, DollarSign, Truck, File, X, ChevronDown } from "lucide-react";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useAllSuppliers, useCreateSupplier } from "../services/suppliers.service";
import { useAllPurchases, useCreatePurchase } from "../services/purchases.service";
import { useProducts } from "../../../modules/productsModule/services/product.service";
import { useBatches } from "../services/batch.service";
import { useSelector } from "react-redux";
import { SearchableSelect } from "../../../components/common/FormFields";

// ─── Helpers ──────────────────────────────────────────────────
const sanitizeToken = (v) => String(v || "").trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "").toUpperCase();
const buildInvoiceNumber = (name, stamp) => `INV-${sanitizeToken(name || "SUPPLIER")}-${stamp}`;
const buildBatchNumber = (stamp, custom) => `BAT-${stamp}-${sanitizeToken(custom || "GEN")}`;
const getBatchStamp = (bn) => { const m = /^BAT-([^-]+)-/.exec(bn || ""); return m?.[1] || Date.now().toString(); };
const toInputDate = (v) => v ? new Date(v).toISOString().slice(0, 10) : "";
const EMPTY = [];

const createInitialItem = () => ({
    item: "", name: "", quantity: "", unit: "", perItemPrice: "",
    notes: "", mfgDate: "", expiryDate: "", batchNumber: "",
    batchSelection: "", batchMode: "new", batchCustom: "",
    discount: "", discountType: "percentage", tax: "", taxType: "percentage",
});

// ─── Mini UI Atoms ─────────────────────────────────────────────
const Label = ({ children }) => (
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{children}</label>
);

const Field = ({ children }) => <div className="flex flex-col">{children}</div>;

const Inp = ({ className = "", ...p }) => (
    <input {...p} className={`w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition placeholder-slate-300 ${className}`} />
);

const Txt = ({ className = "", ...p }) => (
    <textarea {...p} className={`w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition placeholder-slate-300 resize-none ${className}`} />
);

const Btn = ({ children, variant = "primary", size = "md", className = "", ...p }) => {
    const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
    const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-sm" };
    const variants = {
        primary: "bg-teal-600 hover:bg-teal-700 text-white shadow-sm",
        secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700",
        ghost: "bg-transparent hover:bg-slate-100 text-slate-600",
        danger: "bg-rose-50 hover:bg-rose-100 text-rose-600",
        active: "bg-teal-600 text-white shadow-sm",
        inactive: "bg-slate-100 text-slate-600 hover:bg-slate-200",
    };
    return <button {...p} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>{children}</button>;
};

// ─── Searchable Select ─────────────────────────────────────────
const SSelect = ({ options = [], value, onChange, placeholder = "Chunein..." }) => {
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
                        {filtered.length ? filtered.map(o => (
                            <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); setQ(""); }}
                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-teal-50 hover:text-teal-700 transition ${value === o.value ? "bg-teal-50 text-teal-700 font-medium" : "text-slate-700"}`}>
                                {o.label}
                            </div>
                        )) : <div className="px-3 py-4 text-sm text-slate-400 text-center">Koi result nahi</div>}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Section Card ──────────────────────────────────────────────
const Card = ({ title, icon: Icon, children, className = "" }) => (
    <div className={`bg-white border border-slate-200 rounded-2xl overflow-hidden ${className}`}>
        {title && (
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                {Icon && <Icon className="w-4 h-4 text-teal-600" />}
                <span className="text-sm font-semibold text-slate-700">{title}</span>
            </div>
        )}
        <div className="p-5">{children}</div>
    </div>
);

// ─── Main Modal ────────────────────────────────────────────────
export default function AddPurchaseModal({ open, onClose }) {
    const language = useSelector(s => s.auth.user?.language || "en");
    const t = (en, ur) => language === "en" ? en : ur;

    const [editingIndex, setEditingIndex] = useState(null);
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [supplierFormOpen, setSupplierFormOpen] = useState(false);
    const [batchStamp, setBatchStamp] = useState(() => Date.now().toString());
    const [addedItems, setAddedItems] = useState([]);
    const [itemForm, setItemForm] = useState(createInitialItem());

    const [billData, setBillData] = useState({
        supplier: "", purchaseDate: new Date().toISOString().slice(0, 10),
        notes: "", discount: 0, discountType: "percentage",
        gst: 0, shippingCost: 0, paymentMethod: "cash", invoiceNumber: "",
    });

    const { data: suppliersData } = useAllSuppliers();
    const { data: productsData } = useProducts();
    const { data: purchasesData } = useAllPurchases();
    const [createPurchase, { isLoading: isSubmitting }] = useCreatePurchase();
    const { data: batchesData = [] } = useBatches(itemForm.item, { skip: !itemForm.item });

    const suppliersList = suppliersData?.data || suppliersData || [];
    const productsList = productsData?.data || productsData || [];
    const previousBills = purchasesData?.data || purchasesData || EMPTY;
    const availableBatches = Array.isArray(batchesData) ? batchesData : [];
    const selectedBatch = availableBatches.find(b => b._id === itemForm.batchSelection);
    const isExistingMode = itemForm.batchMode === "existing" && Boolean(itemForm.batchSelection);
    const selectedSupplierName = suppliersList.find(s => s._id === billData.supplier)?.name || "";

    // ── Effects ───────────────────────────────────────────────
    useEffect(() => {
        if (!billData.supplier) { setBillData(p => p.invoiceNumber ? { ...p, invoiceNumber: "" } : p); return; }
        const inv = buildInvoiceNumber(selectedSupplierName, Date.now().toString());
        setBillData(p => p.invoiceNumber === inv ? p : { ...p, invoiceNumber: inv });
    }, [billData.supplier, selectedSupplierName]);

    const getPriceHistory = useCallback((itemId, supplierId) => {
        if (!previousBills) return [];
        return previousBills
            .filter(b => (b.supplier?._id || b.supplier) === supplierId)
            .flatMap(b => b.items?.filter(it => (it.product?._id || it.product) === itemId)
                .map(it => ({ date: b.date, price: it.price || it.pricePerUnit || it.totalPurchasePrice / it.quantity })) || [])
            .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    }, [previousBills]);

    useEffect(() => {
        if (!itemForm.item) return;
        const sel = productsList.find(i => i._id === itemForm.item);
        if (!sel) return;
        const hist = getPriceHistory(itemForm.item, billData.supplier);
        setItemForm(prev => {
            const unit = sel.unit || "unit";
            const price = hist.length && !prev.perItemPrice && prev.batchMode === "new"
                ? (hist.reduce((s, h) => s + h.price, 0) / hist.length).toFixed(2)
                : prev.perItemPrice;
            return (prev.unit === unit && prev.perItemPrice === price) ? prev : { ...prev, unit, perItemPrice: price };
        });
    }, [itemForm.item, productsList, billData.supplier, getPriceHistory]);

    useEffect(() => {
        if (!selectedBatch || !isExistingMode) return;
        const price = selectedBatch.purchasePrice != null ? String(selectedBatch.purchasePrice) : null;
        const mfg = toInputDate(selectedBatch.mfgDate);
        const exp = toInputDate(selectedBatch.expiryDate);
        setItemForm(prev => {
            const p = price ?? prev.perItemPrice;
            if (prev.batchNumber === selectedBatch.batchNumber && prev.perItemPrice === p && prev.mfgDate === mfg && prev.expiryDate === exp) return prev;
            return { ...prev, batchNumber: selectedBatch.batchNumber || prev.batchNumber, perItemPrice: p, mfgDate: mfg, expiryDate: exp };
        });
    }, [selectedBatch, isExistingMode]);

    useEffect(() => {
        if (itemForm.batchMode !== "new") return;
        const bn = buildBatchNumber(batchStamp, itemForm.batchCustom);
        setItemForm(prev => prev.batchNumber === bn && prev.batchSelection === "" ? prev : { ...prev, batchNumber: bn, batchSelection: "" });
    }, [itemForm.batchMode, itemForm.batchCustom, batchStamp]);

    // ── Calculations ──────────────────────────────────────────
    const calc = useMemo(() => {
        const subtotal = addedItems.reduce((s, it) => s + (Number(it.totalPurchasePrice) || 0), 0);
        const discount = billData.discountType === "percentage" ? (subtotal * Number(billData.discount || 0)) / 100 : Number(billData.discount || 0);
        const afterDiscount = subtotal - discount;
        const gst = (afterDiscount * Number(billData.gst || 0)) / 100;
        const shipping = Number(billData.shippingCost || 0);
        return { subtotal, discount, gst, shipping, total: afterDiscount + gst + shipping };
    }, [addedItems, billData]);

    const frequentItems = useMemo(() => {
        if (!billData.supplier || !previousBills) return [];
        const freq = {};
        previousBills.filter(b => (b.supplier?._id || b.supplier) === billData.supplier)
            .forEach(b => b.items?.forEach(it => {
                const id = it.product?._id || it.product;
                if (!freq[id]) freq[id] = { ...it, count: 0, prices: [] };
                freq[id].count++;
                freq[id].prices.push(it.price || it.pricePerUnit || it.totalPurchasePrice / it.quantity);
            }));
        return Object.values(freq).sort((a, b) => b.count - a.count).slice(0, 5)
            .map(f => ({ ...f, avgPrice: (f.prices.reduce((a, b) => a + b, 0) / f.prices.length).toFixed(2) }));
    }, [billData.supplier, previousBills]);

    const priceAlert = useMemo(() => {
        if (!itemForm.item || !itemForm.perItemPrice) return null;
        const hist = getPriceHistory(itemForm.item, billData.supplier);
        if (!hist.length) return null;
        const avg = hist.reduce((s, h) => s + h.price, 0) / hist.length;
        const variance = ((Number(itemForm.perItemPrice) - avg) / avg) * 100;
        return { variance: variance.toFixed(1), avgPrice: avg.toFixed(2), isHigher: variance > 10, isLower: variance < -10 };
    }, [itemForm.item, itemForm.perItemPrice, billData.supplier, getPriceHistory]);

    // ── Handlers ──────────────────────────────────────────────
    const handleBillChange = e => { const { name, value } = e.target; setBillData(p => ({ ...p, [name]: value })); };
    const handleItemChange = e => { const { name, value } = e.target; setItemForm(p => ({ ...p, [name]: value })); };

    const handleBatchSelect = (val) => {
        const batch = availableBatches.find(b => b._id === val);
        if (!batch) return;
        setItemForm(p => ({
            ...p, batchMode: "existing", batchCustom: "", batchSelection: val,
            batchNumber: batch.batchNumber || p.batchNumber,
            perItemPrice: batch.purchasePrice != null ? String(batch.purchasePrice) : p.perItemPrice,
            mfgDate: toInputDate(batch.mfgDate), expiryDate: toInputDate(batch.expiryDate),
        }));
    };

    const handleAddItem = (e) => {
        e?.preventDefault();
        if (!billData.supplier) return showError(t("Select supplier first.", "سپلائر منتخب کریں۔"));
        if (!itemForm.item) return showError(t("Select item.", "آئٹم منتخب کریں۔"));
        if (!itemForm.quantity || Number(itemForm.quantity) <= 0) return showError(t("Enter valid quantity.", "صحیح مقدار درج کریں۔"));
        if (itemForm.perItemPrice === "" || Number(itemForm.perItemPrice) < 0) return showError(t("Enter valid price.", "صحیح قیمت درج کریں۔"));
        if (itemForm.batchMode === "existing" && !itemForm.batchSelection) return showError(t("Select an existing batch.", "موجودہ بیچ منتخب کریں۔"));

        const selItem = productsList.find(i => i._id === itemForm.item);
        const total = Number(itemForm.quantity) * Number(itemForm.perItemPrice);
        const batchNo = itemForm.batchMode === "new" ? buildBatchNumber(batchStamp, itemForm.batchCustom) : itemForm.batchNumber?.trim();
        if (!batchNo) return showError(t("Batch number required.", "Batch number required."));

        const existIdx = addedItems.findIndex(it => it.item === itemForm.item && editingIndex === null && it.batchNumber === batchNo);
        if (existIdx !== -1 && window.confirm(t("Merge with existing item?", "موجودہ آئٹم کے ساتھ ملائیں؟"))) {
            setAddedItems(p => p.map((it, i) => i === existIdx ? { ...it, quantity: it.quantity + Number(itemForm.quantity), totalPurchasePrice: it.totalPurchasePrice + total } : it));
            setItemForm(createInitialItem()); setBatchStamp(Date.now().toString()); return;
        }

        const row = {
            item: itemForm.item, name: selItem?.name || "Unknown",
            quantity: Number(itemForm.quantity), unit: itemForm.unit,
            pricePerUnit: Number(itemForm.perItemPrice), totalPurchasePrice: total,
            notes: itemForm.notes || "", mfgDate: itemForm.mfgDate || "", expiryDate: itemForm.expiryDate || "",
            batchNumber: batchNo, batchMode: itemForm.batchMode, batchCustom: itemForm.batchCustom || "",
            batchSelection: itemForm.batchMode === "existing" ? itemForm.batchSelection : "",
            batchId: itemForm.batchMode === "existing" ? itemForm.batchSelection : "",
            discount: Number(itemForm.discount) || 0, discountType: itemForm.discountType,
            tax: Number(itemForm.tax) || 0, taxType: itemForm.taxType,
        };

        if (editingIndex !== null) { setAddedItems(p => p.map((it, i) => i === editingIndex ? row : it)); setEditingIndex(null); }
        else setAddedItems(p => [...p, row]);
        setItemForm(createInitialItem()); setBatchStamp(Date.now().toString());
    };

    const handleSubmit = async () => {
        if (!billData.supplier) return showError(t("Please select supplier.", "سپلائر منتخب کریں۔"));
        if (!addedItems.length) return showError(t("Add at least one item.", "کم از کم ایک آئٹم شامل کریں۔"));
        const payload = {
            supplier: billData.supplier, date: billData.purchaseDate,
            invoiceNumber: billData.invoiceNumber, subtotal: calc.subtotal,
            discount: Number(billData.discount), discountType: billData.discountType,
            gst: Number(billData.gst), shippingCost: Number(billData.shippingCost),
            totalAmount: calc.total, notes: billData.notes || "",
            items: addedItems.map(it => ({
                product: it.item, batchNumber: it.batchNumber || buildBatchNumber(Date.now().toString(), ""),
                quantity: it.quantity, price: it.pricePerUnit,
                discount: it.discount, discountType: it.discountType,
                tax: it.tax, taxType: it.taxType,
                mfgDate: it.mfgDate ? new Date(it.mfgDate).toISOString() : undefined,
                expiryDate: it.expiryDate ? new Date(it.expiryDate).toISOString() : undefined,
            })),
        };
        try {
            await createPurchase(payload).unwrap();
            showSuccess(t("Purchase created successfully.", "خرید کامیابی سے محفوظ ہو گئی۔"));
            setAddedItems([]); setItemForm(createInitialItem()); setBillData({ supplier: "", purchaseDate: new Date().toISOString().slice(0, 10), notes: "", discount: 0, discountType: "percentage", gst: 0, shippingCost: 0, paymentMethod: "cash", invoiceNumber: "" });
            onClose();
        } catch (e) {
            showError(e?.data?.message || t("Failed to create purchase.", "خرید محفوظ نہیں ہو سکی۔"));
        }
    };

    const handleExport = () => {
        const csv = [
            ["Item", "Quantity", "Unit", "Price", "Total", "Batch", "Mfg", "Expiry", "Discount", "Tax"],
            ...addedItems.map(it => [it.name, it.quantity, it.unit, it.pricePerUnit, it.totalPurchasePrice, it.batchNumber, it.mfgDate, it.expiryDate, it.discount, it.tax]),
        ].map(r => r.join(",")).join("\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        a.download = `bill_${billData.purchaseDate}.csv`; a.click();
    };

    const handleBulkImport = (e) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const text = ev.target?.result;
                let items = file.name.endsWith(".json") ? JSON.parse(text) : (() => {
                    const lines = text.split("\n"), headers = lines[0].split(",").map(h => h.trim());
                    return lines.slice(1).filter(l => l.trim()).map(line => {
                        const vals = line.split(",").map(v => v.trim());
                        return headers.reduce((o, h, i) => ({ ...o, [h]: vals[i] }), {});
                    });
                })();
                const mapped = items.map(it => {
                    const found = productsList.find(ai => ai.name.toLowerCase() === it.name?.toLowerCase() || ai._id === it.itemId);
                    if (!found) return null;
                    return { item: found._id, name: found.name, quantity: Number(it.quantity), unit: it.unit || found.unit || "unit", pricePerUnit: Number(it.price || it.pricePerUnit), totalPurchasePrice: Number(it.quantity) * Number(it.price || it.pricePerUnit), notes: it.notes || "", mfgDate: it.mfgDate || "", expiryDate: it.expiryDate || "", batchNumber: it.batchNumber || "", discount: Number(it.discount) || 0, discountType: it.discountType || "percentage", tax: Number(it.tax) || 0, taxType: it.taxType || "percentage" };
                }).filter(Boolean);
                setAddedItems(p => [...p, ...mapped]);
                showSuccess(`${t("Imported", "امپورٹ کیے گئے")} ${mapped.length} ${t("items", "آئٹمز")}`);
            } catch { showError(t("Failed to import", "امپورٹ ناکام")); }
        };
        reader.readAsText(file);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
            onClick={onClose}>
            <div className="relative w-full max-w-6xl my-4 bg-slate-50 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
                onClick={e => e.stopPropagation()}>

                {/* ── Header ─────────────────────────────────── */}
                <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-800 leading-tight">{t("Create Purchase Bill", "بل بنائیں")}</h2>
                            <p className="text-xs text-slate-400">{t("Purchase Management", "خریداری کا انتظام")}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Btn variant="secondary" size="sm" onClick={() => setShowBulkImport(p => !p)}>
                            <Upload className="w-3.5 h-3.5" /><span className="hidden sm:inline">{t("Import", "امپورٹ")}</span>
                        </Btn>
                        {addedItems.length > 0 && (
                            <Btn variant="secondary" size="sm" onClick={handleExport}>
                                <Download className="w-3.5 h-3.5" /><span className="hidden sm:inline">{t("Export", "ایکسپورٹ")}</span>
                            </Btn>
                        )}
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* ── Bulk Import ────────────────────────────── */}
                {showBulkImport && (
                    <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                        <p className="text-xs font-semibold text-amber-800 mb-2">📦 {t("Import CSV/JSON", "CSV/JSON امپورٹ")}</p>
                        <input type="file" accept=".csv,.json" onChange={handleBulkImport}
                            className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-amber-100 file:text-amber-800 file:font-medium hover:file:bg-amber-200" />
                        <p className="text-xs text-amber-700 mt-2 font-mono">Format: name,quantity,unit,price,notes,batchNumber,expiryDate</p>
                    </div>
                )}

                {/* ── Body ───────────────────────────────────── */}
                <div className="p-4 flex gap-6">

                    {/* ── LEFT ─────────────────────────────────── */}
                    <div className="space-y-4 flex-1 h-max">

                        {/* Supplier */}
                        {/* <Card title={t("Supplier Information","سپلائر کی معلومات")} icon={Package}>
                            
                        </Card> */}


                        <div className="flex h-max w-full">
                            <Field>
                                <Label>{t("Select Supplier", "سپلائر منتخب کریں")} *</Label>
                                <div className="flex gap-2 z-50">
                                    <SearchableSelect
                                        options={suppliersList.map(s => ({ label: s.name, value: s._id }))}
                                        value={billData.supplier}
                                        onChange={val => setBillData(p => ({ ...p, supplier: val }))}
                                        placeholder={t("Supplier chunein...", "سپلائر...")}
                                    />
                                    <Btn variant="secondary" size="sm" onClick={() => setSupplierFormOpen(true)}>
                                        <Plus className="w-4 h-4" />
                                    </Btn>
                                </div>
                            </Field>
                            <Field>
                                <Label>{t("Invoice Number", "انوائس نمبر")}</Label>
                                <Inp name="invoiceNumber" value={billData.invoiceNumber} readOnly placeholder="INV-SUPPLIER-..." className="bg-slate-50 cursor-not-allowed text-slate-500" />
                            </Field>
                        </div>

                        {/* Frequent Items */}
                        {billData.supplier && frequentItems.length > 0 && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                                <div className="flex items-center gap-2 mb-3">
                                    <TrendingUp className="w-4 h-4 text-amber-600" />
                                    <span className="text-xs font-semibold text-amber-800">🔥 {t("Frequently Purchased", "اکثر خریداری")}</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {frequentItems.map((f, i) => (
                                        <button key={i} onClick={() => {
                                            const item = productsList.find(ai => ai._id === (f.product?._id || f.item?._id || f.product || f.item));
                                            if (item) { setBatchStamp(Date.now().toString()); setItemForm({ ...createInitialItem(), item: item._id, name: item.name, quantity: f.quantity || "", unit: item.unit || "unit", perItemPrice: f.avgPrice }); }
                                        }} className="text-xs px-3 py-1.5 bg-white border border-amber-200 rounded-xl hover:bg-amber-100 transition text-amber-800 font-medium">
                                            {f.name || f.product?.name} (×{f.count})
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Add Item */}
                        {billData.supplier && (
                            <Card title={t("Add Item", "آئٹم شامل کریں")} icon={Plus}>
                                <div className="space-y-4">
                                    {/* Product + Batch Mode Row */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Field>
                                            <Label>{t("Product", "پروڈکٹ")} *</Label>
                                            <SSelect
                                                options={productsList.map(p => ({ label: p.name, value: p._id }))}
                                                value={itemForm.item}
                                                onChange={val => {
                                                    const sel = productsList.find(i => i._id === val);
                                                    if (sel) { setBatchStamp(Date.now().toString()); setItemForm(p => ({ ...createInitialItem(), item: sel._id, name: sel.name, unit: sel.unit || "unit", discountType: p.discountType || "percentage", taxType: p.taxType || "percentage" })); }
                                                }}
                                                placeholder={t("Search product...", "پروڈکٹ تلاش کریں...")}
                                            />
                                        </Field>
                                        <Field>
                                            <Label>Batch Mode</Label>
                                            <div className="flex gap-2">
                                                <Btn variant={itemForm.batchMode === "new" ? "active" : "inactive"} size="sm" className="flex-1"
                                                    onClick={() => { setBatchStamp(Date.now().toString()); setItemForm(p => ({ ...p, batchMode: "new", batchSelection: "", batchCustom: "", mfgDate: "", expiryDate: "" })); }}>
                                                    New Batch
                                                </Btn>
                                                <Btn variant={itemForm.batchMode === "existing" ? "active" : "inactive"} size="sm" className="flex-1"
                                                    disabled={!itemForm.item || availableBatches.length === 0}
                                                    onClick={() => setItemForm(p => ({ ...p, batchMode: "existing" }))}>
                                                    Existing
                                                </Btn>
                                            </div>
                                            {itemForm.batchMode === "existing" && (
                                                <select value={itemForm.batchSelection} onChange={e => handleBatchSelect(e.target.value)}
                                                    className="mt-2 w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-teal-500">
                                                    <option value="">{t("Select batch", "بیچ منتخب کریں")}</option>
                                                    {availableBatches.map(b => <option key={b._id} value={b._id}>{b.batchNumber} (Qty: {b.quantity})</option>)}
                                                </select>
                                            )}
                                        </Field>
                                    </div>

                                    {/* Batch Number */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Field>
                                            <Label>Batch Number</Label>
                                            <Inp name="batchNumber" value={itemForm.batchNumber} readOnly className="bg-slate-50 cursor-not-allowed text-slate-500 text-xs" />
                                            {itemForm.batchMode === "new" && (
                                                <Inp name="batchCustom" value={itemForm.batchCustom} onChange={handleItemChange} placeholder="Custom suffix..." className="mt-2" />
                                            )}
                                        </Field>
                                        <Field>
                                            <Label>{t("Quantity", "مقدار")} *</Label>
                                            <div className="flex gap-2 items-center">
                                                <Inp name="quantity" type="number" placeholder="0" value={itemForm.quantity} onChange={handleItemChange} />
                                                <span className="shrink-0 px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded-xl">{itemForm.unit || "unit"}</span>
                                            </div>
                                        </Field>
                                    </div>

                                    {/* Price Alert */}
                                    {priceAlert && (
                                        <div className={`text-xs px-3 py-2 rounded-xl font-medium ${priceAlert.isHigher ? "bg-rose-50 text-rose-700 border border-rose-200" : priceAlert.isLower ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-50 text-slate-600 border border-slate-200"}`}>
                                            {priceAlert.isHigher ? "⚠️" : priceAlert.isLower ? "✅" : "ℹ️"} Avg price: Rs {priceAlert.avgPrice} · Variance: {priceAlert.variance}%
                                        </div>
                                    )}

                                    {/* Price + Discount + Tax */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <Field>
                                            <Label>{t("Price/Unit", "قیمت")} *</Label>
                                            <Inp name="perItemPrice" type="number" placeholder="0.00" value={itemForm.perItemPrice} onChange={handleItemChange} />
                                        </Field>
                                        <Field>
                                            <Label>Discount</Label>
                                            <Inp name="discount" type="number" placeholder="0" value={itemForm.discount} onChange={handleItemChange} />
                                        </Field>
                                        <Field>
                                            <Label>Disc. Type</Label>
                                            <select value={itemForm.discountType} onChange={e => setItemForm(p => ({ ...p, discountType: e.target.value }))}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-teal-500">
                                                <option value="percentage">%</option>
                                                <option value="fixed">Fixed</option>
                                            </select>
                                        </Field>
                                        <Field>
                                            <Label>GST (%)</Label>
                                            <Inp name="tax" type="number" placeholder="0" value={itemForm.tax} onChange={handleItemChange} />
                                        </Field>
                                    </div>

                                    {/* Dates */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field>
                                            <Label>Mfg Date</Label>
                                            <Inp name="mfgDate" type="date" value={itemForm.mfgDate} onChange={handleItemChange} />
                                        </Field>
                                        <Field>
                                            <Label>Expiry Date</Label>
                                            <Inp name="expiryDate" type="date" value={itemForm.expiryDate} onChange={handleItemChange} />
                                        </Field>
                                    </div>

                                    <Btn variant="primary" className="w-full" onClick={handleAddItem}>
                                        <Plus className="w-4 h-4" />
                                        {editingIndex !== null ? t("Update Item", "آئٹم اپڈیٹ کریں") : t("Add Item to Bill", "آئٹم شامل کریں")}
                                    </Btn>
                                </div>
                            </Card>
                        )}

                        {/* Added Items Table */}
                        {addedItems.length > 0 && (
                            <Card title={`${t("Added Items", "شامل شدہ آئٹمز")} (${addedItems.length})`} icon={FileText}>
                                <div className="overflow-x-auto -mx-5 -mb-5">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-y border-slate-200">
                                            <tr className="text-xs text-slate-500">
                                                <th className="text-left px-5 py-3 font-semibold">{t("Item", "آئٹم")}</th>
                                                <th className="text-left px-3 py-3 font-semibold">Batch</th>
                                                <th className="text-right px-3 py-3 font-semibold">{t("Qty", "مقدار")}</th>
                                                <th className="text-right px-3 py-3 font-semibold">{t("Price", "قیمت")}</th>
                                                <th className="text-right px-3 py-3 font-semibold">Total</th>
                                                <th className="text-center px-3 py-3 font-semibold">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {addedItems.map((it, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition">
                                                    <td className="px-5 py-3 font-medium text-slate-800">{it.name}</td>
                                                    <td className="px-3 py-3 text-xs text-slate-400 font-mono">{it.batchNumber}</td>
                                                    <td className="px-3 py-3 text-right tabular-nums">{it.quantity} <span className="text-xs text-slate-400">{it.unit}</span></td>
                                                    <td className="px-3 py-3 text-right tabular-nums">{Number(it.pricePerUnit).toFixed(2)}</td>
                                                    <td className="px-3 py-3 text-right tabular-nums font-semibold text-slate-800">{Number(it.totalPurchasePrice).toFixed(2)}</td>
                                                    <td className="px-3 py-3">
                                                        <div className="flex justify-center gap-1">
                                                            <Btn variant="ghost" size="sm" onClick={() => {
                                                                setBatchStamp(getBatchStamp(it.batchNumber));
                                                                setItemForm({ item: it.item, name: it.name, quantity: it.quantity, unit: it.unit, perItemPrice: it.pricePerUnit, notes: it.notes, mfgDate: it.mfgDate, expiryDate: it.expiryDate, batchNumber: it.batchNumber, batchMode: it.batchMode || (it.batchId ? "existing" : "new"), batchCustom: it.batchCustom || "", batchSelection: it.batchId || "", discount: it.discount, discountType: it.discountType, tax: it.tax, taxType: it.taxType });
                                                                setEditingIndex(idx);
                                                            }}>Edit</Btn>
                                                            <Btn variant="danger" size="sm" onClick={() => setAddedItems(p => p.filter((_, i) => i !== idx))}>Remove</Btn>
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

                    {/* ── RIGHT: Bill Details + Summary ────────── */}
                    <div className="space-y-4">
                        <Card title={t("Bill Details", "بل کی تفصیلات")} icon={FileText}>
                            <div className="space-y-3">
                                <Field>
                                    <Label><Calendar className="inline w-3 h-3 mr-1" />{t("Date", "تاریخ")}</Label>
                                    <Inp type="date" name="purchaseDate" value={billData.purchaseDate} onChange={handleBillChange} />
                                </Field>
                                <Field>
                                    <Label><DollarSign className="inline w-3 h-3 mr-1" />Discount</Label>
                                    <div className="flex gap-2">
                                        <Inp type="number" name="discount" value={billData.discount} onChange={handleBillChange} placeholder="0.00" />
                                        <select value={billData.discountType} onChange={e => setBillData(p => ({ ...p, discountType: e.target.value }))}
                                            className="shrink-0 px-2 py-2 text-xs border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-teal-500">
                                            <option value="percentage">%</option>
                                            <option value="fixed">Fixed</option>
                                        </select>
                                    </div>
                                </Field>
                                <Field>
                                    <Label>GST (%)</Label>
                                    <Inp type="number" name="gst" value={billData.gst} onChange={handleBillChange} placeholder="0" />
                                </Field>
                                <Field>
                                    <Label><Truck className="inline w-3 h-3 mr-1" />Shipping Cost</Label>
                                    <Inp type="number" name="shippingCost" value={billData.shippingCost} onChange={handleBillChange} placeholder="0.00" />
                                </Field>
                                <Field>
                                    <Label><File className="inline w-3 h-3 mr-1" />Note</Label>
                                    <Txt name="notes" rows={3} value={billData.notes} onChange={handleBillChange} placeholder="Koi note..." />
                                </Field>
                            </div>
                        </Card>

                        {/* Summary */}
                        <Card title={t("Bill Summary", "بل کا خلاصہ")} icon={DollarSign}>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span className="tabular-nums font-medium">{calc.subtotal.toFixed(2)}</span></div>
                                <div className="flex justify-between text-slate-600"><span>Discount</span><span className="tabular-nums text-rose-500">−{calc.discount.toFixed(2)}</span></div>
                                <div className="flex justify-between text-slate-600"><span>GST</span><span className="tabular-nums text-teal-600">+{calc.gst.toFixed(2)}</span></div>
                                <div className="flex justify-between text-slate-600"><span>Shipping</span><span className="tabular-nums">+{calc.shipping.toFixed(2)}</span></div>
                                <div className="border-t border-slate-200 pt-3 mt-1 flex justify-between items-center">
                                    <span className="font-bold text-slate-800">Total</span>
                                    <span className="text-lg font-bold text-teal-700 tabular-nums">Rs {calc.total.toFixed(2)}</span>
                                </div>
                            </div>
                            <Btn variant="primary" className="w-full mt-4" onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? "Submitting..." : t("Submit Bill →", "بل جمع کریں →")}
                            </Btn>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
// src/modules/productPurchases/components/PurchaseModal.jsx
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
import { Plus, Upload, Download, TrendingUp, Package, Calendar, FileText, DollarSign, Truck, File, X, ChevronDown } from "lucide-react";
import { useEffect, useState, useMemo, useRef } from "react";
import { useAllSuppliers } from "../../suppliers/services/suppliers.service";
import { useAllPurchases, useCreatePurchase, usePurchase, useUpdatePurchase } from "../services/purchases.service";
import { useProducts } from "../../productsModule/services/product.service";
import { useBatchesByProduct } from "../services/batch.service";
import { SearchableSelect } from "../../../shared/components/FormFields.jsx";
import ProductCRUDModal from "../../productsModule/components/ProductCRUDModal.jsx";
import SupplierModal from "../../suppliers/components/SupplierModal.jsx";
import { getPurchaseLabels } from "../labels/purchaseLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";

// ─── constants ────────────────────────────────────────────────────────────────
const toInputDate  = (v) => v ? new Date(v).toISOString().slice(0, 10) : "";
const sanitize     = (v) => String(v || "").trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "").toUpperCase();
const makeBatch    = (stamp) => `BAT-${stamp}-GEN`;
const makeInvoice  = (name, stamp) => `INV-${sanitize(name || "SUPPLIER")}-${stamp}`;
const getBatchStamp = (bn) => { const m = /^BAT-([^-]+)-/.exec(bn || ""); return m?.[1] || Date.now().toString(); };

const emptyItem = () => ({
    item: "", name: "", quantity: "", unit: "", perItemPrice: "",
    mfgDate: "", expiryDate: "", batchNumber: "", batchMode: "new", batchSelection: "",
    discount: "", discountType: "percentage", tax: "", taxType: "percentage",
});

const emptyBill = () => ({
    supplier: "", purchaseDate: new Date().toISOString().slice(0, 10),
    invoiceNumber: "", notes: "", discount: 0, discountType: "percentage",
    gst: 0, shippingCost: 0,
});

// ─── primitives ───────────────────────────────────────────────────────────────
const Label = ({ children }) => <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--muted)" }}>{children}</label>;
const Field = ({ children, className = "" }) => <div className={`flex flex-col ${className}`}>{children}</div>;

const inputBase = `w-full px-3 py-2 text-sm rounded-xl outline-none transition focus:ring-2 placeholder-(--muted)`;
const inputStyle = { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)", "--tw-ring-color": "var(--accent-2)" };

const Inp = ({ className = "", style: s = {}, ...p }) => <input {...p} className={`${inputBase} ${className}`} style={{ ...inputStyle, ...s }} />;
const Txt = ({ className = "", ...p }) => <textarea {...p} className={`${inputBase} resize-none ${className}`} style={inputStyle} />;
const Sel = ({ className = "", ...p }) => <select {...p} className={`${inputBase} ${className}`} style={inputStyle} />;

const btnVariants = {
    primary:   { background: "var(--accent-2)", color: "#fff" },
    secondary: { background: "var(--surface-muted)", color: "var(--ink)", border: "1px solid var(--border)" },
    ghost:     { background: "transparent", color: "var(--muted)" },
    danger:    { background: "rgba(220,38,38,0.08)", color: "#dc2626" },
    active:    { background: "var(--accent-2)", color: "#fff" },
    inactive:  { background: "var(--surface-muted)", color: "var(--muted)", border: "1px solid var(--border)" },
};
const btnSizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-sm" };

const Btn = ({ children, variant = "primary", size = "md", className = "", ...p }) => (
    <button {...p} style={p.disabled ? { ...btnVariants[variant], opacity: 0.5, cursor: "not-allowed" } : btnVariants[variant]}
        className={`inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-95 disabled:pointer-events-none cursor-pointer ${btnSizes[size]} ${className}`}>
        {children}
    </button>
);

// ─── searchable select ────────────────────────────────────────────────────────
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
                className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl transition text-left"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: selected ? "var(--ink)" : "var(--muted)" }}>
                <span>{selected?.label || placeholder}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "var(--muted)" }} />
            </button>
            {open && (
                <div className="absolute z-50 w-full mt-1 rounded-xl shadow-xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div className="p-2" style={{ borderBottom: "1px solid var(--border)" }}>
                        <input autoFocus type="text" placeholder="Search..." value={q} onChange={e => setQ(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm rounded-lg outline-none"
                            style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", color: "var(--ink)" }} />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filtered.length
                            ? filtered.map(o => (
                                <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); setQ(""); }}
                                    className="px-3 py-2 text-sm cursor-pointer transition"
                                    style={{ background: value === o.value ? "rgba(15,118,110,0.08)" : "transparent", color: value === o.value ? "var(--accent-2)" : "var(--ink)", fontWeight: value === o.value ? 600 : 400 }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(15,118,110,0.06)"}
                                    onMouseLeave={e => e.currentTarget.style.background = value === o.value ? "rgba(15,118,110,0.08)" : "transparent"}>
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

// ─── layout atoms ─────────────────────────────────────────────────────────────
const Card = ({ title, icon: Icon, children, className = "", noOverflow = false }) => (
    <div className={`rounded-2xl ${noOverflow ? "" : "overflow-hidden"} ${className}`} style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {title && (
            <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-muted)" }}>
                {Icon && <Icon className="w-4 h-4" style={{ color: "var(--accent-2)" }} />}
                <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{title}</span>
            </div>
        )}
        <div className="p-5">{children}</div>
    </div>
);

const SumRow = ({ label, value, accent, danger }) => (
    <div className="flex justify-between items-center text-sm">
        <span style={{ color: "var(--muted)" }}>{label}</span>
        <span className="tabular-nums font-medium" style={{ color: danger ? "#dc2626" : accent ? "var(--accent-2)" : "var(--ink)" }}>{value}</span>
    </div>
);

// ─── error boundary ───────────────────────────────────────────────────────────
import { Component } from "react";
class ErrorBoundary extends Component {
    state = { error: null };
    static getDerivedStateFromError(e) { return { error: e }; }
    render() {
        if (this.state.error) return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="rounded-2xl p-8 max-w-sm w-full text-center space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <p className="font-semibold" style={{ color: "var(--ink)" }}>Something went wrong</p>
                    <p className="text-sm" style={{ color: "var(--muted)" }}>{this.state.error?.message || "Unexpected error"}</p>
                    <Btn variant="secondary" onClick={() => this.setState({ error: null })}>Dismiss</Btn>
                </div>
            </div>
        );
        return this.props.children;
    }
}

// ─── main modal ───────────────────────────────────────────────────────────────
function PurchaseModalInner({ mode = "create", purchaseId, onClose, onSuccess }) {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getPurchaseLabels(language);
    const isUpdate   = mode === "update";

    // data
    const { data: existingPurchase, isLoading: isFetching } = usePurchase(purchaseId, { skip: !isUpdate || !purchaseId });
    const { data: suppliersRaw, refetch: refetchSuppliers }  = useAllSuppliers();
    const { data: productsRaw, refetch: refetchProducts }   = useProducts();
    const { data: purchasesRaw }  = useAllPurchases();
    const [createPurchase, { isLoading: isCreating }] = useCreatePurchase();
    const [updatePurchase, { isLoading: isUpdating }] = useUpdatePurchase();
    const isSubmitting = isCreating || isUpdating;

    const suppliersList = suppliersRaw?.data ?? suppliersRaw ?? [];
    const productsList  = productsRaw?.data  ?? productsRaw  ?? [];
    const previousBills = purchasesRaw?.data ?? purchasesRaw ?? [];

    // state
    const [bill,         setBill]         = useState(emptyBill());
    const [addedItems,   setAddedItems]   = useState([]);
    const [itemForm,     setItemForm]     = useState(emptyItem());
    const [editingIndex, setEditingIndex] = useState(null);
    const [batchStamp,   setBatchStamp]   = useState(() => Date.now().toString());
    const [showImport,   setShowImport]   = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [showSupplierModal, setShowSupplierModal] = useState(false);

    const { data: batchesRaw = [] } = useBatchesByProduct(itemForm.item, { skip: !itemForm.item });
    const availableBatches = Array.isArray(batchesRaw) ? batchesRaw : [];
    const selectedBatch    = availableBatches.find(b => b._id === itemForm.batchSelection);
    const isExistingMode   = itemForm.batchMode === "existing" && Boolean(itemForm.batchSelection);
    const selectedSupplierName = suppliersList.find(s => s._id === bill.supplier)?.name ?? "";

    const handleProductCreated = () => {
        setShowProductModal(false);
        refetchProducts();
    };

    const handleSupplierCreated = () => {
        setShowSupplierModal(false);
        refetchSuppliers();
    };

    // prefill update
    useEffect(() => {
        if (!isUpdate || !existingPurchase) return;
        setBill({
            supplier:      existingPurchase.supplier?._id ?? existingPurchase.supplier ?? "",
            purchaseDate:  existingPurchase.date ? new Date(existingPurchase.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            invoiceNumber: existingPurchase.invoiceNumber ?? "",
            notes:         existingPurchase.notes         ?? "",
            discount:      existingPurchase.discount      ?? 0,
            discountType:  existingPurchase.discountType  ?? "percentage",
            gst:           existingPurchase.gst           ?? 0,
            shippingCost:  existingPurchase.shippingCost  ?? 0,
        });
        setAddedItems((existingPurchase.items ?? []).map(it => ({
            item: it.product?._id ?? it.product ?? "", name: it.product?.name ?? "",
            quantity: it.quantity ?? 0, unit: it.unit ?? "",
            pricePerUnit: it.price ?? 0, totalPurchasePrice: (it.quantity ?? 0) * (it.price ?? 0),
            mfgDate: toInputDate(it.mfgDate), expiryDate: toInputDate(it.expiryDate),
            batchNumber: it.batchNumber ?? "", batchMode: it.batchId ? "existing" : "new",
            batchSelection: it.batchId ?? "", batchId: it.batchId ?? "",
            discount: it.discount ?? 0, discountType: it.discountType ?? "percentage",
            tax: it.tax ?? 0, taxType: it.taxType ?? "percentage",
        })));
    }, [existingPurchase, isUpdate]);

    // auto-invoice
    useEffect(() => {
        if (isUpdate || !bill.supplier) return;
        const inv = makeInvoice(selectedSupplierName, Date.now().toString());
        setBill(p => p.invoiceNumber === inv ? p : { ...p, invoiceNumber: inv });
    }, [bill.supplier, selectedSupplierName, isUpdate]);

    // batch number (new mode)
    useEffect(() => {
        if (itemForm.batchMode !== "new") return;
        const bn = makeBatch(batchStamp);
        setItemForm(p => p.batchNumber === bn ? p : { ...p, batchNumber: bn, batchSelection: "" });
    }, [itemForm.batchMode, batchStamp]);

    // autofill from existing batch
    useEffect(() => {
        if (!selectedBatch || !isExistingMode) return;
        setItemForm(p => ({
            ...p,
            batchNumber:  selectedBatch.batchNumber ?? p.batchNumber,
            perItemPrice: selectedBatch.purchasePrice != null ? String(selectedBatch.purchasePrice) : p.perItemPrice,
            mfgDate:      toInputDate(selectedBatch.mfgDate),
            expiryDate:   toInputDate(selectedBatch.expiryDate),
        }));
    }, [selectedBatch, isExistingMode]);

    // autofill unit and auto-select batch mode
    useEffect(() => {
        if (!itemForm.item) return;
        const prod = productsList.find(p => p._id === itemForm.item);
        if (prod) {
            setItemForm(p => ({
                ...p,
                unit: prod.unit ?? "unit",
                discountType: prod.discountType ?? "percentage",
                taxType: prod.taxType ?? "percentage"
            }));
        }
    }, [itemForm.item, productsList]);

    // auto-select batch mode based on available batches
    useEffect(() => {
        if (!itemForm.item) return;
        if (availableBatches.length === 0) {
            // No existing batches - default to new mode
            setItemForm(p => ({ ...p, batchMode: "new", batchSelection: "" }));
        } else {
            // Has existing batches - default to existing mode and select newest
            const newestBatch = availableBatches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
            if (newestBatch) {
                handleBatchSelect(newestBatch._id);
            }
        }
    }, [itemForm.item, availableBatches]);

    // calculations
    const calc = useMemo(() => {
        const subtotal    = addedItems.reduce((s, it) => s + (Number(it.totalPurchasePrice) || 0), 0);
        const discountAmt = bill.discountType === "percentage" ? (subtotal * Number(bill.discount || 0)) / 100 : Number(bill.discount || 0);
        const after       = subtotal - discountAmt;
        const gst         = (after * Number(bill.gst || 0)) / 100;
        const shipping    = Number(bill.shippingCost || 0);
        return { subtotal, discount: discountAmt, gst, shipping, total: after + gst + shipping };
    }, [addedItems, bill]);

    // frequent items
    const frequentItems = useMemo(() => {
        if (!bill.supplier || !previousBills?.length) return [];
        const freq = {};
        previousBills.filter(b => (b.supplier?._id ?? b.supplier) === bill.supplier)
            .forEach(b => b.items?.forEach(it => {
                const id = it.product?._id ?? it.product;
                if (!id) return;
                if (!freq[id]) freq[id] = { ...it, count: 0, prices: [] };
                freq[id].count++;
                freq[id].prices.push(it.price ?? 0);
            }));
        return Object.values(freq).sort((a, b) => b.count - a.count).slice(0, 5)
            .map(f => ({ ...f, avgPrice: (f.prices.reduce((a, b) => a + b, 0) / f.prices.length).toFixed(2) }));
    }, [bill.supplier, previousBills]);

    // handlers
    const handleBillChange = e => setBill(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleItemChange = e => setItemForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleBatchSelect = (val) => {
        const b = availableBatches.find(b => b._id === val);
        if (!b) return;
        setItemForm(p => ({
            ...p, batchMode: "existing", batchSelection: val,
            batchNumber:  b.batchNumber ?? p.batchNumber,
            perItemPrice: b.purchasePrice != null ? String(b.purchasePrice) : p.perItemPrice,
            mfgDate:      toInputDate(b.mfgDate),
            expiryDate:   toInputDate(b.expiryDate),
        }));
    };

    const handleAddItem = () => {
        if (!bill.supplier)                                               return showError(labels.selectSupplierFirst);
        if (!itemForm.item)                                               return showError(labels.selectItem);
        if (!itemForm.quantity || Number(itemForm.quantity) <= 0)         return showError(labels.enterValidQuantity);
        if (itemForm.perItemPrice === "" || Number(itemForm.perItemPrice) < 0) return showError(labels.enterValidPrice);
        if (itemForm.batchMode === "existing" && !itemForm.batchSelection) return showError(labels.selectBatch);

        const prod    = productsList.find(p => p._id === itemForm.item);
        const batchNo = itemForm.batchMode === "new" ? makeBatch(batchStamp) : itemForm.batchNumber?.trim();
        if (!batchNo) return showError(labels.batchNumberRequired);

        const row = {
            item: itemForm.item, name: prod?.name ?? "Unknown",
            quantity: Number(itemForm.quantity), unit: itemForm.unit,
            pricePerUnit: Number(itemForm.perItemPrice),
            totalPurchasePrice: Number(itemForm.quantity) * Number(itemForm.perItemPrice),
            mfgDate: itemForm.mfgDate, expiryDate: itemForm.expiryDate,
            batchNumber: batchNo, batchMode: itemForm.batchMode,
            batchSelection: itemForm.batchMode === "existing" ? itemForm.batchSelection : "",
            batchId:        itemForm.batchMode === "existing" ? itemForm.batchSelection : "",
            discount: Number(itemForm.discount) || 0, discountType: itemForm.discountType,
            tax:      Number(itemForm.tax)      || 0, taxType:      itemForm.taxType,
        };

        if (editingIndex !== null) {
            setAddedItems(p => p.map((it, i) => i === editingIndex ? row : it));
            setEditingIndex(null);
        } else {
            setAddedItems(p => [...p, row]);
        }
        setItemForm(emptyItem());
        setBatchStamp(Date.now().toString());
    };

    const handleEditItem = (it, idx) => {
        setBatchStamp(getBatchStamp(it.batchNumber));
        setItemForm({
            item: it.item, name: it.name, quantity: it.quantity, unit: it.unit,
            perItemPrice: it.pricePerUnit, mfgDate: it.mfgDate, expiryDate: it.expiryDate,
            batchNumber: it.batchNumber, batchMode: it.batchMode ?? (it.batchId ? "existing" : "new"),
            batchSelection: it.batchId ?? "",
            discount: it.discount, discountType: it.discountType,
            tax:      it.tax,      taxType:      it.taxType,
        });
        setEditingIndex(idx);
    };

    const handleSubmit = async () => {
        if (!bill.supplier)     return showError(labels.selectSupplier);
        if (!addedItems.length) return showError(labels.addAtLeastOneItem);
        const payload = {
            supplier: bill.supplier, date: bill.purchaseDate,
            invoiceNumber: bill.invoiceNumber, notes: bill.notes ?? "",
            subtotal: calc.subtotal, discount: Number(bill.discount), discountType: bill.discountType,
            gst: Number(bill.gst), shippingCost: Number(bill.shippingCost), totalAmount: calc.total,
            items: addedItems.map(it => ({
                product: it.item, batchNumber: it.batchNumber,
                quantity: it.quantity, price: it.pricePerUnit,
                discount: it.discount, discountType: it.discountType,
                tax: it.tax, taxType: it.taxType,
                mfgDate:    it.mfgDate    ? new Date(it.mfgDate).toISOString()    : undefined,
                expiryDate: it.expiryDate ? new Date(it.expiryDate).toISOString() : undefined,
            })),
        };
        try {
            if (isUpdate) {
                await updatePurchase({ id: purchaseId, ...payload }).unwrap();
                showSuccess(labels.purchaseUpdated);
            } else {
                await createPurchase(payload).unwrap();
                showSuccess(labels.purchaseCreated);
                setBill(emptyBill()); setAddedItems([]); setItemForm(emptyItem());
            }
            onSuccess?.();
            onClose();
        } catch (e) {
            showError(e?.data?.message ?? labels.operationFailed);
        }
    };

    const handleExport = () => {
        const csv = [
            ["Item","Quantity","Unit","Price","Total","Batch","Mfg","Expiry","Discount","Tax"],
            ...addedItems.map(it => [it.name, it.quantity, it.unit, it.pricePerUnit, it.totalPurchasePrice, it.batchNumber, it.mfgDate, it.expiryDate, it.discount, it.tax]),
        ].map(r => r.join(",")).join("\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        a.download = `purchase_${bill.purchaseDate}.csv`;
        a.click();
    };

    const handleBulkImport = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const text = ev.target?.result ?? "";
                const rows = file.name.endsWith(".json") ? JSON.parse(text) : (() => {
                    const lines = text.split("\n");
                    const headers = lines[0].split(",").map(h => h.trim());
                    return lines.slice(1).filter(l => l.trim()).map(line => {
                        const vals = line.split(",").map(v => v.trim());
                        return headers.reduce((o, h, i) => ({ ...o, [h]: vals[i] }), {});
                    });
                })();
                const mapped = rows.map(it => {
                    const found = productsList.find(p => p.name.toLowerCase() === it.name?.toLowerCase() || p._id === it.itemId);
                    if (!found) return null;
                    const qty = Number(it.quantity), price = Number(it.price ?? it.pricePerUnit);
                    return {
                        item: found._id, name: found.name, quantity: qty,
                        unit: it.unit ?? found.unit ?? "unit",
                        pricePerUnit: price, totalPurchasePrice: qty * price,
                        mfgDate: it.mfgDate ?? "", expiryDate: it.expiryDate ?? "",
                        batchNumber: it.batchNumber ?? "", batchMode: "new", batchSelection: "", batchId: "",
                        discount: Number(it.discount) || 0, discountType: it.discountType ?? "percentage",
                        tax:      Number(it.tax)      || 0, taxType:      it.taxType      ?? "percentage",
                    };
                }).filter(Boolean);
                setAddedItems(p => [...p, ...mapped]);
                showSuccess(`Imported ${mapped.length} items`);
            } catch { showError("Import failed — check file format"); }
        };
        reader.readAsText(file);
    };

    if (isUpdate && isFetching && !existingPurchase) return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded-2xl p-8 text-sm" style={{ background: "var(--surface)", color: "var(--muted)" }}>Loading…</div>
        </div>
    );

    // ─── render ───────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto" onClick={onClose}>
            <div className="relative w-full max-w-6xl my-4 rounded-3xl shadow-2xl overflow-hidden"
                style={{ background: "var(--app-bg)", border: "1px solid var(--border)" }}
                onClick={e => e.stopPropagation()}>

                {/* header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 sticky top-0 z-10" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent-2)" }}>
                            <Package className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold leading-tight" style={{ color: "var(--ink)" }}>
                                {isUpdate ? labels.editPurchase : labels.newPurchaseBill}
                            </h2>
                            <p className="text-xs" style={{ color: "var(--muted)" }}>{isUpdate ? bill.invoiceNumber : labels.purchaseManagement}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isUpdate && <Btn variant="secondary" size="sm" onClick={() => setShowImport(p => !p)}><Upload className="w-3.5 h-3.5" /><span className="hidden sm:inline">{labels.import}</span></Btn>}
                        {addedItems.length > 0 && <Btn variant="secondary" size="sm" onClick={handleExport}><Download className="w-3.5 h-3.5" /><span className="hidden sm:inline">{labels.export}</span></Btn>}
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl transition" style={{ background: "var(--surface-muted)", color: "var(--muted)" }}>
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* import bar */}
                {showImport && (
                    <div className="mx-4 sm:mx-6 mt-4 p-4 rounded-2xl" style={{ background: "rgba(180,83,9,0.06)", border: "1px solid rgba(180,83,9,0.2)" }}>
                        <p className="text-xs font-semibold mb-2" style={{ color: "var(--accent)" }}>{labels.importCsvJson}</p>
                        <input type="file" accept=".csv,.json" onChange={handleBulkImport} className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:font-medium file:cursor-pointer" style={{ color: "var(--muted)" }} />
                        <p className="text-xs mt-2 font-mono" style={{ color: "var(--muted)" }}>{labels.formatHint}</p>
                    </div>
                )}

                {/* body */}
                <div className="p-3 sm:p-4 flex flex-col lg:flex-row gap-4">

                    {/* left column */}
                    <div className="flex-1 space-y-4 min-w-0">

                        {/* supplier */}
                        <Card noOverflow>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field>
                                    <Label>{labels.supplier} *</Label>
                                    <div className="flex gap-2">
                                        <div className="relative z-50 flex-1">
                                            <SearchableSelect
                                                options={suppliersList.map(s => ({ label: s.name, value: s._id }))}
                                                value={bill.supplier}
                                                onChange={val => setBill(p => ({ ...p, supplier: val }))}
                                                placeholder={labels.selectSupplier + "…"}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowSupplierModal(true)}
                                            className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
                                            title="Create new supplier"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </Field>
                                <Field>
                                    <Label>{labels.invoiceNo}</Label>
                                    <Inp value={bill.invoiceNumber} readOnly style={{ background: "var(--surface-muted)", cursor: "not-allowed", color: "var(--muted)" }} />
                                </Field>
                            </div>
                        </Card>

                        {/* frequent items */}
                        {!isUpdate && bill.supplier && frequentItems.length > 0 && (
                            <div className="p-4 rounded-2xl" style={{ background: "rgba(180,83,9,0.05)", border: "1px solid rgba(180,83,9,0.15)" }}>
                                <div className="flex items-center gap-2 mb-3">
                                    <TrendingUp className="w-4 h-4" style={{ color: "var(--accent)" }} />
                                    <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>{labels.frequentlyPurchased}</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {frequentItems.map((f, i) => {
                                        const prod = productsList.find(p => p._id === (f.product?._id ?? f.item?._id ?? f.product ?? f.item));
                                        return prod ? (
                                            <button key={i} onClick={() => { setBatchStamp(Date.now().toString()); setItemForm({ ...emptyItem(), item: prod._id, name: prod.name, unit: prod.unit ?? "unit", perItemPrice: f.avgPrice }); }}
                                                className="text-xs px-3 py-1.5 rounded-xl font-medium transition"
                                                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" }}>
                                                {prod.name} ×{f.count}
                                            </button>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}

                        {/* add/edit item form */}
                        {bill.supplier && (
                            <Card title={editingIndex !== null ? labels.editItem : labels.addItem} icon={Plus}>
                                <div className="space-y-4">
                                    {/* product + batch mode */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Field>
                                            <Label>{labels.product} *</Label>
                                            <div className="flex gap-2">
                                                <SSelect
                                                    className="flex-1"
                                                    options={productsList.map(p => ({ label: p.name, value: p._id }))}
                                                    value={itemForm.item}
                                                    onChange={val => {
                                                        const prod = productsList.find(p => p._id === val);
                                                        if (prod) { setBatchStamp(Date.now().toString()); setItemForm(p => ({ ...emptyItem(), item: prod._id, name: prod.name, unit: prod.unit ?? "unit", discountType: p.discountType ?? "percentage", taxType: p.taxType ?? "percentage" })); }
                                                    }}
                                                    placeholder={labels.product + "…"}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowProductModal(true)}
                                                    className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
                                                    title="Create new product"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </Field>
                                        <Field>
                                            <Label>{labels.batchMode}</Label>
                                            <div className="flex gap-2">
                                                <Btn variant={itemForm.batchMode === "new" ? "active" : "inactive"} size="sm" className="flex-1"
                                                    onClick={() => { setBatchStamp(Date.now().toString()); setItemForm(p => ({ ...p, batchMode: "new", batchSelection: "" })); }}>
                                                    {labels.new}
                                                </Btn>
                                                <Btn variant={itemForm.batchMode === "existing" ? "active" : "inactive"} size="sm" className="flex-1"
                                                    disabled={!itemForm.item || availableBatches.length === 0}
                                                    onClick={() => setItemForm(p => ({ ...p, batchMode: "existing" }))}>
                                                    {labels.existing}
                                                </Btn>
                                            </div>
                                            {itemForm.batchMode === "existing" && (
                                                <Sel className="mt-2" value={itemForm.batchSelection} onChange={e => handleBatchSelect(e.target.value)}>
                                                    <option value="">{labels.selectBatchPlaceholder}</option>
                                                    {availableBatches.map(b => <option key={b._id} value={b._id}>{b.batchNumber} (Qty: {b.quantity})</option>)}
                                                </Sel>
                                            )}
                                        </Field>
                                    </div>

                                    {/* batch no + quantity */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Field>
                                            <Label>{labels.batchNo}</Label>
                                            <Inp value={itemForm.batchNumber} readOnly className="text-xs" style={{ background: "var(--surface-muted)", cursor: "not-allowed", color: "var(--muted)" }} />
                                        </Field>
                                        <Field>
                                            <Label>{labels.quantity} *</Label>
                                            <div className="flex gap-2 items-center">
                                                <Inp name="quantity" type="number" placeholder="0" value={itemForm.quantity} onChange={handleItemChange} />
                                                <span className="shrink-0 px-3 py-2 text-xs font-semibold rounded-xl" style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                                                    {itemForm.unit || "unit"}
                                                </span>
                                            </div>
                                        </Field>
                                    </div>

                                    {/* price + discount + tax */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <Field><Label>{labels.price} *</Label><Inp name="perItemPrice" type="number" placeholder="0.00" value={itemForm.perItemPrice} onChange={handleItemChange} /></Field>
                                        <Field><Label>{labels.discount}</Label><Inp name="discount" type="number" placeholder="0" value={itemForm.discount} onChange={handleItemChange} /></Field>
                                        <Field>
                                            <Label>{labels.discountType}</Label>
                                            <Sel value={itemForm.discountType} onChange={e => setItemForm(p => ({ ...p, discountType: e.target.value }))}>
                                                <option value="percentage">{labels.percentage}</option>
                                                <option value="fixed">{labels.fixed}</option>
                                            </Sel>
                                        </Field>
                                        <Field><Label>{labels.taxPercent}</Label><Inp name="tax" type="number" placeholder="0" value={itemForm.tax} onChange={handleItemChange} /></Field>
                                    </div>

                                    {/* dates */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field><Label>{labels.mfgDate}</Label><Inp name="mfgDate" type="date" value={itemForm.mfgDate} onChange={handleItemChange} /></Field>
                                        <Field><Label>{labels.expiryDate}</Label><Inp name="expiryDate" type="date" value={itemForm.expiryDate} onChange={handleItemChange} /></Field>
                                    </div>

                                    <Btn variant="primary" className="w-full" onClick={handleAddItem}>
                                        <Plus className="w-4 h-4" />
                                        {editingIndex !== null ? labels.updateItem : labels.addToBill}
                                    </Btn>
                                </div>
                            </Card>
                        )}

                        {/* items table */}
                        {addedItems.length > 0 && (
                            <Card title={`${labels.items} (${addedItems.length})`} icon={FileText}>
                                <div className="overflow-x-auto -mx-5 -mb-5">
                                    <table className="w-full text-sm min-w-[500px]">
                                        <thead>
                                            <tr className="text-xs uppercase tracking-wider" style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
                                                {[labels.item, labels.batch, labels.qty, labels.price, labels.total, labels.actions].map(h => (
                                                    <th key={h} className={`px-4 py-3 font-semibold ${h === labels.actions ? "text-center" : h === labels.qty || h === labels.price || h === labels.total ? "text-right" : "text-left"}`}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {addedItems.map((it, idx) => (
                                                <tr key={idx} className="transition" style={{ borderBottom: "1px solid var(--border)" }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "var(--surface-muted)"}
                                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                                    <td className="px-4 py-3 font-medium" style={{ color: "var(--ink)" }}>{it.name}</td>
                                                    <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--muted)" }}>{it.batchNumber}</td>
                                                    <td className="px-4 py-3 text-right tabular-nums" style={{ color: "var(--ink)" }}>{it.quantity} <span className="text-xs" style={{ color: "var(--muted)" }}>{it.unit}</span></td>
                                                    <td className="px-4 py-3 text-right tabular-nums" style={{ color: "var(--muted)" }}>{Number(it.pricePerUnit).toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-right tabular-nums font-semibold" style={{ color: "var(--ink)" }}>{Number(it.totalPurchasePrice).toFixed(2)}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex justify-center gap-1">
                                                            <Btn variant="ghost" size="sm" onClick={() => handleEditItem(it, idx)}>{labels.edit}</Btn>
                                                            <Btn variant="danger" size="sm" onClick={() => setAddedItems(p => p.filter((_, i) => i !== idx))}>{labels.remove}</Btn>
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

                    {/* right column */}
                    <div className="w-full lg:w-72 space-y-4 shrink-0">
                        <Card title={labels.billDetails} icon={FileText}>
                            <div className="space-y-3">
                                <Field><Label><Calendar className="inline w-3 h-3 mr-1" />{labels.date}</Label><Inp type="date" name="purchaseDate" value={bill.purchaseDate} onChange={handleBillChange} /></Field>
                                <Field>
                                    <Label><DollarSign className="inline w-3 h-3 mr-1" />{labels.discount}</Label>
                                    <div className="flex gap-2">
                                        <Inp type="number" name="discount" placeholder="0" value={bill.discount} onChange={handleBillChange} className="text-base py-3" />
                                        <Sel className="w-24 shrink-0 text-base py-3" value={bill.discountType} onChange={e => setBill(p => ({ ...p, discountType: e.target.value }))}>
                                            <option value="percentage">{labels.percentage}</option>
                                            <option value="fixed">{labels.fixed}</option>
                                        </Sel>
                                    </div>
                                </Field>
                                <Field><Label>{labels.taxGst}</Label><Inp type="number" name="gst" placeholder="0" value={bill.gst} onChange={handleBillChange} /></Field>
                                <Field><Label><Truck className="inline w-3 h-3 mr-1" />{labels.shipping}</Label><Inp type="number" name="shippingCost" placeholder="0" value={bill.shippingCost} onChange={handleBillChange} /></Field>
                                <Field><Label><File className="inline w-3 h-3 mr-1" />{labels.notes}</Label><Txt name="notes" rows={3} placeholder={labels.optionalNote} value={bill.notes} onChange={handleBillChange} /></Field>
                            </div>
                        </Card>

                        <Card title={labels.summary} icon={DollarSign}>
                            <div className="space-y-2">
                                <SumRow label={labels.subtotal} value={`Rs ${calc.subtotal.toFixed(2)}`} />
                                <SumRow label={labels.discount} value={`− Rs ${calc.discount.toFixed(2)}`} danger />
                                <SumRow label={labels.gst}      value={`+ Rs ${calc.gst.toFixed(2)}`} accent />
                                <SumRow label={labels.shipping} value={`+ Rs ${calc.shipping.toFixed(2)}`} />
                                <div className="pt-3 mt-1 flex justify-between items-center" style={{ borderTop: "1px solid var(--border)" }}>
                                    <span className="font-bold" style={{ color: "var(--ink)" }}>{labels.total}</span>
                                    <span className="text-lg font-black tabular-nums" style={{ color: "var(--accent-2)" }}>Rs {calc.total.toFixed(2)}</span>
                                </div>
                            </div>
                            <Btn variant="primary" className="w-full mt-4" onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? (isUpdate ? labels.updating : labels.submitting) : (isUpdate ? labels.updateBill : labels.submitBill)}
                            </Btn>
                        </Card>
                    </div>
                </div>
            </div>
            {showProductModal && (
                <ProductCRUDModal
                    mode="create"
                    open={showProductModal}
                    onClose={() => setShowProductModal(false)}
                    onSuccess={handleProductCreated}
                />
            )}
            {showSupplierModal && (
                <SupplierModal
                    mode="create"
                    onClose={() => setShowSupplierModal(false)}
                    onSuccess={handleSupplierCreated}
                />
            )}
        </div>
    );
}

export default function PurchaseModal(props) {
    return <ErrorBoundary><PurchaseModalInner {...props} /></ErrorBoundary>;
}




// // src/modules/productPurchases/components/PurchaseModal.jsx
// import { showError, showSuccess }       from "../../../shared/utilities/toastHelpers.js";
// import { Plus, Upload, Download, TrendingUp, Package, Calendar, FileText,
//          DollarSign, Truck, File, X, ChevronDown }  from "lucide-react";
// import { useEffect, useState, useMemo, useCallback, useRef } from "react";
// import { useAllSuppliers }              from "../../suppliers/services/suppliers.service";
// import { useAllPurchases, useCreatePurchase, usePurchase, useUpdatePurchase }
//                                         from "../services/purchases.service";
// import { useProducts }                  from "../../productsModule/services/product.service";
// import { useBatchesByProduct }          from "../services/batch.service";
// import { useSelector }                  from "react-redux";
// import { SearchableSelect }             from "../../../shared/components/FormFields.jsx";

// // ─── helpers ──────────────────────────────────────────────────────────────────
// const toInputDate  = (v) => v ? new Date(v).toISOString().slice(0, 10) : "";
// const sanitize     = (v) => String(v || "").trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "").toUpperCase();
// const makeBatch    = (stamp, custom) => `BAT-${stamp}-${sanitize(custom || "GEN")}`;
// const makeInvoice  = (name, stamp)   => `INV-${sanitize(name || "SUPPLIER")}-${stamp}`;
// const getBatchStamp = (bn) => { const m = /^BAT-([^-]+)-/.exec(bn || ""); return m?.[1] || Date.now().toString(); };

// const emptyItem = () => ({
//     item: "", name: "", quantity: "", unit: "", perItemPrice: "",
//     mfgDate: "", expiryDate: "", batchNumber: "", batchMode: "new",
//     batchCustom: "", batchSelection: "",
//     discount: "", discountType: "percentage", tax: "", taxType: "percentage",
// });

// const emptyBill = () => ({
//     supplier: "", purchaseDate: new Date().toISOString().slice(0, 10),
//     invoiceNumber: "", notes: "", discount: 0, discountType: "percentage",
//     gst: 0, shippingCost: 0, paymentMethod: "cash",
// });

// // ─── atom components using theme tokens ───────────────────────────────────────
// const Label = ({ children }) => (
//     <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
//         style={{ color: "var(--muted)" }}>
//         {children}
//     </label>
// );

// const Field = ({ children, className = "" }) => (
//     <div className={`flex flex-col ${className}`}>{children}</div>
// );

// const Inp = ({ className = "", ...p }) => (
//     <input {...p} className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition
//         focus:ring-2 placeholder-(--muted) ${className}`}
//         style={{
//             background: "var(--surface)",
//             border: "1px solid var(--border)",
//             color: "var(--ink)",
//             "--tw-ring-color": "var(--accent-2)",
//         }} />
// );

// const Txt = ({ className = "", ...p }) => (
//     <textarea {...p} className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition
//         resize-none focus:ring-2 placeholder-(--muted) ${className}`}
//         style={{
//             background: "var(--surface)",
//             border: "1px solid var(--border)",
//             color: "var(--ink)",
//         }} />
// );

// const Sel = ({ className = "", ...p }) => (
//     <select {...p} className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition ${className}`}
//         style={{
//             background: "var(--surface)",
//             border: "1px solid var(--border)",
//             color: "var(--ink)",
//         }} />
// );

// const Btn = ({ children, variant = "primary", size = "md", className = "", ...p }) => {
//     const sz = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-sm" }[size];
//     const styles = {
//         primary:   { background: "var(--accent-2)", color: "#fff" },
//         secondary: { background: "var(--surface-muted)", color: "var(--ink)", border: "1px solid var(--border)" },
//         ghost:     { background: "transparent", color: "var(--muted)" },
//         danger:    { background: "rgba(220,38,38,0.08)", color: "#dc2626" },
//         active:    { background: "var(--accent-2)", color: "#fff" },
//         inactive:  { background: "var(--surface-muted)", color: "var(--muted)", border: "1px solid var(--border)" },
//     };
//     return (
//         <button {...p} style={p.disabled ? { ...styles[variant], opacity: 0.5, cursor: "not-allowed" } : styles[variant]}
//             className={`inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all
//                 active:scale-95 disabled:pointer-events-none cursor-pointer ${sz} ${className}`}>
//             {children}
//         </button>
//     );
// };

// // Searchable dropdown — theme-aware
// const SSelect = ({ options = [], value, onChange, placeholder = "Select..." }) => {
//     const [open, setOpen] = useState(false);
//     const [q, setQ]       = useState("");
//     const ref             = useRef();
//     const selected        = options.find(o => o.value === value);
//     const filtered        = options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()));

//     useEffect(() => {
//         const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
//         document.addEventListener("mousedown", h);
//         return () => document.removeEventListener("mousedown", h);
//     }, []);

//     return (
//         <div ref={ref} className="relative w-full">
//             <button type="button" onClick={() => setOpen(p => !p)}
//                 className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl transition text-left"
//                 style={{ background: "var(--surface)", border: "1px solid var(--border)", color: selected ? "var(--ink)" : "var(--muted)" }}>
//                 <span>{selected?.label || placeholder}</span>
//                 <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
//                     style={{ color: "var(--muted)" }} />
//             </button>
//             {open && (
//                 <div className="absolute z-50 w-full mt-1 rounded-xl shadow-xl overflow-hidden"
//                     style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
//                     <div className="p-2" style={{ borderBottom: "1px solid var(--border)" }}>
//                         <input autoFocus type="text" placeholder="Search..." value={q}
//                             onChange={e => setQ(e.target.value)}
//                             className="w-full px-3 py-1.5 text-sm rounded-lg outline-none"
//                             style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", color: "var(--ink)" }} />
//                     </div>
//                     <div className="max-h-48 overflow-y-auto">
//                         {filtered.length
//                             ? filtered.map(o => (
//                                 <div key={o.value}
//                                     onClick={() => { onChange(o.value); setOpen(false); setQ(""); }}
//                                     className="px-3 py-2 text-sm cursor-pointer transition"
//                                     style={{
//                                         background: value === o.value ? "rgba(15,118,110,0.08)" : "transparent",
//                                         color: value === o.value ? "var(--accent-2)" : "var(--ink)",
//                                         fontWeight: value === o.value ? 600 : 400,
//                                     }}
//                                     onMouseEnter={e => e.currentTarget.style.background = "rgba(15,118,110,0.06)"}
//                                     onMouseLeave={e => e.currentTarget.style.background = value === o.value ? "rgba(15,118,110,0.08)" : "transparent"}>
//                                     {o.label}
//                                 </div>
//                             ))
//                             : <div className="px-3 py-4 text-sm text-center" style={{ color: "var(--muted)" }}>No results</div>
//                         }
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// // Section card
// const Card = ({ title, icon: Icon, children, className = "", noOverflow = false }) => (
//     <div className={`rounded-2xl ${noOverflow ? "" : "overflow-hidden"} ${className}`}
//         style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
//         {title && (
//             <div className="flex items-center gap-2 px-5 py-3"
//                 style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-muted)" }}>
//                 {Icon && <Icon className="w-4 h-4" style={{ color: "var(--accent-2)" }} />}
//                 <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{title}</span>
//             </div>
//         )}
//         <div className="p-5">{children}</div>
//     </div>
// );

// // Summary row
// const SumRow = ({ label, value, accent, danger }) => (
//     <div className="flex justify-between items-center text-sm">
//         <span style={{ color: "var(--muted)" }}>{label}</span>
//         <span className="tabular-nums font-medium"
//             style={{ color: danger ? "#dc2626" : accent ? "var(--accent-2)" : "var(--ink)" }}>
//             {value}
//         </span>
//     </div>
// );

// // ─── main modal ───────────────────────────────────────────────────────────────
// // Props:
// //   mode        "create" | "update"   (default "create")
// //   purchaseId  string                (required when mode="update")
// //   onClose     fn
// //   onSuccess   fn                    called after successful submit — use to trigger list refresh
// export default function PurchaseModal({ mode = "create", purchaseId, onClose, onSuccess }) {
//     const language = useSelector(s => s.auth?.user?.language ?? "en");
//     const t = (en, ur) => language === "en" ? en : ur;
//     const isUpdate = mode === "update";

//     // ─── data hooks ────────────────────────────────────────────
//     const { data: existingPurchase, isLoading: isFetching } =
//         usePurchase(purchaseId, { skip: !isUpdate || !purchaseId });

//     const { data: suppliersRaw }  = useAllSuppliers();
//     const { data: productsRaw }   = useProducts();
//     const { data: purchasesRaw }  = useAllPurchases();

//     const [createPurchase, { isLoading: isCreating }] = useCreatePurchase();
//     const [updatePurchase, { isLoading: isUpdating }] = useUpdatePurchase();
//     const isSubmitting = isCreating || isUpdating;

//     const suppliersList  = suppliersRaw?.data  ?? suppliersRaw  ?? [];
//     const productsList   = productsRaw?.data   ?? productsRaw   ?? [];
//     const previousBills  = purchasesRaw?.data  ?? purchasesRaw  ?? [];

//     // ─── local state ───────────────────────────────────────────
//     const [bill,        setBill]        = useState(emptyBill());
//     const [addedItems,  setAddedItems]  = useState([]);
//     const [itemForm,    setItemForm]    = useState(emptyItem());
//     const [editingIndex,setEditingIndex]= useState(null);
//     const [batchStamp,  setBatchStamp]  = useState(() => Date.now().toString());
//     const [showImport,  setShowImport]  = useState(false);

//     const { data: batchesRaw = [] } =
//         useBatchesByProduct(itemForm.item, { skip: !itemForm.item });
//     const availableBatches = Array.isArray(batchesRaw) ? batchesRaw : [];
//     const selectedBatch    = availableBatches.find(b => b._id === itemForm.batchSelection);
//     const isExistingMode   = itemForm.batchMode === "existing" && Boolean(itemForm.batchSelection);

//     const selectedSupplierName =
//         suppliersList.find(s => s._id === bill.supplier)?.name ?? "";

//     // ─── prefill for update ────────────────────────────────────
//     useEffect(() => {
//         if (!isUpdate || !existingPurchase) return;
//         setBill({
//             supplier:     existingPurchase.supplier?._id ?? existingPurchase.supplier ?? "",
//             purchaseDate: existingPurchase.date
//                 ? new Date(existingPurchase.date).toISOString().slice(0, 10)
//                 : new Date().toISOString().slice(0, 10),
//             invoiceNumber: existingPurchase.invoiceNumber ?? "",
//             notes:         existingPurchase.notes         ?? "",
//             discount:      existingPurchase.discount      ?? 0,
//             discountType:  existingPurchase.discountType  ?? "percentage",
//             gst:           existingPurchase.gst           ?? 0,
//             shippingCost:  existingPurchase.shippingCost  ?? 0,
//             paymentMethod: "cash",
//         });
//         setAddedItems((existingPurchase.items ?? []).map(it => ({
//             item:              it.product?._id ?? it.product ?? "",
//             name:              it.product?.name ?? "",
//             quantity:          it.quantity  ?? 0,
//             unit:              it.unit      ?? "",
//             pricePerUnit:      it.price     ?? 0,
//             totalPurchasePrice:(it.quantity ?? 0) * (it.price ?? 0),
//             mfgDate:           toInputDate(it.mfgDate),
//             expiryDate:        toInputDate(it.expiryDate),
//             batchNumber:       it.batchNumber ?? "",
//             batchMode:         it.batchId ? "existing" : "new",
//             batchCustom:       "",
//             batchSelection:    it.batchId ?? "",
//             batchId:           it.batchId ?? "",
//             discount:          it.discount  ?? 0,
//             discountType:      it.discountType ?? "percentage",
//             tax:               it.tax          ?? 0,
//             taxType:           it.taxType      ?? "percentage",
//         })));
//     }, [existingPurchase, isUpdate]);

//     // ─── auto-invoice (create mode only) ──────────────────────
//     useEffect(() => {
//         if (isUpdate || !bill.supplier) return;
//         const inv = makeInvoice(selectedSupplierName, Date.now().toString());
//         setBill(p => p.invoiceNumber === inv ? p : { ...p, invoiceNumber: inv });
//     }, [bill.supplier, selectedSupplierName, isUpdate]);

//     // ─── batch number build (new mode) ────────────────────────
//     useEffect(() => {
//         if (itemForm.batchMode !== "new") return;
//         const bn = makeBatch(batchStamp, itemForm.batchCustom);
//         setItemForm(p => p.batchNumber === bn ? p : { ...p, batchNumber: bn, batchSelection: "" });
//     }, [itemForm.batchMode, itemForm.batchCustom, batchStamp]);

//     // ─── autofill from existing batch ─────────────────────────
//     useEffect(() => {
//         if (!selectedBatch || !isExistingMode) return;
//         const price = selectedBatch.purchasePrice != null ? String(selectedBatch.purchasePrice) : null;
//         setItemForm(p => ({
//             ...p,
//             batchNumber:  selectedBatch.batchNumber ?? p.batchNumber,
//             perItemPrice: price ?? p.perItemPrice,
//             mfgDate:      toInputDate(selectedBatch.mfgDate),
//             expiryDate:   toInputDate(selectedBatch.expiryDate),
//         }));
//     }, [selectedBatch, isExistingMode]);

//     // ─── autofill unit from product ───────────────────────────
//     useEffect(() => {
//         if (!itemForm.item) return;
//         const prod = productsList.find(p => p._id === itemForm.item);
//         if (!prod) return;
//         setItemForm(p => p.unit === (prod.unit ?? "unit") ? p : { ...p, unit: prod.unit ?? "unit" });
//     }, [itemForm.item, productsList]);

//     // ─── calculations ──────────────────────────────────────────
//     const calc = useMemo(() => {
//         const subtotal      = addedItems.reduce((s, it) => s + (Number(it.totalPurchasePrice) || 0), 0);
//         const discountAmt   = bill.discountType === "percentage"
//             ? (subtotal * Number(bill.discount || 0)) / 100
//             : Number(bill.discount || 0);
//         const afterDiscount = subtotal - discountAmt;
//         const gst           = (afterDiscount * Number(bill.gst || 0)) / 100;
//         const shipping      = Number(bill.shippingCost || 0);
//         return { subtotal, discount: discountAmt, gst, shipping, total: afterDiscount + gst + shipping };
//     }, [addedItems, bill]);

//     // ─── frequent items (create mode hint) ────────────────────
//     const frequentItems = useMemo(() => {
//         if (!bill.supplier || !previousBills?.length) return [];
//         const freq = {};
//         previousBills
//             .filter(b => (b.supplier?._id ?? b.supplier) === bill.supplier)
//             .forEach(b => b.items?.forEach(it => {
//                 const id = it.product?._id ?? it.product;
//                 if (!id) return;
//                 if (!freq[id]) freq[id] = { ...it, count: 0, prices: [] };
//                 freq[id].count++;
//                 freq[id].prices.push(it.price ?? it.pricePerUnit ?? 0);
//             }));
//         return Object.values(freq)
//             .sort((a, b) => b.count - a.count).slice(0, 5)
//             .map(f => ({
//                 ...f,
//                 avgPrice: (f.prices.reduce((a, b) => a + b, 0) / f.prices.length).toFixed(2),
//             }));
//     }, [bill.supplier, previousBills]);

//     // ─── handlers ──────────────────────────────────────────────
//     const handleBillChange  = e => setBill(p => ({ ...p, [e.target.name]: e.target.value }));
//     const handleItemChange  = e => setItemForm(p => ({ ...p, [e.target.name]: e.target.value }));

//     const handleBatchSelect = (val) => {
//         const b = availableBatches.find(b => b._id === val);
//         if (!b) return;
//         setItemForm(p => ({
//             ...p, batchMode: "existing", batchCustom: "", batchSelection: val,
//             batchNumber:  b.batchNumber ?? p.batchNumber,
//             perItemPrice: b.purchasePrice != null ? String(b.purchasePrice) : p.perItemPrice,
//             mfgDate:      toInputDate(b.mfgDate),
//             expiryDate:   toInputDate(b.expiryDate),
//         }));
//     };

//     const handleAddItem = () => {
//         if (!bill.supplier) return showError(t("Select supplier first.", "سپلائر منتخب کریں۔"));
//         if (!itemForm.item) return showError(t("Select item.", "آئٹم منتخب کریں۔"));
//         if (!itemForm.quantity || Number(itemForm.quantity) <= 0) return showError(t("Enter valid quantity.", "صحیح مقدار درج کریں۔"));
//         if (itemForm.perItemPrice === "" || Number(itemForm.perItemPrice) < 0) return showError(t("Enter valid price.", "صحیح قیمت درج کریں۔"));
//         if (itemForm.batchMode === "existing" && !itemForm.batchSelection) return showError(t("Select batch.", "بیچ منتخب کریں۔"));

//         const prod    = productsList.find(p => p._id === itemForm.item);
//         const total   = Number(itemForm.quantity) * Number(itemForm.perItemPrice);
//         const batchNo = itemForm.batchMode === "new"
//             ? makeBatch(batchStamp, itemForm.batchCustom)
//             : itemForm.batchNumber?.trim();
//         if (!batchNo) return showError("Batch number required.");

//         const row = {
//             item: itemForm.item, name: prod?.name ?? "Unknown",
//             quantity: Number(itemForm.quantity), unit: itemForm.unit,
//             pricePerUnit: Number(itemForm.perItemPrice), totalPurchasePrice: total,
//             mfgDate: itemForm.mfgDate, expiryDate: itemForm.expiryDate,
//             batchNumber: batchNo, batchMode: itemForm.batchMode,
//             batchCustom: itemForm.batchCustom ?? "",
//             batchSelection: itemForm.batchMode === "existing" ? itemForm.batchSelection : "",
//             batchId:        itemForm.batchMode === "existing" ? itemForm.batchSelection : "",
//             discount: Number(itemForm.discount) || 0, discountType: itemForm.discountType,
//             tax:      Number(itemForm.tax)      || 0, taxType:      itemForm.taxType,
//         };

//         if (editingIndex !== null) {
//             setAddedItems(p => p.map((it, i) => i === editingIndex ? row : it));
//             setEditingIndex(null);
//         } else {
//             setAddedItems(p => [...p, row]);
//         }
//         setItemForm(emptyItem());
//         setBatchStamp(Date.now().toString());
//     };

//     const handleEditItem = (it, idx) => {
//         setBatchStamp(getBatchStamp(it.batchNumber));
//         setItemForm({
//             item: it.item, name: it.name, quantity: it.quantity, unit: it.unit,
//             perItemPrice: it.pricePerUnit, mfgDate: it.mfgDate, expiryDate: it.expiryDate,
//             batchNumber: it.batchNumber,
//             batchMode:    it.batchMode ?? (it.batchId ? "existing" : "new"),
//             batchCustom:  it.batchCustom ?? "",
//             batchSelection: it.batchId ?? "",
//             discount: it.discount, discountType: it.discountType,
//             tax:      it.tax,      taxType:      it.taxType,
//         });
//         setEditingIndex(idx);
//     };

//     const handleSubmit = async () => {
//         if (!bill.supplier)   return showError(t("Select supplier.", "سپلائر منتخب کریں۔"));
//         if (!addedItems.length) return showError(t("Add at least one item.", "ایک آئٹم شامل کریں۔"));

//         const payload = {
//             supplier:     bill.supplier,
//             date:         bill.purchaseDate,
//             invoiceNumber: bill.invoiceNumber,
//             subtotal:     calc.subtotal,
//             discount:     Number(bill.discount),
//             discountType: bill.discountType,
//             gst:          Number(bill.gst),
//             shippingCost: Number(bill.shippingCost),
//             totalAmount:  calc.total,
//             notes:        bill.notes ?? "",
//             items: addedItems.map(it => ({
//                 product:      it.item,
//                 batchNumber:  it.batchNumber,
//                 quantity:     it.quantity,
//                 price:        it.pricePerUnit,
//                 discount:     it.discount,
//                 discountType: it.discountType,
//                 tax:          it.tax,
//                 taxType:      it.taxType,
//                 mfgDate:      it.mfgDate    ? new Date(it.mfgDate).toISOString()    : undefined,
//                 expiryDate:   it.expiryDate ? new Date(it.expiryDate).toISOString() : undefined,
//             })),
//         };

//         try {
//             if (isUpdate) {
//                 await updatePurchase({ id: purchaseId, ...payload }).unwrap();
//                 showSuccess(t("Purchase updated!", "خرید اپڈیٹ ہو گئی۔"));
//             } else {
//                 await createPurchase(payload).unwrap();
//                 showSuccess(t("Purchase created!", "خرید محفوظ ہو گئی۔"));
//                 setBill(emptyBill());
//                 setAddedItems([]);
//                 setItemForm(emptyItem());
//             }
//             onSuccess?.();
//             onClose();
//         } catch (e) {
//             showError(e?.data?.message ?? t("Operation failed.", "ناکام۔"));
//         }
//     };

//     const handleExport = () => {
//         const csv = [
//             ["Item","Quantity","Unit","Price","Total","Batch","Mfg","Expiry","Discount","Tax"],
//             ...addedItems.map(it => [
//                 it.name, it.quantity, it.unit, it.pricePerUnit,
//                 it.totalPurchasePrice, it.batchNumber,
//                 it.mfgDate, it.expiryDate, it.discount, it.tax,
//             ]),
//         ].map(r => r.join(",")).join("\n");
//         const a = document.createElement("a");
//         a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
//         a.download = `purchase_${bill.purchaseDate}.csv`;
//         a.click();
//     };

//     const handleBulkImport = (e) => {
//         const file = e.target.files?.[0];
//         if (!file) return;
//         const reader = new FileReader();
//         reader.onload = ev => {
//             try {
//                 const text = ev.target?.result ?? "";
//                 const rows = file.name.endsWith(".json")
//                     ? JSON.parse(text)
//                     : (() => {
//                         const lines   = text.split("\n");
//                         const headers = lines[0].split(",").map(h => h.trim());
//                         return lines.slice(1).filter(l => l.trim()).map(line => {
//                             const vals = line.split(",").map(v => v.trim());
//                             return headers.reduce((o, h, i) => ({ ...o, [h]: vals[i] }), {});
//                         });
//                     })();
//                 const mapped = rows.map(it => {
//                     const found = productsList.find(
//                         p => p.name.toLowerCase() === it.name?.toLowerCase() || p._id === it.itemId
//                     );
//                     if (!found) return null;
//                     const qty   = Number(it.quantity);
//                     const price = Number(it.price ?? it.pricePerUnit);
//                     return {
//                         item: found._id, name: found.name, quantity: qty,
//                         unit: it.unit ?? found.unit ?? "unit",
//                         pricePerUnit: price, totalPurchasePrice: qty * price,
//                         mfgDate: it.mfgDate ?? "", expiryDate: it.expiryDate ?? "",
//                         batchNumber: it.batchNumber ?? "",
//                         batchMode: "new", batchCustom: "", batchSelection: "", batchId: "",
//                         discount: Number(it.discount) || 0, discountType: it.discountType ?? "percentage",
//                         tax:      Number(it.tax)      || 0, taxType:      it.taxType      ?? "percentage",
//                     };
//                 }).filter(Boolean);
//                 setAddedItems(p => [...p, ...mapped]);
//                 showSuccess(`Imported ${mapped.length} items`);
//             } catch {
//                 showError("Import failed");
//             }
//         };
//         reader.readAsText(file);
//     };

//     // loading state for update prefill
//     if (isUpdate && isFetching && !existingPurchase) return (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
//             <div className="rounded-2xl p-8 text-sm" style={{ background: "var(--surface)", color: "var(--muted)" }}>
//                 Loading…
//             </div>
//         </div>
//     );

//     // ─── render ────────────────────────────────────────────────
//     return (
//         <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-3 overflow-y-auto"
//             onClick={onClose}>
//             <div className="relative w-full max-w-6xl my-4 rounded-3xl shadow-2xl overflow-hidden"
//                 style={{ background: "var(--app-bg)", border: "1px solid var(--border)" }}
//                 onClick={e => e.stopPropagation()}>

//                 {/* ── header ──────────────────────────────────── */}
//                 <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
//                     style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
//                     <div className="flex items-center gap-3">
//                         <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
//                             style={{ background: "var(--accent-2)" }}>
//                             <Package className="w-4 h-4 text-white" />
//                         </div>
//                         <div>
//                             <h2 className="text-base font-bold leading-tight" style={{ color: "var(--ink)" }}>
//                                 {isUpdate ? t("Update Purchase", "خرید اپڈیٹ") : t("New Purchase Bill", "نئی خرید")}
//                             </h2>
//                             <p className="text-xs" style={{ color: "var(--muted)" }}>
//                                 {isUpdate ? bill.invoiceNumber : t("Purchase Management", "خریداری")}
//                             </p>
//                         </div>
//                     </div>

//                     <div className="flex items-center gap-2">
//                         {!isUpdate && (
//                             <Btn variant="secondary" size="sm" onClick={() => setShowImport(p => !p)}>
//                                 <Upload className="w-3.5 h-3.5" />
//                                 <span className="hidden sm:inline">Import</span>
//                             </Btn>
//                         )}
//                         {addedItems.length > 0 && (
//                             <Btn variant="secondary" size="sm" onClick={handleExport}>
//                                 <Download className="w-3.5 h-3.5" />
//                                 <span className="hidden sm:inline">Export</span>
//                             </Btn>
//                         )}
//                         <button onClick={onClose}
//                             className="w-8 h-8 flex items-center justify-center rounded-xl transition"
//                             style={{ background: "var(--surface-muted)", color: "var(--muted)" }}>
//                             <X className="w-4 h-4" />
//                         </button>
//                     </div>
//                 </div>

//                 {/* ── bulk import bar ──────────────────────────── */}
//                 {showImport && (
//                     <div className="mx-6 mt-4 p-4 rounded-2xl"
//                         style={{ background: "rgba(180,83,9,0.06)", border: "1px solid rgba(180,83,9,0.2)" }}>
//                         <p className="text-xs font-semibold mb-2" style={{ color: "var(--accent)" }}>
//                             Import CSV / JSON
//                         </p>
//                         <input type="file" accept=".csv,.json" onChange={handleBulkImport}
//                             className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:font-medium file:cursor-pointer"
//                             style={{ color: "var(--muted)" }} />
//                         <p className="text-xs mt-2 font-mono" style={{ color: "var(--muted)" }}>
//                             Format: name,quantity,unit,price,batchNumber,expiryDate
//                         </p>
//                     </div>
//                 )}

//                 {/* ── body ────────────────────────────────────── */}
//                 <div className="p-4 flex gap-5">

//                     {/* ── left column ────────────────────────── */}
//                     <div className="flex-1 space-y-4 min-w-0">

//                         {/* supplier row */}
//                         <Card noOverflow={true}>
//                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                                 <Field>
//                                     <Label>{t("Supplier", "سپلائر")} *</Label>
//                                     <div className="flex gap-2 relative z-50">
//                                         <SearchableSelect
//                                             options={suppliersList.map(s => ({ label: s.name, value: s._id }))}
//                                             value={bill.supplier}
//                                             onChange={val => setBill(p => ({ ...p, supplier: val }))}
//                                             placeholder={t("Select supplier…", "سپلائر…")}
//                                         />
//                                     </div>
//                                 </Field>
//                                 <Field>
//                                     <Label>{t("Invoice No", "انوائس")}</Label>
//                                     <Inp value={bill.invoiceNumber} readOnly
//                                         style={{ background: "var(--surface-muted)", cursor: "not-allowed", color: "var(--muted)" }} />
//                                 </Field>
//                             </div>
//                         </Card>

//                         {/* frequent items hint — create mode only */}
//                         {!isUpdate && bill.supplier && frequentItems.length > 0 && (
//                             <div className="p-4 rounded-2xl"
//                                 style={{ background: "rgba(180,83,9,0.05)", border: "1px solid rgba(180,83,9,0.15)" }}>
//                                 <div className="flex items-center gap-2 mb-3">
//                                     <TrendingUp className="w-4 h-4" style={{ color: "var(--accent)" }} />
//                                     <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
//                                         Frequently purchased
//                                     </span>
//                                 </div>
//                                 <div className="flex flex-wrap gap-2">
//                                     {frequentItems.map((f, i) => {
//                                         const prod = productsList.find(
//                                             p => p._id === (f.product?._id ?? f.item?._id ?? f.product ?? f.item)
//                                         );
//                                         return prod ? (
//                                             <button key={i} onClick={() => {
//                                                 setBatchStamp(Date.now().toString());
//                                                 setItemForm({ ...emptyItem(), item: prod._id, name: prod.name, unit: prod.unit ?? "unit", perItemPrice: f.avgPrice });
//                                             }} className="text-xs px-3 py-1.5 rounded-xl font-medium transition"
//                                                 style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" }}>
//                                                 {prod.name} ×{f.count}
//                                             </button>
//                                         ) : null;
//                                     })}
//                                 </div>
//                             </div>
//                         )}

//                         {/* add / edit item form */}
//                         {bill.supplier && (
//                             <Card
//                                 title={editingIndex !== null
//                                     ? t("Edit Item", "آئٹم ایڈٹ")
//                                     : t("Add Item", "آئٹم شامل کریں")}
//                                 icon={Plus}>
//                                 <div className="space-y-4">

//                                     {/* product + batch mode */}
//                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                                         <Field>
//                                             <Label>{t("Product", "پروڈکٹ")} *</Label>
//                                             <SSelect
//                                                 options={productsList.map(p => ({ label: p.name, value: p._id }))}
//                                                 value={itemForm.item}
//                                                 onChange={val => {
//                                                     const prod = productsList.find(p => p._id === val);
//                                                     if (prod) {
//                                                         setBatchStamp(Date.now().toString());
//                                                         setItemForm(p => ({
//                                                             ...emptyItem(), item: prod._id, name: prod.name,
//                                                             unit: prod.unit ?? "unit",
//                                                             discountType: p.discountType ?? "percentage",
//                                                             taxType:      p.taxType      ?? "percentage",
//                                                         }));
//                                                     }
//                                                 }}
//                                                 placeholder={t("Search product…", "پروڈکٹ…")}
//                                             />
//                                         </Field>
//                                         <Field>
//                                             <Label>Batch Mode</Label>
//                                             <div className="flex gap-2">
//                                                 <Btn variant={itemForm.batchMode === "new" ? "active" : "inactive"}
//                                                     size="sm" className="flex-1"
//                                                     onClick={() => {
//                                                         setBatchStamp(Date.now().toString());
//                                                         setItemForm(p => ({ ...p, batchMode: "new", batchSelection: "", batchCustom: "" }));
//                                                     }}>
//                                                     New
//                                                 </Btn>
//                                                 <Btn variant={itemForm.batchMode === "existing" ? "active" : "inactive"}
//                                                     size="sm" className="flex-1"
//                                                     disabled={!itemForm.item || availableBatches.length === 0}
//                                                     onClick={() => setItemForm(p => ({ ...p, batchMode: "existing" }))}>
//                                                     Existing
//                                                 </Btn>
//                                             </div>
//                                             {itemForm.batchMode === "existing" && (
//                                                 <Sel className="mt-2" value={itemForm.batchSelection}
//                                                     onChange={e => handleBatchSelect(e.target.value)}>
//                                                     <option value="">Select batch…</option>
//                                                     {availableBatches.map(b => (
//                                                         <option key={b._id} value={b._id}>
//                                                             {b.batchNumber} (Qty: {b.quantity})
//                                                         </option>
//                                                     ))}
//                                                 </Sel>
//                                             )}
//                                         </Field>
//                                     </div>

//                                     {/* batch number + quantity */}
//                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                                         <Field>
//                                             <Label>Batch No</Label>
//                                             <Inp value={itemForm.batchNumber} readOnly
//                                                 className="text-xs"
//                                                 style={{ background: "var(--surface-muted)", cursor: "not-allowed", color: "var(--muted)" }} />
//                                             {itemForm.batchMode === "new" && (
//                                                 <Inp name="batchCustom" className="mt-2" placeholder="Custom suffix…"
//                                                     value={itemForm.batchCustom} onChange={handleItemChange} />
//                                             )}
//                                         </Field>
//                                         <Field>
//                                             <Label>{t("Quantity", "مقدار")} *</Label>
//                                             <div className="flex gap-2 items-center">
//                                                 <Inp name="quantity" type="number" placeholder="0"
//                                                     value={itemForm.quantity} onChange={handleItemChange} />
//                                                 <span className="shrink-0 px-3 py-2 text-xs font-semibold rounded-xl"
//                                                     style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", color: "var(--muted)" }}>
//                                                     {itemForm.unit || "unit"}
//                                                 </span>
//                                             </div>
//                                         </Field>
//                                     </div>

//                                     {/* price + discount + tax */}
//                                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
//                                         <Field>
//                                             <Label>Per Item Price *</Label>
//                                             <Inp name="perItemPrice" type="number" placeholder="0.00"
//                                                 value={itemForm.perItemPrice} onChange={handleItemChange} />
//                                         </Field>
//                                         <Field>
//                                             <Label>Discount</Label>
//                                             <Inp name="discount" type="number" placeholder="0"
//                                                 value={itemForm.discount} onChange={handleItemChange} />
//                                         </Field>
//                                         <Field>
//                                             <Label>Disc. Type</Label>
//                                             <Sel value={itemForm.discountType}
//                                                 onChange={e => setItemForm(p => ({ ...p, discountType: e.target.value }))}>
//                                                 <option value="percentage">%</option>
//                                                 <option value="fixed">Fixed</option>
//                                             </Sel>
//                                         </Field>
//                                         <Field>
//                                             <Label>Tax (%)</Label>
//                                             <Inp name="tax" type="number" placeholder="0"
//                                                 value={itemForm.tax} onChange={handleItemChange} />
//                                         </Field>
//                                     </div>

//                                     {/* dates */}
//                                     <div className="grid grid-cols-2 gap-3">
//                                         <Field>
//                                             <Label>Mfg Date</Label>
//                                             <Inp name="mfgDate" type="date"
//                                                 value={itemForm.mfgDate} onChange={handleItemChange} />
//                                         </Field>
//                                         <Field>
//                                             <Label>Expiry Date</Label>
//                                             <Inp name="expiryDate" type="date"
//                                                 value={itemForm.expiryDate} onChange={handleItemChange} />
//                                         </Field>
//                                     </div>

//                                     <Btn variant="primary" className="w-full" onClick={handleAddItem}>
//                                         <Plus className="w-4 h-4" />
//                                         {editingIndex !== null ? t("Update Item", "اپڈیٹ") : t("Add to Bill", "شامل کریں")}
//                                     </Btn>
//                                 </div>
//                             </Card>
//                         )}

//                         {/* added items table */}
//                         {addedItems.length > 0 && (
//                             <Card title={`${t("Items", "آئٹمز")} (${addedItems.length})`} icon={FileText}>
//                                 <div className="overflow-x-auto -mx-5 -mb-5">
//                                     <table className="w-full text-sm">
//                                         <thead>
//                                             <tr className="text-xs uppercase tracking-wider"
//                                                 style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
//                                                 <th className="text-left px-5 py-3 font-semibold">Item</th>
//                                                 <th className="text-left px-3 py-3 font-semibold">Batch</th>
//                                                 <th className="text-right px-3 py-3 font-semibold">Qty</th>
//                                                 <th className="text-right px-3 py-3 font-semibold">Price</th>
//                                                 <th className="text-right px-3 py-3 font-semibold">Total</th>
//                                                 <th className="text-center px-3 py-3 font-semibold">Actions</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {addedItems.map((it, idx) => (
//                                                 <tr key={idx} className="transition"
//                                                     style={{ borderBottom: "1px solid var(--border)" }}
//                                                     onMouseEnter={e => e.currentTarget.style.background = "var(--surface-muted)"}
//                                                     onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
//                                                     <td className="px-5 py-3 font-medium" style={{ color: "var(--ink)" }}>{it.name}</td>
//                                                     <td className="px-3 py-3 font-mono text-xs" style={{ color: "var(--muted)" }}>{it.batchNumber}</td>
//                                                     <td className="px-3 py-3 text-right tabular-nums" style={{ color: "var(--ink)" }}>
//                                                         {it.quantity} <span className="text-xs" style={{ color: "var(--muted)" }}>{it.unit}</span>
//                                                     </td>
//                                                     <td className="px-3 py-3 text-right tabular-nums" style={{ color: "var(--muted)" }}>
//                                                         {Number(it.pricePerUnit).toFixed(2)}
//                                                     </td>
//                                                     <td className="px-3 py-3 text-right tabular-nums font-semibold" style={{ color: "var(--ink)" }}>
//                                                         {Number(it.totalPurchasePrice).toFixed(2)}
//                                                     </td>
//                                                     <td className="px-3 py-3">
//                                                         <div className="flex justify-center gap-1">
//                                                             <Btn variant="ghost" size="sm" onClick={() => handleEditItem(it, idx)}>Edit</Btn>
//                                                             <Btn variant="danger" size="sm" onClick={() => setAddedItems(p => p.filter((_, i) => i !== idx))}>Remove</Btn>
//                                                         </div>
//                                                     </td>
//                                                 </tr>
//                                             ))}
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             </Card>
//                         )}
//                     </div>

//                     {/* ── right column ────────────────────────── */}
//                     <div className="w-72 space-y-4 shrink-0">

//                         {/* bill details */}
//                         <Card title={t("Bill Details", "بل تفصیل")} icon={FileText}>
//                             <div className="space-y-3">
//                                 <Field>
//                                     <Label><Calendar className="inline w-3 h-3 mr-1" />Date</Label>
//                                     <Inp type="date" name="purchaseDate"
//                                         value={bill.purchaseDate} onChange={handleBillChange} />
//                                 </Field>
//                                 <Field>
//                                     <Label><DollarSign className="inline w-3 h-3 mr-1" />Discount</Label>
//                                     <div className="flex gap-2">
//                                         <Inp type="number" name="discount" placeholder="0"
//                                             value={bill.discount} onChange={handleBillChange} />
//                                         <Sel className="w-20 shrink-0" value={bill.discountType}
//                                             onChange={e => setBill(p => ({ ...p, discountType: e.target.value }))}>
//                                             <option value="percentage">%</option>
//                                             <option value="fixed">Fixed</option>
//                                         </Sel>
//                                     </div>
//                                 </Field>
//                                 <Field>
//                                     <Label>Tax / GST (%)</Label>
//                                     <Inp type="number" name="gst" placeholder="0"
//                                         value={bill.gst} onChange={handleBillChange} />
//                                 </Field>
//                                 <Field>
//                                     <Label><Truck className="inline w-3 h-3 mr-1" />Shipping</Label>
//                                     <Inp type="number" name="shippingCost" placeholder="0"
//                                         value={bill.shippingCost} onChange={handleBillChange} />
//                                 </Field>
//                                 <Field>
//                                     <Label><File className="inline w-3 h-3 mr-1" />Notes</Label>
//                                     <Txt name="notes" rows={3} placeholder="Optional note…"
//                                         value={bill.notes} onChange={handleBillChange} />
//                                 </Field>
//                             </div>
//                         </Card>

//                         {/* summary + submit */}
//                         <Card title={t("Summary", "خلاصہ")} icon={DollarSign}>
//                             <div className="space-y-2">
//                                 <SumRow label="Subtotal"  value={`Rs ${calc.subtotal.toFixed(2)}`} />
//                                 <SumRow label="Discount"  value={`− Rs ${calc.discount.toFixed(2)}`} danger />
//                                 <SumRow label="Tax"       value={`+ Rs ${calc.gst.toFixed(2)}`}  accent />
//                                 <SumRow label="Shipping"  value={`+ Rs ${calc.shipping.toFixed(2)}`} />
//                                 <div className="pt-3 mt-1 flex justify-between items-center"
//                                     style={{ borderTop: "1px solid var(--border)" }}>
//                                     <span className="font-bold" style={{ color: "var(--ink)" }}>Total</span>
//                                     <span className="text-lg font-black tabular-nums" style={{ color: "var(--accent-2)" }}>
//                                         Rs {calc.total.toFixed(2)}
//                                     </span>
//                                 </div>
//                             </div>
//                             <Btn variant="primary" className="w-full mt-4" onClick={handleSubmit} disabled={isSubmitting}>
//                                 {isSubmitting
//                                     ? (isUpdate ? "Updating…" : "Submitting…")
//                                     : (isUpdate ? t("Update Bill →", "اپڈیٹ →") : t("Submit Bill →", "جمع کریں →"))}
//                             </Btn>
//                         </Card>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }


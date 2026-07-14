// src/modules/productPurchases/components/PurchaseModal.jsx
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
import { Plus, TrendingUp, Package, Calendar, FileText, DollarSign, Truck, File, X, ChevronDown } from "lucide-react";
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
const toInputDate = (v) => v ? new Date(v).toISOString().slice(0, 10) : "";
const sanitize = (v) => String(v || "").trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "").toUpperCase();
const makeBatch = (stamp) => `BAT-${stamp}-GEN`;
const makeInvoice = (name, stamp) => `INV-${sanitize(name || "SUPPLIER")}-${stamp}`;
const getBatchStamp = (bn) => { const m = /^BAT-([^-]+)-/.exec(bn || ""); return m?.[1] || Date.now().toString(); };

const emptyItem = () => ({
    item: "", name: "", quantity: "", unit: "", perItemPrice: "",
    mfgDate: "", expiryDate: "", batchNumber: "", batchMode: "new", batchSelection: "",
    discount: "", discountType: "percentage", tax: "", taxType: "percentage",
});

const calculateItemDiscountAmount = (quantity, pricePerUnit, discount, discountType) => {
    const baseTotal = Number(quantity || 0) * Number(pricePerUnit || 0);
    const discountValue = Number(discount || 0);
    if (!discountValue) return 0;
    const discountAmount = discountType === "fixed"
        ? discountValue
        : (baseTotal * discountValue) / 100;
    return Math.min(baseTotal, discountAmount);
};

const calculateItemTaxAmount = (quantity, pricePerUnit, discount, discountType, tax, taxType) => {
    const baseTotal = Number(quantity || 0) * Number(pricePerUnit || 0);
    const discountAmount = calculateItemDiscountAmount(quantity, pricePerUnit, discount, discountType);
    const afterDiscount = Math.max(0, baseTotal - discountAmount);
    const taxValue = Number(tax || 0);
    if (!taxValue) return 0;
    return taxType === "fixed" ? taxValue : (afterDiscount * taxValue) / 100;
};

const calculateItemLineTotal = (quantity, pricePerUnit, discount, discountType, tax, taxType) => {
    const baseTotal = Number(quantity || 0) * Number(pricePerUnit || 0);
    const discountAmount = calculateItemDiscountAmount(quantity, pricePerUnit, discount, discountType);
    const afterDiscount = Math.max(0, baseTotal - discountAmount);
    const taxAmount = calculateItemTaxAmount(quantity, pricePerUnit, discount, discountType, tax, taxType);
    return afterDiscount + taxAmount;
};

const emptyBill = () => ({
    supplier: "", purchaseDate: new Date().toISOString().slice(0, 10),
    invoiceNumber: "", notes: "", discount: 0, discountType: "percentage",
    gst: 0, gstType: "percentage", shippingCost: 0,
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
    primary: { background: "var(--accent-2)", color: "#fff" },
    secondary: { background: "var(--surface-muted)", color: "var(--ink)", border: "1px solid var(--border)" },
    ghost: { background: "transparent", color: "var(--muted)" },
    danger: { background: "rgba(220,38,38,0.08)", color: "#dc2626" },
    active: { background: "var(--accent-2)", color: "#fff" },
    inactive: { background: "var(--surface-muted)", color: "var(--muted)", border: "1px solid var(--border)" },
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
                <span className="truncate">{selected?.label || placeholder}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "var(--muted)" }} />
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
            <div className="flex items-center gap-2 px-4 sm:px-5 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-muted)" }}>
                {Icon && <Icon className="w-4 h-4 shrink-0" style={{ color: "var(--accent-2)" }} />}
                <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{title}</span>
            </div>
        )}
        <div className="p-5 sm:p-6">{children}</div>
    </div>
);

const SumRow = ({ label, value, accent, danger }) => (
    <div className="flex flex-col gap-0.5">
        <span className="text-xs" style={{ color: "var(--muted)" }}>{label}</span>
        <span className="tabular-nums font-medium break-all" style={{ color: danger ? "#dc2626" : accent ? "var(--accent-2)" : "var(--ink)" }}>{value}</span>
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
    const isUpdate = mode === "update";

    // data
    const { data: existingPurchase, isLoading: isFetching } = usePurchase(purchaseId, { skip: !isUpdate || !purchaseId });
    const { data: suppliersRaw, refetch: refetchSuppliers } = useAllSuppliers();
    const { data: productsRaw, refetch: refetchProducts } = useProducts();
    const { data: purchasesRaw } = useAllPurchases();
    const [createPurchase, { isLoading: isCreating }] = useCreatePurchase();
    const [updatePurchase, { isLoading: isUpdating }] = useUpdatePurchase();
    const isSubmitting = isCreating || isUpdating;

    const suppliersList = suppliersRaw?.data ?? suppliersRaw ?? [];
    const productsList = productsRaw?.data ?? productsRaw ?? [];
    const previousBills = purchasesRaw?.data ?? purchasesRaw ?? [];
    const supplierOptions = useMemo(() => suppliersList.map(s => ({
        label: s.name,
        value: s._id,
        disabled: s.isActive === false,
    })), [suppliersList]);

    // state
    const [bill, setBill] = useState(emptyBill());
    const [addedItems, setAddedItems] = useState([]);
    const [itemForm, setItemForm] = useState(emptyItem());
    const [editingIndex, setEditingIndex] = useState(null);
    const [batchStamp, setBatchStamp] = useState(() => Date.now().toString());
    const [showProductModal, setShowProductModal] = useState(false);
    const [showSupplierModal, setShowSupplierModal] = useState(false);

    const { data: batchesRaw = [] } = useBatchesByProduct(itemForm.item, { skip: !itemForm.item });
    const availableBatches = Array.isArray(batchesRaw) ? batchesRaw : [];
    const selectedBatch = availableBatches.find(b => b._id === itemForm.batchSelection);
    const isExistingMode = itemForm.batchMode === "existing" && Boolean(itemForm.batchSelection);
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
            supplier: existingPurchase.supplier?._id ?? existingPurchase.supplier ?? "",
            purchaseDate: existingPurchase.date ? new Date(existingPurchase.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            invoiceNumber: existingPurchase.invoiceNumber ?? "",
            notes: existingPurchase.notes ?? "",
            discount: existingPurchase.discount ?? 0,
            discountType: existingPurchase.discountType ?? "percentage",
            gst: existingPurchase.gst ?? 0,
            gstType: existingPurchase.gstType ?? "percentage",
            shippingCost: existingPurchase.shippingCost ?? 0,
        });
        setAddedItems((existingPurchase.items ?? []).map(it => ({
            item: it.product?._id ?? it.product ?? "", name: it.product?.name ?? "",
            quantity: it.quantity ?? 0, unit: it.unit ?? "",
            pricePerUnit: it.price ?? 0, totalPurchasePrice: calculateItemLineTotal(it.quantity ?? 0, it.price ?? 0, it.discount ?? 0, it.discountType ?? "percentage", it.tax ?? 0, it.taxType ?? "percentage"),
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
            batchNumber: selectedBatch.batchNumber ?? p.batchNumber,
            perItemPrice: selectedBatch.purchasePrice != null ? String(selectedBatch.purchasePrice) : p.perItemPrice,
            mfgDate: toInputDate(selectedBatch.mfgDate),
            expiryDate: toInputDate(selectedBatch.expiryDate),
        }));
    }, [selectedBatch, isExistingMode]);

    // autofill unit and auto-select batch mode (only for a fresh product pick, not while editing an existing row)
    useEffect(() => {
        if (!itemForm.item || editingIndex !== null) return;
        const prod = productsList.find(p => p._id === itemForm.item);
        if (prod) {
            setItemForm(p => ({
                ...p,
                unit: prod.unit ?? "unit",
                discountType: prod.discountType ?? "percentage",
                taxType: prod.taxType ?? "percentage"
            }));
        }
    }, [itemForm.item, productsList, editingIndex]);

    // auto-select batch mode based on available batches (only for a fresh product pick, not while editing)
    useEffect(() => {
        if (!itemForm.item || editingIndex !== null) return;
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
    }, [itemForm.item, availableBatches, editingIndex]);

    // calculations
    const calc = useMemo(() => {
        const itemsBase = addedItems.reduce((s, it) => s + Number(it.quantity || 0) * Number(it.pricePerUnit || 0), 0);
        const itemsDiscountTotal = addedItems.reduce((s, it) => s + calculateItemDiscountAmount(it.quantity, it.pricePerUnit, it.discount, it.discountType), 0);
        const itemsTaxTotal = addedItems.reduce((s, it) => s + calculateItemTaxAmount(it.quantity, it.pricePerUnit, it.discount, it.discountType, it.tax, it.taxType), 0);
        const subtotal = addedItems.reduce((s, it) => s + (Number(it.totalPurchasePrice) || 0), 0);
        const billDiscount = bill.discountType === "percentage" ? (subtotal * Number(bill.discount || 0)) / 100 : Number(bill.discount || 0);
        const afterBillDiscount = subtotal - billDiscount;
        const billTax = bill.gstType === "fixed" ? Number(bill.gst || 0) : (afterBillDiscount * Number(bill.gst || 0)) / 100;
        const shipping = Number(bill.shippingCost || 0);
        return { itemsBase, itemsDiscountTotal, itemsTaxTotal, subtotal, billDiscount, billTax, shipping, total: afterBillDiscount + billTax + shipping };
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
            batchNumber: b.batchNumber ?? p.batchNumber,
            perItemPrice: b.purchasePrice != null ? String(b.purchasePrice) : p.perItemPrice,
            mfgDate: toInputDate(b.mfgDate),
            expiryDate: toInputDate(b.expiryDate),
        }));
    };

    const handleAddItem = () => {
        if (!itemForm.item) return showError(labels.selectItem);
        if (!itemForm.quantity || Number(itemForm.quantity) <= 0) return showError(labels.enterValidQuantity);
        if (itemForm.perItemPrice === "" || Number(itemForm.perItemPrice) < 0) return showError(labels.enterValidPrice);
        if (itemForm.batchMode === "existing" && !itemForm.batchSelection) return showError(labels.selectBatch);

        const prod = productsList.find(p => p._id === itemForm.item);
        const batchNo = itemForm.batchMode === "new" ? makeBatch(batchStamp) : itemForm.batchNumber?.trim();
        if (!batchNo) return showError(labels.batchNumberRequired);

        if (editingIndex === null && addedItems.some(it => it.item === itemForm.item)) {
            return showError(labels.productAlreadyAdded || "This product is already added to the bill");
        }

        const row = {
            item: itemForm.item, name: prod?.name ?? "Unknown",
            quantity: Number(itemForm.quantity), unit: itemForm.unit,
            pricePerUnit: Number(itemForm.perItemPrice),
            totalPurchasePrice: calculateItemLineTotal(Number(itemForm.quantity), Number(itemForm.perItemPrice), Number(itemForm.discount) || 0, itemForm.discountType, Number(itemForm.tax) || 0, itemForm.taxType),
            mfgDate: itemForm.mfgDate, expiryDate: itemForm.expiryDate,
            batchNumber: batchNo, batchMode: itemForm.batchMode,
            batchSelection: itemForm.batchMode === "existing" ? itemForm.batchSelection : "",
            batchId: itemForm.batchMode === "existing" ? itemForm.batchSelection : "",
            discount: Number(itemForm.discount) || 0, discountType: itemForm.discountType,
            tax: Number(itemForm.tax) || 0, taxType: itemForm.taxType,
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
            tax: it.tax, taxType: it.taxType,
        });
        setEditingIndex(idx);
    };

    const handleSubmit = async () => {
        if (!addedItems.length) return showError(labels.addAtLeastOneItem);
        if (!bill.supplier) return showError(labels.selectSupplier);
        if (!bill.purchaseDate) return showError(labels.selectDate ?? "Please select a purchase date");

        const payload = {
            supplier: bill.supplier, date: bill.purchaseDate,
            invoiceNumber: bill.invoiceNumber, notes: bill.notes ?? "",
            subtotal: calc.subtotal, discount: Number(bill.discount), discountType: bill.discountType,
            gst: Number(bill.gst), gstType: bill.gstType, shippingCost: Number(bill.shippingCost), totalAmount: calc.total,
            items: addedItems.map(it => ({
                product: it.item, batchNumber: it.batchNumber,
                quantity: it.quantity, price: it.pricePerUnit,
                discount: it.discount, discountType: it.discountType,
                tax: it.tax, taxType: it.taxType,
                mfgDate: it.mfgDate ? new Date(it.mfgDate).toISOString() : undefined,
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

    if (isUpdate && isFetching && !existingPurchase) return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded-2xl p-8 text-sm" style={{ background: "var(--surface)", color: "var(--muted)" }}>Loading…</div>
        </div>
    );

    // ─── render ───────────────────────────────────────────────────────────────
    // layout: [add-item-form | items-added]  →  [bill additional data]  →  [summary]  →  [create purchase]
    // item form no longer depends on supplier selection; supplier/date/items are validated on final submit.
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto" onClick={onClose}>
            <div className="relative w-full max-w-6xl sm:my-4 min-h-full sm:min-h-0 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden" style={{ background: "var(--app-bg)", border: "1px solid var(--border)" }} onClick={e => e.stopPropagation()}>

                {/* header */}
                <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-10" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent-2)" }}><Package className="w-4 h-4 text-white" /></div>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold leading-tight truncate" style={{ color: "var(--ink)" }}>{isUpdate ? labels.editPurchase : labels.newPurchaseBill}</h2>
                            <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{isUpdate ? bill.invoiceNumber : labels.purchaseManagement}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl transition shrink-0" style={{ background: "var(--surface-muted)", color: "var(--muted)" }}><X className="w-4 h-4" /></button>
                    </div>
                </div>

                {/* body */}
                <div className="p-3 sm:p-4 md:p-5 space-y-4">

                    {/* row 1: add item form | items added */}
                    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 xl:gap-6 xl:min-h-[640px]">
                        <Card title={editingIndex !== null ? labels.editItem : labels.addItem} icon={Plus} className="h-full">
                        <div className="space-y-5">
    <div className="grid grid-cols-1 gap-4">
        <Field>
            <Label>{labels.product} *</Label>
            <div className="flex gap-2">
                <SSelect className="flex-1" options={productsList.map(p => ({ label: p.name, value: p._id }))} value={itemForm.item}
                    onChange={val => { const prod = productsList.find(p => p._id === val); if (prod) { setBatchStamp(Date.now().toString()); setItemForm(() => ({ ...emptyItem(), item: prod._id, name: prod.name, unit: prod.unit ?? "unit", discountType: prod.discountType ?? "percentage", taxType: prod.taxType ?? "percentage" })); } }}
                    placeholder={labels.product + "…"} />
                <button type="button" onClick={() => setShowProductModal(true)} className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition flex items-center gap-1 shrink-0" title="Create new product"><Plus size={16} /></button>
            </div>
        </Field>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field><Label>{labels.batchNo}</Label><Inp value={itemForm.batchNumber} readOnly className="text-xs" style={{ background: "var(--surface-muted)", cursor: "not-allowed", color: "var(--muted)" }} /></Field>
        <Field>
            <Label>{labels.batchMode}</Label>
            <div className="flex gap-2">
                <Btn variant={itemForm.batchMode === "new" ? "active" : "inactive"} size="sm" className="flex-1" onClick={() => { setBatchStamp(Date.now().toString()); setItemForm(p => ({ ...p, batchMode: "new", batchSelection: "" })); }}>{labels.new}</Btn>
                <Btn variant={itemForm.batchMode === "existing" ? "active" : "inactive"} size="sm" className="flex-1" disabled={!itemForm.item || availableBatches.length === 0} onClick={() => setItemForm(p => ({ ...p, batchMode: "existing" }))}>{labels.existing}</Btn>
            </div>
            {itemForm.batchMode === "existing" && (
                <Sel className="mt-2" value={itemForm.batchSelection} onChange={e => handleBatchSelect(e.target.value)}>
                    <option value="">{labels.selectBatchPlaceholder}</option>
                    {availableBatches.map(b => <option key={b._id} value={b._id}>{b.batchNumber} (Qty: {b.quantity})</option>)}
                </Sel>
            )}
        </Field>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field>
            <Label>{labels.quantity} *</Label>
            <div className="flex gap-2 items-center">
                <Inp name="quantity" type="number" placeholder="0" value={itemForm.quantity} onChange={handleItemChange} />
                <span className="shrink-0 px-3 py-2 text-xs font-semibold rounded-xl" style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", color: "var(--muted)" }}>{itemForm.unit || "unit"}</span>
            </div>
        </Field>
        <Field><Label>{labels.perItemPrice} *</Label><Inp name="perItemPrice" type="number" placeholder="0.00" value={itemForm.perItemPrice} onChange={handleItemChange} /></Field>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field><Label>{labels.discount}</Label><Inp name="discount" type="number" placeholder="0" value={itemForm.discount} onChange={handleItemChange} /></Field>
        <Field>
            <Label>{labels.discountType}</Label>
            <Sel value={itemForm.discountType} onChange={e => setItemForm(p => ({ ...p, discountType: e.target.value }))}>
                <option value="percentage">{labels.percentage}</option>
                <option value="fixed">{labels.fixed}</option>
            </Sel>
        </Field>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field><Label>{labels.taxPercent}</Label><Inp name="tax" type="number" placeholder="0" value={itemForm.tax} onChange={handleItemChange} /></Field>
        <Field>
            <Label>{labels.taxType || "Tax Type"}</Label>
            <Sel value={itemForm.taxType} onChange={e => setItemForm(p => ({ ...p, taxType: e.target.value }))}>
                <option value="percentage">{labels.percentage}</option>
                <option value="fixed">{labels.fixed}</option>
            </Sel>
        </Field>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field><Label>{labels.mfgDate}</Label><Inp name="mfgDate" type="date" value={itemForm.mfgDate} onChange={handleItemChange} /></Field>
        <Field><Label>{labels.expiryDate}</Label><Inp name="expiryDate" type="date" value={itemForm.expiryDate} onChange={handleItemChange} /></Field>
    </div>

    {!isUpdate && bill.supplier && frequentItems.length > 0 && (
        <div className="p-3 rounded-xl" style={{ background: "rgba(180,83,9,0.05)", border: "1px solid rgba(180,83,9,0.15)" }}>
            <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} /><span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>{labels.frequentlyPurchased}</span></div>
            <div className="flex flex-wrap gap-2">
                {frequentItems.map((f, i) => {
                    const prod = productsList.find(p => p._id === (f.product?._id ?? f.item?._id ?? f.product ?? f.item));
                    return prod ? (
                        <button key={i} onClick={() => { setBatchStamp(Date.now().toString()); setItemForm({ ...emptyItem(), item: prod._id, name: prod.name, unit: prod.unit ?? "unit", perItemPrice: f.avgPrice }); }}
                            className="text-xs px-3 py-1.5 rounded-xl font-medium transition" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" }}>{prod.name} ×{f.count}</button>
                    ) : null;
                })}
            </div>
        </div>
    )}

    <Btn variant="primary" className="w-full" onClick={handleAddItem}><Plus className="w-4 h-4" />{editingIndex !== null ? labels.updateItem : labels.addToBill}</Btn>
</div>
                        </Card>

                        <Card title={`${labels.items} (${addedItems.length})`} icon={FileText} className="h-full">
                            {addedItems.length ? (
                                <div className="overflow-x-auto -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 max-h-[600px] overflow-y-auto">
                                    <table className="w-full text-sm min-w-[480px]">
                                        <thead>
                                            <tr className="text-xs uppercase tracking-wider" style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
                                                {[labels.item, labels.batch, labels.qty, labels.price, labels.discount, labels.tax, labels.total, labels.actions].map(h => (
                                                    <th key={h} className={`px-2 sm:px-3 py-3 font-semibold ${h === labels.actions ? "text-center" : h === labels.qty || h === labels.price || h === labels.total ? "text-right" : "text-left"}`}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {addedItems.map((it, idx) => (
                                                <tr key={idx} className="transition" style={{ borderBottom: "1px solid var(--border)" }} onMouseEnter={e => e.currentTarget.style.background = "var(--surface-muted)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                                    <td className="px-2 sm:px-3 py-3 font-medium" style={{ color: "var(--ink)" }}>{it.name}</td>
                                                    <td className="px-2 sm:px-3 py-3 font-mono text-xs" style={{ color: "var(--muted)" }}>{it.batchNumber}</td>
                                                    <td className="px-2 sm:px-3 py-3 text-right tabular-nums" style={{ color: "var(--ink)" }}>{it.quantity} <span className="text-xs" style={{ color: "var(--muted)" }}>{it.unit}</span></td>
                                                    <td className="px-2 sm:px-3 py-3 text-right tabular-nums" style={{ color: "var(--muted)" }}>{Number(it.pricePerUnit).toFixed(2)}</td>
                                                    <td className="px-2 sm:px-3 py-3 text-right tabular-nums" style={{ color: "var(--muted)" }}>{`${Number(it.discount || 0).toFixed(2)} ${it.discountType === "fixed" ? labels.fixed : labels.percentage}`}</td>
                                                    <td className="px-2 sm:px-3 py-3 text-right tabular-nums" style={{ color: "var(--muted)" }}>{`${Number(it.tax || 0).toFixed(2)} ${it.taxType === "fixed" ? labels.fixed : labels.percentage}`}</td>
                                                    <td className="px-2 sm:px-3 py-3 text-right tabular-nums font-semibold" style={{ color: "var(--ink)" }}>{Number(it.totalPurchasePrice).toFixed(2)}</td>
                                                    <td className="px-2 sm:px-3 py-3"><div className="flex justify-center gap-1"><Btn variant="ghost" size="sm" onClick={() => handleEditItem(it, idx)}>{labels.edit}</Btn><Btn variant="danger" size="sm" onClick={() => setAddedItems(p => p.filter((_, i) => i !== idx))}>{labels.remove}</Btn></div></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-sm text-center py-8" style={{ color: "var(--muted)" }}>{labels.addAtLeastOneItem}</p>
                            )}
                        </Card>
                    </div>

                    {/* row 2: bill additional data (supplier + invoice no + other bill detail) */}
                    <Card title={labels.billDetails} icon={FileText} noOverflow>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Field>
                                <Label>{labels.supplier} *</Label>
                                <div className="flex gap-2">
                                    <div className="relative z-50 flex-1"><SearchableSelect options={supplierOptions} value={bill.supplier} onChange={val => setBill(p => ({ ...p, supplier: val }))} placeholder={labels.selectSupplier + "…"} /></div>
                                    <button type="button" onClick={() => setShowSupplierModal(true)} className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition flex items-center gap-1 shrink-0" title="Create new supplier"><Plus size={16} /></button>
                                </div>
                            </Field>
                            <Field><Label>{labels.invoiceNo}</Label><Inp value={bill.invoiceNumber} readOnly style={{ background: "var(--surface-muted)", cursor: "not-allowed", color: "var(--muted)" }} /></Field>
                            <Field><Label><Calendar className="inline w-3 h-3 mr-1" />{labels.date} *</Label><Inp type="date" name="purchaseDate" value={bill.purchaseDate} onChange={handleBillChange} /></Field>
                            <Field>
                                <Label><DollarSign className="inline w-3 h-3 mr-1" />{labels.discount}</Label>
                                <div className="flex gap-2">
                                    <Inp type="number" name="discount" placeholder="0" value={bill.discount} onChange={handleBillChange} />
                                    <Sel className="w-20 sm:w-24 shrink-0" value={bill.discountType} onChange={e => setBill(p => ({ ...p, discountType: e.target.value }))}>
                                        <option value="percentage">{labels.percentage}</option>
                                        <option value="fixed">{labels.fixed}</option>
                                    </Sel>
                                </div>
                            </Field>
                            <Field>
                                <Label>{labels.taxGst}</Label>
                                <div className="flex gap-2">
                                    <Inp type="number" name="gst" placeholder="0" value={bill.gst} onChange={handleBillChange} />
                                    <Sel className="w-20 sm:w-24 shrink-0" value={bill.gstType} onChange={e => setBill(p => ({ ...p, gstType: e.target.value }))}>
                                        <option value="percentage">{labels.percentage}</option>
                                        <option value="fixed">{labels.fixed}</option>
                                    </Sel>
                                </div>
                            </Field>
                            <Field><Label><Truck className="inline w-3 h-3 mr-1" />{labels.shipping}</Label><Inp type="number" name="shippingCost" placeholder="0" value={bill.shippingCost} onChange={handleBillChange} /></Field>
                            <Field className="sm:col-span-2 lg:col-span-2"><Label><File className="inline w-3 h-3 mr-1" />{labels.notes}</Label><Txt name="notes" rows={1} placeholder={labels.optionalNote} value={bill.notes} onChange={handleBillChange} /></Field>
                        </div>
                    </Card>

                    {/* row 3: summary */}
                    <Card title={labels.summary} icon={DollarSign}>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            <SumRow label={labels.subtotal} value={`Rs ${calc.itemsBase.toFixed(2)}`} />
                            <SumRow label={`${labels.discount} (${labels.items})`} value={`− Rs ${calc.itemsDiscountTotal.toFixed(2)}`} danger />
                            <SumRow label={`${labels.taxGst} (${labels.items})`} value={`+ Rs ${calc.itemsTaxTotal.toFixed(2)}`} accent />
                            <SumRow label={labels.total + " (" + labels.items + ")"} value={`Rs ${calc.subtotal.toFixed(2)}`} />
                            <SumRow label={`${labels.discount} (${labels.billDetails})`} value={`− Rs ${calc.billDiscount.toFixed(2)}`} danger />
                            <SumRow label={`${labels.taxGst} (${labels.billDetails})`} value={`+ Rs ${calc.billTax.toFixed(2)}`} accent />
                            <SumRow label={labels.shipping} value={`+ Rs ${calc.shipping.toFixed(2)}`} />
                        </div>
                        <div className="pt-3 mt-3 flex justify-between items-center gap-2" style={{ borderTop: "1px solid var(--border)" }}>
                            <span className="font-bold" style={{ color: "var(--ink)" }}>{labels.total}</span>
                            <span className="text-base sm:text-lg font-black tabular-nums" style={{ color: "var(--accent-2)" }}>Rs {calc.total.toFixed(2)}</span>
                        </div>
                    </Card>

                    {/* row 4: create purchase */}
                    <Btn variant="primary" className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (isUpdate ? labels.updating : labels.submitting) : (isUpdate ? labels.updateBill : labels.submitBill)}
                    </Btn>
                </div>
            </div>
            {showProductModal && <ProductCRUDModal mode="create" open={showProductModal} onClose={() => setShowProductModal(false)} onSuccess={handleProductCreated} />}
            {showSupplierModal && <SupplierModal mode="create" onClose={() => setShowSupplierModal(false)} onSuccess={handleSupplierCreated} />}
        </div>
    );
}

export default function PurchaseModal(props) {
    return <ErrorBoundary><PurchaseModalInner {...props} /></ErrorBoundary>;
}


















































// // src/modules/productPurchases/components/PurchaseModal.jsx
// import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
// import { Plus, TrendingUp, Package, Calendar, FileText, DollarSign, Truck, File, X, ChevronDown } from "lucide-react";
// import { useEffect, useState, useMemo, useRef } from "react";
// import { useAllSuppliers } from "../../suppliers/services/suppliers.service";
// import { useAllPurchases, useCreatePurchase, usePurchase, useUpdatePurchase } from "../services/purchases.service";
// import { useProducts } from "../../productsModule/services/product.service";
// import { useBatchesByProduct } from "../services/batch.service";
// import { SearchableSelect } from "../../../shared/components/FormFields.jsx";
// import ProductCRUDModal from "../../productsModule/components/ProductCRUDModal.jsx";
// import SupplierModal from "../../suppliers/components/SupplierModal.jsx";
// import { getPurchaseLabels } from "../labels/purchaseLabels.js";
// import { useSettings } from "../../settings/hooks/useSettings.js";

// // ─── constants ────────────────────────────────────────────────────────────────
// const toInputDate = (v) => v ? new Date(v).toISOString().slice(0, 10) : "";
// const sanitize = (v) => String(v || "").trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "").toUpperCase();
// const makeBatch = (stamp) => `BAT-${stamp}-GEN`;
// const makeInvoice = (name, stamp) => `INV-${sanitize(name || "SUPPLIER")}-${stamp}`;
// const getBatchStamp = (bn) => { const m = /^BAT-([^-]+)-/.exec(bn || ""); return m?.[1] || Date.now().toString(); };

// const emptyItem = () => ({
//     item: "", name: "", quantity: "", unit: "", perItemPrice: "",
//     mfgDate: "", expiryDate: "", batchNumber: "", batchMode: "new", batchSelection: "",
//     discount: "", discountType: "percentage", tax: "", taxType: "percentage",
// });

// const calculateItemLineTotal = (quantity, pricePerUnit, discount, discountType) => {
//     const baseTotal = Number(quantity || 0) * Number(pricePerUnit || 0);
//     const discountValue = Number(discount || 0);
//     if (!discountValue) return baseTotal;
//     const discountAmount = discountType === "fixed"
//         ? discountValue
//         : (baseTotal * discountValue) / 100;
//     return Math.max(0, baseTotal - discountAmount);
// };

// const emptyBill = () => ({
//     supplier: "", purchaseDate: new Date().toISOString().slice(0, 10),
//     invoiceNumber: "", notes: "", discount: 0, discountType: "percentage",
//     gst: 0, shippingCost: 0,
// });

// // ─── primitives ───────────────────────────────────────────────────────────────
// const Label = ({ children }) => <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--muted)" }}>{children}</label>;
// const Field = ({ children, className = "" }) => <div className={`flex flex-col ${className}`}>{children}</div>;

// const inputBase = `w-full px-3 py-2 text-sm rounded-xl outline-none transition focus:ring-2 placeholder-(--muted)`;
// const inputStyle = { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)", "--tw-ring-color": "var(--accent-2)" };

// const Inp = ({ className = "", style: s = {}, ...p }) => <input {...p} className={`${inputBase} ${className}`} style={{ ...inputStyle, ...s }} />;
// const Txt = ({ className = "", ...p }) => <textarea {...p} className={`${inputBase} resize-none ${className}`} style={inputStyle} />;
// const Sel = ({ className = "", ...p }) => <select {...p} className={`${inputBase} ${className}`} style={inputStyle} />;

// const btnVariants = {
//     primary: { background: "var(--accent-2)", color: "#fff" },
//     secondary: { background: "var(--surface-muted)", color: "var(--ink)", border: "1px solid var(--border)" },
//     ghost: { background: "transparent", color: "var(--muted)" },
//     danger: { background: "rgba(220,38,38,0.08)", color: "#dc2626" },
//     active: { background: "var(--accent-2)", color: "#fff" },
//     inactive: { background: "var(--surface-muted)", color: "var(--muted)", border: "1px solid var(--border)" },
// };
// const btnSizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-sm" };

// const Btn = ({ children, variant = "primary", size = "md", className = "", ...p }) => (
//     <button {...p} style={p.disabled ? { ...btnVariants[variant], opacity: 0.5, cursor: "not-allowed" } : btnVariants[variant]}
//         className={`inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-95 disabled:pointer-events-none cursor-pointer ${btnSizes[size]} ${className}`}>
//         {children}
//     </button>
// );

// // ─── searchable select ────────────────────────────────────────────────────────
// const SSelect = ({ options = [], value, onChange, placeholder = "Select..." }) => {
//     const [open, setOpen] = useState(false);
//     const [q, setQ] = useState("");
//     const ref = useRef();
//     const selected = options.find(o => o.value === value);
//     const filtered = options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()));

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
//                 <span className="truncate">{selected?.label || placeholder}</span>
//                 <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "var(--muted)" }} />
//             </button>
//             {open && (
//                 <div className="absolute z-50 w-full mt-1 rounded-xl shadow-xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
//                     <div className="p-2" style={{ borderBottom: "1px solid var(--border)" }}>
//                         <input autoFocus type="text" placeholder="Search..." value={q} onChange={e => setQ(e.target.value)}
//                             className="w-full px-3 py-1.5 text-sm rounded-lg outline-none"
//                             style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", color: "var(--ink)" }} />
//                     </div>
//                     <div className="max-h-48 overflow-y-auto">
//                         {filtered.length
//                             ? filtered.map(o => (
//                                 <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); setQ(""); }}
//                                     className="px-3 py-2 text-sm cursor-pointer transition"
//                                     style={{ background: value === o.value ? "rgba(15,118,110,0.08)" : "transparent", color: value === o.value ? "var(--accent-2)" : "var(--ink)", fontWeight: value === o.value ? 600 : 400 }}
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

// // ─── layout atoms ─────────────────────────────────────────────────────────────
// const Card = ({ title, icon: Icon, children, className = "", noOverflow = false }) => (
//     <div className={`rounded-2xl ${noOverflow ? "" : "overflow-hidden"} ${className}`} style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
//         {title && (
//             <div className="flex items-center gap-2 px-4 sm:px-5 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-muted)" }}>
//                 {Icon && <Icon className="w-4 h-4 shrink-0" style={{ color: "var(--accent-2)" }} />}
//                 <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{title}</span>
//             </div>
//         )}
//         <div className="p-4 sm:p-5">{children}</div>
//     </div>
// );

// const SumRow = ({ label, value, accent, danger }) => (
//     <div className="flex flex-col gap-0.5">
//         <span className="text-xs" style={{ color: "var(--muted)" }}>{label}</span>
//         <span className="tabular-nums font-medium break-all" style={{ color: danger ? "#dc2626" : accent ? "var(--accent-2)" : "var(--ink)" }}>{value}</span>
//     </div>
// );

// // ─── error boundary ───────────────────────────────────────────────────────────
// import { Component } from "react";
// class ErrorBoundary extends Component {
//     state = { error: null };
//     static getDerivedStateFromError(e) { return { error: e }; }
//     render() {
//         if (this.state.error) return (
//             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
//                 <div className="rounded-2xl p-8 max-w-sm w-full text-center space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
//                     <p className="font-semibold" style={{ color: "var(--ink)" }}>Something went wrong</p>
//                     <p className="text-sm" style={{ color: "var(--muted)" }}>{this.state.error?.message || "Unexpected error"}</p>
//                     <Btn variant="secondary" onClick={() => this.setState({ error: null })}>Dismiss</Btn>
//                 </div>
//             </div>
//         );
//         return this.props.children;
//     }
// }

// // ─── main modal ───────────────────────────────────────────────────────────────
// function PurchaseModalInner({ mode = "create", purchaseId, onClose, onSuccess }) {
//     const { settings } = useSettings();
//     const language = settings?.language || "en";
//     const labels = getPurchaseLabels(language);
//     const isUpdate = mode === "update";

//     // data
//     const { data: existingPurchase, isLoading: isFetching } = usePurchase(purchaseId, { skip: !isUpdate || !purchaseId });
//     const { data: suppliersRaw, refetch: refetchSuppliers } = useAllSuppliers();
//     const { data: productsRaw, refetch: refetchProducts } = useProducts();
//     const { data: purchasesRaw } = useAllPurchases();
//     const [createPurchase, { isLoading: isCreating }] = useCreatePurchase();
//     const [updatePurchase, { isLoading: isUpdating }] = useUpdatePurchase();
//     const isSubmitting = isCreating || isUpdating;

//     const suppliersList = suppliersRaw?.data ?? suppliersRaw ?? [];
//     const productsList = productsRaw?.data ?? productsRaw ?? [];
//     const previousBills = purchasesRaw?.data ?? purchasesRaw ?? [];
//     const supplierOptions = useMemo(() => suppliersList.map(s => ({
//         label: s.name,
//         value: s._id,
//         disabled: s.isActive === false,
//     })), [suppliersList]);

//     // state
//     const [bill, setBill] = useState(emptyBill());
//     const [addedItems, setAddedItems] = useState([]);
//     const [itemForm, setItemForm] = useState(emptyItem());
//     const [editingIndex, setEditingIndex] = useState(null);
//     const [batchStamp, setBatchStamp] = useState(() => Date.now().toString());
//     const [showProductModal, setShowProductModal] = useState(false);
//     const [showSupplierModal, setShowSupplierModal] = useState(false);

//     const { data: batchesRaw = [] } = useBatchesByProduct(itemForm.item, { skip: !itemForm.item });
//     const availableBatches = Array.isArray(batchesRaw) ? batchesRaw : [];
//     const selectedBatch = availableBatches.find(b => b._id === itemForm.batchSelection);
//     const isExistingMode = itemForm.batchMode === "existing" && Boolean(itemForm.batchSelection);
//     const selectedSupplierName = suppliersList.find(s => s._id === bill.supplier)?.name ?? "";

//     const handleProductCreated = () => {
//         setShowProductModal(false);
//         refetchProducts();
//     };

//     const handleSupplierCreated = () => {
//         setShowSupplierModal(false);
//         refetchSuppliers();
//     };

//     // prefill update
//     useEffect(() => {
//         if (!isUpdate || !existingPurchase) return;
//         setBill({
//             supplier: existingPurchase.supplier?._id ?? existingPurchase.supplier ?? "",
//             purchaseDate: existingPurchase.date ? new Date(existingPurchase.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
//             invoiceNumber: existingPurchase.invoiceNumber ?? "",
//             notes: existingPurchase.notes ?? "",
//             discount: existingPurchase.discount ?? 0,
//             discountType: existingPurchase.discountType ?? "percentage",
//             gst: existingPurchase.gst ?? 0,
//             shippingCost: existingPurchase.shippingCost ?? 0,
//         });
//         setAddedItems((existingPurchase.items ?? []).map(it => ({
//             item: it.product?._id ?? it.product ?? "", name: it.product?.name ?? "",
//             quantity: it.quantity ?? 0, unit: it.unit ?? "",
//             pricePerUnit: it.price ?? 0, totalPurchasePrice: calculateItemLineTotal(it.quantity ?? 0, it.price ?? 0, it.discount ?? 0, it.discountType ?? "percentage"),
//             mfgDate: toInputDate(it.mfgDate), expiryDate: toInputDate(it.expiryDate),
//             batchNumber: it.batchNumber ?? "", batchMode: it.batchId ? "existing" : "new",
//             batchSelection: it.batchId ?? "", batchId: it.batchId ?? "",
//             discount: it.discount ?? 0, discountType: it.discountType ?? "percentage",
//             tax: it.tax ?? 0, taxType: it.taxType ?? "percentage",
//         })));
//     }, [existingPurchase, isUpdate]);

//     // auto-invoice
//     useEffect(() => {
//         if (isUpdate || !bill.supplier) return;
//         const inv = makeInvoice(selectedSupplierName, Date.now().toString());
//         setBill(p => p.invoiceNumber === inv ? p : { ...p, invoiceNumber: inv });
//     }, [bill.supplier, selectedSupplierName, isUpdate]);

//     // batch number (new mode)
//     useEffect(() => {
//         if (itemForm.batchMode !== "new") return;
//         const bn = makeBatch(batchStamp);
//         setItemForm(p => p.batchNumber === bn ? p : { ...p, batchNumber: bn, batchSelection: "" });
//     }, [itemForm.batchMode, batchStamp]);

//     // autofill from existing batch
//     useEffect(() => {
//         if (!selectedBatch || !isExistingMode) return;
//         setItemForm(p => ({
//             ...p,
//             batchNumber: selectedBatch.batchNumber ?? p.batchNumber,
//             perItemPrice: selectedBatch.purchasePrice != null ? String(selectedBatch.purchasePrice) : p.perItemPrice,
//             mfgDate: toInputDate(selectedBatch.mfgDate),
//             expiryDate: toInputDate(selectedBatch.expiryDate),
//         }));
//     }, [selectedBatch, isExistingMode]);

//     // autofill unit and auto-select batch mode
//     useEffect(() => {
//         if (!itemForm.item) return;
//         const prod = productsList.find(p => p._id === itemForm.item);
//         if (prod) {
//             setItemForm(p => ({
//                 ...p,
//                 unit: prod.unit ?? "unit",
//                 discountType: prod.discountType ?? "percentage",
//                 taxType: prod.taxType ?? "percentage"
//             }));
//         }
//     }, [itemForm.item, productsList]);

//     // auto-select batch mode based on available batches
//     useEffect(() => {
//         if (!itemForm.item) return;
//         if (availableBatches.length === 0) {
//             // No existing batches - default to new mode
//             setItemForm(p => ({ ...p, batchMode: "new", batchSelection: "" }));
//         } else {
//             // Has existing batches - default to existing mode and select newest
//             const newestBatch = availableBatches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
//             if (newestBatch) {
//                 handleBatchSelect(newestBatch._id);
//             }
//         }
//     }, [itemForm.item, availableBatches]);

//     // calculations
//     const calc = useMemo(() => {
//         const subtotal = addedItems.reduce((s, it) => s + (Number(it.totalPurchasePrice) || 0), 0);
//         const discountAmt = bill.discountType === "percentage" ? (subtotal * Number(bill.discount || 0)) / 100 : Number(bill.discount || 0);
//         const after = subtotal - discountAmt;
//         const gst = (after * Number(bill.gst || 0)) / 100;
//         const shipping = Number(bill.shippingCost || 0);
//         return { subtotal, discount: discountAmt, gst, shipping, total: after + gst + shipping };
//     }, [addedItems, bill]);

//     // frequent items
//     const frequentItems = useMemo(() => {
//         if (!bill.supplier || !previousBills?.length) return [];
//         const freq = {};
//         previousBills.filter(b => (b.supplier?._id ?? b.supplier) === bill.supplier)
//             .forEach(b => b.items?.forEach(it => {
//                 const id = it.product?._id ?? it.product;
//                 if (!id) return;
//                 if (!freq[id]) freq[id] = { ...it, count: 0, prices: [] };
//                 freq[id].count++;
//                 freq[id].prices.push(it.price ?? 0);
//             }));
//         return Object.values(freq).sort((a, b) => b.count - a.count).slice(0, 5)
//             .map(f => ({ ...f, avgPrice: (f.prices.reduce((a, b) => a + b, 0) / f.prices.length).toFixed(2) }));
//     }, [bill.supplier, previousBills]);

//     // handlers
//     const handleBillChange = e => setBill(p => ({ ...p, [e.target.name]: e.target.value }));
//     const handleItemChange = e => setItemForm(p => ({ ...p, [e.target.name]: e.target.value }));

//     const handleBatchSelect = (val) => {
//         const b = availableBatches.find(b => b._id === val);
//         if (!b) return;
//         setItemForm(p => ({
//             ...p, batchMode: "existing", batchSelection: val,
//             batchNumber: b.batchNumber ?? p.batchNumber,
//             perItemPrice: b.purchasePrice != null ? String(b.purchasePrice) : p.perItemPrice,
//             mfgDate: toInputDate(b.mfgDate),
//             expiryDate: toInputDate(b.expiryDate),
//         }));
//     };

//     const handleAddItem = () => {
//         if (!itemForm.item) return showError(labels.selectItem);
//         if (!itemForm.quantity || Number(itemForm.quantity) <= 0) return showError(labels.enterValidQuantity);
//         if (itemForm.perItemPrice === "" || Number(itemForm.perItemPrice) < 0) return showError(labels.enterValidPrice);
//         if (itemForm.batchMode === "existing" && !itemForm.batchSelection) return showError(labels.selectBatch);

//         const prod = productsList.find(p => p._id === itemForm.item);
//         const batchNo = itemForm.batchMode === "new" ? makeBatch(batchStamp) : itemForm.batchNumber?.trim();
//         if (!batchNo) return showError(labels.batchNumberRequired);

//         if (editingIndex === null && addedItems.some(it => it.item === itemForm.item)) {
//             return showError(labels.productAlreadyAdded || "This product is already added to the bill");
//         }

//         const row = {
//             item: itemForm.item, name: prod?.name ?? "Unknown",
//             quantity: Number(itemForm.quantity), unit: itemForm.unit,
//             pricePerUnit: Number(itemForm.perItemPrice),
//             totalPurchasePrice: calculateItemLineTotal(Number(itemForm.quantity), Number(itemForm.perItemPrice), Number(itemForm.discount) || 0, itemForm.discountType),
//             mfgDate: itemForm.mfgDate, expiryDate: itemForm.expiryDate,
//             batchNumber: batchNo, batchMode: itemForm.batchMode,
//             batchSelection: itemForm.batchMode === "existing" ? itemForm.batchSelection : "",
//             batchId: itemForm.batchMode === "existing" ? itemForm.batchSelection : "",
//             discount: Number(itemForm.discount) || 0, discountType: itemForm.discountType,
//             tax: Number(itemForm.tax) || 0, taxType: itemForm.taxType,
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
//             batchNumber: it.batchNumber, batchMode: it.batchMode ?? (it.batchId ? "existing" : "new"),
//             batchSelection: it.batchId ?? "",
//             discount: it.discount, discountType: it.discountType,
//             tax: it.tax, taxType: it.taxType,
//         });
//         setEditingIndex(idx);
//     };

//     const handleSubmit = async () => {
//         if (!addedItems.length) return showError(labels.addAtLeastOneItem);
//         if (!bill.supplier) return showError(labels.selectSupplier);
//         if (!bill.purchaseDate) return showError(labels.selectDate ?? "Please select a purchase date");

//         const payload = {
//             supplier: bill.supplier, date: bill.purchaseDate,
//             invoiceNumber: bill.invoiceNumber, notes: bill.notes ?? "",
//             subtotal: calc.subtotal, discount: Number(bill.discount), discountType: bill.discountType,
//             gst: Number(bill.gst), shippingCost: Number(bill.shippingCost), totalAmount: calc.total,
//             items: addedItems.map(it => ({
//                 product: it.item, batchNumber: it.batchNumber,
//                 quantity: it.quantity, price: it.pricePerUnit,
//                 discount: it.discount, discountType: it.discountType,
//                 tax: it.tax, taxType: it.taxType,
//                 mfgDate: it.mfgDate ? new Date(it.mfgDate).toISOString() : undefined,
//                 expiryDate: it.expiryDate ? new Date(it.expiryDate).toISOString() : undefined,
//             })),
//         };
//         try {
//             if (isUpdate) {
//                 await updatePurchase({ id: purchaseId, ...payload }).unwrap();
//                 showSuccess(labels.purchaseUpdated);
//             } else {
//                 await createPurchase(payload).unwrap();
//                 showSuccess(labels.purchaseCreated);
//                 setBill(emptyBill()); setAddedItems([]); setItemForm(emptyItem());
//             }
//             onSuccess?.();
//             onClose();
//         } catch (e) {
//             showError(e?.data?.message ?? labels.operationFailed);
//         }
//     };

//     if (isUpdate && isFetching && !existingPurchase) return (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
//             <div className="rounded-2xl p-8 text-sm" style={{ background: "var(--surface)", color: "var(--muted)" }}>Loading…</div>
//         </div>
//     );

//     // ─── render ───────────────────────────────────────────────────────────────
//     // layout: [add-item-form | items-added]  →  [bill additional data]  →  [summary]  →  [create purchase]
//     // item form no longer depends on supplier selection; supplier/date/items are validated on final submit.
//     return (
//         <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto" onClick={onClose}>
//             <div className="relative w-full max-w-6xl sm:my-4 min-h-full sm:min-h-0 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden" style={{ background: "var(--app-bg)", border: "1px solid var(--border)" }} onClick={e => e.stopPropagation()}>

//                 {/* header */}
//                 <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-10" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
//                     <div className="flex items-center gap-2 sm:gap-3 min-w-0">
//                         <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent-2)" }}><Package className="w-4 h-4 text-white" /></div>
//                         <div className="min-w-0">
//                             <h2 className="text-sm sm:text-base font-bold leading-tight truncate" style={{ color: "var(--ink)" }}>{isUpdate ? labels.editPurchase : labels.newPurchaseBill}</h2>
//                             <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{isUpdate ? bill.invoiceNumber : labels.purchaseManagement}</p>
//                         </div>
//                     </div>
//                     <div className="flex items-center gap-2 shrink-0">
//                         <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl transition shrink-0" style={{ background: "var(--surface-muted)", color: "var(--muted)" }}><X className="w-4 h-4" /></button>
//                     </div>
//                 </div>

//                 {/* body */}
//                 <div className="p-3 sm:p-4 md:p-5 space-y-4">

//                     {/* row 1: add item form | items added */}
//                     <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 xl:gap-6">
//                         <Card title={editingIndex !== null ? labels.editItem : labels.addItem} icon={Plus} className="h-full">
//                             <div className="space-y-4">
//                                 <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-4">
//                                     <Field>
//                                         <Label>{labels.product} *</Label>
//                                         <div className="flex gap-2">
//                                             <SSelect className="flex-1" options={productsList.map(p => ({ label: p.name, value: p._id }))} value={itemForm.item}
//                                                 onChange={val => { const prod = productsList.find(p => p._id === val); if (prod) { setBatchStamp(Date.now().toString()); setItemForm(p => ({ ...emptyItem(), item: prod._id, name: prod.name, unit: prod.unit ?? "unit", discountType: p.discountType ?? "percentage", taxType: p.taxType ?? "percentage" })); } }}
//                                                 placeholder={labels.product + "…"} />
//                                             <button type="button" onClick={() => setShowProductModal(true)} className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition flex items-center gap-1 shrink-0" title="Create new product"><Plus size={16} /></button>
//                                         </div>
//                                     </Field>
//                                     <Field>
//                                         <Label>{labels.batchMode}</Label>
//                                         <div className="flex gap-2">
//                                             <Btn variant={itemForm.batchMode === "new" ? "active" : "inactive"} size="sm" className="flex-1" onClick={() => { setBatchStamp(Date.now().toString()); setItemForm(p => ({ ...p, batchMode: "new", batchSelection: "" })); }}>{labels.new}</Btn>
//                                             <Btn variant={itemForm.batchMode === "existing" ? "active" : "inactive"} size="sm" className="flex-1" disabled={!itemForm.item || availableBatches.length === 0} onClick={() => setItemForm(p => ({ ...p, batchMode: "existing" }))}>{labels.existing}</Btn>
//                                         </div>
//                                         {itemForm.batchMode === "existing" && (
//                                             <Sel className="mt-2" value={itemForm.batchSelection} onChange={e => handleBatchSelect(e.target.value)}>
//                                                 <option value="">{labels.selectBatchPlaceholder}</option>
//                                                 {availableBatches.map(b => <option key={b._id} value={b._id}>{b.batchNumber} (Qty: {b.quantity})</option>)}
//                                             </Sel>
//                                         )}
//                                     </Field>
//                                 </div>

//                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                                     <Field><Label>{labels.batchNo}</Label><Inp value={itemForm.batchNumber} readOnly className="text-xs" style={{ background: "var(--surface-muted)", cursor: "not-allowed", color: "var(--muted)" }} /></Field>
//                                     <Field>
//                                         <Label>{labels.quantity} *</Label>
//                                         <div className="flex gap-2 items-center">
//                                             <Inp name="quantity" type="number" placeholder="0" value={itemForm.quantity} onChange={handleItemChange} />
//                                             <span className="shrink-0 px-3 py-2 text-xs font-semibold rounded-xl" style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", color: "var(--muted)" }}>{itemForm.unit || "unit"}</span>
//                                         </div>
//                                     </Field>
//                                 </div>

//                                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
//                                     <Field><Label>{labels.perItemPrice} *</Label><Inp name="perItemPrice" type="number" placeholder="0.00" value={itemForm.perItemPrice} onChange={handleItemChange} /></Field>
//                                     <Field><Label>{labels.discount}</Label><Inp name="discount" type="number" placeholder="0" value={itemForm.discount} onChange={handleItemChange} /></Field>
//                                     <Field>
//                                         <Label>{labels.discountType}</Label>
//                                         <Sel value={itemForm.discountType} onChange={e => setItemForm(p => ({ ...p, discountType: e.target.value }))}>
//                                             <option value="percentage">{labels.percentage}</option>
//                                             <option value="fixed">{labels.fixed}</option>
//                                         </Sel>
//                                     </Field>
//                                     <Field><Label>{labels.taxPercent}</Label><Inp name="tax" type="number" placeholder="0" value={itemForm.tax} onChange={handleItemChange} /></Field>
//                                 </div>

//                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                                     <Field><Label>{labels.mfgDate}</Label><Inp name="mfgDate" type="date" value={itemForm.mfgDate} onChange={handleItemChange} /></Field>
//                                     <Field><Label>{labels.expiryDate}</Label><Inp name="expiryDate" type="date" value={itemForm.expiryDate} onChange={handleItemChange} /></Field>
//                                 </div>

//                                 {!isUpdate && bill.supplier && frequentItems.length > 0 && (
//                                     <div className="p-3 rounded-xl" style={{ background: "rgba(180,83,9,0.05)", border: "1px solid rgba(180,83,9,0.15)" }}>
//                                         <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} /><span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>{labels.frequentlyPurchased}</span></div>
//                                         <div className="flex flex-wrap gap-2">
//                                             {frequentItems.map((f, i) => {
//                                                 const prod = productsList.find(p => p._id === (f.product?._id ?? f.item?._id ?? f.product ?? f.item));
//                                                 return prod ? (
//                                                     <button key={i} onClick={() => { setBatchStamp(Date.now().toString()); setItemForm({ ...emptyItem(), item: prod._id, name: prod.name, unit: prod.unit ?? "unit", perItemPrice: f.avgPrice }); }}
//                                                         className="text-xs px-3 py-1.5 rounded-xl font-medium transition" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" }}>{prod.name} ×{f.count}</button>
//                                                 ) : null;
//                                             })}
//                                         </div>
//                                     </div>
//                                 )}

//                                 <Btn variant="primary" className="w-full" onClick={handleAddItem}><Plus className="w-4 h-4" />{editingIndex !== null ? labels.updateItem : labels.addToBill}</Btn>
//                             </div>
//                         </Card>

//                         <Card title={`${labels.items} (${addedItems.length})`} icon={FileText}>
//                             {addedItems.length ? (
//                                 <div className="overflow-x-auto -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 max-h-[420px] overflow-y-auto">
//                                     <table className="w-full text-sm min-w-[480px]">
//                                         <thead>
//                                             <tr className="text-xs uppercase tracking-wider" style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
//                                                 {[labels.item, labels.batch, labels.qty, labels.price, labels.total, labels.actions].map(h => (
//                                                     <th key={h} className={`px-3 sm:px-4 py-3 font-semibold ${h === labels.actions ? "text-center" : h === labels.qty || h === labels.price || h === labels.total ? "text-right" : "text-left"}`}>{h}</th>
//                                                 ))}
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {addedItems.map((it, idx) => (
//                                                 <tr key={idx} className="transition" style={{ borderBottom: "1px solid var(--border)" }} onMouseEnter={e => e.currentTarget.style.background = "var(--surface-muted)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
//                                                     <td className="px-3 sm:px-4 py-3 font-medium" style={{ color: "var(--ink)" }}>{it.name}</td>
//                                                     <td className="px-3 sm:px-4 py-3 font-mono text-xs" style={{ color: "var(--muted)" }}>{it.batchNumber}</td>
//                                                     <td className="px-3 sm:px-4 py-3 text-right tabular-nums" style={{ color: "var(--ink)" }}>{it.quantity} <span className="text-xs" style={{ color: "var(--muted)" }}>{it.unit}</span></td>
//                                                     <td className="px-3 sm:px-4 py-3 text-right tabular-nums" style={{ color: "var(--muted)" }}>{Number(it.pricePerUnit).toFixed(2)}</td>
//                                                     <td className="px-3 sm:px-4 py-3 text-right tabular-nums font-semibold" style={{ color: "var(--ink)" }}>{Number(it.totalPurchasePrice).toFixed(2)}</td>
//                                                     <td className="px-3 sm:px-4 py-3"><div className="flex justify-center gap-1"><Btn variant="ghost" size="sm" onClick={() => handleEditItem(it, idx)}>{labels.edit}</Btn><Btn variant="danger" size="sm" onClick={() => setAddedItems(p => p.filter((_, i) => i !== idx))}>{labels.remove}</Btn></div></td>
//                                                 </tr>
//                                             ))}
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             ) : (
//                                 <p className="text-sm text-center py-8" style={{ color: "var(--muted)" }}>{labels.addAtLeastOneItem}</p>
//                             )}
//                         </Card>
//                     </div>

//                     {/* row 2: bill additional data (supplier + invoice no + other bill detail) */}
//                     <Card title={labels.billDetails} icon={FileText} noOverflow>
//                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//                             <Field>
//                                 <Label>{labels.supplier} *</Label>
//                                 <div className="flex gap-2">
//                                     <div className="relative z-50 flex-1"><SearchableSelect options={supplierOptions} value={bill.supplier} onChange={val => setBill(p => ({ ...p, supplier: val }))} placeholder={labels.selectSupplier + "…"} /></div>
//                                     <button type="button" onClick={() => setShowSupplierModal(true)} className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition flex items-center gap-1 shrink-0" title="Create new supplier"><Plus size={16} /></button>
//                                 </div>
//                             </Field>
//                             <Field><Label>{labels.invoiceNo}</Label><Inp value={bill.invoiceNumber} readOnly style={{ background: "var(--surface-muted)", cursor: "not-allowed", color: "var(--muted)" }} /></Field>
//                             <Field><Label><Calendar className="inline w-3 h-3 mr-1" />{labels.date} *</Label><Inp type="date" name="purchaseDate" value={bill.purchaseDate} onChange={handleBillChange} /></Field>
//                             <Field>
//                                 <Label><DollarSign className="inline w-3 h-3 mr-1" />{labels.discount}</Label>
//                                 <div className="flex gap-2">
//                                     <Inp type="number" name="discount" placeholder="0" value={bill.discount} onChange={handleBillChange} />
//                                     <Sel className="w-20 sm:w-24 shrink-0" value={bill.discountType} onChange={e => setBill(p => ({ ...p, discountType: e.target.value }))}>
//                                         <option value="percentage">{labels.percentage}</option>
//                                         <option value="fixed">{labels.fixed}</option>
//                                     </Sel>
//                                 </div>
//                             </Field>
//                             <Field><Label>{labels.taxGst}</Label><Inp type="number" name="gst" placeholder="0" value={bill.gst} onChange={handleBillChange} /></Field>
//                             <Field><Label><Truck className="inline w-3 h-3 mr-1" />{labels.shipping}</Label><Inp type="number" name="shippingCost" placeholder="0" value={bill.shippingCost} onChange={handleBillChange} /></Field>
//                             <Field className="sm:col-span-2 lg:col-span-2"><Label><File className="inline w-3 h-3 mr-1" />{labels.notes}</Label><Txt name="notes" rows={1} placeholder={labels.optionalNote} value={bill.notes} onChange={handleBillChange} /></Field>
//                         </div>
//                     </Card>

//                     {/* row 3: summary */}
//                     <Card title={labels.summary} icon={DollarSign}>
//                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
//                             <SumRow label={labels.subtotal} value={`Rs ${calc.subtotal.toFixed(2)}`} />
//                             <SumRow label={labels.discount} value={`− Rs ${calc.discount.toFixed(2)}`} danger />
//                             <SumRow label={labels.gst} value={`+ Rs ${calc.gst.toFixed(2)}`} accent />
//                             <SumRow label={labels.shipping} value={`+ Rs ${calc.shipping.toFixed(2)}`} />
//                         </div>
//                         <div className="pt-3 mt-3 flex justify-between items-center gap-2" style={{ borderTop: "1px solid var(--border)" }}>
//                             <span className="font-bold" style={{ color: "var(--ink)" }}>{labels.total}</span>
//                             <span className="text-base sm:text-lg font-black tabular-nums" style={{ color: "var(--accent-2)" }}>Rs {calc.total.toFixed(2)}</span>
//                         </div>
//                     </Card>

//                     {/* row 4: create purchase */}
//                     <Btn variant="primary" className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
//                         {isSubmitting ? (isUpdate ? labels.updating : labels.submitting) : (isUpdate ? labels.updateBill : labels.submitBill)}
//                     </Btn>
//                 </div>
//             </div>
//             {showProductModal && <ProductCRUDModal mode="create" open={showProductModal} onClose={() => setShowProductModal(false)} onSuccess={handleProductCreated} />}
//             {showSupplierModal && <SupplierModal mode="create" onClose={() => setShowSupplierModal(false)} onSuccess={handleSupplierCreated} />}
//         </div>
//     );
// }

// export default function PurchaseModal(props) {
//     return <ErrorBoundary><PurchaseModalInner {...props} /></ErrorBoundary>;
// }
















// // // src/modules/productPurchases/components/PurchaseModal.jsx
// // import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
// // import { Plus, Upload, Download, TrendingUp, Package, Calendar, FileText, DollarSign, Truck, File, X, ChevronDown } from "lucide-react";
// // import { useEffect, useState, useMemo, useRef } from "react";
// // import { useAllSuppliers } from "../../suppliers/services/suppliers.service";
// // import { useAllPurchases, useCreatePurchase, usePurchase, useUpdatePurchase } from "../services/purchases.service";
// // import { useProducts } from "../../productsModule/services/product.service";
// // import { useBatchesByProduct } from "../services/batch.service";
// // import { SearchableSelect } from "../../../shared/components/FormFields.jsx";
// // import ProductCRUDModal from "../../productsModule/components/ProductCRUDModal.jsx";
// // import SupplierModal from "../../suppliers/components/SupplierModal.jsx";
// // import { getPurchaseLabels } from "../labels/purchaseLabels.js";
// // import { useSettings } from "../../settings/hooks/useSettings.js";

// // // ─── constants ────────────────────────────────────────────────────────────────
// // const toInputDate = (v) => v ? new Date(v).toISOString().slice(0, 10) : "";
// // const sanitize = (v) => String(v || "").trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "").toUpperCase();
// // const makeBatch = (stamp) => `BAT-${stamp}-GEN`;
// // const makeInvoice = (name, stamp) => `INV-${sanitize(name || "SUPPLIER")}-${stamp}`;
// // const getBatchStamp = (bn) => { const m = /^BAT-([^-]+)-/.exec(bn || ""); return m?.[1] || Date.now().toString(); };

// // const emptyItem = () => ({
// //     item: "", name: "", quantity: "", unit: "", perItemPrice: "",
// //     mfgDate: "", expiryDate: "", batchNumber: "", batchMode: "new", batchSelection: "",
// //     discount: "", discountType: "percentage", tax: "", taxType: "percentage",
// // });

// // const emptyBill = () => ({
// //     supplier: "", purchaseDate: new Date().toISOString().slice(0, 10),
// //     invoiceNumber: "", notes: "", discount: 0, discountType: "percentage",
// //     gst: 0, shippingCost: 0,
// // });

// // // ─── primitives ───────────────────────────────────────────────────────────────
// // const Label = ({ children }) => <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--muted)" }}>{children}</label>;
// // const Field = ({ children, className = "" }) => <div className={`flex flex-col ${className}`}>{children}</div>;

// // const inputBase = `w-full px-3 py-2 text-sm rounded-xl outline-none transition focus:ring-2 placeholder-(--muted)`;
// // const inputStyle = { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)", "--tw-ring-color": "var(--accent-2)" };

// // const Inp = ({ className = "", style: s = {}, ...p }) => <input {...p} className={`${inputBase} ${className}`} style={{ ...inputStyle, ...s }} />;
// // const Txt = ({ className = "", ...p }) => <textarea {...p} className={`${inputBase} resize-none ${className}`} style={inputStyle} />;
// // const Sel = ({ className = "", ...p }) => <select {...p} className={`${inputBase} ${className}`} style={inputStyle} />;

// // const btnVariants = {
// //     primary: { background: "var(--accent-2)", color: "#fff" },
// //     secondary: { background: "var(--surface-muted)", color: "var(--ink)", border: "1px solid var(--border)" },
// //     ghost: { background: "transparent", color: "var(--muted)" },
// //     danger: { background: "rgba(220,38,38,0.08)", color: "#dc2626" },
// //     active: { background: "var(--accent-2)", color: "#fff" },
// //     inactive: { background: "var(--surface-muted)", color: "var(--muted)", border: "1px solid var(--border)" },
// // };
// // const btnSizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-sm" };

// // const Btn = ({ children, variant = "primary", size = "md", className = "", ...p }) => (
// //     <button {...p} style={p.disabled ? { ...btnVariants[variant], opacity: 0.5, cursor: "not-allowed" } : btnVariants[variant]}
// //         className={`inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-95 disabled:pointer-events-none cursor-pointer ${btnSizes[size]} ${className}`}>
// //         {children}
// //     </button>
// // );

// // // ─── searchable select ────────────────────────────────────────────────────────
// // const SSelect = ({ options = [], value, onChange, placeholder = "Select..." }) => {
// //     const [open, setOpen] = useState(false);
// //     const [q, setQ] = useState("");
// //     const ref = useRef();
// //     const selected = options.find(o => o.value === value);
// //     const filtered = options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()));

// //     useEffect(() => {
// //         const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
// //         document.addEventListener("mousedown", h);
// //         return () => document.removeEventListener("mousedown", h);
// //     }, []);

// //     return (
// //         <div ref={ref} className="relative w-full">
// //             <button type="button" onClick={() => setOpen(p => !p)}
// //                 className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl transition text-left"
// //                 style={{ background: "var(--surface)", border: "1px solid var(--border)", color: selected ? "var(--ink)" : "var(--muted)" }}>
// //                 <span>{selected?.label || placeholder}</span>
// //                 <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "var(--muted)" }} />
// //             </button>
// //             {open && (
// //                 <div className="absolute z-50 w-full mt-1 rounded-xl shadow-xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
// //                     <div className="p-2" style={{ borderBottom: "1px solid var(--border)" }}>
// //                         <input autoFocus type="text" placeholder="Search..." value={q} onChange={e => setQ(e.target.value)}
// //                             className="w-full px-3 py-1.5 text-sm rounded-lg outline-none"
// //                             style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", color: "var(--ink)" }} />
// //                     </div>
// //                     <div className="max-h-48 overflow-y-auto">
// //                         {filtered.length
// //                             ? filtered.map(o => (
// //                                 <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); setQ(""); }}
// //                                     className="px-3 py-2 text-sm cursor-pointer transition"
// //                                     style={{ background: value === o.value ? "rgba(15,118,110,0.08)" : "transparent", color: value === o.value ? "var(--accent-2)" : "var(--ink)", fontWeight: value === o.value ? 600 : 400 }}
// //                                     onMouseEnter={e => e.currentTarget.style.background = "rgba(15,118,110,0.06)"}
// //                                     onMouseLeave={e => e.currentTarget.style.background = value === o.value ? "rgba(15,118,110,0.08)" : "transparent"}>
// //                                     {o.label}
// //                                 </div>
// //                             ))
// //                             : <div className="px-3 py-4 text-sm text-center" style={{ color: "var(--muted)" }}>No results</div>
// //                         }
// //                     </div>
// //                 </div>
// //             )}
// //         </div>
// //     );
// // };

// // // ─── layout atoms ─────────────────────────────────────────────────────────────
// // const Card = ({ title, icon: Icon, children, className = "", noOverflow = false }) => (
// //     <div className={`rounded-2xl ${noOverflow ? "" : "overflow-hidden"} ${className}`} style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
// //         {title && (
// //             <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-muted)" }}>
// //                 {Icon && <Icon className="w-4 h-4" style={{ color: "var(--accent-2)" }} />}
// //                 <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{title}</span>
// //             </div>
// //         )}
// //         <div className="p-5">{children}</div>
// //     </div>
// // );

// // const SumRow = ({ label, value, accent, danger }) => (
// //     <div className="flex justify-between items-center text-sm">
// //         <span style={{ color: "var(--muted)" }}>{label}</span>
// //         <span className="tabular-nums font-medium" style={{ color: danger ? "#dc2626" : accent ? "var(--accent-2)" : "var(--ink)" }}>{value}</span>
// //     </div>
// // );

// // // ─── error boundary ───────────────────────────────────────────────────────────
// // import { Component } from "react";
// // class ErrorBoundary extends Component {
// //     state = { error: null };
// //     static getDerivedStateFromError(e) { return { error: e }; }
// //     render() {
// //         if (this.state.error) return (
// //             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
// //                 <div className="rounded-2xl p-8 max-w-sm w-full text-center space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
// //                     <p className="font-semibold" style={{ color: "var(--ink)" }}>Something went wrong</p>
// //                     <p className="text-sm" style={{ color: "var(--muted)" }}>{this.state.error?.message || "Unexpected error"}</p>
// //                     <Btn variant="secondary" onClick={() => this.setState({ error: null })}>Dismiss</Btn>
// //                 </div>
// //             </div>
// //         );
// //         return this.props.children;
// //     }
// // }

// // // ─── main modal ───────────────────────────────────────────────────────────────
// // function PurchaseModalInner({ mode = "create", purchaseId, onClose, onSuccess }) {
// //     const { settings } = useSettings();
// //     const language = settings?.language || "en";
// //     const labels = getPurchaseLabels(language);
// //     const isUpdate = mode === "update";

// //     // data
// //     const { data: existingPurchase, isLoading: isFetching } = usePurchase(purchaseId, { skip: !isUpdate || !purchaseId });
// //     const { data: suppliersRaw, refetch: refetchSuppliers } = useAllSuppliers();
// //     const { data: productsRaw, refetch: refetchProducts } = useProducts();
// //     const { data: purchasesRaw } = useAllPurchases();
// //     const [createPurchase, { isLoading: isCreating }] = useCreatePurchase();
// //     const [updatePurchase, { isLoading: isUpdating }] = useUpdatePurchase();
// //     const isSubmitting = isCreating || isUpdating;

// //     const suppliersList = suppliersRaw?.data ?? suppliersRaw ?? [];
// //     const productsList = productsRaw?.data ?? productsRaw ?? [];
// //     const previousBills = purchasesRaw?.data ?? purchasesRaw ?? [];
// //     const supplierOptions = useMemo(() => suppliersList.map(s => ({
// //         label: s.name,
// //         value: s._id,
// //         disabled: s.isActive === false,
// //     })), [suppliersList]);

// //     // state
// //     const [bill, setBill] = useState(emptyBill());
// //     const [addedItems, setAddedItems] = useState([]);
// //     const [itemForm, setItemForm] = useState(emptyItem());
// //     const [editingIndex, setEditingIndex] = useState(null);
// //     const [batchStamp, setBatchStamp] = useState(() => Date.now().toString());
// //     const [showImport, setShowImport] = useState(false);
// //     const [showProductModal, setShowProductModal] = useState(false);
// //     const [showSupplierModal, setShowSupplierModal] = useState(false);

// //     const { data: batchesRaw = [] } = useBatchesByProduct(itemForm.item, { skip: !itemForm.item });
// //     const availableBatches = Array.isArray(batchesRaw) ? batchesRaw : [];
// //     const selectedBatch = availableBatches.find(b => b._id === itemForm.batchSelection);
// //     const isExistingMode = itemForm.batchMode === "existing" && Boolean(itemForm.batchSelection);
// //     const selectedSupplierName = suppliersList.find(s => s._id === bill.supplier)?.name ?? "";

// //     const handleProductCreated = () => {
// //         setShowProductModal(false);
// //         refetchProducts();
// //     };

// //     const handleSupplierCreated = () => {
// //         setShowSupplierModal(false);
// //         refetchSuppliers();
// //     };

// //     // prefill update
// //     useEffect(() => {
// //         if (!isUpdate || !existingPurchase) return;
// //         setBill({
// //             supplier: existingPurchase.supplier?._id ?? existingPurchase.supplier ?? "",
// //             purchaseDate: existingPurchase.date ? new Date(existingPurchase.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
// //             invoiceNumber: existingPurchase.invoiceNumber ?? "",
// //             notes: existingPurchase.notes ?? "",
// //             discount: existingPurchase.discount ?? 0,
// //             discountType: existingPurchase.discountType ?? "percentage",
// //             gst: existingPurchase.gst ?? 0,
// //             shippingCost: existingPurchase.shippingCost ?? 0,
// //         });
// //         setAddedItems((existingPurchase.items ?? []).map(it => ({
// //             item: it.product?._id ?? it.product ?? "", name: it.product?.name ?? "",
// //             quantity: it.quantity ?? 0, unit: it.unit ?? "",
// //             pricePerUnit: it.price ?? 0, totalPurchasePrice: (it.quantity ?? 0) * (it.price ?? 0),
// //             mfgDate: toInputDate(it.mfgDate), expiryDate: toInputDate(it.expiryDate),
// //             batchNumber: it.batchNumber ?? "", batchMode: it.batchId ? "existing" : "new",
// //             batchSelection: it.batchId ?? "", batchId: it.batchId ?? "",
// //             discount: it.discount ?? 0, discountType: it.discountType ?? "percentage",
// //             tax: it.tax ?? 0, taxType: it.taxType ?? "percentage",
// //         })));
// //     }, [existingPurchase, isUpdate]);

// //     // auto-invoice
// //     useEffect(() => {
// //         if (isUpdate || !bill.supplier) return;
// //         const inv = makeInvoice(selectedSupplierName, Date.now().toString());
// //         setBill(p => p.invoiceNumber === inv ? p : { ...p, invoiceNumber: inv });
// //     }, [bill.supplier, selectedSupplierName, isUpdate]);

// //     // batch number (new mode)
// //     useEffect(() => {
// //         if (itemForm.batchMode !== "new") return;
// //         const bn = makeBatch(batchStamp);
// //         setItemForm(p => p.batchNumber === bn ? p : { ...p, batchNumber: bn, batchSelection: "" });
// //     }, [itemForm.batchMode, batchStamp]);

// //     // autofill from existing batch
// //     useEffect(() => {
// //         if (!selectedBatch || !isExistingMode) return;
// //         setItemForm(p => ({
// //             ...p,
// //             batchNumber: selectedBatch.batchNumber ?? p.batchNumber,
// //             perItemPrice: selectedBatch.purchasePrice != null ? String(selectedBatch.purchasePrice) : p.perItemPrice,
// //             mfgDate: toInputDate(selectedBatch.mfgDate),
// //             expiryDate: toInputDate(selectedBatch.expiryDate),
// //         }));
// //     }, [selectedBatch, isExistingMode]);

// //     // autofill unit and auto-select batch mode
// //     useEffect(() => {
// //         if (!itemForm.item) return;
// //         const prod = productsList.find(p => p._id === itemForm.item);
// //         if (prod) {
// //             setItemForm(p => ({
// //                 ...p,
// //                 unit: prod.unit ?? "unit",
// //                 discountType: prod.discountType ?? "percentage",
// //                 taxType: prod.taxType ?? "percentage"
// //             }));
// //         }
// //     }, [itemForm.item, productsList]);

// //     // auto-select batch mode based on available batches
// //     useEffect(() => {
// //         if (!itemForm.item) return;
// //         if (availableBatches.length === 0) {
// //             // No existing batches - default to new mode
// //             setItemForm(p => ({ ...p, batchMode: "new", batchSelection: "" }));
// //         } else {
// //             // Has existing batches - default to existing mode and select newest
// //             const newestBatch = availableBatches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
// //             if (newestBatch) {
// //                 handleBatchSelect(newestBatch._id);
// //             }
// //         }
// //     }, [itemForm.item, availableBatches]);

// //     // calculations
// //     const calc = useMemo(() => {
// //         const subtotal = addedItems.reduce((s, it) => s + (Number(it.totalPurchasePrice) || 0), 0);
// //         const discountAmt = bill.discountType === "percentage" ? (subtotal * Number(bill.discount || 0)) / 100 : Number(bill.discount || 0);
// //         const after = subtotal - discountAmt;
// //         const gst = (after * Number(bill.gst || 0)) / 100;
// //         const shipping = Number(bill.shippingCost || 0);
// //         return { subtotal, discount: discountAmt, gst, shipping, total: after + gst + shipping };
// //     }, [addedItems, bill]);

// //     // frequent items
// //     const frequentItems = useMemo(() => {
// //         if (!bill.supplier || !previousBills?.length) return [];
// //         const freq = {};
// //         previousBills.filter(b => (b.supplier?._id ?? b.supplier) === bill.supplier)
// //             .forEach(b => b.items?.forEach(it => {
// //                 const id = it.product?._id ?? it.product;
// //                 if (!id) return;
// //                 if (!freq[id]) freq[id] = { ...it, count: 0, prices: [] };
// //                 freq[id].count++;
// //                 freq[id].prices.push(it.price ?? 0);
// //             }));
// //         return Object.values(freq).sort((a, b) => b.count - a.count).slice(0, 5)
// //             .map(f => ({ ...f, avgPrice: (f.prices.reduce((a, b) => a + b, 0) / f.prices.length).toFixed(2) }));
// //     }, [bill.supplier, previousBills]);

// //     // handlers
// //     const handleBillChange = e => setBill(p => ({ ...p, [e.target.name]: e.target.value }));
// //     const handleItemChange = e => setItemForm(p => ({ ...p, [e.target.name]: e.target.value }));

// //     const handleBatchSelect = (val) => {
// //         const b = availableBatches.find(b => b._id === val);
// //         if (!b) return;
// //         setItemForm(p => ({
// //             ...p, batchMode: "existing", batchSelection: val,
// //             batchNumber: b.batchNumber ?? p.batchNumber,
// //             perItemPrice: b.purchasePrice != null ? String(b.purchasePrice) : p.perItemPrice,
// //             mfgDate: toInputDate(b.mfgDate),
// //             expiryDate: toInputDate(b.expiryDate),
// //         }));
// //     };

// //     const handleAddItem = () => {
// //         if (!bill.supplier) return showError(labels.selectSupplierFirst);
// //         if (!itemForm.item) return showError(labels.selectItem);
// //         if (!itemForm.quantity || Number(itemForm.quantity) <= 0) return showError(labels.enterValidQuantity);
// //         if (itemForm.perItemPrice === "" || Number(itemForm.perItemPrice) < 0) return showError(labels.enterValidPrice);
// //         if (itemForm.batchMode === "existing" && !itemForm.batchSelection) return showError(labels.selectBatch);

// //         const prod = productsList.find(p => p._id === itemForm.item);
// //         const batchNo = itemForm.batchMode === "new" ? makeBatch(batchStamp) : itemForm.batchNumber?.trim();
// //         if (!batchNo) return showError(labels.batchNumberRequired);

// //         const row = {
// //             item: itemForm.item, name: prod?.name ?? "Unknown",
// //             quantity: Number(itemForm.quantity), unit: itemForm.unit,
// //             pricePerUnit: Number(itemForm.perItemPrice),
// //             totalPurchasePrice: Number(itemForm.quantity) * Number(itemForm.perItemPrice),
// //             mfgDate: itemForm.mfgDate, expiryDate: itemForm.expiryDate,
// //             batchNumber: batchNo, batchMode: itemForm.batchMode,
// //             batchSelection: itemForm.batchMode === "existing" ? itemForm.batchSelection : "",
// //             batchId: itemForm.batchMode === "existing" ? itemForm.batchSelection : "",
// //             discount: Number(itemForm.discount) || 0, discountType: itemForm.discountType,
// //             tax: Number(itemForm.tax) || 0, taxType: itemForm.taxType,
// //         };

// //         if (editingIndex !== null) {
// //             setAddedItems(p => p.map((it, i) => i === editingIndex ? row : it));
// //             setEditingIndex(null);
// //         } else {
// //             setAddedItems(p => [...p, row]);
// //         }
// //         setItemForm(emptyItem());
// //         setBatchStamp(Date.now().toString());
// //     };

// //     const handleEditItem = (it, idx) => {
// //         setBatchStamp(getBatchStamp(it.batchNumber));
// //         setItemForm({
// //             item: it.item, name: it.name, quantity: it.quantity, unit: it.unit,
// //             perItemPrice: it.pricePerUnit, mfgDate: it.mfgDate, expiryDate: it.expiryDate,
// //             batchNumber: it.batchNumber, batchMode: it.batchMode ?? (it.batchId ? "existing" : "new"),
// //             batchSelection: it.batchId ?? "",
// //             discount: it.discount, discountType: it.discountType,
// //             tax: it.tax, taxType: it.taxType,
// //         });
// //         setEditingIndex(idx);
// //     };

// //     const handleSubmit = async () => {
// //         if (!bill.supplier) return showError(labels.selectSupplier);
// //         if (!addedItems.length) return showError(labels.addAtLeastOneItem);
// //         const payload = {
// //             supplier: bill.supplier, date: bill.purchaseDate,
// //             invoiceNumber: bill.invoiceNumber, notes: bill.notes ?? "",
// //             subtotal: calc.subtotal, discount: Number(bill.discount), discountType: bill.discountType,
// //             gst: Number(bill.gst), shippingCost: Number(bill.shippingCost), totalAmount: calc.total,
// //             items: addedItems.map(it => ({
// //                 product: it.item, batchNumber: it.batchNumber,
// //                 quantity: it.quantity, price: it.pricePerUnit,
// //                 discount: it.discount, discountType: it.discountType,
// //                 tax: it.tax, taxType: it.taxType,
// //                 mfgDate: it.mfgDate ? new Date(it.mfgDate).toISOString() : undefined,
// //                 expiryDate: it.expiryDate ? new Date(it.expiryDate).toISOString() : undefined,
// //             })),
// //         };
// //         try {
// //             if (isUpdate) {
// //                 await updatePurchase({ id: purchaseId, ...payload }).unwrap();
// //                 showSuccess(labels.purchaseUpdated);
// //             } else {
// //                 await createPurchase(payload).unwrap();
// //                 showSuccess(labels.purchaseCreated);
// //                 setBill(emptyBill()); setAddedItems([]); setItemForm(emptyItem());
// //             }
// //             onSuccess?.();
// //             onClose();
// //         } catch (e) {
// //             showError(e?.data?.message ?? labels.operationFailed);
// //         }
// //     };

// //     const handleExport = () => {
// //         const csv = [
// //             ["Item", "Quantity", "Unit", "Price", "Total", "Batch", "Mfg", "Expiry", "Discount", "Tax"],
// //             ...addedItems.map(it => [it.name, it.quantity, it.unit, it.pricePerUnit, it.totalPurchasePrice, it.batchNumber, it.mfgDate, it.expiryDate, it.discount, it.tax]),
// //         ].map(r => r.join(",")).join("\n");
// //         const a = document.createElement("a");
// //         a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
// //         a.download = `purchase_${bill.purchaseDate}.csv`;
// //         a.click();
// //     };

// //     const handleBulkImport = (e) => {
// //         const file = e.target.files?.[0];
// //         if (!file) return;
// //         const reader = new FileReader();
// //         reader.onload = ev => {
// //             try {
// //                 const text = ev.target?.result ?? "";
// //                 const rows = file.name.endsWith(".json") ? JSON.parse(text) : (() => {
// //                     const lines = text.split("\n");
// //                     const headers = lines[0].split(",").map(h => h.trim());
// //                     return lines.slice(1).filter(l => l.trim()).map(line => {
// //                         const vals = line.split(",").map(v => v.trim());
// //                         return headers.reduce((o, h, i) => ({ ...o, [h]: vals[i] }), {});
// //                     });
// //                 })();
// //                 const mapped = rows.map(it => {
// //                     const found = productsList.find(p => p.name.toLowerCase() === it.name?.toLowerCase() || p._id === it.itemId);
// //                     if (!found) return null;
// //                     const qty = Number(it.quantity), price = Number(it.price ?? it.pricePerUnit);
// //                     return {
// //                         item: found._id, name: found.name, quantity: qty,
// //                         unit: it.unit ?? found.unit ?? "unit",
// //                         pricePerUnit: price, totalPurchasePrice: qty * price,
// //                         mfgDate: it.mfgDate ?? "", expiryDate: it.expiryDate ?? "",
// //                         batchNumber: it.batchNumber ?? "", batchMode: "new", batchSelection: "", batchId: "",
// //                         discount: Number(it.discount) || 0, discountType: it.discountType ?? "percentage",
// //                         tax: Number(it.tax) || 0, taxType: it.taxType ?? "percentage",
// //                     };
// //                 }).filter(Boolean);
// //                 setAddedItems(p => [...p, ...mapped]);
// //                 showSuccess(`Imported ${mapped.length} items`);
// //             } catch { showError("Import failed — check file format"); }
// //         };
// //         reader.readAsText(file);
// //     };

// //     if (isUpdate && isFetching && !existingPurchase) return (
// //         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
// //             <div className="rounded-2xl p-8 text-sm" style={{ background: "var(--surface)", color: "var(--muted)" }}>Loading…</div>
// //         </div>
// //     );

// //     // ─── render ───────────────────────────────────────────────────────────────
// //     return (
// //         <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto" onClick={onClose}>
// //             <div className="relative w-full max-w-6xl my-4 rounded-3xl shadow-2xl overflow-hidden"
// //                 style={{ background: "var(--app-bg)", border: "1px solid var(--border)" }}
// //                 onClick={e => e.stopPropagation()}>

// //                 {/* header */}
// //                 <div className="flex items-center justify-between px-4 sm:px-6 py-4 sticky top-0 z-10" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
// //                     <div className="flex items-center gap-3">
// //                         <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent-2)" }}>
// //                             <Package className="w-4 h-4 text-white" />
// //                         </div>
// //                         <div>
// //                             <h2 className="text-base font-bold leading-tight" style={{ color: "var(--ink)" }}>
// //                                 {isUpdate ? labels.editPurchase : labels.newPurchaseBill}
// //                             </h2>
// //                             <p className="text-xs" style={{ color: "var(--muted)" }}>{isUpdate ? bill.invoiceNumber : labels.purchaseManagement}</p>
// //                         </div>
// //                     </div>
// //                     <div className="flex items-center gap-2">
// //                         {!isUpdate && <Btn variant="secondary" size="sm" onClick={() => setShowImport(p => !p)}><Upload className="w-3.5 h-3.5" /><span className="hidden sm:inline">{labels.import}</span></Btn>}
// //                         {addedItems.length > 0 && <Btn variant="secondary" size="sm" onClick={handleExport}><Download className="w-3.5 h-3.5" /><span className="hidden sm:inline">{labels.export}</span></Btn>}
// //                         <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl transition" style={{ background: "var(--surface-muted)", color: "var(--muted)" }}>
// //                             <X className="w-4 h-4" />
// //                         </button>
// //                     </div>
// //                 </div>

// //                 {/* import bar */}
// //                 {showImport && (
// //                     <div className="mx-4 sm:mx-6 mt-4 p-4 rounded-2xl" style={{ background: "rgba(180,83,9,0.06)", border: "1px solid rgba(180,83,9,0.2)" }}>
// //                         <p className="text-xs font-semibold mb-2" style={{ color: "var(--accent)" }}>{labels.importCsvJson}</p>
// //                         <input type="file" accept=".csv,.json" onChange={handleBulkImport} className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:font-medium file:cursor-pointer" style={{ color: "var(--muted)" }} />
// //                         <p className="text-xs mt-2 font-mono" style={{ color: "var(--muted)" }}>{labels.formatHint}</p>
// //                     </div>
// //                 )}

// //                 {/* body */}
// //                 <div className="p-3 sm:p-4 flex flex-col lg:flex-row gap-4">

// //                     {/* left column */}
// //                     <div className="flex-1 space-y-4 min-w-0">

// //                         {/* supplier */}
// //                         <Card noOverflow>
// //                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
// //                                 <Field>
// //                                     <Label>{labels.supplier} *</Label>
// //                                     <div className="flex gap-2">
// //                                         <div className="relative z-50 flex-1">
// //                                             <SearchableSelect
// //                                                 options={supplierOptions}
// //                                                 value={bill.supplier}
// //                                                 onChange={val => setBill(p => ({ ...p, supplier: val }))}
// //                                                 placeholder={labels.selectSupplier + "…"}
// //                                             />
// //                                         </div>
// //                                         <button
// //                                             type="button"
// //                                             onClick={() => setShowSupplierModal(true)}
// //                                             className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
// //                                             title="Create new supplier"
// //                                         >
// //                                             <Plus size={16} />
// //                                         </button>
// //                                     </div>
// //                                 </Field>
// //                                 <Field>
// //                                     <Label>{labels.invoiceNo}</Label>
// //                                     <Inp value={bill.invoiceNumber} readOnly style={{ background: "var(--surface-muted)", cursor: "not-allowed", color: "var(--muted)" }} />
// //                                 </Field>
// //                             </div>
// //                         </Card>

// //                         {/* frequent items */}
// //                         {!isUpdate && bill.supplier && frequentItems.length > 0 && (
// //                             <div className="p-4 rounded-2xl" style={{ background: "rgba(180,83,9,0.05)", border: "1px solid rgba(180,83,9,0.15)" }}>
// //                                 <div className="flex items-center gap-2 mb-3">
// //                                     <TrendingUp className="w-4 h-4" style={{ color: "var(--accent)" }} />
// //                                     <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>{labels.frequentlyPurchased}</span>
// //                                 </div>
// //                                 <div className="flex flex-wrap gap-2">
// //                                     {frequentItems.map((f, i) => {
// //                                         const prod = productsList.find(p => p._id === (f.product?._id ?? f.item?._id ?? f.product ?? f.item));
// //                                         return prod ? (
// //                                             <button key={i} onClick={() => { setBatchStamp(Date.now().toString()); setItemForm({ ...emptyItem(), item: prod._id, name: prod.name, unit: prod.unit ?? "unit", perItemPrice: f.avgPrice }); }}
// //                                                 className="text-xs px-3 py-1.5 rounded-xl font-medium transition"
// //                                                 style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" }}>
// //                                                 {prod.name} ×{f.count}
// //                                             </button>
// //                                         ) : null;
// //                                     })}
// //                                 </div>
// //                             </div>
// //                         )}

// //                         {/* add/edit item form */}
// //                         {bill.supplier && (
// //                             <Card title={editingIndex !== null ? labels.editItem : labels.addItem} icon={Plus}>
// //                                 <div className="space-y-4">
// //                                     {/* product + batch mode */}
// //                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
// //                                         <Field>
// //                                             <Label>{labels.product} *</Label>
// //                                             <div className="flex gap-2">
// //                                                 <SSelect
// //                                                     className="flex-1"
// //                                                     options={productsList.map(p => ({ label: p.name, value: p._id }))}
// //                                                     value={itemForm.item}
// //                                                     onChange={val => {
// //                                                         const prod = productsList.find(p => p._id === val);
// //                                                         if (prod) { setBatchStamp(Date.now().toString()); setItemForm(p => ({ ...emptyItem(), item: prod._id, name: prod.name, unit: prod.unit ?? "unit", discountType: p.discountType ?? "percentage", taxType: p.taxType ?? "percentage" })); }
// //                                                     }}
// //                                                     placeholder={labels.product + "…"}
// //                                                 />
// //                                                 <button
// //                                                     type="button"
// //                                                     onClick={() => setShowProductModal(true)}
// //                                                     className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
// //                                                     title="Create new product"
// //                                                 >
// //                                                     <Plus size={16} />
// //                                                 </button>
// //                                             </div>
// //                                         </Field>
// //                                         <Field>
// //                                             <Label>{labels.batchMode}</Label>
// //                                             <div className="flex gap-2">
// //                                                 <Btn variant={itemForm.batchMode === "new" ? "active" : "inactive"} size="sm" className="flex-1"
// //                                                     onClick={() => { setBatchStamp(Date.now().toString()); setItemForm(p => ({ ...p, batchMode: "new", batchSelection: "" })); }}>
// //                                                     {labels.new}
// //                                                 </Btn>
// //                                                 <Btn variant={itemForm.batchMode === "existing" ? "active" : "inactive"} size="sm" className="flex-1"
// //                                                     disabled={!itemForm.item || availableBatches.length === 0}
// //                                                     onClick={() => setItemForm(p => ({ ...p, batchMode: "existing" }))}>
// //                                                     {labels.existing}
// //                                                 </Btn>
// //                                             </div>
// //                                             {itemForm.batchMode === "existing" && (
// //                                                 <Sel className="mt-2" value={itemForm.batchSelection} onChange={e => handleBatchSelect(e.target.value)}>
// //                                                     <option value="">{labels.selectBatchPlaceholder}</option>
// //                                                     {availableBatches.map(b => <option key={b._id} value={b._id}>{b.batchNumber} (Qty: {b.quantity})</option>)}
// //                                                 </Sel>
// //                                             )}
// //                                         </Field>
// //                                     </div>

// //                                     {/* batch no + quantity */}
// //                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
// //                                         <Field>
// //                                             <Label>{labels.batchNo}</Label>
// //                                             <Inp value={itemForm.batchNumber} readOnly className="text-xs" style={{ background: "var(--surface-muted)", cursor: "not-allowed", color: "var(--muted)" }} />
// //                                         </Field>
// //                                         <Field>
// //                                             <Label>{labels.quantity} *</Label>
// //                                             <div className="flex gap-2 items-center">
// //                                                 <Inp name="quantity" type="number" placeholder="0" value={itemForm.quantity} onChange={handleItemChange} />
// //                                                 <span className="shrink-0 px-3 py-2 text-xs font-semibold rounded-xl" style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", color: "var(--muted)" }}>
// //                                                     {itemForm.unit || "unit"}
// //                                                 </span>
// //                                             </div>
// //                                         </Field>
// //                                     </div>

// //                                     {/* price + discount + tax */}
// //                                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
// //                                         <Field><Label>{labels.perItemPrice} *</Label><Inp name="perItemPrice" type="number" placeholder="0.00" value={itemForm.perItemPrice} onChange={handleItemChange} /></Field>
// //                                         <Field><Label>{labels.discount}</Label><Inp name="discount" type="number" placeholder="0" value={itemForm.discount} onChange={handleItemChange} /></Field>
// //                                         <Field>
// //                                             <Label>{labels.discountType}</Label>
// //                                             <Sel value={itemForm.discountType} onChange={e => setItemForm(p => ({ ...p, discountType: e.target.value }))}>
// //                                                 <option value="percentage">{labels.percentage}</option>
// //                                                 <option value="fixed">{labels.fixed}</option>
// //                                             </Sel>
// //                                         </Field>
// //                                         <Field><Label>{labels.taxPercent}</Label><Inp name="tax" type="number" placeholder="0" value={itemForm.tax} onChange={handleItemChange} /></Field>
// //                                     </div>

// //                                     {/* dates */}
// //                                     <div className="grid grid-cols-2 gap-3">
// //                                         <Field><Label>{labels.mfgDate}</Label><Inp name="mfgDate" type="date" value={itemForm.mfgDate} onChange={handleItemChange} /></Field>
// //                                         <Field><Label>{labels.expiryDate}</Label><Inp name="expiryDate" type="date" value={itemForm.expiryDate} onChange={handleItemChange} /></Field>
// //                                     </div>

// //                                     <Btn variant="primary" className="w-full" onClick={handleAddItem}>
// //                                         <Plus className="w-4 h-4" />
// //                                         {editingIndex !== null ? labels.updateItem : labels.addToBill}
// //                                     </Btn>
// //                                 </div>
// //                             </Card>
// //                         )}

// //                         {/* items table */}
// //                         {addedItems.length > 0 && (
// //                             <Card title={`${labels.items} (${addedItems.length})`} icon={FileText}>
// //                                 <div className="overflow-x-auto -mx-5 -mb-5">
// //                                     <table className="w-full text-sm min-w-[500px]">
// //                                         <thead>
// //                                             <tr className="text-xs uppercase tracking-wider" style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
// //                                                 {[labels.item, labels.batch, labels.qty, labels.price, labels.total, labels.actions].map(h => (
// //                                                     <th key={h} className={`px-4 py-3 font-semibold ${h === labels.actions ? "text-center" : h === labels.qty || h === labels.price || h === labels.total ? "text-right" : "text-left"}`}>{h}</th>
// //                                                 ))}
// //                                             </tr>
// //                                         </thead>
// //                                         <tbody>
// //                                             {addedItems.map((it, idx) => (
// //                                                 <tr key={idx} className="transition" style={{ borderBottom: "1px solid var(--border)" }}
// //                                                     onMouseEnter={e => e.currentTarget.style.background = "var(--surface-muted)"}
// //                                                     onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
// //                                                     <td className="px-4 py-3 font-medium" style={{ color: "var(--ink)" }}>{it.name}</td>
// //                                                     <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--muted)" }}>{it.batchNumber}</td>
// //                                                     <td className="px-4 py-3 text-right tabular-nums" style={{ color: "var(--ink)" }}>{it.quantity} <span className="text-xs" style={{ color: "var(--muted)" }}>{it.unit}</span></td>
// //                                                     <td className="px-4 py-3 text-right tabular-nums" style={{ color: "var(--muted)" }}>{Number(it.pricePerUnit).toFixed(2)}</td>
// //                                                     <td className="px-4 py-3 text-right tabular-nums font-semibold" style={{ color: "var(--ink)" }}>{Number(it.totalPurchasePrice).toFixed(2)}</td>
// //                                                     <td className="px-4 py-3">
// //                                                         <div className="flex justify-center gap-1">
// //                                                             <Btn variant="ghost" size="sm" onClick={() => handleEditItem(it, idx)}>{labels.edit}</Btn>
// //                                                             <Btn variant="danger" size="sm" onClick={() => setAddedItems(p => p.filter((_, i) => i !== idx))}>{labels.remove}</Btn>
// //                                                         </div>
// //                                                     </td>
// //                                                 </tr>
// //                                             ))}
// //                                         </tbody>
// //                                     </table>
// //                                 </div>
// //                             </Card>
// //                         )}
// //                     </div>

// //                     {/* right column */}
// //                     <div className="w-full lg:w-72 space-y-4 shrink-0">
// //                         <Card title={labels.billDetails} icon={FileText}>
// //                             <div className="space-y-3">
// //                                 <Field><Label><Calendar className="inline w-3 h-3 mr-1" />{labels.date}</Label><Inp type="date" name="purchaseDate" value={bill.purchaseDate} onChange={handleBillChange} /></Field>
// //                                 <Field>
// //                                     <Label><DollarSign className="inline w-3 h-3 mr-1" />{labels.discount}</Label>
// //                                     <div className="flex gap-2">
// //                                         <Inp type="number" name="discount" placeholder="0" value={bill.discount} onChange={handleBillChange} className="text-base py-3" />
// //                                         <Sel className="w-24 shrink-0 text-base py-3" value={bill.discountType} onChange={e => setBill(p => ({ ...p, discountType: e.target.value }))}>
// //                                             <option value="percentage">{labels.percentage}</option>
// //                                             <option value="fixed">{labels.fixed}</option>
// //                                         </Sel>
// //                                     </div>
// //                                 </Field>
// //                                 <Field><Label>{labels.taxGst}</Label><Inp type="number" name="gst" placeholder="0" value={bill.gst} onChange={handleBillChange} /></Field>
// //                                 <Field><Label><Truck className="inline w-3 h-3 mr-1" />{labels.shipping}</Label><Inp type="number" name="shippingCost" placeholder="0" value={bill.shippingCost} onChange={handleBillChange} /></Field>
// //                                 <Field><Label><File className="inline w-3 h-3 mr-1" />{labels.notes}</Label><Txt name="notes" rows={3} placeholder={labels.optionalNote} value={bill.notes} onChange={handleBillChange} /></Field>
// //                             </div>
// //                         </Card>

// //                         <Card title={labels.summary} icon={DollarSign}>
// //                             <div className="space-y-2">
// //                                 <SumRow label={labels.subtotal} value={`Rs ${calc.subtotal.toFixed(2)}`} />
// //                                 <SumRow label={labels.discount} value={`− Rs ${calc.discount.toFixed(2)}`} danger />
// //                                 <SumRow label={labels.gst} value={`+ Rs ${calc.gst.toFixed(2)}`} accent />
// //                                 <SumRow label={labels.shipping} value={`+ Rs ${calc.shipping.toFixed(2)}`} />
// //                                 <div className="pt-3 mt-1 flex justify-between items-center" style={{ borderTop: "1px solid var(--border)" }}>
// //                                     <span className="font-bold" style={{ color: "var(--ink)" }}>{labels.total}</span>
// //                                     <span className="text-lg font-black tabular-nums" style={{ color: "var(--accent-2)" }}>Rs {calc.total.toFixed(2)}</span>
// //                                 </div>
// //                             </div>
// //                             <Btn variant="primary" className="w-full mt-4" onClick={handleSubmit} disabled={isSubmitting}>
// //                                 {isSubmitting ? (isUpdate ? labels.updating : labels.submitting) : (isUpdate ? labels.updateBill : labels.submitBill)}
// //                             </Btn>
// //                         </Card>
// //                     </div>
// //                 </div>
// //             </div>
// //             {showProductModal && (
// //                 <ProductCRUDModal
// //                     mode="create"
// //                     open={showProductModal}
// //                     onClose={() => setShowProductModal(false)}
// //                     onSuccess={handleProductCreated}
// //                 />
// //             )}
// //             {showSupplierModal && (
// //                 <SupplierModal
// //                     mode="create"
// //                     onClose={() => setShowSupplierModal(false)}
// //                     onSuccess={handleSupplierCreated}
// //                 />
// //             )}
// //         </div>
// //     );
// // }

// // export default function PurchaseModal(props) {
// //     return <ErrorBoundary><PurchaseModalInner {...props} /></ErrorBoundary>;
// // }



// src/modules/productPurchases/components/PurchaseModal.jsx
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
import { Plus, TrendingUp, Package, Calendar, FileText, DollarSign, Truck, File, X, ChevronDown, Lock, Unlock, Eye, EyeOff, Edit, Trash2 } from "lucide-react";
import { useEffect, useState, useMemo, useRef } from "react";
import { useAllSuppliers } from "../../suppliers/services/suppliers.service";
import { useAllPurchases, useCreatePurchase, usePurchase, useUpdatePurchase, useGeneratePurchaseNumber } from "../services/purchases.service";
import { useProducts } from "../../productsModule/services/product.service";
import { useBatchesByProduct, useGenerateBatchNumber } from "../services/batch.service";
import { SearchableSelect } from "../../../shared/components/FormFields.jsx";
import ProductCRUDModal from "../../productsModule/components/ProductCRUDModal.jsx";
import SupplierModal from "../../suppliers/components/SupplierModal.jsx";
import { getPurchaseLabels } from "../labels/purchaseLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";

// ─── constants ────────────────────────────────────────────────────────────────
const toInputDate = (v) => v ? new Date(v).toISOString().slice(0, 10) : "";
const sanitize = (v) => String(v || "").trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "").toUpperCase();
const makeBatch = (stamp) => `BAT-${stamp}-GEN`;
const makeInvoice = (name, stamp) => `PI-${stamp.slice(-6)}`;
const getBatchStamp = (bn) => { const m = /^BAT-([^-]+)-/.exec(bn || ""); return m?.[1] || Date.now().toString(); };

const emptyItem = () => ({
    item: "", name: "", quantity: "", unit: "", perItemPrice: "", costPrice: "",
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

const calculateItemTotalPrice = (quantity, costPrice) => {
    return Number(quantity || 0) * Number(costPrice || 0);
};

const calculateItemAfterDiscount = (quantity, costPrice, discount, discountType) => {
    const totalPrice = calculateItemTotalPrice(quantity, costPrice);
    const discountAmount = calculateItemDiscountAmount(quantity, costPrice, discount, discountType);
    return Math.max(0, totalPrice - discountAmount);
};

const calculateItemTaxOnAfterDiscount = (quantity, costPrice, discount, discountType, tax, taxType) => {
    const afterDiscount = calculateItemAfterDiscount(quantity, costPrice, discount, discountType);
    const taxValue = Number(tax || 0);
    if (!taxValue) return 0;
    return taxType === "fixed" ? taxValue : (afterDiscount * taxValue) / 100;
};

const calculateItemFinalSubtotal = (quantity, costPrice, discount, discountType, tax, taxType) => {
    const afterDiscount = calculateItemAfterDiscount(quantity, costPrice, discount, discountType);
    const taxAmount = calculateItemTaxOnAfterDiscount(quantity, costPrice, discount, discountType, tax, taxType);
    return afterDiscount + taxAmount;
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
    const [generateBatchNumber] = useGenerateBatchNumber();
    const [generatePurchaseNumber, { data: purchaseNumberData }] = useGeneratePurchaseNumber();
    const [createPurchase, { isLoading: isCreating }] = useCreatePurchase();
    const [updatePurchase, { isLoading: isUpdating }] = useUpdatePurchase();
    const isSubmitting = isCreating || isUpdating;

    const suppliersList = suppliersRaw?.data ?? suppliersRaw ?? [];
    const productsList = productsRaw?.data ?? productsRaw ?? [];
    const previousBills = purchasesRaw?.data ?? purchasesRaw ?? [];

    // state
    const [bill, setBill] = useState(emptyBill());
    const [addedItems, setAddedItems] = useState([]);
    const [itemForm, setItemForm] = useState(emptyItem());
    const [editingIndex, setEditingIndex] = useState(null);
    const [batchStamp, setBatchStamp] = useState(() => Date.now().toString());
    const [generatedBatchNumber, setGeneratedBatchNumber] = useState(null);
    const [generatedInvoiceNumber, setGeneratedInvoiceNumber] = useState(null);
    const [showProductModal, setShowProductModal] = useState(false);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [isInvoiceNumberLocked, setIsInvoiceNumberLocked] = useState(true);
    const [expandedItems, setExpandedItems] = useState({});

    const supplierOptions = useMemo(() => {
        if (isUpdate && bill.supplier) {
            // In update mode, include all suppliers but disable inactive ones except the selected one
            return suppliersList.map(s => ({
                label: s.name,
                value: s._id,
                disabled: s.isActive === false && s._id !== bill.supplier,
            }));
        } else {
            // In create mode, only show active suppliers
            return suppliersList
                .filter(s => s.isActive !== false)
                .map(s => ({
                    label: s.name,
                    value: s._id,
                    disabled: false,
                }));
        }
    }, [suppliersList, isUpdate, bill.supplier]);

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
        setAddedItems((existingPurchase.items ?? []).map(it => ({
            item: it.product?._id ?? it.product ?? "", name: it.product?.name ?? "",
            quantity: it.quantity ?? 0, unit: it.unit ?? "",
            pricePerUnit: it.price ?? 0, costPrice: it.costPrice ?? 0,
            totalPurchasePrice: calculateItemLineTotal(it.quantity ?? 0, it.price ?? 0, it.discount ?? 0, it.discountType ?? "percentage", it.tax ?? 0, it.taxType ?? "percentage"),
            mfgDate: toInputDate(it.mfgDate), expiryDate: toInputDate(it.expiryDate),
            batchNumber: it.batchNumber ?? it.batch?.batchNumber ?? "", batchMode: (it.batchId ?? it.batch?._id) ? "existing" : "new",
            batchSelection: it.batchId ?? it.batch?._id ?? "", batchId: it.batchId ?? it.batch?._id ?? "",
            discount: it.discount ?? 0, discountType: it.discountType ?? "percentage",
            tax: it.tax ?? 0, taxType: it.taxType ?? "percentage",
        })));
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
    }, [existingPurchase, isUpdate]);

    // auto-invoice
    useEffect(() => {
        if (isUpdate || !bill.supplier) return;
        
        // Call API only once when supplier is selected
        if (!generatedInvoiceNumber) {
            generatePurchaseNumber().then((result) => {
                if (result?.data?.invoiceNumber) {
                    setGeneratedInvoiceNumber(result.data.invoiceNumber);
                }
            });
        }
    }, [bill.supplier, isUpdate, generatedInvoiceNumber, generatePurchaseNumber]);

    // Update invoice number in form when generated
    useEffect(() => {
        if (isUpdate || !generatedInvoiceNumber) return;
        setBill(p => p.invoiceNumber === generatedInvoiceNumber ? p : { ...p, invoiceNumber: generatedInvoiceNumber });
    }, [generatedInvoiceNumber, isUpdate]);

    // check for duplicate invoice and regenerate if needed
    useEffect(() => {
        if (isUpdate || !bill.invoiceNumber) return;
        const isDuplicate = previousBills.some(b => b.invoiceNumber === bill.invoiceNumber);
        if (isDuplicate) {
            generatePurchaseNumber().then((result) => {
                if (result?.data?.invoiceNumber) {
                    setGeneratedInvoiceNumber(result.data.invoiceNumber);
                }
            });
        }
    }, [bill.invoiceNumber, previousBills, isUpdate, generatePurchaseNumber]);

    // batch number (new mode)
    useEffect(() => {
        if (itemForm.batchMode !== "new") return;
        
        // Call API only once when switching to new mode
        if (!generatedBatchNumber) {
            generateBatchNumber().then((result) => {
                if (result?.data?.batchNumber) {
                    setGeneratedBatchNumber(result.data.batchNumber);
                }
            });
        }
    }, [itemForm.batchMode, generatedBatchNumber, generateBatchNumber]);

    // Update batch number in form when generated
    useEffect(() => {
        if (itemForm.batchMode !== "new") return;
        const bn = generatedBatchNumber || makeBatch(batchStamp);
        setItemForm(p => p.batchNumber === bn ? p : { ...p, batchNumber: bn, batchSelection: "" });
    }, [itemForm.batchMode, batchStamp, generatedBatchNumber]);

    // autofill from existing batch
    useEffect(() => {
        if (!selectedBatch || !isExistingMode) return;
        setItemForm(p => ({
            ...p,
            batchNumber: selectedBatch.batchNumber ?? p.batchNumber,
            perItemPrice: editingIndex === null && selectedBatch.purchasePrice != null ? String(selectedBatch.purchasePrice) : p.perItemPrice,
            mfgDate: toInputDate(selectedBatch.mfgDate),
            expiryDate: toInputDate(selectedBatch.expiryDate),
        }));
    }, [selectedBatch, isExistingMode, editingIndex]);

    // Ensure existing batch is selected when editing item after batches are loaded
    useEffect(() => {
        if (editingIndex === null || !itemForm.item) return;
        const editingItem = addedItems[editingIndex];
        if (!editingItem || !editingItem.batchId) return;
        
        // If we have a batchId in the editing item but it's not currently selected
        // and the batch exists in availableBatches, select it
        if (editingItem.batchId && itemForm.batchSelection !== editingItem.batchId) {
            const batchExists = availableBatches.find(b => b._id === editingItem.batchId);
            if (batchExists) {
                setItemForm(p => ({
                    ...p,
                    batchMode: "existing",
                    batchSelection: editingItem.batchId,
                    batchNumber: batchExists.batchNumber ?? p.batchNumber,
                    perItemPrice: p.perItemPrice,
                    mfgDate: toInputDate(batchExists.mfgDate),
                    expiryDate: toInputDate(batchExists.expiryDate),
                }));
            }
        }
    }, [availableBatches, editingIndex, addedItems, itemForm.item]);

    // autofill unit and auto-select batch mode (only for a fresh product pick, not while editing an existing row)
    useEffect(() => {
        if (!itemForm.item || editingIndex !== null) return;
        const prod = productsList.find(p => p._id === itemForm.item);
        if (prod) {
            setItemForm(p => ({
                ...p,
                unit: prod.unit ?? "unit",
                perItemPrice: prod.perItemPrice || prod.defaultSalePrice || "",
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
            // const newestBatch = availableBatches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
            const newestBatch = [...availableBatches].sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            )[0];
            if (newestBatch) {
                handleBatchSelect(newestBatch._id);
            }
        }
    }, [itemForm.item, availableBatches, editingIndex]);

    // calculations
    const calculations = useMemo(() => {
        const itemsBase = addedItems.reduce((s, it) => s + Number(it.quantity || 0) * Number(it.costPrice || 0), 0);
        const itemsDiscountTotal = addedItems.reduce((s, it) => s + calculateItemDiscountAmount(it.quantity, it.costPrice, it.discount, it.discountType), 0);
        const itemsTaxTotal = addedItems.reduce((s, it) => s + calculateItemTaxAmount(it.quantity, it.costPrice, it.discount, it.discountType, it.tax, it.taxType), 0);
        const subtotalAfterItems = addedItems.reduce((s, it) => s + (Number(it.totalPurchasePrice) || 0), 0);
        const billDiscount = bill.discountType === "percentage" ? (subtotalAfterItems * Number(bill.discount || 0)) / 100 : Number(bill.discount || 0);
        const afterBillDiscount = subtotalAfterItems - billDiscount;
        const billTax = bill.gstType === "fixed" ? Number(bill.gst || 0) : (afterBillDiscount * Number(bill.gst || 0)) / 100;
        const afterBillTax = afterBillDiscount + billTax;
        const shipping = Number(bill.shippingCost || 0);
        return { 
            itemsBase, 
            itemsDiscountTotal, 
            itemsTaxTotal, 
            subtotalAfterItems, 
            billDiscount, 
            afterBillDiscount,
            billTax, 
            afterBillTax,
            shipping, 
            total: afterBillTax + shipping 
        };
    }, [addedItems, bill]);

    const calc = calculations;

    // frequent items
    const frequentItems = useMemo(() => {
        if (!bill.supplier || !previousBills?.length) return [];
        const freq = {};
        previousBills.filter(b => (b.supplier?._id ?? b.supplier) === bill.supplier)
            .forEach(b => b.items?.forEach(it => {
                const id = it.product?._id ?? it.product;
                if (!id) return;
                if (!freq[id]) {
                    freq[id] = {
                        product: it.product,
                        item: it.item,
                        count: 0,
                        prices: []
                    };
                }
                freq[id].count++;
                freq[id].prices = [...freq[id].prices, it.price ?? 0];
            }));
        return Object.values(freq).sort((a, b) => b.count - a.count).slice(0, 5)
            .map(f => ({ ...f, avgPrice: (f.prices.reduce((a, b) => a + b, 0) / f.prices.length).toFixed(2) }));
    }, [bill.supplier, previousBills]);

    // handlers
    const handleBillChange = e => setBill(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleItemChange = e => setItemForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleBatchSelect = (val) => {
        const b = availableBatches.find(b => b._id === val);
        if (!b) {
            showError("Batch not found");
            return;
        }
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
        if (itemForm.costPrice === "" || Number(itemForm.costPrice) < 0) return showError(labels.enterValidPrice);
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
            pricePerUnit: Number(itemForm.perItemPrice) || 0,
            costPrice: Number(itemForm.costPrice),
            totalPurchasePrice: calculateItemFinalSubtotal(Number(itemForm.quantity), Number(itemForm.costPrice), Number(itemForm.discount) || 0, itemForm.discountType, Number(itemForm.tax) || 0, itemForm.taxType),
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
        const hasExistingBatch = it.batchId && it.batchMode === "existing";
        setItemForm({
            item: it.item, name: it.name, quantity: it.quantity, unit: it.unit,
            perItemPrice: it.pricePerUnit, costPrice: it.costPrice || "",
            mfgDate: it.mfgDate, expiryDate: it.expiryDate,
            batchNumber: it.batchNumber, batchMode: hasExistingBatch ? "existing" : "new",
            batchSelection: hasExistingBatch ? it.batchId : "",
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
            subtotal: calc.subtotalAfterItems,
            discount: Number(bill.discount), discountType: bill.discountType,
            gst: Number(bill.gst), gstType: bill.gstType,
            shippingCost: Number(bill.shippingCost), totalAmount: calc.total,
            items: addedItems.map(it => ({
                product: it.item,
                batchNumber: it.batchMode === "existing" ? it.batchNumber : undefined, // Only send batchNumber for existing batches
                quantity: it.quantity, price: it.pricePerUnit, costPrice: it.costPrice || 0,
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
            <div className="relative w-[70%] max-w-6xl sm:my-4 min-h-full sm:min-h-0 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden" style={{ background: "var(--app-bg)", border: "1px solid var(--border)" }} onClick={e => e.stopPropagation()}>

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
                                            <button type="button" onClick={() => setShowProductModal(true)} className="px-3 py-2 rounded-lg hover:opacity-90 transition flex items-center gap-1 shrink-0" style={{ background: "var(--accent-2)", color: "#fff" }} title="Create new product"><Plus size={16} /></button>
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
                                    <Field><Label>{labels.quantity} *</Label>
                                        <Inp name="quantity" type="number" placeholder="0" value={itemForm.quantity} onChange={handleItemChange} />
                                    </Field>
                                    <Field><Label>{labels.unit}</Label>
                                        <span className="shrink-0 px-3 py-2 text-xs font-semibold rounded-xl w-full flex items-center justify-center" style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", color: "var(--muted)" }}>{itemForm.unit || "unit"}</span>
                                    </Field>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <Field><Label>{labels.costPrice || "Cost Price"} *</Label><Inp name="costPrice" type="number" placeholder="0.00" value={itemForm.costPrice} onChange={handleItemChange} /></Field>
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

                                <div className="grid grid-cols-1 gap-4">
                                    <Field><Label>Declare Sale Price</Label><Inp name="perItemPrice" type="number" placeholder="0.00" value={itemForm.perItemPrice} onChange={handleItemChange} /></Field>
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
                                                {[labels.item, labels.batch, labels.qty, labels.salePrice || "Sale Price", labels.costPrice || "Cost Price", labels.discount, labels.tax, labels.total, labels.actions].map(h => (
                                                    <th key={h} className={`px-2 sm:px-3 py-3 font-semibold ${h === labels.actions ? "text-center" : h === labels.qty || h === (labels.salePrice || "Sale Price") || h === (labels.costPrice || "Cost Price") || h === labels.total ? "text-right" : "text-left"}`}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {addedItems.map((it, idx) => {
                                                const totalPrice = calculateItemTotalPrice(it.quantity, it.costPrice);
                                                const discountAmount = calculateItemDiscountAmount(it.quantity, it.costPrice, it.discount, it.discountType);
                                                const afterDiscount = calculateItemAfterDiscount(it.quantity, it.costPrice, it.discount, it.discountType);
                                                const taxAmount = calculateItemTaxOnAfterDiscount(it.quantity, it.costPrice, it.discount, it.discountType, it.tax, it.taxType);
                                                const finalSubtotal = calculateItemFinalSubtotal(it.quantity, it.costPrice, it.discount, it.discountType, it.tax, it.taxType);
                                                const isExpanded = expandedItems[idx];
                                                
                                                return (
                                                    <>
                                                        <tr key={idx} className="transition" style={{ borderBottom: "1px solid var(--border)" }} onMouseEnter={e => e.currentTarget.style.background = "var(--surface-muted)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                                            <td className="px-2 sm:px-3 py-3 font-medium" style={{ color: "var(--ink)" }}>{it.name}</td>
                                                            <td className="px-2 sm:px-3 py-3 font-mono text-xs" style={{ color: "var(--muted)" }}>{it.batchNumber}</td>
                                                            <td className="px-2 sm:px-3 py-3 text-right tabular-nums" style={{ color: "var(--ink)" }}>{it.quantity} <span className="text-xs" style={{ color: "var(--muted)" }}>{it.unit}</span></td>
                                                            <td className="px-2 sm:px-3 py-3 text-right tabular-nums" style={{ color: "var(--accent-2)" }}>{Number(it.pricePerUnit || 0).toFixed(2)}</td>
                                                            <td className="px-2 sm:px-3 py-3 text-right tabular-nums" style={{ color: "var(--ink)" }}>{Number(it.costPrice || 0).toFixed(2)}</td>
                                                            <td className="px-2 sm:px-3 py-3 text-right tabular-nums" style={{ color: "var(--muted)" }}>{`${Number(it.discount || 0).toFixed(2)} ${it.discountType === "fixed" ? labels.fixed : labels.percentage}`}</td>
                                                            <td className="px-2 sm:px-3 py-3 text-right tabular-nums" style={{ color: "var(--muted)" }}>{`${Number(it.tax || 0).toFixed(2)} ${it.taxType === "fixed" ? labels.fixed : labels.percentage}`}</td>
                                                            <td className="px-2 sm:px-3 py-3 text-right tabular-nums font-semibold" style={{ color: "var(--ink)" }}>{Number(it.totalPurchasePrice).toFixed(2)}</td>
                                                            <td className="px-2 sm:px-3 py-3">
                                                                <div className="flex justify-center gap-1 items-center">
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => setExpandedItems(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                                                        className="p-1 rounded hover:bg-[var(--surface-muted)] transition"
                                                                        style={{ color: "var(--muted)" }}
                                                                        title={isExpanded ? "Hide calculations" : "Show calculations"}
                                                                    >
                                                                        {isExpanded ? <EyeOff size={16} /> : <Eye size={16} />}
                                                                    </button>
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => handleEditItem(it, idx)}
                                                                        className="p-1 rounded hover:bg-[var(--surface-muted)] transition"
                                                                        style={{ color: "var(--muted)" }}
                                                                        title={labels.edit}
                                                                    >
                                                                        <Edit size={16} />
                                                                    </button>
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => setAddedItems(p => p.filter((_, i) => i !== idx))}
                                                                        className="p-1 rounded hover:bg-[rgba(220,38,38,0.1)] transition"
                                                                        style={{ color: "#dc2626" }}
                                                                        title={labels.remove}
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        {isExpanded && (
                                                            <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                                                <td colSpan="9" className="px-2 sm:px-3 py-4" style={{ background: "var(--surface-muted)" }}>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        {/* Total Price Calculation */}
                                                                        <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                                            <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Total Price Calculation</p>
                                                                            <div className="text-xs space-y-1">
                                                                                <div className="flex justify-between">
                                                                                    <span style={{ color: "var(--ink)" }}>Quantity:</span>
                                                                                    <span className="font-mono" style={{ color: "var(--ink)" }}>{it.quantity} {it.unit}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span style={{ color: "var(--ink)" }}>Cost Price:</span>
                                                                                    <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {Number(it.costPrice).toFixed(2)}</span>
                                                                                </div>
                                                                                <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                                                    <span style={{ color: "var(--accent-2)" }}>Total Price:</span>
                                                                                    <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {totalPrice.toFixed(2)}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Discount Calculation */}
                                                                        <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                                            <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Discount Calculation</p>
                                                                            <div className="text-xs space-y-1">
                                                                                <div className="flex justify-between">
                                                                                    <span style={{ color: "var(--ink)" }}>Discount:</span>
                                                                                    <span className="font-mono" style={{ color: "var(--ink)" }}>{Number(it.discount).toFixed(2)} {it.discountType === "fixed" ? labels.fixed : labels.percentage}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span style={{ color: "var(--ink)" }}>Discount Amount:</span>
                                                                                    <span className="font-mono" style={{ color: "#dc2626" }}>-Rs {discountAmount.toFixed(2)}</span>
                                                                                </div>
                                                                                <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                                                    <span style={{ color: "var(--accent-2)" }}>After Discount:</span>
                                                                                    <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {afterDiscount.toFixed(2)}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Tax Calculation */}
                                                                        <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                                            <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Tax Calculation (on After Discount)</p>
                                                                            <div className="text-xs space-y-1">
                                                                                <div className="flex justify-between">
                                                                                    <span style={{ color: "var(--ink)" }}>After Discount Value:</span>
                                                                                    <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {afterDiscount.toFixed(2)}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span style={{ color: "var(--ink)" }}>Tax:</span>
                                                                                    <span className="font-mono" style={{ color: "var(--ink)" }}>{Number(it.tax).toFixed(2)} {it.taxType === "fixed" ? labels.fixed : labels.percentage}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span style={{ color: "var(--ink)" }}>Tax Amount:</span>
                                                                                    <span className="font-mono" style={{ color: "#16a34a" }}>+Rs {taxAmount.toFixed(2)}</span>
                                                                                </div>
                                                                                <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                                                    <span style={{ color: "var(--accent-2)" }}>After Tax:</span>
                                                                                    <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {(afterDiscount + taxAmount).toFixed(2)}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Final Subtotal */}
                                                                        <div className="p-3 rounded-lg" style={{ background: "rgba(15,118,110,0.08)", border: "1px solid rgba(15,118,110,0.25)" }}>
                                                                            <p className="text-xs font-semibold mb-2" style={{ color: "var(--accent-2)" }}>Final Item Subtotal</p>
                                                                            <div className="text-xs space-y-1">
                                                                                <div className="flex justify-between">
                                                                                    <span style={{ color: "var(--ink)" }}>After Discount:</span>
                                                                                    <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {afterDiscount.toFixed(2)}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span style={{ color: "var(--ink)" }}>Tax Amount:</span>
                                                                                    <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {taxAmount.toFixed(2)}</span>
                                                                                </div>
                                                                                <div className="flex justify-between font-bold text-sm pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                                                                                    <span style={{ color: "var(--accent-2)" }}>Final Subtotal:</span>
                                                                                    <span className="font-mono text-base" style={{ color: "var(--accent-2)" }}>Rs {finalSubtotal.toFixed(2)}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </>
                                                );
                                            })}
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
                                    <button type="button" onClick={() => setShowSupplierModal(true)} className="px-3 py-2 rounded-lg hover:opacity-90 transition flex items-center gap-1 shrink-0" style={{ background: "var(--accent-2)", color: "#fff" }} title="Create new supplier"><Plus size={16} /></button>
                                </div>
                            </Field>
                            <Field>
                                <Label>{labels.invoiceNo}</Label>
                                <div className="flex gap-2">
                                    <Inp 
                                        value={bill.invoiceNumber} 
                                        onChange={handleBillChange}
                                        name="invoiceNumber"
                                        readOnly={isInvoiceNumberLocked}
                                        style={isInvoiceNumberLocked ? { background: "var(--surface-muted)", cursor: "not-allowed", color: "var(--muted)" } : {}} 
                                    />
                                    <Btn
                                        variant="secondary"
                                        onClick={() => setIsInvoiceNumberLocked(!isInvoiceNumberLocked)}
                                        title={isInvoiceNumberLocked ? "Unlock to edit" : "Lock to prevent edits"}
                                        className="px-3"
                                    >
                                        {isInvoiceNumberLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                    </Btn>
                                </div>
                            </Field>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Subtotal Card */}
                            <div className="p-4 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>{labels.subtotal}</p>
                                <div className="text-xs space-y-1">
                                    <div className="flex justify-between">
                                        <span style={{ color: "var(--ink)" }}>Items Subtotal:</span>
                                        <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {calc.subtotalAfterItems.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                        <span style={{ color: "var(--accent-2)" }}>Subtotal:</span>
                                        <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {calc.subtotalAfterItems.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bill Discount Card */}
                            <div className="p-4 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>{labels.discount} ({labels.billDetails})</p>
                                <div className="text-xs space-y-1">
                                    <div className="flex justify-between">
                                        <span style={{ color: "var(--ink)" }}>Discount:</span>
                                        <span className="font-mono" style={{ color: "var(--ink)" }}>{Number(bill.discount).toFixed(2)} {bill.discountType === "fixed" ? labels.fixed : labels.percentage}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: "var(--ink)" }}>Discount Amount:</span>
                                        <span className="font-mono" style={{ color: "#dc2626" }}>-Rs {calc.billDiscount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                        <span style={{ color: "var(--accent-2)" }}>After Discount:</span>
                                        <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {calc.afterBillDiscount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bill Tax Card */}
                            <div className="p-4 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>{labels.taxGst} ({labels.billDetails})</p>
                                <div className="text-xs space-y-1">
                                    <div className="flex justify-between">
                                        <span style={{ color: "var(--ink)" }}>After Discount Value:</span>
                                        <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {calc.afterBillDiscount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: "var(--ink)" }}>Tax:</span>
                                        <span className="font-mono" style={{ color: "var(--ink)" }}>{Number(bill.gst).toFixed(2)} {bill.gstType === "fixed" ? labels.fixed : labels.percentage}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: "var(--ink)" }}>Tax Amount:</span>
                                        <span className="font-mono" style={{ color: "#16a34a" }}>+Rs {calc.billTax.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                        <span style={{ color: "var(--accent-2)" }}>After Tax:</span>
                                        <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {calc.afterBillTax.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Card */}
                            <div className="p-4 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>{labels.shipping}</p>
                                <div className="text-xs space-y-1">
                                    <div className="flex justify-between">
                                        <span style={{ color: "var(--ink)" }}>After Tax Value:</span>
                                        <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {calc.afterBillTax.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: "var(--ink)" }}>Shipping Cost:</span>
                                        <span className="font-mono" style={{ color: "#16a34a" }}>+Rs {calc.shipping.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                        <span style={{ color: "var(--accent-2)" }}>After Shipping:</span>
                                        <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {calc.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Final Total Card */}
                        <div className="mt-4 p-4 rounded-lg" style={{ background: "rgba(15,118,110,0.08)", border: "1px solid rgba(15,118,110,0.25)" }}>
                            <p className="text-xs font-semibold mb-2" style={{ color: "var(--accent-2)" }}>{labels.total}</p>
                            <div className="text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span style={{ color: "var(--ink)" }}>After Bill Discount:</span>
                                    <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {calc.afterBillDiscount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: "var(--ink)" }}>Tax Amount:</span>
                                    <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {calc.billTax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: "var(--ink)" }}>Shipping Cost:</span>
                                    <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {calc.shipping.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                                    <span style={{ color: "var(--accent-2)" }}>Grand Total:</span>
                                    <span className="font-mono text-xl" style={{ color: "var(--accent-2)" }}>Rs {calc.total.toFixed(2)}</span>
                                </div>
                            </div>
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






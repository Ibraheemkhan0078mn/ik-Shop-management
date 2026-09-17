// src/modules/productPurchases/components/PurchaseModal.jsx
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
import { Plus, TrendingUp, Package, Calendar, FileText, DollarSign, File, X, ChevronDown, Lock, Unlock, Eye, EyeOff, Edit, Trash2 } from "lucide-react";
import { useEffect, useState, useMemo, useRef } from "react";
import { useAllSuppliers } from "../../suppliers/services/suppliers.service";
import { useAllPurchases, useCreatePurchase, usePurchase, useUpdatePurchase, useGeneratePurchaseNumber, useBatchUsageForPurchase } from "../services/purchases.service";
import { useProducts } from "../../productsModule/services/product.service";
import { useBatchesByProduct, useGenerateBatchNumber } from "../services/batch.service";
import ProductCRUDModal from "../../productsModule/components/ProductCRUDModal.jsx";
import SupplierModal from "../../suppliers/components/SupplierModal.jsx";
import { getPurchaseLabels } from "../labels/purchaseLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { ProductService } from "../../productsModule/api/productsApi.js";
import { SupplierService } from "../../suppliers/services/suppliers.service.js";

// ─── constants ────────────────────────────────────────────────────────────────
const toInputDate = (v) => v ? new Date(v).toISOString().slice(0, 10) : "";

const emptyItem = () => ({
    item: "", name: "", quantity: "", unit: "", perItemPrice: "", costPrice: "",
    mfgDate: "", expiryDate: "", batchNumber: "", batchMode: "new", batchSelection: "",
    discount: "", discountType: "percentage", discountInputType: "percentage", discountInputValue: "", discountScope: "entire",
    tax: "", taxType: "percentage", taxInputType: "percentage", taxInputValue: "", taxScope: "entire",
});

const getScopeMultiplier = (quantity, scope) => scope === "perUnit" ? Number(quantity || 0) : 1;

const calculateItemDiscountAmount = (quantity, pricePerUnit, discount, discountType, discountScope = "entire") => {
    const unitPrice = Number(pricePerUnit || 0);
    const discountValue = Number(discount || 0);
    if (!discountValue) return 0;
    const quantityValue = Number(quantity || 0);
    const unitDiscountAmount = discountType === "fixed"
        ? (discountScope === "perUnit" ? discountValue : (quantityValue > 0 ? discountValue / quantityValue : 0))
        : (unitPrice * discountValue) / 100;
    return Math.min(unitPrice, Math.max(0, unitDiscountAmount)) * quantityValue;
};

const calculateItemTotalPrice = (quantity, costPrice) => {
    return Number(quantity || 0) * Number(costPrice || 0);
};

const calculateItemAfterDiscount = (quantity, costPrice, discount, discountType, discountScope = "entire") => {
    const totalPrice = calculateItemTotalPrice(quantity, costPrice);
    const discountAmount = calculateItemDiscountAmount(quantity, costPrice, discount, discountType, discountScope);
    return Math.max(0, totalPrice - discountAmount);
};

const calculateItemTaxOnAfterDiscount = (quantity, costPrice, discount, discountType, tax, taxType, discountScope = "entire", taxScope = "entire") => {
    const afterDiscount = calculateItemAfterDiscount(quantity, costPrice, discount, discountType, discountScope);
    const taxValue = Number(tax || 0);
    if (!taxValue) return 0;
    return taxType === "fixed" ? taxValue * getScopeMultiplier(quantity, taxScope) : (afterDiscount * taxValue) / 100;
};

const calculateItemFinalSubtotal = (quantity, costPrice, discount, discountType, tax, taxType, discountScope = "entire", taxScope = "entire") => {
    const afterDiscount = calculateItemAfterDiscount(quantity, costPrice, discount, discountType, discountScope);
    const taxAmount = calculateItemTaxOnAfterDiscount(quantity, costPrice, discount, discountType, tax, taxType, discountScope, taxScope);
    return afterDiscount + taxAmount;
};

const calculateItemTaxAmount = (quantity, pricePerUnit, discount, discountType, tax, taxType, discountScope = "entire", taxScope = "entire") => {
    const unitPrice = Number(pricePerUnit || 0);
    const quantityValue = Number(quantity || 0);
    const discountValue = Number(discount || 0);
    const taxValue = Number(tax || 0);
    if (!taxValue) return 0;

    const unitDiscountAmount = discountType === "fixed"
        ? (discountScope === "perUnit" ? discountValue : (quantityValue > 0 ? discountValue / quantityValue : 0))
        : (unitPrice * discountValue) / 100;
    const discountedUnitPrice = Math.max(0, unitPrice - Math.min(unitPrice, Math.max(0, unitDiscountAmount)));

    const unitTaxAmount = taxType === "fixed"
        ? (taxScope === "perUnit" ? taxValue : (quantityValue > 0 ? taxValue / quantityValue : 0))
        : (discountedUnitPrice * taxValue) / 100;

    return unitTaxAmount * quantityValue;
};

const calculateItemLineTotal = (quantity, pricePerUnit, discount, discountType, tax, taxType, discountScope = "entire", taxScope = "entire") => {
    const baseTotal = Number(quantity || 0) * Number(pricePerUnit || 0);
    const discountAmount = calculateItemDiscountAmount(quantity, pricePerUnit, discount, discountType, discountScope);
    const afterDiscount = Math.max(0, baseTotal - discountAmount);
    const taxAmount = calculateItemTaxAmount(quantity, pricePerUnit, discount, discountType, tax, taxType, discountScope, taxScope);
    return afterDiscount + taxAmount;
};

const convertItemRatesToPercentages = (item) => {
    const baseTotal = Number(item.quantity || 0) * Number(item.costPrice || item.price || 0);
    const discountAmount = calculateItemDiscountAmount(item.quantity, item.costPrice || item.price, item.discount, item.discountType, item.discountScope);
    const afterDiscount = Math.max(0, baseTotal - discountAmount);

    return {
        ...item,
        discount: item.discountType === "fixed" && baseTotal > 0
            ? (discountAmount / baseTotal) * 100
            : Number(item.discount || 0),
        discountType: "percentage",
        tax: item.taxType === "fixed" && afterDiscount > 0
            ? (calculateItemTaxAmount(item.quantity, item.costPrice || item.price, item.discount, item.discountType, item.tax, item.taxType, item.discountScope, item.taxScope) / afterDiscount) * 100
            : Number(item.tax || 0),
        taxType: "percentage",
    };
};

const calculateItemCosting = (item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.costPrice ?? item.price ?? 0);
    const discountValue = Number(item.discount || 0);
    const discountType = item.discountType ?? "percentage";
    const taxValue = Number(item.tax || 0);
    const taxType = item.taxType ?? "percentage";
    const discountScope = item.discountScope ?? "entire";
    const taxScope = item.taxScope ?? "entire";

    const discountAmountPerUnit = discountType === "fixed"
        ? (discountScope === "perUnit" ? discountValue : (quantity > 0 ? discountValue / quantity : 0))
        : (unitPrice * discountValue) / 100;

    const discountedUnitPrice = Math.max(0, unitPrice - Math.min(unitPrice, Math.max(0, discountAmountPerUnit)));

    const taxAmountPerUnit = taxType === "fixed"
        ? (taxScope === "perUnit" ? taxValue : (quantity > 0 ? taxValue / quantity : 0))
        : (discountedUnitPrice * taxValue) / 100;

    const perUnitCosting = discountedUnitPrice + taxAmountPerUnit;
    const totalCosting = perUnitCosting * quantity;
    const baseTotal = quantity * unitPrice;
    const discountAmount = calculateItemDiscountAmount(quantity, unitPrice, item.discount, discountType, discountScope);
    const afterDiscount = Math.max(0, baseTotal - discountAmount);
    const taxAmount = calculateItemTaxAmount(quantity, unitPrice, item.discount, discountType, item.tax, taxType, discountScope, taxScope);

    return { baseTotal, discountAmount, afterDiscount, taxAmount, totalCosting, perUnitCosting };
};

const emptyBill = () => ({
    supplier: "", purchaseDate: new Date().toISOString().slice(0, 10),
    invoiceNumber: "", notes: "", 
    // Purchase level discount, tax, and shipping - commented out
    // discount: 0, discountType: "percentage",
    // gst: 0, gstType: "percentage", shippingCost: 0,
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

// ─── API-based searchable select for products ─────────────────────────────────────
const ApiProductSelect = ({ value, onChange, placeholder = "Search products...", productName = "" }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState([]);
    const ref = useRef();

    // Add current value to options if not already present (for update mode)
    const selected = useMemo(() => {
        const found = options.find(o => o.value === value);
        if (found) return found;
        // If value exists but not in options, create a temporary option with the product name
        if (value) return { label: productName || value, value: value, data: { name: productName || value } };
        return null;
    }, [options, value, productName]);

    const searchProducts = async (query) => {
        if (!query || query.length < 1) {
            setOptions([]);
            return;
        }
        setLoading(true);
        try {
            const results = await ProductService.search(query, 20);
            setOptions(results.map(p => ({ label: p.name, value: p._id, data: p })));
        } catch (error) {
            console.error("Error searching products:", error);
            setOptions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (open && search) {
                searchProducts(search);
            }
        }, 300);
        return () => clearTimeout(debounceTimer);
    }, [search, open]);

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
                        <input 
                            autoFocus 
                            type="text" 
                            placeholder="Search products..." 
                            value={search} 
                            onChange={e => setSearch(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm rounded-lg outline-none"
                            style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", color: "var(--ink)" }} 
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {loading ? (
                            <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
                        ) : search.length < 1 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">Type at least 1 character to search</div>
                        ) : options.length > 0 ? (
                            options.map(o => (
                                <div key={o.value} onClick={() => { onChange(o.value, o.data); setOpen(false); setSearch(""); }}
                                    className="px-3 py-2 text-sm cursor-pointer transition"
                                    style={{ background: value === o.value ? "rgba(15,118,110,0.08)" : "transparent", color: value === o.value ? "var(--accent-2)" : "var(--ink)", fontWeight: value === o.value ? 600 : 400 }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(15,118,110,0.06)"}
                                    onMouseLeave={e => e.currentTarget.style.background = value === o.value ? "rgba(15,118,110,0.08)" : "transparent"}>
                                    {o.label}
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">No products found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── API-based searchable select for suppliers ─────────────────────────────────────
const ApiSupplierSelect = ({ value, onChange, placeholder = "Search suppliers...", supplierName = "" }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState([]);
    const ref = useRef();

    // Add current value to options if not already present (for update mode)
    const selected = useMemo(() => {
        const found = options.find(o => o.value === value);
        if (found) return found;
        // If value exists but not in options, create a temporary option with the supplier name
        if (value) return { label: supplierName || value, value: value, data: { name: supplierName || value } };
        return null;
    }, [options, value, supplierName]);

    const searchSuppliers = async (query) => {
        if (!query || query.length < 1) {
            setOptions([]);
            return;
        }
        setLoading(true);
        try {
            const results = await SupplierService.search(query, 20);
            setOptions(results.map(s => ({ label: s.name, value: s._id, data: s })));
        } catch (error) {
            console.error("Error searching suppliers:", error);
            setOptions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (open && search) {
                searchSuppliers(search);
            }
        }, 300);
        return () => clearTimeout(debounceTimer);
    }, [search, open]);

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
                        <input 
                            autoFocus 
                            type="text" 
                            placeholder="Search suppliers..." 
                            value={search} 
                            onChange={e => setSearch(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm rounded-lg outline-none"
                            style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", color: "var(--ink)" }} 
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {loading ? (
                            <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
                        ) : search.length < 1 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">Type at least 1 character to search</div>
                        ) : options.length > 0 ? (
                            options.map(o => (
                                <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); setSearch(""); }}
                                    className="px-3 py-2 text-sm cursor-pointer transition"
                                    style={{ background: value === o.value ? "rgba(15,118,110,0.08)" : "transparent", color: value === o.value ? "var(--accent-2)" : "var(--ink)", fontWeight: value === o.value ? 600 : 400 }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(15,118,110,0.06)"}
                                    onMouseLeave={e => e.currentTarget.style.background = value === o.value ? "rgba(15,118,110,0.08)" : "transparent"}>
                                    {o.label}
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">No suppliers found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── original searchable select ────────────────────────────────────────────────────────
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
    const [generatePurchaseNumber] = useGeneratePurchaseNumber();
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
    const [generatedBatchNumber, setGeneratedBatchNumber] = useState(null);
    const [generatedInvoiceNumber, setGeneratedInvoiceNumber] = useState(null);
    const [showProductModal, setShowProductModal] = useState(false);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [isInvoiceNumberLocked, setIsInvoiceNumberLocked] = useState(true);
    const [expandedItems, setExpandedItems] = useState({});
    const [isRecalculating, setIsRecalculating] = useState(false);
    const hasRecalculatedRef = useRef(false);
    const batchGenerationRequestRef = useRef(0);

    const { data: batchesRaw = [] } = useBatchesByProduct(itemForm.item, { skip: !itemForm.item });
    const availableBatches = Array.isArray(batchesRaw) ? batchesRaw : [];
    const selectedBatch = availableBatches.find(b => b._id === itemForm.batchSelection);
    const isExistingMode = itemForm.batchMode === "existing" && Boolean(itemForm.batchSelection);
    const { data: selectedBatchUsage } = useBatchUsageForPurchase({ purchaseId, batchId: itemForm.batchSelection }, { skip: !isUpdate || !purchaseId || !itemForm.batchSelection });
    const isBatchMetadataLocked = isExistingMode && isUpdate && selectedBatchUsage && !selectedBatchUsage.editable;

    // Calculate stock status for purchase form
    const getStockStatus = (productId, newQuantity) => {
        const product = productsList.find(p => p._id === productId);
        if (!product) return null;

        const currentStock = product.currentStockLevel || 0;
        const projectedStock = currentStock + (Number(newQuantity) || 0);
        const minStock = product.minStockLevel || 5;
        const maxStock = product.maxStockLevel || 10;

        let status, color, label;

        if (projectedStock === 0) {
            status = 'empty';
            color = 'red';
            label = 'Empty';
        } else if (projectedStock < minStock) {
            status = 'low_stock';
            color = 'amber';
            label = 'Low Stock';
        } else if (projectedStock >= maxStock) {
            status = 'max_stock';
            color = 'red';
            label = 'Max Stock';
        } else {
            status = 'normal_stock';
            color = 'green';
            label = 'Normal Stock';
        }

        return {
            currentStock,
            projectedStock,
            minStock,
            maxStock,
            status,
            color,
            label
        };
    };

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
        setAddedItems((existingPurchase.items ?? []).map((it) => {
            const batch = it.batch || {};
            const batchId = it.batchId ?? batch._id ?? "";
            const costPrice = batch.costPrice ?? it.costPrice ?? it.price ?? 0;
            const sellingPrice = batch.defaultSellingPrice ?? it.price ?? it.perItemPrice ?? 0;
            const discountValue = batch.discountEntryValue ?? it.discount ?? 0;
            const discountType = batch.discountEntryType ?? it.discountType ?? "percentage";
            const discountScope = batch.discountScope ?? it.discountScope ?? "entire";
            const taxValue = batch.taxEntryValue ?? it.tax ?? 0;
            const taxType = batch.taxEntryType ?? it.taxType ?? "percentage";
            const taxScope = batch.taxScope ?? it.taxScope ?? "entire";

            return {
                item: it.product?._id ?? it.product ?? "",
                name: it.product?.name ?? "",
                quantity: it.quantity ?? 0,
                unit: it.unit ?? "",
                pricePerUnit: sellingPrice,
                costPrice,
                totalPurchasePrice: calculateItemLineTotal(it.quantity ?? 0, costPrice, discountValue, discountType, taxValue, taxType, discountScope, taxScope),
                mfgDate: toInputDate(batch.mfgDate ?? it.mfgDate),
                expiryDate: toInputDate(batch.expiryDate ?? it.expiryDate),
                batchNumber: batch.batchNumber ?? it.batchNumber ?? "",
                batchMode: batchId ? "existing" : "new",
                batchSelection: batchId,
                batchId,
                discount: discountValue,
                discountType,
                discountScope,
                discountInputType: discountType,
                discountInputValue: discountValue,
                tax: taxValue,
                taxType,
                taxScope,
                taxInputType: taxType,
                taxInputValue: taxValue,
            };
        }));
        setBill({
            supplier: existingPurchase.supplier?._id ?? existingPurchase.supplier ?? "",
            supplierName: existingPurchase.supplier?.name ?? "",
            purchaseDate: existingPurchase.date ? new Date(existingPurchase.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            invoiceNumber: existingPurchase.invoiceNumber ?? "",
            notes: existingPurchase.notes ?? "",
            // Purchase level discount, tax, and shipping - commented out
            // discount: existingPurchase.discount ?? 0,
            // discountType: existingPurchase.discountType ?? "percentage",
            // gst: existingPurchase.gst ?? 0,
            // gstType: existingPurchase.gstType ?? "percentage",
            // shippingCost: existingPurchase.shippingCost ?? 0,
        });
        // Reset recalculation flag when loading new purchase
        hasRecalculatedRef.current = false;
    }, [existingPurchase, isUpdate]);

    // Auto-recalculate after data is loaded in edit mode
    useEffect(() => {
        if (!isUpdate || !existingPurchase || addedItems.length === 0 || hasRecalculatedRef.current) return;
        
        // Recalculate each item's totals
        const finalSubtotal = (quantity, costPrice, discount, discountType, tax, taxType, discountScope, taxScope) => {
            const afterDiscount = calculateItemAfterDiscount(quantity, costPrice, discount, discountType, discountScope);
            const taxAmount = calculateItemTaxOnAfterDiscount(quantity, costPrice, discount, discountType, tax, taxType, discountScope, taxScope);
            return afterDiscount + taxAmount;
        };
        
        const recalculatedItems = addedItems.map(it => {
            const quantity = Number(it.quantity) || 0;
            const costPrice = Number(it.costPrice) || 0;
            const discount = Number(it.discount) || 0;
            const discountType = it.discountType || 'percentage';
            const tax = Number(it.tax) || 0;
            const taxType = it.taxType || 'percentage';
            
            const totalPurchasePrice = finalSubtotal(quantity, costPrice, discount, discountType, tax, taxType, it.discountScope, it.taxScope);
            
            return {
                ...it,
                totalPurchasePrice
            };
        });
        
        setAddedItems(recalculatedItems);
        hasRecalculatedRef.current = true;
    }, [existingPurchase, isUpdate, addedItems]);

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

    // Update batch number in form when generated
    useEffect(() => {
        if (itemForm.batchMode !== "new") return;
        if (!generatedBatchNumber) {
            setItemForm(p => p.batchNumber ? { ...p, batchNumber: "", batchSelection: "" } : p);
            return;
        }
        setItemForm(p => p.batchNumber === generatedBatchNumber ? p : { ...p, batchNumber: generatedBatchNumber, batchSelection: "" });
    }, [itemForm.batchMode, generatedBatchNumber]);

    // autofill from existing batch
    useEffect(() => {
        if (!selectedBatch || !isExistingMode) return;
        setItemForm(p => ({
            ...p,
            batchNumber: selectedBatch.batchNumber ?? p.batchNumber,
            costPrice: editingIndex === null && selectedBatch.costPrice != null ? String(selectedBatch.costPrice) : p.costPrice,
            perItemPrice: editingIndex === null && selectedBatch.defaultSellingPrice != null ? String(selectedBatch.defaultSellingPrice) : p.perItemPrice,
            mfgDate: toInputDate(selectedBatch.mfgDate),
            expiryDate: toInputDate(selectedBatch.expiryDate),
            discountType: editingIndex === null ? selectedBatch.discountEntryType || "percentage" : p.discountType,
            discountInputType: editingIndex === null ? selectedBatch.discountEntryType || "percentage" : p.discountInputType,
            discountInputValue: editingIndex === null ? String(selectedBatch.discountEntryValue ?? 0) : p.discountInputValue,
            discount: editingIndex === null ? String(selectedBatch.discountEntryValue ?? 0) : p.discount,
            taxType: editingIndex === null ? selectedBatch.taxEntryType || "percentage" : p.taxType,
            taxInputType: editingIndex === null ? selectedBatch.taxEntryType || "percentage" : p.taxInputType,
            taxInputValue: editingIndex === null ? String(selectedBatch.taxEntryValue ?? 0) : p.taxInputValue,
            tax: editingIndex === null ? String(selectedBatch.taxEntryValue ?? 0) : p.tax,
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
        const itemsDiscountTotal = addedItems.reduce((s, it) => s + calculateItemDiscountAmount(it.quantity, it.costPrice, it.discount, it.discountType, it.discountScope), 0);
        const itemsTaxTotal = addedItems.reduce((s, it) => s + calculateItemTaxAmount(it.quantity, it.costPrice, it.discount, it.discountType, it.tax, it.taxType, it.discountScope, it.taxScope), 0);
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

    const itemFormCosting = calculateItemCosting(itemForm);
    const itemFormBaseTotal = itemFormCosting.baseTotal;
    const itemFormDiscountAmount = itemFormCosting.discountAmount;
    const itemFormAfterDiscount = itemFormCosting.afterDiscount;
    const itemFormTaxAmount = itemFormCosting.taxAmount;
    const itemFormDiscountPercentage = itemForm.discountType === "percentage"
        ? (Number(itemForm.discount || 0) || 0)
        : itemFormBaseTotal > 0 ? (itemFormDiscountAmount / itemFormBaseTotal) * 100 : 0;
    const itemFormTaxPercentage = itemForm.taxType === "percentage"
        ? (Number(itemForm.tax || 0) || 0)
        : itemFormAfterDiscount > 0 ? (itemFormTaxAmount / itemFormAfterDiscount) * 100 : 0;
    const itemFormFinalTotal = itemFormCosting.totalCosting;

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

    const requestGeneratedBatchNumber = (productId = itemForm.item) => {
        if (!productId) return;

        const requestId = ++batchGenerationRequestRef.current;
        const reservedBatchNumbers = addedItems
            .map(item => item.batchNumber)
            .filter(Boolean);

        setGeneratedBatchNumber(null);
        generateBatchNumber({ reservedBatchNumbers }).unwrap().then((result) => {
            if (requestId === batchGenerationRequestRef.current && result?.batchNumber) {
                setGeneratedBatchNumber(result.batchNumber);
            }
        }).catch(() => {
            if (requestId === batchGenerationRequestRef.current) {
                showError(labels.batchNumberRequired);
            }
        });
    };

    const handleBatchSelect = (val) => {
        const b = availableBatches.find(b => b._id === val);
        if (!b) {
            showError("Batch not found");
            return;
        }
        setItemForm(p => ({
            ...p, batchMode: "existing", batchSelection: val,
            batchNumber: b.batchNumber ?? p.batchNumber,
            costPrice: b.costPrice != null ? String(b.costPrice) : p.costPrice,
            perItemPrice: b.defaultSellingPrice != null ? String(b.defaultSellingPrice) : p.perItemPrice,
            mfgDate: toInputDate(b.mfgDate),
            expiryDate: toInputDate(b.expiryDate),
            discount: String(b.discountEntryValue ?? 0),
            discountType: b.discountEntryType || "percentage",
            discountInputType: b.discountEntryType || "percentage",
            discountInputValue: String(b.discountEntryValue ?? 0),
            tax: String(b.taxEntryValue ?? 0),
            taxType: b.taxEntryType || "percentage",
            taxInputType: b.taxEntryType || "percentage",
            taxInputValue: String(b.taxEntryValue ?? 0),
            discountScope: b.discountScope || "entire",
            taxScope: b.taxScope || "entire",
        }));
    };

    const handleAddItem = () => {
        if (!itemForm.item) return showError(labels.selectItem);
        if (!itemForm.quantity || Number(itemForm.quantity) <= 0) return showError(labels.enterValidQuantity || "Please enter a valid quantity.");
        if (itemForm.costPrice === "" || Number(itemForm.costPrice) < 0) return showError(labels.enterValidPrice);
        if (!Number.isFinite(Number(itemForm.discount)) || Number(itemForm.discount) < 0) return showError("Please enter a valid discount.");
        if (!Number.isFinite(Number(itemForm.tax)) || Number(itemForm.tax) < 0) return showError("Please enter a valid tax.");
        if (itemForm.discountType === "percentage" && Number(itemForm.discount) > 100) return showError("Discount percentage cannot exceed 100%.");
        if (itemForm.taxType === "percentage" && Number(itemForm.tax) > 100) return showError("Tax percentage cannot exceed 100%.");
        if (itemForm.batchMode === "existing" && !itemForm.batchSelection) return showError(labels.selectBatch);

        const prod = productsList.find(p => p._id === itemForm.item);
        const batchNo = itemForm.batchNumber ? itemForm.batchNumber.trim() : "";
        if (!batchNo) return showError(labels.batchNumberRequired);

        if (editingIndex === null && addedItems.some(it => it.item === itemForm.item)) {
            return showError(labels.productAlreadyAdded || "This product is already added to the bill");
        }

        const row = {
            item: itemForm.item, name: prod?.name ?? "Unknown",
            quantity: Number(itemForm.quantity), unit: itemForm.unit,
            pricePerUnit: Number(itemForm.perItemPrice) || 0,
            costPrice: Number(itemForm.costPrice),
            totalPurchasePrice: itemFormCosting.totalCosting,
            perUnitCosting: itemFormCosting.perUnitCosting,
            mfgDate: itemForm.mfgDate, expiryDate: itemForm.expiryDate,
            batchNumber: batchNo, batchMode: itemForm.batchMode,
            batchSelection: itemForm.batchMode === "existing" ? itemForm.batchSelection : "",
            batchId: itemForm.batchMode === "existing" ? itemForm.batchSelection : "",
            batchMetadataEdited: Boolean(itemForm.batchSelection && (
                String(itemForm.costPrice) !== String(selectedBatch?.costPrice ?? "") ||
                String(itemForm.perItemPrice) !== String(selectedBatch?.defaultSellingPrice ?? "") ||
                itemForm.mfgDate !== toInputDate(selectedBatch?.mfgDate) ||
                itemForm.expiryDate !== toInputDate(selectedBatch?.expiryDate) ||
                String(itemForm.discount) !== String(selectedBatch?.discountEntryValue ?? 0) ||
                itemForm.discountType !== (selectedBatch?.discountEntryType || "percentage") ||
                itemForm.discountScope !== (selectedBatch?.discountScope || "entire") ||
                String(itemForm.tax) !== String(selectedBatch?.taxEntryValue ?? 0) ||
                itemForm.taxType !== (selectedBatch?.taxEntryType || "percentage") ||
                itemForm.taxScope !== (selectedBatch?.taxScope || "entire")
            )),
            discount: Number(itemForm.discount) || 0, discountType: itemForm.discountType, discountScope: itemForm.discountScope,
            discountInputType: itemForm.discountType, discountInputValue: Number(itemForm.discount) || 0,
            tax: Number(itemForm.tax) || 0, taxType: itemForm.taxType, taxScope: itemForm.taxScope,
            taxInputType: itemForm.taxType, taxInputValue: Number(itemForm.tax) || 0,
        };

        if (editingIndex !== null) {
            setAddedItems(p => p.map((it, i) => i === editingIndex ? row : it));
            setEditingIndex(null);
        } else {
            setAddedItems(p => [...p, row]);
        }
        batchGenerationRequestRef.current += 1;
        setItemForm(emptyItem());
        setGeneratedBatchNumber(null);
    };

    const handleEditItem = (it, idx) => {
        const hasExistingBatch = Boolean(it.batchId && it.batchMode === "existing");
        const batchSource = it.batch || {};
        const selectedCostPrice = batchSource.costPrice ?? it.costPrice ?? it.pricePerUnit ?? 0;
        const selectedSalePrice = batchSource.defaultSellingPrice ?? it.pricePerUnit ?? 0;
        const selectedDiscount = batchSource.discountEntryValue ?? it.discount ?? 0;
        const selectedDiscountType = batchSource.discountEntryType ?? it.discountType ?? "percentage";
        const selectedDiscountScope = batchSource.discountScope ?? it.discountScope ?? "entire";
        const selectedTax = batchSource.taxEntryValue ?? it.tax ?? 0;
        const selectedTaxType = batchSource.taxEntryType ?? it.taxType ?? "percentage";
        const selectedTaxScope = batchSource.taxScope ?? it.taxScope ?? "entire";
        setItemForm({
            item: it.item, name: it.name, quantity: it.quantity, unit: it.unit,
            perItemPrice: selectedSalePrice, costPrice: selectedCostPrice || "",
            mfgDate: it.mfgDate, expiryDate: it.expiryDate,
            batchNumber: it.batchNumber, batchMode: hasExistingBatch ? "existing" : "new",
            batchSelection: hasExistingBatch ? it.batchId : "",
            discount: selectedDiscount, discountType: selectedDiscountType,
            discountInputType: selectedDiscountType, discountInputValue: selectedDiscount,
            discountScope: selectedDiscountScope,
            tax: selectedTax, taxType: selectedTaxType, taxInputType: selectedTaxType, taxInputValue: selectedTax, taxScope: selectedTaxScope,
        });
        setEditingIndex(idx);
    };

    // Recalculate all purchase totals
    const handleRecalculate = () => {
        setIsRecalculating(true);
        
        // Recalculate each item's totals
        const recalculatedItems = addedItems.map(it => {
            const quantity = Number(it.quantity) || 0;
            const costPrice = Number(it.costPrice) || 0;
            const discount = Number(it.discount) || 0;
            const discountType = it.discountType || 'percentage';
            const tax = Number(it.tax) || 0;
            const taxType = it.taxType || 'percentage';
            
            const totalPurchasePrice = calculateItemFinalSubtotal(quantity, costPrice, discount, discountType, tax, taxType, it.discountScope, it.taxScope);
            
            return {
                ...it,
                totalPurchasePrice
            };
        });
        
        setAddedItems(recalculatedItems);
        setIsRecalculating(false);
        showSuccess("Recalculated successfully");
    };

    const handleSubmit = async () => {
        // First run recalculation
        handleRecalculate();
        
        if (!addedItems.length) return showError(labels.addAtLeastOneItem);
        if (!bill.supplier) return showError(labels.selectSupplier);
        if (!bill.purchaseDate) return showError(labels.selectDate ?? "Please select a purchase date");

        const payload = {
            supplier: bill.supplier, date: bill.purchaseDate,
            invoiceNumber: bill.invoiceNumber, notes: bill.notes ?? "",
            subtotal: calc.subtotalAfterItems,
            // Purchase level discount, tax, and shipping - commented out
            // discount: Number(bill.discount), discountType: bill.discountType,
            // gst: Number(bill.gst), gstType: bill.gstType,
            // shippingCost: Number(bill.shippingCost), 
            totalAmount: calc.subtotalAfterItems, // Use subtotalAfterItems instead of calc.total
            items: addedItems.map(it => {
                const percentageItem = convertItemRatesToPercentages({
                    quantity: it.quantity,
                    price: it.pricePerUnit,
                    costPrice: it.costPrice || 0,
                    discount: it.discount,
                    discountType: it.discountType,
                    discountInputType: it.discountInputType || it.discountType,
                    discountInputValue: it.discountInputValue ?? it.discount,
                    discountScope: it.discountScope,
                    tax: it.tax,
                    taxType: it.taxType,
                    taxInputType: it.taxInputType || it.taxType,
                    taxInputValue: it.taxInputValue ?? it.tax,
                    taxScope: it.taxScope,
                });

                return {
                    product: it.item,
                    batchNumber: it.batchNumber,
                    isNewBatch: it.batchMode === "new",
                    quantity: it.quantity, price: it.pricePerUnit, costPrice: it.costPrice || 0,
                    discount: percentageItem.discount, discountType: percentageItem.discountType,
                    tax: percentageItem.tax, taxType: percentageItem.taxType,
                    discountInputType: percentageItem.discountInputType, discountInputValue: percentageItem.discountInputValue,
                    discountScope: percentageItem.discountScope, taxInputType: percentageItem.taxInputType,
                    taxInputValue: percentageItem.taxInputValue, taxScope: percentageItem.taxScope,
                    batchMetadataEdited: it.batchMetadataEdited === true,
                    perUnitCosting: it.perUnitCosting, totalCosting: it.totalPurchasePrice,
                mfgDate: it.mfgDate ? new Date(it.mfgDate).toISOString() : undefined,
                expiryDate: it.expiryDate ? new Date(it.expiryDate).toISOString() : undefined,
                };
            }),
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
            <div className="relative w-[90%] max-w-6xl sm:my-4 min-h-full sm:min-h-0 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden" style={{ background: "var(--app-bg)", border: "1px solid var(--border)" }} onClick={e => e.stopPropagation()}>

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
                                            <ApiProductSelect 
                                                className="flex-1" 
                                                value={itemForm.item}
                                                productName={itemForm.name}
                                                onChange={(val, productData) => { 
                                                    if (productData) { 
                                                        setItemForm(() => ({ 
                                                            ...emptyItem(), 
                                                            item: productData._id, 
                                                            name: productData.name, 
                                                            unit: productData.unit ?? "unit", 
                                                            discountType: productData.discountType ?? "percentage", 
                                                            taxType: productData.taxType ?? "percentage" 
                                                        })); 
                                                        requestGeneratedBatchNumber(productData._id);
                                                    } 
                                                }}
                                                placeholder={labels.product + "…"} 
                                            />
                                            <button type="button" onClick={() => setShowProductModal(true)} className="px-3 py-2 rounded-lg hover:opacity-90 transition flex items-center gap-1 shrink-0" style={{ background: "var(--accent-2)", color: "#fff" }} title="Create new product"><Plus size={16} /></button>
                                        </div>
                                    </Field>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field><Label>{labels.batchNo}</Label><Inp value={itemForm.batchNumber} readOnly className="text-xs" style={{ background: "var(--surface-muted)", cursor: "not-allowed", color: "var(--muted)" }} /></Field>
                                    <Field>
                                        <Label>{labels.batchMode}</Label>
                                        <div className="flex gap-2">
                                                <Btn variant={itemForm.batchMode === "new" ? "active" : "inactive"} size="sm" className="flex-1" onClick={() => { 
                                                setItemForm(p => ({
                                                    ...p,
                                                    batchMode: "new",
                                                    batchSelection: "",
                                                    batchNumber: "",
                                                })); 
                                                requestGeneratedBatchNumber();
                                            }}>{labels.new}</Btn>
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
                                        <Inp 
                                            name="quantity" 
                                            type="number" 
                                            placeholder="0" 
                                            value={itemForm.quantity} 
                                            onChange={handleItemChange}
                                            min="0"
                                            onWheel={e => e.target.blur()}
                                        />
                                    </Field>
                                    <Field><Label>Status</Label>
                                        {itemForm.item && (() => {
                                            const stockStatus = getStockStatus(itemForm.item, itemForm.quantity);
                                            if (!stockStatus) return <span className="shrink-0 px-3 py-2 text-xs font-semibold rounded-xl w-full flex items-center justify-center" style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", color: "var(--muted)" }}>—</span>;
                                            const colorClasses = {
                                                red: 'bg-red-50 text-red-700 border-red-200',
                                                amber: 'bg-amber-50 text-amber-700 border-amber-200',
                                                green: 'bg-green-50 text-green-700 border-green-200',
                                                blue: 'bg-blue-50 text-blue-700 border-blue-200'
                                            };
                                            return (
                                                <div className={`px-3 py-2 rounded-lg text-xs border ${colorClasses[stockStatus.color]}`}>
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium">{stockStatus.label}</span>
                                                        <span>Current: {stockStatus.currentStock} + New: {itemForm.quantity || 0} = {stockStatus.projectedStock}</span>
                                                    </div>
                                                    <div className="text-[10px] opacity-75 mt-1">
                                                        Min: {stockStatus.minStock} | Max: {stockStatus.maxStock}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </Field>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field><Label>{labels.costPrice || "Cost Price"} *</Label>
                                        <Inp 
                                            name="costPrice" 
                                            type="number" 
                                            placeholder="0.00" 
                                            value={itemForm.costPrice} 
                                            onChange={handleItemChange}
                                            min="0"
                                            onWheel={e => e.target.blur()}
                                            readOnly={isBatchMetadataLocked}
                                            style={isBatchMetadataLocked ? { background: "var(--surface-muted)", cursor: "not-allowed", color: "var(--muted)" } : {}}
                                        />
                                    </Field>
                                    <Field><Label>Default Sale Price</Label>
                                        <Inp 
                                            name="perItemPrice" 
                                            type="number" 
                                            placeholder="0.00" 
                                            value={itemForm.perItemPrice} 
                                            onChange={handleItemChange}
                                            min="0"
                                            onWheel={e => e.target.blur()}
                                            readOnly={isBatchMetadataLocked}
                                            style={isBatchMetadataLocked ? { background: "var(--surface-muted)", cursor: "not-allowed", color: "var(--muted)" } : {}}
                                        />
                                    </Field>
                                </div>

                                <div className="space-y-4">
                                    <div className="rounded-2xl border p-3" style={{ background: "rgba(59,130,246,0.04)", borderColor: "rgba(59,130,246,0.18)" }}>
                                        <div className="mb-2 flex items-center justify-between gap-2">
                                            <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--muted)" }}>{labels.discount}</span>
                                            <span className="text-[11px] font-semibold" style={{ color: "var(--accent-2)" }}>{itemFormDiscountPercentage.toFixed(2)}%</span>
                                        </div>
                                        <div className="flex gap-3 mb-2 text-xs" style={{ color: "var(--muted)" }}>
                                            {["percentage", "fixed"].map(type => (
                                                <label key={type} className="flex items-center gap-1.5 cursor-pointer">
                                                    <input type="radio" name="discountType" value={type} checked={itemForm.discountType === type} disabled={isBatchMetadataLocked} onChange={e => setItemForm(p => ({ ...p, discountType: e.target.value }))} />
                                                    {type === "percentage" ? labels.percentage : labels.fixed}
                                                </label>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <Inp name="discount" type="number" placeholder={itemForm.discountType === "fixed" ? "Fixed amount" : "Percentage"} value={itemForm.discount} onChange={handleItemChange} min="0" max={itemForm.discountType === "percentage" ? "100" : undefined} onWheel={e => e.target.blur()} readOnly={isBatchMetadataLocked} style={isBatchMetadataLocked ? { background: "var(--surface-muted)", cursor: "not-allowed", color: "var(--muted)" } : {}} />
                                            <Sel value={itemForm.discountScope} onChange={e => setItemForm(p => ({ ...p, discountScope: e.target.value }))} disabled={isBatchMetadataLocked}>
                                                <option value="entire">Entire calculation</option>
                                                <option value="perUnit">Per unit</option>
                                            </Sel>
                                        </div>
                                        <p className="mt-2 text-[11px]" style={{ color: "var(--muted)" }}>
                                            {itemForm.discountType === "fixed" ? `Amount: Rs ${itemFormDiscountAmount.toFixed(2)} • Equivalent: ${itemFormDiscountPercentage.toFixed(2)}%` : `Amount: Rs ${itemFormDiscountAmount.toFixed(2)} • Rate: ${itemFormDiscountPercentage.toFixed(2)}%`}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border p-3" style={{ background: "rgba(16,185,129,0.04)", borderColor: "rgba(16,185,129,0.18)" }}>
                                        <div className="mb-2 flex items-center justify-between gap-2">
                                            <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--muted)" }}>{labels.taxPercent || "Tax"}</span>
                                            <span className="text-[11px] font-semibold" style={{ color: "var(--accent-2)" }}>{itemFormTaxPercentage.toFixed(2)}%</span>
                                        </div>
                                        <div className="flex gap-3 mb-2 text-xs" style={{ color: "var(--muted)" }}>
                                            {["percentage", "fixed"].map(type => (
                                                <label key={type} className="flex items-center gap-1.5 cursor-pointer">
                                                    <input type="radio" name="taxType" value={type} checked={itemForm.taxType === type} disabled={isBatchMetadataLocked} onChange={e => setItemForm(p => ({ ...p, taxType: e.target.value }))} />
                                                    {type === "percentage" ? labels.percentage : labels.fixed}
                                                </label>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <Inp name="tax" type="number" placeholder={itemForm.taxType === "fixed" ? "Fixed amount" : "Percentage"} value={itemForm.tax} onChange={handleItemChange} min="0" max={itemForm.taxType === "percentage" ? "100" : undefined} onWheel={e => e.target.blur()} readOnly={isBatchMetadataLocked} style={isBatchMetadataLocked ? { background: "var(--surface-muted)", cursor: "not-allowed", color: "var(--muted)" } : {}} />
                                            <Sel value={itemForm.taxScope} onChange={e => setItemForm(p => ({ ...p, taxScope: e.target.value }))} disabled={isBatchMetadataLocked}>
                                                <option value="entire">Entire calculation</option>
                                                <option value="perUnit">Per unit</option>
                                            </Sel>
                                        </div>
                                        <p className="mt-2 text-[11px]" style={{ color: "var(--muted)" }}>
                                            {itemForm.taxType === "fixed" ? `Amount: Rs ${itemFormTaxAmount.toFixed(2)} • Equivalent: ${itemFormTaxPercentage.toFixed(2)}%` : `Amount: Rs ${itemFormTaxAmount.toFixed(2)} • Rate: ${itemFormTaxPercentage.toFixed(2)}%`}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Field><Label>{labels.mfgDate}</Label>
                                        <Inp 
                                            name="mfgDate" 
                                            type="date" 
                                            value={itemForm.mfgDate} 
                                            onChange={handleItemChange}
                                            readOnly={isBatchMetadataLocked}
                                            style={isBatchMetadataLocked ? { background: "var(--surface-muted)", cursor: "not-allowed", color: "var(--muted)" } : {}}
                                        />
                                    </Field>
                                    <Field><Label>{labels.expiryDate}</Label>
                                        <Inp 
                                            name="expiryDate" 
                                            type="date" 
                                            value={itemForm.expiryDate} 
                                            onChange={handleItemChange}
                                            readOnly={isBatchMetadataLocked}
                                            style={isBatchMetadataLocked ? { background: "var(--surface-muted)", cursor: "not-allowed", color: "var(--muted)" } : {}}
                                        />
                                    </Field>
                                </div>

                                <div className="p-3 rounded-2xl" style={{ background: "var(--surface-muted)", border: "1px solid var(--border)" }}>
                                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Item calculation summary</p>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5" style={{ background: "rgba(148,163,184,0.08)" }}>
                                            <span style={{ color: "var(--ink)" }}>Cost price</span>
                                            <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {Number(itemForm.costPrice || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5" style={{ background: "rgba(239,68,68,0.05)" }}>
                                            <span style={{ color: "var(--ink)" }}>Discount</span>
                                            <span className="font-mono text-right" style={{ color: "#dc2626" }}>
                                                -Rs {itemFormDiscountAmount.toFixed(2)}<br />
                                                <span style={{ color: "var(--muted)" }}>({itemFormDiscountPercentage.toFixed(2)}%)</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5" style={{ background: "rgba(59,130,246,0.05)" }}>
                                            <span style={{ color: "var(--ink)" }}>After discount</span>
                                            <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {itemFormAfterDiscount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5" style={{ background: "rgba(16,185,129,0.05)" }}>
                                            <span style={{ color: "var(--ink)" }}>Tax</span>
                                            <span className="font-mono text-right" style={{ color: "#16a34a" }}>
                                                +Rs {itemFormTaxAmount.toFixed(2)}<br />
                                                <span style={{ color: "var(--muted)" }}>({itemFormTaxPercentage.toFixed(2)}%)</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5" style={{ background: "rgba(168,85,247,0.06)" }}>
                                            <span style={{ color: "var(--ink)" }}>Per-unit costing</span>
                                            <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {itemFormCosting.perUnitCosting.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5 font-semibold" style={{ background: "rgba(15,118,110,0.08)", borderTop: "1px solid var(--border)" }}>
                                            <span style={{ color: "var(--accent-2)" }}>Final item total</span>
                                            <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {itemFormFinalTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {!isUpdate && bill.supplier && frequentItems.length > 0 && (
                                    <div className="p-3 rounded-xl" style={{ background: "rgba(180,83,9,0.05)", border: "1px solid rgba(180,83,9,0.15)" }}>
                                        <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} /><span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>{labels.frequentlyPurchased}</span></div>
                                        <div className="flex flex-wrap gap-2">
                                            {frequentItems.map((f, i) => {
                                                const prod = productsList.find(p => p._id === (f.product?._id ?? f.item?._id ?? f.product ?? f.item));
                                                return prod ? (
                                                    <button key={i} onClick={() => { setItemForm({ ...emptyItem(), item: prod._id, name: prod.name, unit: prod.unit ?? "unit", perItemPrice: f.avgPrice }); requestGeneratedBatchNumber(prod._id); }}
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
                                                const discountAmount = calculateItemDiscountAmount(it.quantity, it.costPrice, it.discount, it.discountType, it.discountScope);
                                                const afterDiscount = calculateItemAfterDiscount(it.quantity, it.costPrice, it.discount, it.discountType, it.discountScope);
                                                const taxAmount = calculateItemTaxOnAfterDiscount(it.quantity, it.costPrice, it.discount, it.discountType, it.tax, it.taxType, it.discountScope, it.taxScope);
                                                const finalSubtotal = calculateItemFinalSubtotal(it.quantity, it.costPrice, it.discount, it.discountType, it.tax, it.taxType, it.discountScope, it.taxScope);
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
                                    <ApiSupplierSelect 
                                        className="flex-1" 
                                        value={bill.supplier}
                                        supplierName={bill.supplierName}
                                        onChange={val => setBill(p => ({ ...p, supplier: val }))}
                                        placeholder={labels.selectSupplier + "…"} 
                                    />
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
                            {/* Purchase level discount - commented out */}
                            {/* <Field>
                                <Label><DollarSign className="inline w-3 h-3 mr-1" />{labels.discount}</Label>
                                <div className="flex gap-2">
                                    <Inp type="number" name="discount" placeholder="0" value={bill.discount} onChange={handleBillChange} min="0" max="100" onWheel={e => e.target.blur()} />
                                    <Sel className="w-20 sm:w-24 shrink-0" value={bill.discountType} onChange={e => setBill(p => ({ ...p, discountType: e.target.value }))}>
                                        <option value="percentage">{labels.percentage}</option>
                                        <option value="fixed">{labels.fixed}</option>
                                    </Sel>
                                </div>
                            </Field> */}
                            {/* Purchase level tax - commented out */}
                            {/* <Field>
                                <Label>{labels.taxGst}</Label>
                                <div className="flex gap-2">
                                    <Inp type="number" name="gst" placeholder="0" value={bill.gst} onChange={handleBillChange} min="0" max="100" onWheel={e => e.target.blur()} />
                                    <Sel className="w-20 sm:w-24 shrink-0" value={bill.gstType} onChange={e => setBill(p => ({ ...p, gstType: e.target.value }))}>
                                        <option value="percentage">{labels.percentage}</option>
                                        <option value="fixed">{labels.fixed}</option>
                                    </Sel>
                                </div>
                            </Field> */}
                            {/* Purchase level shipping - commented out */}
                            {/* <Field><Label><Truck className="inline w-3 h-3 mr-1" />{labels.shipping}</Label><Inp type="number" name="shippingCost" placeholder="0" value={bill.shippingCost} onChange={handleBillChange} min="0" onWheel={e => e.target.blur()} /></Field> */}
                            <Field className="sm:col-span-2 lg:col-span-4"><Label><File className="inline w-3 h-3 mr-1" />{labels.notes}</Label><Txt name="notes" rows={1} placeholder={labels.optionalNote} value={bill.notes} onChange={handleBillChange} /></Field>
                        </div>
                    </Card>

                    {/* row 4: create purchase */}
                    <Btn variant="primary" className="w-full !h-14 text-base font-bold" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (isUpdate ? labels.updating : labels.submitting) : (
                            <span className="flex items-center justify-center gap-2">
                                <span>{isUpdate ? labels.updateBill : labels.submitBill}</span>
                                <span className="rounded-full px-2.5 py-1 text-xs" style={{ background: "rgba(255,255,255,0.15)" }}>
                                    Rs {calc.subtotalAfterItems.toFixed(2)}
                                </span>
                            </span>
                        )}
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






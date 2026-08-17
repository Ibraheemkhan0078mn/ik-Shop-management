// src/modules/purchaseReturn/components/PurchaseReturnModal.jsx
// Props:
//   mode       "create" | "update"
//   purchaseReturnId  string  (required when mode="update")
//   purchaseId string  (optional, for auto-filling purchase in create mode)
//   onClose    fn
//   onSuccess  fn

import { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch } from "react-redux";
import { X, Search, Pencil, Calendar, Lock, Unlock, Eye, EyeOff } from "lucide-react";
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getPurchaseReturnLabels } from "../labels/purchaseReturnLabels.js";
import { backendBaseUrl } from "../../../shared/constants/constants.js";
import {
    createPurchaseReturnApi,
    updatePurchaseReturnApi,
    getPurchaseReturnByIdApi,
    submitPurchaseReturnApi,
    approvePurchaseReturnApi,
    getPurchaseByInvoiceNumberApi,
    getPurchaseReturnsApi,
    generatePurchaseReturnNumberApi,
} from "../api/purchaseReturnApi.js";
import { usePurchases, usePurchase } from "../../productPurchases/services/purchases.service.js";
import { productApi } from "../../productsModule/services/product.service.js";

const getLocalizedReasons = (labels) => [
    { label: labels.damaged, value: "damaged" },
    { label: labels.expired, value: "expired" },
    { label: labels.wrongItem, value: "wrong_item" },
    { label: labels.excess, value: "excess" },
    { label: labels.qualityIssue, value: "quality_issue" },
    { label: labels.other, value: "other" },
];

const emptyForm = () => ({
    purchase: null,
    supplier: null,
    returnDate: new Date().toISOString().split("T")[0],
    returnReason: "",
    notes: "",
});

const Label = ({ children }) => (
    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--muted)" }}>
        {children}
    </label>
);

const Field = ({ children, className = "" }) => <div className={`flex flex-col overflow-visible ${className}`}>{children}</div>;

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

const SSelect = ({ options = [], value, onChange, placeholder = "Select…", zIndex = 100 }) => {
    const [open, setOpen] = useState(false);
    const selected = options.find((o) => o.value === value);

    useEffect(() => {
        const h = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const ref = useRef(null);

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
                    className="absolute w-full mt-1 rounded-xl shadow-2xl overflow-hidden z-50"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", zIndex }}
                >
                    <div className="max-h-48 overflow-y-auto">
                        {options.length ? (
                            options.map((o) => (
                                <div
                                    key={o.value}
                                    onClick={() => {
                                        onChange(o.value);
                                        setOpen(false);
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
        className={`rounded-2xl ${className}`}
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

export default function PurchaseReturnModal({ mode = "create", purchaseReturnId, purchaseId, onClose, onSuccess }) {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getPurchaseReturnLabels(language);
    const dispatch = useDispatch();

    const isUpdate = mode === "update";

    const [existingPurchaseReturn, setExistingPurchaseReturn] = useState(null);
    const [isFetching, setIsFetching] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const isSubmitting = isCreating || isUpdating;

    const [form, setForm] = useState(emptyForm());
    const [purchaseData, setPurchaseData] = useState(null);
    const [selectedItems, setSelectedItems] = useState({});
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [showFindPopup, setShowFindPopup] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [filteredPurchases, setFilteredPurchases] = useState([]);
    const [isLoadingPurchases, setIsLoadingPurchases] = useState(false);
    const [purchaseReturnNumber, setPurchaseReturnNumber] = useState("");
    const [isPurchaseReturnNumberLocked, setIsPurchaseReturnNumberLocked] = useState(true);
    const [expandedCalculation, setExpandedCalculation] = useState({});
    const [batchStocks, setBatchStocks] = useState({});

    const { data: purchasesData } = usePurchases({ page: 1, limit: 100 });
    const allPurchases = purchasesData?.data ?? [];
    const { data: purchaseDataById } = usePurchase(purchaseId, { skip: isUpdate || !purchaseId });

    const localizedReasons = useMemo(() => getLocalizedReasons(labels), [labels]);

    const update = (f, v) => setForm((p) => ({ ...p, [f]: v }));

    // Fetch batch stocks when purchase data is loaded
    useEffect(() => {
        const fetchBatchStocks = async () => {
            if (purchaseData?.items) {
                const stocks = {};
                for (const item of purchaseData.items) {
                    const batchId = item.batch?._id || item.batch;
                    if (batchId && !stocks[batchId]) {
                        try {
                            const response = await fetch(`${backendBaseUrl}/batches/stock/${batchId}`, {
                                headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                }
                            });
                            const data = await response.json();
                            if (data.success && data.data) {
                                stocks[batchId] = data.data.quantity || 0;
                            }
                        } catch (error) {
                            console.error("Error fetching batch stock:", error);
                            stocks[batchId] = item.quantity || 0; // Fallback to purchase quantity
                        }
                    }
                }
                setBatchStocks(stocks);
            }
        };
        fetchBatchStocks();
    }, [purchaseData]);

    // Generate default purchase return number on mount for create mode
    useEffect(() => {
        const generateNumber = async () => {
            if (!isUpdate) {
                try {
                    const result = await generatePurchaseReturnNumberApi();
                    if (result?.success && result?.data?.purchaseReturnNumber) {
                        setPurchaseReturnNumber(result.data.purchaseReturnNumber);
                    }
                } catch (e) {
                    console.error("Failed to generate purchase return number:", e);
                    // Fallback to random number if API fails
                    const randomNum = Math.floor(10000 + Math.random() * 90000);
                    setPurchaseReturnNumber(`PR-${randomNum}`);
                }
            }
        };
        generateNumber();
    }, [isUpdate]);

    useEffect(() => {
        const loadExisting = async () => {
            if (!isUpdate || !purchaseReturnId) return;
            setIsFetching(true);
            try {
                const res = await getPurchaseReturnByIdApi(purchaseReturnId);
                const data = res?.data;
                setExistingPurchaseReturn(data);

                // Fetch full purchase data if purchase ID is available
                if (data?.purchase && !purchaseData) {
                    const purchaseId = typeof data.purchase === 'string' ? data.purchase : data.purchase._id;
                    if (purchaseId) {
                        try {
                            const purchaseRes = await getPurchaseByInvoiceNumberApi(purchaseId);
                            if (purchaseRes?.success && purchaseRes?.data) {
                                setPurchaseData(purchaseRes.data);
                                setInvoiceNumber(purchaseRes.data.invoiceNumber || "");
                            }
                        } catch (e) {
                            console.error("Failed to fetch purchase data:", e);
                        }
                    }
                }

                setForm({
                    purchase: data?.purchase?._id ?? data?.purchase ?? "",
                    supplier: data?.supplier?._id ?? data?.supplier ?? "",
                    returnDate: data?.returnDate ? new Date(data.returnDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                    returnReason: data?.notes ?? "",
                    notes: data?.notes ?? "",
                });

                setPurchaseReturnNumber(data?.purchaseReturnNumber || "");
                setIsPurchaseReturnNumberLocked(true);

                const selected = {};
                (data?.items ?? []).forEach((it) => {
                    const batchId = it.batch?._id || it.batch;
                    selected[batchId] = {
                        returnQuantity: it.quantity,
                        returnReason: it.returnReason,
                        condition: it.condition || "good",
                        cut: it.cut || 0,
                        notes: it.notes || "",
                    };
                });
                setSelectedItems(selected);
            } catch (e) {
                showError(e?.response?.data?.message || labels.failedToCreate);
            } finally {
                setIsFetching(false);
            }
        };

        loadExisting();
    }, [isUpdate, purchaseReturnId]);

    // Auto-load purchase data when purchaseId is provided in create mode
    useEffect(() => {
        if (isUpdate || !purchaseId || !purchaseDataById) return;
        setPurchaseData(purchaseDataById);
        setInvoiceNumber(purchaseDataById.invoiceNumber || "");
        setForm(prev => ({
            ...prev,
            purchase: purchaseDataById._id,
            supplier: purchaseDataById.supplier?._id,
        }));
        showSuccess(labels.purchaseSelected);
    }, [isUpdate, purchaseId, purchaseDataById]);

    const handleSearchInvoice = async () => {
        if (!invoiceNumber.trim()) return showError(labels.pleaseEnterInvoice);

        setIsSearching(true);
        try {
            const result = await getPurchaseByInvoiceNumberApi(invoiceNumber.trim());

            if (result?.success && result?.data) {
                setPurchaseData(result.data);
                setForm((prev) => ({
                    ...prev,
                    purchase: result.data._id,
                    supplier: result.data.supplier?._id,
                }));
                setSelectedItems({});
                showSuccess(labels.purchaseFound);
            } else {
                showError(result?.message || labels.purchaseNotFound);
            }
        } catch (e) {
            showError(e?.response?.data?.message || e?.message || labels.failedToSearch);
        } finally {
            setIsSearching(false);
        }
    };

    const handleFilterPurchases = () => {
        if (!startDate || !endDate) return showError(labels.pleaseSelectDateRange);

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const filtered = allPurchases.filter(p => {
            const purchaseDate = new Date(p.date || p.createdAt);
            return purchaseDate >= start && purchaseDate <= end;
        });

        setFilteredPurchases(filtered);
    };

    const handleSelectPurchase = (purchase) => {
        setInvoiceNumber(purchase.invoiceNumber || "");
        setShowFindPopup(false);
        setPurchaseData(purchase);
        setForm((prev) => ({
            ...prev,
            purchase: purchase._id,
            supplier: purchase.supplier?._id,
        }));
        setSelectedItems({});
        showSuccess(labels.purchaseSelected);
    };

    const handleItemSelect = (batchId, item) => {
        setSelectedItems((prev) => {
            if (prev[batchId]) {
                const newSelected = { ...prev };
                delete newSelected[batchId];
                return newSelected;
            } else {
                return {
                    ...prev,
                    [batchId]: {
                        returnQuantity: item.quantity,
                        returnReason: localizedReasons[0]?.value || "damaged",
                        condition: "good",
                        cut: 0,
                        notes: "",
                    },
                };
            }
        });
    };

    const handleItemDetailChange = (batchId, field, value) => {
        setSelectedItems((prev) => {
            const updated = {
                ...prev,
                [batchId]: {
                    ...prev[batchId],
                    [field]: value,
                },
            };

            // Validate return quantity against limits
            if (field === "returnQuantity") {
                const item = purchaseData?.items?.find(i => (i.batch?._id || i.batch) === batchId);
                if (item) {
                    const batchStock = batchStocks[batchId] || 0;
                    const purchaseQuantity = item.quantity || 0;
                    const maxLimit = Math.min(batchStock, purchaseQuantity);
                    const quantity = Number(value) || 0;
                    
                    // Clamp the value to the maximum allowed limit
                    if (quantity > maxLimit) {
                        updated[batchId].returnQuantity = maxLimit;
                    }
                }
            }

            return updated;
        });
    };

    const calculateDiscountAmount = (item, quantity) => {
        const costPrice = item.costPrice || item.price;
        let discountAmount = 0;
        
        if (purchaseData?.discountType && purchaseData?.discount) {
            const discount = Number(purchaseData.discount) || 0;
            if (purchaseData.discountType === 'percentage') {
                discountAmount = (costPrice * quantity * discount) / 100;
            } else if (purchaseData.discountType === 'fixed') {
                const totalQuantity = purchaseData.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 1;
                const discountPerItem = discount / totalQuantity;
                discountAmount = discountPerItem * quantity;
            }
        }
        
        return discountAmount;
    };

    const calculateTaxAmount = (item, quantity) => {
        const costPrice = item.costPrice || item.price;
        let taxAmount = 0;
        
        if (purchaseData?.gstType && purchaseData?.gst) {
            const tax = Number(purchaseData.gst) || 0;
            if (purchaseData.gstType === 'percentage') {
                taxAmount = (costPrice * quantity * tax) / 100;
            } else if (purchaseData.gstType === 'fixed') {
                taxAmount = tax * quantity;
            }
        }
        
        return taxAmount;
    };

    const calculateRefund = (item, details) => {
        const returnQty = Number(details.returnQuantity) || 0;
        const costPrice = Number(item.costPrice || item.price) || 0;
        const cut = Number(details.cut) || 0;

        // Calculate original total
        const originalTotal = costPrice * returnQty;
        
        // Calculate discount amount
        let discountAmount = 0;
        if (purchaseData?.discountType && purchaseData?.discount) {
            const discount = Number(purchaseData.discount) || 0;
            if (purchaseData.discountType === 'percentage') {
                discountAmount = (costPrice * returnQty * discount) / 100;
            } else if (purchaseData.discountType === 'fixed') {
                const totalQuantity = purchaseData.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 1;
                const discountPerItem = discount / totalQuantity;
                discountAmount = discountPerItem * returnQty;
            }
        }
        
        // Calculate tax amount (on after-discount price)
        const afterDiscount = originalTotal - discountAmount;
        let taxAmount = 0;
        if (purchaseData?.gstType && purchaseData?.gst) {
            const tax = Number(purchaseData.gst) || 0;
            if (purchaseData.gstType === 'percentage') {
                taxAmount = (afterDiscount * tax) / 100;
            } else if (purchaseData.gstType === 'fixed') {
                taxAmount = tax;
            }
        }

        // Calculate refund: original - discount + tax - cut
        return originalTotal - discountAmount + taxAmount - cut;
    };

    const totalRefund = useMemo(() => {
        if (!purchaseData?.items) return 0;
        return purchaseData.items.reduce((sum, item) => {
            const details = selectedItems[item.batch?._id || item.batch];
            if (!details) return sum;
            return sum + calculateRefund(item, details);
        }, 0);
    }, [purchaseData, selectedItems]);

    const handleSubmit = async () => {
        console.log("the submit is running.")
        if (!purchaseData) return showError(labels.pleaseSelectPurchase);
        if (Object.keys(selectedItems).length === 0) return showError(labels.pleaseSelectItem);

        // Validate purchase return number for duplicates (only in create mode)
        if (!isUpdate && purchaseReturnNumber) {
            try {
                const response = await fetch(`${backendBaseUrl}/purchase-returns/validate-number`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ purchaseReturnNumber })
                });
                const data = await response.json();
                if (!data.success) {
                    return showError(data.message || "Purchase return number already exists");
                }
            } catch (error) {
                console.error("Error validating purchase return number:", error);
            }
        }

        // Validate all selected items
        for (const [batchId, details] of Object.entries(selectedItems)) {
            if (!details.returnReason) return showError(labels.specifyReturnReason);
            if (!details.returnQuantity || Number(details.returnQuantity) <= 0) return showError(labels.specifyValidQuantity);
        }

        // Build payload
        const items = purchaseData.items
            .filter((item) => selectedItems[item.batch?._id || item.batch])
            .map((item) => {
                const batchId = item.batch?._id || item.batch;
                const details = selectedItems[batchId];
                return {
                    product: item.product?._id || item.product,
                    batch: batchId,
                    batchNumber: item.batch?.batchNumber || "",
                    quantity: details.returnQuantity,
                    purchasePrice: item.price,
                    returnReason: details.returnReason,
                    condition: details.condition,
                    cut: details.cut,
                    notes: details.notes,
                };
            });

        const payload = {
            purchase: purchaseData._id,
            supplier: purchaseData.supplier?._id,
            returnDate: form.returnDate,
            notes: form.returnReason,
            items,
            purchaseReturnNumber: purchaseReturnNumber || undefined,
        };

        console.log(payload, "the paylaod")

        try {
            if (isUpdate) {
                setIsUpdating(true);
                await updatePurchaseReturnApi(purchaseReturnId, payload);
                showSuccess(labels.returnUpdated);
            } else {
                setIsCreating(true);
                await createPurchaseReturnApi(payload);
                showSuccess(labels.returnCreated);
                setForm(emptyForm());
                setPurchaseData(null);
                setSelectedItems({});
                setInvoiceNumber("");
                setPurchaseReturnNumber("");
                setIsPurchaseReturnNumberLocked(true);
            }
            // Invalidate product cache to refresh product data
            dispatch(productApi.util.invalidateTags(["Product"]));
            onSuccess?.();
            onClose();
        } catch (e) {
            showError(e?.response?.data?.message || e?.message || labels.operationFailed);
        } finally {
            setIsCreating(false);
            setIsUpdating(false);
        }
    };

    const handleSubmitForApproval = async () => {
        if (!purchaseReturnId) return;
        try {
            await submitPurchaseReturnApi(purchaseReturnId);
            showSuccess(labels.submittedForApproval);
            onSuccess?.();
            onClose();
        } catch (e) {
            showError(e?.response?.data?.message || e?.message || labels.operationFailed);
        }
    };

    const handleApprove = async () => {
        if (!purchaseReturnId) return;
        try {
            await approvePurchaseReturnApi(purchaseReturnId);
            showSuccess(labels.returnApproved);
            onSuccess?.();
            onClose();
        } catch (e) {
            showError(e?.response?.data?.message || e?.message || labels.operationFailed);
        }
    };

    const handlePurchaseReturnNumberChange = async (value) => {
        setPurchaseReturnNumber(value);
        
        // Check for duplicates if the value matches the PR-XXXXX pattern
        if (value && value.match(/^PR-\d{5}$/)) {
            try {
                const result = await getPurchaseReturnsApi({ purchaseReturnNumber: value });
                if (result?.data && result.data.length > 0) {
                    showError("Purchase return number already exists. Generating a new one...");
                    // Generate new unique number
                    let isUnique = false;
                    let attempts = 0;
                    let newNumber;
                    while (!isUnique && attempts < 100) {
                        const randomNum = Math.floor(10000 + Math.random() * 90000);
                        newNumber = `PR-${randomNum}`;
                        try {
                            const checkResult = await getPurchaseReturnsApi({ purchaseReturnNumber: newNumber });
                            if (!checkResult?.data || checkResult.data.length === 0) {
                                isUnique = true;
                            }
                        } catch (e) {
                            // If error, assume it doesn't exist
                            isUnique = true;
                        }
                        attempts++;
                    }
                    if (isUnique && newNumber) {
                        setPurchaseReturnNumber(newNumber);
                    }
                }
            } catch (e) {
                // Ignore errors during duplicate check
                console.log("Duplicate check error:", e);
            }
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col"
                style={{ background: "var(--app-bg)", border: "1px solid var(--border)" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* header */}
                <div
                    className="flex items-center justify-between px-6 py-4 border-b shrink-0"
                    style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent)" }}>
                            <Pencil className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold leading-tight" style={{ color: "var(--ink)" }}>
                                {isUpdate ? labels.updatePurchaseReturn : labels.recordPurchaseReturn}
                            </h2>
                            <p className="text-xs" style={{ color: "var(--muted)" }}>
                                {labels.returnItemsToSupplier}
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

                <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                    {/* Purchase Return Number */}
                    <Card>
                        <Field>
                            <Label>{labels.purchaseReturnNumber || "Purchase Return Number"}</Label>
                            <div className="flex gap-2">
                                <Inp
                                    placeholder="PR-XXXXX"
                                    value={purchaseReturnNumber}
                                    onChange={(e) => handlePurchaseReturnNumberChange(e.target.value)}
                                    disabled={isPurchaseReturnNumberLocked}
                                    className={isPurchaseReturnNumberLocked ? "bg-muted" : ""}
                                />
                                <Btn
                                    variant="secondary"
                                    onClick={() => setIsPurchaseReturnNumberLocked(!isPurchaseReturnNumberLocked)}
                                    title={isPurchaseReturnNumberLocked ? "Unlock to edit" : "Lock to prevent edits"}
                                >
                                    {isPurchaseReturnNumberLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                </Btn>
                            </div>
                        </Field>
                    </Card>

                    {/* Search by invoice number */}
                    {!isUpdate && (
                        <Card>
                            <div className="flex gap-3">
                                <Field className="flex-1">
                                    <Label>{labels.searchByInvoice}</Label>
                                    <div className="flex gap-2">
                                        <Inp
                                            placeholder={labels.enterInvoiceNumber}
                                            value={invoiceNumber}
                                            onChange={(e) => setInvoiceNumber(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleSearchInvoice()}
                                        />
                                        <Btn variant="primary" onClick={handleSearchInvoice} disabled={isSearching}>
                                            <Search className="w-4 h-4" />
                                        </Btn>
                                        <Btn variant="secondary" onClick={() => setShowFindPopup(true)} title="Find purchases by date">
                                            <Calendar className="w-4 h-4" />
                                        </Btn>
                                    </div>
                                </Field>
                            </div>
                        </Card>
                    )}

                    {/* Purchase details (read-only) */}
                    {purchaseData && (
                        <Card title={labels.purchaseDetails}>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <Field>
                                    <Label>{labels.supplier}</Label>
                                    <div className="px-3 py-2 text-sm rounded-xl" style={{ background: "var(--surface-muted)", color: "var(--ink)" }}>
                                        {purchaseData.supplier?.name || "—"}
                                    </div>
                                </Field>
                                <Field>
                                    <Label>{labels.invoiceNumber}</Label>
                                    <div className="px-3 py-2 text-sm rounded-xl font-mono" style={{ background: "var(--surface-muted)", color: "var(--ink)" }}>
                                        {purchaseData.invoiceNumber || "—"}
                                    </div>
                                </Field>
                                <Field>
                                    <Label>{labels.purchaseDate}</Label>
                                    <div className="px-3 py-2 text-sm rounded-xl" style={{ background: "var(--surface-muted)", color: "var(--ink)" }}>
                                        {purchaseData.date ? new Date(purchaseData.date).toLocaleDateString() : "—"}
                                    </div>
                                </Field>
                                <Field>
                                    <Label>{labels.totalAmount}</Label>
                                    <div className="px-3 py-2 text-sm rounded-xl font-semibold" style={{ background: "var(--surface-muted)", color: "var(--accent)" }}>
                                        Rs. {Number(purchaseData.totalAmount || 0).toFixed(2)}
                                    </div>
                                </Field>
                            </div>
                        </Card>
                    )}

                    {/* Return details */}
                    {purchaseData && (
                        <Card title={labels.returnDetails}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field>
                                    <Label>{labels.returnDate} *</Label>
                                    <Inp type="date" value={form.returnDate} onChange={(e) => update("returnDate", e.target.value)} />
                                </Field>
                                <Field>
                                    <Label>{labels.overallReturnReason}</Label>
                                    <Txt rows={2} placeholder={labels.overallReturnReason + "..."} value={form.returnReason} onChange={(e) => update("returnReason", e.target.value)} />
                                </Field>
                            </div>
                        </Card>
                    )}

                    {/* Items as checkboxes */}
                    {purchaseData && (
                        <Card title={`${labels.purchaseItems} (${purchaseData.items?.length || 0})`}>
                            <div className="space-y-3">
                                {purchaseData.items?.map((item, idx) => {
                                    const batchId = item.batch?._id || item.batch;
                                    const isSelected = !!selectedItems[batchId];
                                    const details = selectedItems[batchId] || {};
                                    const refund = isSelected ? calculateRefund(item, details) : 0;

                                    return (
                                        <div key={batchId || idx} className="border rounded-xl" style={{ borderColor: "var(--border)" }}>
                                            {/* Item header with checkbox */}
                                            <div
                                                className="flex items-center gap-3 px-4 py-3 cursor-pointer transition"
                                                style={{ background: isSelected ? "rgba(15,118,110,0.04)" : "var(--surface)" }}
                                                onClick={() => handleItemSelect(batchId, item)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        handleItemSelect(batchId, item);
                                                    }}
                                                    className="w-4 h-4 rounded"
                                                    style={{ accentColor: "var(--accent-2)" }}
                                                />
                                                <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
                                                    <div>
                                                        <span className="font-semibold" style={{ color: "var(--ink)" }}>{item.product?.name || "—"}</span>
                                                    </div>
                                                    <div style={{ color: "var(--muted)" }}>
                                                        {labels.items}: {item.quantity}
                                                    </div>
                                                    <div style={{ color: "var(--muted)" }}>
                                                        {labels.costPrice || "Cost Price"}: Rs. {Number(item.costPrice || item.price || 0).toFixed(2)}
                                                    </div>
                                                    <div style={{ color: "var(--muted)" }}>
                                                        {labels.batch}: {item.batch?.batchNumber || "—"}
                                                    </div>
                                                    {isSelected && (
                                                        <div className="text-right font-semibold" style={{ color: "var(--accent-2)" }}>
                                                            Rs {((details.returnQuantity * (item.costPrice || item.price)) - calculateDiscountAmount(item, details.returnQuantity) + calculateTaxAmount(item, details.returnQuantity)).toFixed(2)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Inline form for selected item */}
                                            {isSelected && (
                                                <div className="px-4 py-3 border-t overflow-visible" style={{ borderColor: "var(--border)", background: "var(--surface-muted)" }}>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                        <Field>
                                                            <Label>{labels.returnQuantity} *</Label>
                                                            <Inp
                                                                type="number"
                                                                min={1}
                                                                max={Math.min(batchStocks[batchId] || 0, item.quantity || 0)}
                                                                value={details.returnQuantity}
                                                                onChange={(e) => handleItemDetailChange(batchId, "returnQuantity", e.target.value)}
                                                                onWheel={e => e.target.blur()}
                                                            />
                                                            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                                                                Max limit: {Math.min(batchStocks[batchId] || 0, item.quantity || 0)} (Stock: {batchStocks[batchId] || 0}, Purchase: {item.quantity || 0})
                                                            </p>
                                                        </Field>
                                                        <Field>
                                                            <Label>{labels.returnReason} *</Label>
                                                            <SSelect
                                                                options={localizedReasons}
                                                                value={details.returnReason}
                                                                onChange={(v) => handleItemDetailChange(batchId, "returnReason", v)}
                                                                placeholder={labels.returnReason + "…"}
                                                                zIndex={9999}
                                                            />
                                                        </Field>
                                                        <Field>
                                                            <Label>{labels.cutAmount}</Label>
                                                            <Inp
                                                                type="number"
                                                                min={0}
                                                                value={details.cut}
                                                                onChange={(e) => handleItemDetailChange(batchId, "cut", e.target.value)}
                                                                onWheel={e => e.target.blur()}
                                                            />
                                                        </Field>
                                                    </div>
                                                    <Field className="mt-3">
                                                        <div 
                                                            className="flex items-center justify-between cursor-pointer"
                                                            onClick={() => setExpandedCalculation(prev => ({
                                                                ...prev,
                                                                [batchId]: !prev[batchId]
                                                            }))}
                                                        >
                                                            <Label className="cursor-pointer">{labels.refundPreview}</Label>
                                                            {expandedCalculation[batchId] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </div>
                                                        {expandedCalculation[batchId] && (
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                                                                {/* Container 1: Original Price */}
                                                                <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Original Price</p>
                                                                    <div className="text-xs space-y-1">
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Return Quantity:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>{details.returnQuantity}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Cost Price:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {(item.costPrice || item.price).toFixed(2)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                                            <span style={{ color: "var(--accent-2)" }}>Original Total:</span>
                                                                            <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {(details.returnQuantity * (item.costPrice || item.price)).toFixed(2)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Container 2: Discount & Tax */}
                                                                <div className="p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                                                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Discount & Tax</p>
                                                                    <div className="text-xs space-y-1">
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Discount:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>{Number(purchaseData?.discount || 0).toFixed(2)} {purchaseData?.discountType || ""}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Discount Amount:</span>
                                                                            <span className="font-mono" style={{ color: "#dc2626" }}>-Rs {calculateDiscountAmount(item, details.returnQuantity).toFixed(2)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Tax:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>{Number(purchaseData?.gst || 0).toFixed(2)} {purchaseData?.gstType || ""}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Tax Amount:</span>
                                                                            <span className="font-mono" style={{ color: "#16a34a" }}>+Rs {calculateTaxAmount(item, details.returnQuantity).toFixed(2)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Container 3: Subtotal & Refund */}
                                                                <div className="p-3 rounded-lg" style={{ background: "rgba(15,118,110,0.08)", border: "1px solid rgba(15,118,110,0.25)" }}>
                                                                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--accent-2)" }}>Subtotal & Refund</p>
                                                                    <div className="text-xs space-y-1">
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Original Total:</span>
                                                                            <span className="font-mono" style={{ color: "var(--ink)" }}>Rs {(details.returnQuantity * (item.costPrice || item.price)).toFixed(2)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Less Discount:</span>
                                                                            <span className="font-mono" style={{ color: "#dc2626" }}>-Rs {calculateDiscountAmount(item, details.returnQuantity).toFixed(2)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Plus Tax:</span>
                                                                            <span className="font-mono" style={{ color: "#16a34a" }}>+Rs {calculateTaxAmount(item, details.returnQuantity).toFixed(2)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                                                                            <span style={{ color: "var(--accent-2)" }}>Subtotal:</span>
                                                                            <span className="font-mono" style={{ color: "var(--accent-2)" }}>Rs {((details.returnQuantity * (item.costPrice || item.price)) - calculateDiscountAmount(item, details.returnQuantity) + calculateTaxAmount(item, details.returnQuantity)).toFixed(2)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span style={{ color: "var(--ink)" }}>Less Cut:</span>
                                                                            <span className="font-mono" style={{ color: "#dc2626" }}>-Rs {Number(details.cut).toFixed(2)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between font-bold text-sm pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                                                                            <span style={{ color: "var(--accent-2)" }}>Refund:</span>
                                                                            <span className="font-mono text-base" style={{ color: "var(--accent-2)" }}>Rs {refund.toFixed(2)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Field>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    )}

                    {/* Total refund summary */}
                    {purchaseData && Object.keys(selectedItems).length > 0 && (
                        <Card>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                                    {labels.totalRefundAmount} ({Object.keys(selectedItems).length} {labels.items})
                                </span>
                                <span className="text-xl font-black tabular-nums" style={{ color: "var(--accent)" }}>
                                    Rs. {totalRefund.toFixed(2)}
                                </span>
                            </div>
                        </Card>
                    )}
                </div>

                {/* footer */}
                <div className="flex justify-between gap-3 p-5 shrink-0" style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
                    <div className="flex gap-2">
                        {isUpdate && existingPurchaseReturn?.status === "draft" && <Btn variant="secondary" onClick={handleSubmitForApproval}>{labels.submitForApproval}</Btn>}
                        {isUpdate && existingPurchaseReturn?.status === "pending" && (
                            <Btn variant="secondary" onClick={handleApprove}>{labels.approve}</Btn>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Btn variant="secondary" onClick={onClose}>{labels.cancel}</Btn>
                        <Btn variant="primary" onClick={handleSubmit} disabled={isSubmitting || !purchaseData || Object.keys(selectedItems).length === 0}>
                            {isSubmitting ? (isUpdate ? labels.updating : labels.saving) : isUpdate ? labels.updatePurchaseReturn : labels.saveReturn}
                        </Btn>
                    </div>
                </div>
            </div>

            {/* Find Purchase Popup */}
            {showFindPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowFindPopup(false)}>
                    <div className="relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden" style={{ background: "var(--app-bg)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                            <h3 className="text-base font-bold" style={{ color: "var(--ink)" }}>{labels.findPurchases || "Find Purchases"}</h3>
                            <button onClick={() => setShowFindPopup(false)} className="w-8 h-8 flex items-center justify-center rounded-xl transition" style={{ background: "var(--surface-muted)", color: "var(--muted)" }}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Field>
                                    <Label>{labels.startDate || "Start Date"}</Label>
                                    <Inp type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                </Field>
                                <Field>
                                    <Label>{labels.endDate || "End Date"}</Label>
                                    <Inp type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                </Field>
                            </div>
                            <Btn variant="primary" className="w-full" onClick={handleFilterPurchases}>
                                {labels.filter || "Filter"}
                            </Btn>
                            
                            {filteredPurchases.length > 0 && (
                                <div className="mt-4 border rounded-xl overflow-hidden" style={{ borderColor: "var(--border)", maxHeight: "300px", overflowY: "auto" }}>
                                    <table className="w-full text-sm">
                                        <thead style={{ background: "var(--surface-muted)" }}>
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>{labels.invoiceNumber}</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>{labels.date}</th>
                                                <th className="px-4 py-2 text-right text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>{labels.totalAmount}</th>
                                                <th className="px-4 py-2 text-center text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>{labels.actions}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPurchases.map(p => (
                                                <tr key={p._id} className="hover:bg-[var(--surface-muted)]" style={{ borderBottom: "1px solid var(--border)" }}>
                                                    <td className="px-4 py-2 font-mono text-xs" style={{ color: "var(--ink)" }}>{p.invoiceNumber || "—"}</td>
                                                    <td className="px-4 py-2 text-xs" style={{ color: "var(--ink)" }}>{p.date ? new Date(p.date).toLocaleDateString() : "—"}</td>
                                                    <td className="px-4 py-2 text-right text-xs font-semibold" style={{ color: "var(--accent)" }}>Rs {(p.totalAmount || 0).toLocaleString()}</td>
                                                    <td className="px-4 py-2 text-center">
                                                        <Btn variant="primary" size="sm" onClick={() => handleSelectPurchase(p)}>
                                                            {labels.select || "Select"}
                                                        </Btn>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            
                            {filteredPurchases.length === 0 && startDate && endDate && (
                                <p className="text-center text-sm" style={{ color: "var(--muted)" }}>{labels.noPurchasesFound || "No purchases found in this date range"}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


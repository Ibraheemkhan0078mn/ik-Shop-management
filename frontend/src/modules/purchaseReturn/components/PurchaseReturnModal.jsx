// src/modules/purchaseReturn/components/PurchaseReturnModal.jsx
// Props:
//   mode       "create" | "update"
//   purchaseReturnId  string  (required when mode="update")
//   onClose    fn
//   onSuccess  fn

import { useState, useEffect, useMemo, useRef } from "react";
import { X, Search, CheckCircle, Pencil, Trash2 } from "lucide-react";
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getPurchaseReturnLabels } from "../labels/purchaseReturnLabels.js";
import {
    createPurchaseReturnApi,
    updatePurchaseReturnApi,
    getPurchaseReturnByIdApi,
    submitPurchaseReturnApi,
    approvePurchaseReturnApi,
    rejectPurchaseReturnApi,
    getPurchaseByInvoiceNumberApi,
} from "../api/purchaseReturnApi.js";

const REASONS = [
    { label: "Damaged", value: "damaged" },
    { label: "Expired", value: "expired" },
    { label: "Wrong Item", value: "wrong_item" },
    { label: "Excess", value: "excess" },
    { label: "Quality Issue", value: "quality_issue" },
    { label: "Other", value: "other" },
];

const CONDITIONS = [
    { label: "Good", value: "good" },
    { label: "Fair", value: "fair" },
    { label: "Poor", value: "poor" },
    { label: "Damaged", value: "damaged" },
];

const getLocalizedReasons = (labels) => [
    { label: labels.damaged, value: "damaged" },
    { label: labels.expired, value: "expired" },
    { label: labels.wrongItem, value: "wrong_item" },
    { label: labels.excess, value: "excess" },
    { label: labels.qualityIssue, value: "quality_issue" },
    { label: labels.other, value: "other" },
];

const getLocalizedConditions = (labels) => [
    { label: labels.good, value: "good" },
    { label: labels.fair, value: "fair" },
    { label: labels.poor, value: "poor" },
    { label: labels.damaged, value: "damaged" },
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
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getPurchaseReturnLabels(language);
    
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

    const localizedReasons = useMemo(() => getLocalizedReasons(labels), [labels]);
    const localizedConditions = useMemo(() => getLocalizedConditions(labels), [labels]);

    const update = (f, v) => setForm((p) => ({ ...p, [f]: v }));

    useEffect(() => {
        const loadExisting = async () => {
            if (!isUpdate || !purchaseReturnId) return;
            setIsFetching(true);
            try {
                const res = await getPurchaseReturnByIdApi(purchaseReturnId);
                const data = res?.data;
                setExistingPurchaseReturn(data);

                if (data?.purchase && !purchaseData) {
                    setPurchaseData(data.purchase);
                    setInvoiceNumber(data.purchase.invoiceNumber || "");
                }

                setForm({
                    purchase: data?.purchase?._id ?? data?.purchase ?? "",
                    supplier: data?.supplier?._id ?? data?.supplier ?? "",
                    returnDate: data?.returnDate ? new Date(data.returnDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                    returnReason: data?.notes ?? "",
                    notes: data?.notes ?? "",
                });

                const selected = {};
                (data?.items ?? []).forEach((it) => {
                    selected[it.batch?._id || it.batch] = {
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
                        returnReason: "",
                        condition: "good",
                        cut: 0,
                        notes: "",
                    },
                };
            }
        });
    };

    const handleItemDetailChange = (batchId, field, value) => {
        setSelectedItems((prev) => ({
            ...prev,
            [batchId]: {
                ...prev[batchId],
                [field]: value,
            },
        }));
    };

    const calculateRefund = (item, details) => {
        const returnQty = Number(details.returnQuantity) || 0;
        const costPrice = Number(item.price) || 0;
        const cut = Number(details.cut) || 0;
        return (returnQty * costPrice) - cut;
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

        // Validate all selected items
        for (const [batchId, details] of Object.entries(selectedItems)) {
            if (!details.returnReason) return showError(labels.specifyReturnReason);
            if (!details.condition) return showError(labels.specifyCondition);
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
            }
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

    const handleReject = async () => {
        if (!purchaseReturnId) return;
        const reason = prompt(labels.enterRejectionReason);
        if (!reason) return;
        try {
            await rejectPurchaseReturnApi(purchaseReturnId, reason);
            showSuccess(labels.returnRejected);
            onSuccess?.();
            onClose();
        } catch (e) {
            showError(e?.response?.data?.message || e?.message || labels.operationFailed);
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
                className="relative w-full max-w-4xl my-4 rounded-3xl shadow-2xl overflow-hidden"
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

                <div className="p-5 space-y-5">
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
                                        <div key={batchId || idx} className="border rounded-xl overflow-hidden" style={{ borderColor: "var(--border)" }}>
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
                                                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                                                    <div>
                                                        <span className="font-semibold" style={{ color: "var(--ink)" }}>{item.product?.name || "—"}</span>
                                                    </div>
                                                    <div style={{ color: "var(--muted)" }}>
                                                        {labels.items}: {item.quantity}
                                                    </div>
                                                    <div style={{ color: "var(--muted)" }}>
                                                        {labels.price}: Rs. {Number(item.price || 0).toFixed(2)}
                                                    </div>
                                                    <div style={{ color: "var(--muted)" }}>
                                                        {labels.batch}: {item.batch?.batchNumber || "—"}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Inline form for selected item */}
                                            {isSelected && (
                                                <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)", background: "var(--surface-muted)" }}>
                                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                                        <Field>
                                                            <Label>{labels.returnQuantity} *</Label>
                                                            <Inp
                                                                type="number"
                                                                min={1}
                                                                max={item.quantity}
                                                                value={details.returnQuantity}
                                                                onChange={(e) => handleItemDetailChange(batchId, "returnQuantity", e.target.value)}
                                                            />
                                                        </Field>
                                                        <Field>
                                                            <Label>{labels.returnReason} *</Label>
                                                            <SSelect
                                                                options={localizedReasons}
                                                                value={details.returnReason}
                                                                onChange={(v) => handleItemDetailChange(batchId, "returnReason", v)}
                                                                placeholder={labels.returnReason + "…"}
                                                                zIndex={70}
                                                            />
                                                        </Field>
                                                        <Field>
                                                            <Label>{labels.condition} *</Label>
                                                            <SSelect
                                                                options={localizedConditions}
                                                                value={details.condition}
                                                                onChange={(v) => handleItemDetailChange(batchId, "condition", v)}
                                                                placeholder={labels.condition + "…"}
                                                                zIndex={70}
                                                            />
                                                        </Field>
                                                        <Field>
                                                            <Label>{labels.cutAmount}</Label>
                                                            <Inp
                                                                type="number"
                                                                min={0}
                                                                value={details.cut}
                                                                onChange={(e) => handleItemDetailChange(batchId, "cut", e.target.value)}
                                                            />
                                                        </Field>
                                                    </div>
                                                    <Field className="mt-3">
                                                        <Label>{labels.refundPreview}</Label>
                                                        <div className="px-3 py-2 text-sm rounded-xl font-semibold" style={{ background: "var(--surface)", color: "var(--accent)" }}>
                                                            Rs. {refund.toFixed(2)} = ({details.returnQuantity} × Rs. {Number(item.price || 0).toFixed(2)}) - Rs. {Number(details.cut || 0).toFixed(2)}
                                                        </div>
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

                    {/* footer */}
                    <div className="flex justify-between gap-3 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                        <div className="flex gap-2">
                            {isUpdate && existingPurchaseReturn?.status === "draft" && <Btn variant="secondary" onClick={handleSubmitForApproval}>{labels.submitForApproval}</Btn>}
                            {isUpdate && existingPurchaseReturn?.status === "pending" && (
                                <>
                                    <Btn variant="secondary" onClick={handleApprove}>{labels.approve}</Btn>
                                    <Btn variant="danger" onClick={handleReject}>{labels.reject}</Btn>
                                </>
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
            </div>
        </div>
    );
}


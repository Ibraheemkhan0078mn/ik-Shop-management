// src/modules/wastage/components/WastageModal.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { X, Plus, Package, Calendar, FileText, DollarSign, AlertTriangle, Trash } from "lucide-react";
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
import { useCreateWastage, useUpdateWastage, useWastage } from "../services/wastage.service.js";
import { useProducts } from "../../productsModule/services/product.service.js";
import { useBatchesByProduct } from "../../productPurchases/services/batch.service.js";
import { getWastageLabels } from "../labels/wastageLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { Component } from "react";

// ─── constants ────────────────────────────────────────────────────────────────
const blankItem = () => ({
  product: "",
  productName: "",
  batchNumber: "",
  expiryDate: "",
  quantity: "",
  costPrice: "",
  reason: "",
  notes: "",
});

const emptyForm = () => ({
  wastageDate: new Date().toISOString().split("T")[0],
  notes: "",
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
function WastageModalInner({ mode = "create", wastageId, onClose, onSuccess }) {
  const { settings } = useSettings();
  const language = settings?.language || "en";
  const labels = getWastageLabels(language);

  const isUpdate = mode === "update";

  const { data: existingWastage, isLoading: isFetching } = useWastage(wastageId, { skip: !isUpdate || !wastageId });
  const [createWastage, { isLoading: isCreating }] = useCreateWastage();
  const [updateWastage, { isLoading: isUpdating }] = useUpdateWastage();
  const isSubmitting = isCreating || isUpdating;

  const { data: productsRaw = [] } = useProducts();
  const products = productsRaw?.data ?? productsRaw ?? [];

  const [form, setForm] = useState(emptyForm());
  const [currentItem, setCurrentItem] = useState(blankItem());
  const [items, setItems] = useState([]);
  const [editingIndex, setEditingIndex] = useState(-1);

  const updateForm = (field, value) => setForm(p => ({ ...p, [field]: value }));
  const updateCurrent = (field, value) => setCurrentItem(p => ({ ...p, [field]: value }));

  // ── Prefill for update ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isUpdate || !existingWastage) return;
    setForm({
      wastageDate: existingWastage.wastageDate
        ? new Date(existingWastage.wastageDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      notes: existingWastage.notes ?? "",
    });
    setItems((existingWastage.items ?? []).map(it => ({
      product: it.product?._id ?? it.product ?? "",
      productName: it.product?.name ?? "",
      batchNumber: it.batchNumber ?? "",
      expiryDate: it.expiryDate ? new Date(it.expiryDate).toISOString().split("T")[0] : "",
      quantity: it.quantity ?? "",
      costPrice: it.costPrice ?? "",
      reason: it.reason ?? "",
      notes: it.notes ?? "",
    })));
  }, [existingWastage, isUpdate]);

  // ── Memoized Options ──────────────────────────────────────────────────
  const productOptions = useMemo(() =>
    products.map(p => ({ label: p.name, value: p._id })), [products]
  );

  const batchOptions = useMemo(() => {
    const prod = products.find(p => p._id === currentItem.product);
    const batches = prod?.batches || [];
    return batches.map(b => ({
      label: `${b.batchNumber} — Exp: ${b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : "N/A"}`,
      value: b.batchNumber,
      expiryDate: b.expiryDate ?? "",
    }));
  }, [currentItem.product, products]);

  const reasonOptions = useMemo(() => [
    { label: labels.expired, value: "expired" },
    { label: labels.damaged, value: "damaged" },
    { label: labels.stolen, value: "stolen" },
    { label: labels.spillage, value: "spillage" },
    { label: labels.qualityIssue, value: "quality_issue" },
    { label: labels.other, value: "other" },
  ], [labels]);

  const totalLoss = useMemo(() =>
    items.reduce((sum, it) => sum + (Number(it.quantity || 0) * Number(it.costPrice || 0)), 0),
    [items]
  );

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleAddItem = () => {
    console.log("Adding item:", currentItem);

    if (!currentItem.product) {
      showError(labels.selectProduct);
      return;
    }
    if (!currentItem.quantity || Number(currentItem.quantity) <= 0) {
      showError(labels.enterValidQuantity);
      return;
    }
    if (!currentItem.reason) {
      showError(labels.selectReason);
      return;
    }

    const prod = products.find(p => p._id === currentItem.product);
    const row = {
      ...currentItem,
      productName: prod?.name ?? currentItem.productName,
      quantity: String(currentItem.quantity),
      costPrice: String(currentItem.costPrice || 0)
    };

    console.log("Adding row:", row);

    if (editingIndex >= 0) {
      const updatedItems = items.map((it, i) => i === editingIndex ? row : it);
      setItems(updatedItems);
      setEditingIndex(-1);
    } else {
      setItems(prev => [...prev, row]);
    }
    setCurrentItem(blankItem());
  };

  const handleEditItem = (index) => {
    setCurrentItem(items[index]);
    setEditingIndex(index);
  };

  const cancelEdit = () => {
    setCurrentItem(blankItem());
    setEditingIndex(-1);
  };

  const removeItem = (index) => {
    setItems(p => p.filter((_, i) => i !== index));
    if (editingIndex === index) cancelEdit();
  };

  const handleSubmit = async () => {
    if (!items.length) {
      showError(labels.addAtLeastOneItem);
      return;
    }

    const payload = { ...form, items };
    console.log("Submitting payload:", payload);

    try {
      if (isUpdate) {
        await updateWastage({ id: wastageId, ...payload }).unwrap();
        showSuccess(labels.wastageUpdated);
      } else {
        await createWastage(payload).unwrap();
        showSuccess(labels.wastageCreated);
        setForm(emptyForm());
        setItems([]);
      }
      onSuccess?.();
      onClose();
    } catch (e) {
      console.error("Submit error:", e);
      showError(e?.data?.message ?? labels.operationFailed);
    }
  };

  // ── Loading State ──────────────────────────────────────────────────────
  if (isUpdate && isFetching && !existingWastage) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="rounded-2xl p-8 text-sm" style={{ background: "var(--surface)", color: "var(--muted)" }}>{labels.loading}</div>
    </div>
  );

  // ─── render ───────────────────────────────────────────────────────────────
  // layout: [add-item-form | items-added]  →  [wastage details]  →  [summary]  →  [submit]
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div className="relative w-full max-w-6xl sm:my-4 min-h-full sm:min-h-0 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden" style={{ background: "var(--app-bg)", border: "1px solid var(--border)" }} onClick={e => e.stopPropagation()}>

        {/* header */}
        <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-10" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent-2)" }}><Trash className="w-4 h-4 text-white" /></div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold leading-tight truncate" style={{ color: "var(--ink)" }}>{isUpdate ? labels.updateWastage : labels.recordWastage}</h2>
              <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{labels.trackProductLosses}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl transition shrink-0" style={{ background: "var(--surface-muted)", color: "var(--muted)" }}><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* body */}
        <div className="p-3 sm:p-4 md:p-5 space-y-4">

          {/* row 1: add item form | items added */}
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 xl:gap-6 xl:min-h-[560px]">
            <Card title={editingIndex >= 0 ? `${labels.updateItem} #${editingIndex + 1}` : labels.addItem} icon={Plus} className="h-full">
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4">
                  <Field>
                    <Label>{labels.product} *</Label>
                    <Sel
                      value={currentItem.product}
                      onChange={e => {
                        const val = e.target.value;
                        const prod = products.find(p => p._id === val);
                        setCurrentItem({
                          ...blankItem(),
                          product: val,
                          productName: prod?.name ?? ""
                        });
                      }}
                    >
                      <option value="">{labels.selectProductPlaceholder}</option>
                      {productOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </Sel>
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <Label>{labels.reason} *</Label>
                    <Sel
                      value={currentItem.reason}
                      onChange={e => updateCurrent("reason", e.target.value)}
                    >
                      <option value="">{labels.selectReasonPlaceholder}</option>
                      {reasonOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </Sel>
                  </Field>
                  <Field>
                    <Label>{labels.batch}</Label>
                    <Sel
                      value={currentItem.batchNumber}
                      onChange={e => {
                        const val = e.target.value;
                        const b = batchOptions.find(o => o.value === val);
                        updateCurrent("batchNumber", val);
                        if (b?.expiryDate) {
                          updateCurrent("expiryDate", new Date(b.expiryDate).toISOString().split("T")[0]);
                        }
                      }}
                      disabled={!currentItem.product}
                    >
                      <option value="">{labels.selectBatchPlaceholder}</option>
                      {batchOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </Sel>
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <Label>{labels.quantity} *</Label>
                    <Inp
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      value={currentItem.quantity}
                      onChange={e => updateCurrent("quantity", e.target.value)}
                      disabled={!currentItem.product}
                    />
                  </Field>
                  <Field>
                    <Label>{labels.expiryDate}</Label>
                    <Inp
                      type="date"
                      value={currentItem.expiryDate}
                      onChange={e => updateCurrent("expiryDate", e.target.value)}
                      disabled={!currentItem.product}
                    />
                  </Field>
                </div>

                {/* Cost Price field disabled per business requirement
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field>
                      <Label>Cost Price</Label>
                      <Inp
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={currentItem.costPrice}
                        onChange={e => updateCurrent("costPrice", e.target.value)}
                      />
                    </Field>
                </div>
                */}

                <Field>
                  <Label>{labels.notes} {currentItem.reason === "other" ? "*" : ""}</Label>
                  <Txt
                    rows={3}
                    placeholder={labels.itemLevelNotes}
                    value={currentItem.notes}
                    onChange={e => updateCurrent("notes", e.target.value)}
                    disabled={!currentItem.product}
                  />
                </Field>

                <div className="flex gap-2">
                  {editingIndex >= 0 && (
                    <Btn variant="secondary" className="flex-1" onClick={cancelEdit}>
                      {labels.cancelEdit}
                    </Btn>
                  )}
                  <Btn
                    variant="primary"
                    className="flex-1 w-full"
                    onClick={handleAddItem}
                    disabled={!currentItem.product || !currentItem.quantity || !currentItem.reason}
                  >
                    <Plus className="w-4 h-4" />
                    {editingIndex >= 0 ? labels.updateItem : labels.addItem}
                  </Btn>
                </div>
              </div>
            </Card>

            <Card title={`${labels.items} (${items.length})`} icon={FileText} className="h-full">
              {items.length ? (
                <div className="overflow-x-auto -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 max-h-[600px] overflow-y-auto">
                  <table className="w-full text-sm min-w-[520px]">
                    <thead>
                      <tr className="text-xs uppercase tracking-wider" style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
                        {[labels.item, labels.batch, labels.qty, labels.reason, labels.notes, labels.actions].map(h => (
                          <th key={h} className={`px-2 sm:px-3 py-3 font-semibold ${h === labels.actions ? "text-center" : h === labels.qty ? "text-right" : "text-left"}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => (
                        <tr key={idx} className="transition" style={{ borderBottom: "1px solid var(--border)", background: editingIndex === idx ? "rgba(15,118,110,0.05)" : "transparent" }}
                          onMouseEnter={e => { if (editingIndex !== idx) e.currentTarget.style.background = "var(--surface-muted)"; }}
                          onMouseLeave={e => { if (editingIndex !== idx) e.currentTarget.style.background = "transparent"; }}>
                          <td className="px-2 sm:px-3 py-3 font-medium" style={{ color: "var(--ink)" }}>{it.productName || it.product}</td>
                          <td className="px-2 sm:px-3 py-3 font-mono text-xs" style={{ color: "var(--muted)" }}>{it.batchNumber || "—"}</td>
                          <td className="px-2 sm:px-3 py-3 text-right tabular-nums" style={{ color: "var(--ink)" }}>{it.quantity}</td>
                          <td className="px-2 sm:px-3 py-3" style={{ color: "var(--muted)" }}>{reasonOptions.find(r => r.value === it.reason)?.label ?? it.reason}</td>
                          <td className="px-2 sm:px-3 py-3 max-w-[160px] truncate" style={{ color: "var(--muted)" }}>{it.notes || "—"}</td>
                          <td className="px-2 sm:px-3 py-3"><div className="flex justify-center gap-1"><Btn variant="ghost" size="sm" onClick={() => handleEditItem(idx)}>{labels.edit}</Btn><Btn variant="danger" size="sm" onClick={() => removeItem(idx)}>{labels.remove}</Btn></div></td>
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

          {/* row 2: wastage details (date + notes) */}
          <Card title={labels.wastageDate ? "Wastage Details" : "Details"} icon={Calendar} noOverflow>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field>
                <Label><Calendar className="inline w-3 h-3 mr-1" />{labels.wastageDate} *</Label>
                <Inp
                  type="date"
                  value={form.wastageDate}
                  onChange={e => updateForm("wastageDate", e.target.value)}
                />
              </Field>
              <Field className="sm:col-span-1 lg:col-span-3">
                <Label><FileText className="inline w-3 h-3 mr-1" />{labels.notes}</Label>
                <Inp
                  placeholder={labels.optionalOverallNotes}
                  value={form.notes}
                  onChange={e => updateForm("notes", e.target.value)}
                />
              </Field>
            </div>
          </Card>

          {/* row 3: summary */}
          <Card title={labels.summary || "Summary"} icon={AlertTriangle}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <SumRow label={labels.items} value={items.length} />
              <SumRow label={labels.quantity} value={items.reduce((s, it) => s + Number(it.quantity || 0), 0)} />
              <SumRow label={labels.totalLoss} value={`Rs. ${totalLoss.toFixed(2)}`} danger />
            </div>
            <div className="pt-3 mt-3 flex justify-between items-center gap-2" style={{ borderTop: "1px solid var(--border)" }}>
              <span className="font-bold" style={{ color: "var(--ink)" }}>{labels.totalLoss}</span>
              <span className="text-base sm:text-lg font-black tabular-nums" style={{ color: "var(--accent-2)" }}>Rs. {totalLoss.toFixed(2)}</span>
            </div>
          </Card>

          {/* row 4: actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end">
            <Btn variant="secondary" onClick={onClose} className="w-full sm:w-auto">
              {labels.cancel}
            </Btn>
            <Btn
              variant="primary"
              className="w-full sm:flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting || !items.length}
            >
              {isSubmitting
                ? (isUpdate ? labels.updating : labels.saving)
                : isUpdate
                  ? `${labels.updateWastage} (${items.length})`
                  : `${labels.saveWastage} (${items.length})`
              }
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WastageModal(props) {
  return <ErrorBoundary><WastageModalInner {...props} /></ErrorBoundary>;
}












// // src/modules/wastage/components/WastageModal.jsx
// import { useState, useEffect, useMemo, useRef } from "react";
// import { X, Plus, CheckCircle, Pencil, Trash2, Trash } from "lucide-react";
// import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
// import { useCreateWastage, useUpdateWastage, useWastage } from "../services/wastage.service.js";
// import { useProducts } from "../../productsModule/services/product.service.js";
// import { useBatchesByProduct } from "../../productPurchases/services/batch.service.js";
// import { getWastageLabels } from "../labels/wastageLabels.js";
// import { useSettings } from "../../settings/hooks/useSettings.js";

// // ─── Constants ──────────────────────────────────────────────────────────────
// const REASONS = [
//   { label: "Expired", value: "expired" },
//   { label: "Damaged", value: "damaged" },
//   { label: "Stolen", value: "stolen" },
//   { label: "Spillage", value: "spillage" },
//   { label: "Quality Issue", value: "quality_issue" },
//   { label: "Other", value: "other" },
// ];

// const blankItem = () => ({
//   product: "",
//   productName: "",
//   batchNumber: "",
//   expiryDate: "",
//   quantity: "",
//   costPrice: "",
//   reason: "",
//   notes: "",
// });

// const emptyForm = () => ({
//   wastageDate: new Date().toISOString().split("T")[0],
//   notes: "",
// });

// // ─── Theme Components ──────────────────────────────────────────────────────
// const Label = ({ children }) => (
//   <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-[var(--muted)]">
//     {children}
//   </label>
// );

// const Field = ({ children, className = "" }) => (
//   <div className={`flex flex-col ${className}`}>{children}</div>
// );

// const Input = ({ className = "", ...props }) => (
//   <input
//     {...props}
//     className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition focus:ring-2 focus:ring-[var(--accent-2)] bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)] placeholder:text-[var(--muted)] ${className}`}
//   />
// );

// const Textarea = ({ className = "", ...props }) => (
//   <textarea
//     {...props}
//     className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition resize-none focus:ring-2 focus:ring-[var(--accent-2)] bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)] placeholder:text-[var(--muted)] ${className}`}
//   />
// );

// const Button = ({ children, variant = "primary", size = "md", className = "", ...props }) => {
//   const sizes = {
//     sm: "px-3 py-1.5 text-xs",
//     md: "px-3 sm:px-4 py-2 text-sm",
//     lg: "px-5 py-2.5 text-sm",
//   };

//   const variants = {
//     primary: "bg-[var(--accent-2)] text-white hover:opacity-90",
//     secondary: "bg-[var(--app-bg)] text-[var(--ink)] border border-[var(--border)] hover:bg-[var(--surface)]",
//     ghost: "bg-transparent text-[var(--muted)] hover:bg-[var(--app-bg)]",
//     danger: "bg-red-50 text-red-600 hover:bg-red-100",
//   };

//   return (
//     <button
//       {...props}
//       className={`inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-45 disabled:pointer-events-none cursor-pointer ${sizes[size]} ${variants[variant]} ${className}`}
//     >
//       {children}
//     </button>
//   );
// };

// const Card = ({ title, children, className = "" }) => (
//   <div className={`rounded-xl sm:rounded-2xl overflow-hidden bg-[var(--surface)] border border-[var(--border)] ${className}`}>
//     {title && (
//       <div className="px-4 sm:px-5 py-2 sm:py-3 text-xs font-semibold uppercase tracking-wider border-b border-[var(--border)] bg-[var(--app-bg)] text-[var(--muted)]">
//         {title}
//       </div>
//     )}
//     <div className="p-3 sm:p-4">{children}</div>
//   </div>
// );

// // ─── Main Modal ─────────────────────────────────────────────────────────────
// export default function WastageModal({ mode = "create", wastageId, onClose, onSuccess }) {
//   const { settings } = useSettings();
//   const language = settings?.language || "en";
//   const labels = getWastageLabels(language);

//   const isUpdate = mode === "update";

//   const { data: existingWastage, isLoading: isFetching } = useWastage(wastageId, { skip: !isUpdate || !wastageId });
//   const [createWastage, { isLoading: isCreating }] = useCreateWastage();
//   const [updateWastage, { isLoading: isUpdating }] = useUpdateWastage();
//   const isSubmitting = isCreating || isUpdating;

//   const { data: productsRaw = [] } = useProducts();
//   const products = productsRaw?.data ?? productsRaw ?? [];

//   const [form, setForm] = useState(emptyForm());
//   const [currentItem, setCurrentItem] = useState(blankItem());
//   const [items, setItems] = useState([]);
//   const [editingIndex, setEditingIndex] = useState(-1);

//   const updateForm = (field, value) => setForm(p => ({ ...p, [field]: value }));
//   const updateCurrent = (field, value) => setCurrentItem(p => ({ ...p, [field]: value }));

//   // ── Prefill for update ──────────────────────────────────────────────────
//   useEffect(() => {
//     if (!isUpdate || !existingWastage) return;
//     setForm({
//       wastageDate: existingWastage.wastageDate
//         ? new Date(existingWastage.wastageDate).toISOString().split("T")[0]
//         : new Date().toISOString().split("T")[0],
//       notes: existingWastage.notes ?? "",
//     });
//     setItems((existingWastage.items ?? []).map(it => ({
//       product: it.product?._id ?? it.product ?? "",
//       productName: it.product?.name ?? "",
//       batchNumber: it.batchNumber ?? "",
//       expiryDate: it.expiryDate ? new Date(it.expiryDate).toISOString().split("T")[0] : "",
//       quantity: it.quantity ?? "",
//       costPrice: it.costPrice ?? "",
//       reason: it.reason ?? "",
//       notes: it.notes ?? "",
//     })));
//   }, [existingWastage, isUpdate]);

//   // ── Memoized Options ──────────────────────────────────────────────────
//   const productOptions = useMemo(() =>
//     products.map(p => ({ label: p.name, value: p._id })), [products]
//   );

//   const batchOptions = useMemo(() => {
//     const prod = products.find(p => p._id === currentItem.product);
//     const batches = prod?.batches || [];
//     return batches.map(b => ({
//       label: `${b.batchNumber} — Exp: ${b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : "N/A"}`,
//       value: b.batchNumber,
//       expiryDate: b.expiryDate ?? "",
//     }));
//   }, [currentItem.product, products]);

//   const reasonOptions = useMemo(() => [
//     { label: labels.expired, value: "expired" },
//     { label: labels.damaged, value: "damaged" },
//     { label: labels.stolen, value: "stolen" },
//     { label: labels.spillage, value: "spillage" },
//     { label: labels.qualityIssue, value: "quality_issue" },
//     { label: labels.other, value: "other" },
//   ], [labels]);

//   const totalLoss = useMemo(() =>
//     items.reduce((sum, it) => sum + (Number(it.quantity || 0) * Number(it.costPrice || 0)), 0),
//     [items]
//   );

//   // ── Handlers ────────────────────────────────────────────────────────────
//   const handleAddItem = () => {
//     console.log("Adding item:", currentItem);

//     if (!currentItem.product) {
//       showError(labels.selectProduct);
//       return;
//     }
//     if (!currentItem.quantity || Number(currentItem.quantity) <= 0) {
//       showError(labels.enterValidQuantity);
//       return;
//     }
//     if (!currentItem.reason) {
//       showError(labels.selectReason);
//       return;
//     }

//     const prod = products.find(p => p._id === currentItem.product);
//     const row = {
//       ...currentItem,
//       productName: prod?.name ?? currentItem.productName,
//       quantity: String(currentItem.quantity),
//       costPrice: String(currentItem.costPrice || 0)
//     };

//     console.log("Adding row:", row);

//     if (editingIndex >= 0) {
//       const updatedItems = items.map((it, i) => i === editingIndex ? row : it);
//       setItems(updatedItems);
//       setEditingIndex(-1);
//     } else {
//       setItems(prev => [...prev, row]);
//     }
//     setCurrentItem(blankItem());
//   };

//   const handleEditItem = (index) => {
//     setCurrentItem(items[index]);
//     setEditingIndex(index);
//   };

//   const cancelEdit = () => {
//     setCurrentItem(blankItem());
//     setEditingIndex(-1);
//   };

//   const removeItem = (index) => {
//     setItems(p => p.filter((_, i) => i !== index));
//     if (editingIndex === index) cancelEdit();
//   };

//   const handleSubmit = async () => {
//     if (!items.length) {
//       showError(labels.addAtLeastOneItem);
//       return;
//     }

//     const payload = { ...form, items };
//     console.log("Submitting payload:", payload);

//     try {
//       if (isUpdate) {
//         await updateWastage({ id: wastageId, ...payload }).unwrap();
//         showSuccess(labels.wastageUpdated);
//       } else {
//         await createWastage(payload).unwrap();
//         showSuccess(labels.wastageCreated);
//         setForm(emptyForm());
//         setItems([]);
//       }
//       onSuccess?.();
//       onClose();
//     } catch (e) {
//       console.error("Submit error:", e);
//       showError(e?.data?.message ?? labels.operationFailed);
//     }
//   };

//   // ── Loading State ──────────────────────────────────────────────────────
//   if (isUpdate && isFetching && !existingWastage) {
//     return (
//       <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
//         <div className="rounded-2xl p-8 text-sm bg-[var(--surface)] text-[var(--muted)]">{labels.loading}</div>
//       </div>
//     );
//   }

//   // ─── Render ──────────────────────────────────────────────────────────────
//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto"
//       onClick={onClose}
//     >
//       <div
//         className="relative w-full min-h-full sm:min-h-0 sm:max-w-3xl sm:my-4 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden bg-[var(--surface)] border-t border-b sm:border border-[var(--border)]"
//         onClick={e => e.stopPropagation()}
//       >
//         {/* ─── Header ────────────────────────────────────────────────────── */}
//         <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-30 bg-[var(--surface)] border-b border-[var(--border)]">
//           <div className="flex items-center gap-2 sm:gap-3 min-w-0">
//             <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 bg-[var(--accent)]">
//               <Trash className="w-4 h-4 text-white" />
//             </div>
//             <div className="min-w-0">
//               <h2 className="text-sm sm:text-base font-bold leading-tight truncate text-[var(--ink)] font-display">
//                 {isUpdate ? labels.updateWastage : labels.recordWastage}
//               </h2>
//               <p className="text-xs truncate text-[var(--muted)]">{labels.trackProductLosses}</p>
//             </div>
//           </div>
//           <button
//             onClick={onClose}
//             className="w-8 h-8 flex items-center justify-center rounded-xl transition shrink-0 bg-[var(--app-bg)] text-[var(--muted)] hover:text-[var(--ink)]"
//           >
//             <X className="w-4 h-4" />
//           </button>
//         </div>

//         {/* ─── Body ──────────────────────────────────────────────────────── */}
//         <div className="p-3 sm:p-5 space-y-4 sm:space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
//           {/* Date & Notes */}
//           <Card>
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
//               <Field>
//                 <Label>{labels.wastageDate} *</Label>
//                 <Input
//                   type="date"
//                   value={form.wastageDate}
//                   onChange={e => updateForm("wastageDate", e.target.value)}
//                 />
//               </Field>
//               <Field>
//                 <Label>{labels.notes}</Label>
//                 <Input
//                   placeholder={labels.optionalOverallNotes}
//                   value={form.notes}
//                   onChange={e => updateForm("notes", e.target.value)}
//                 />
//               </Field>
//             </div>
//           </Card>

//           {/* Item Form */}
//           <Card title={editingIndex >= 0 ? `${labels.updateItem} #${editingIndex + 1}` : labels.addItem}>
//             <div className="space-y-3 sm:space-y-4">
//               {/* Product & Reason Row */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
//                 <Field>
//                   <Label>{labels.product} *</Label>
//                   <select
//                     value={currentItem.product}
//                     onChange={e => {
//                       const val = e.target.value;
//                       const prod = products.find(p => p._id === val);
//                       setCurrentItem({
//                         ...blankItem(),
//                         product: val,
//                         productName: prod?.name ?? ""
//                       });
//                     }}
//                     className="w-full px-3 py-2 text-sm rounded-xl outline-none transition focus:ring-2 focus:ring-[var(--accent-2)] bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)] cursor-pointer"
//                   >
//                     <option value="">{labels.selectProductPlaceholder}</option>
//                     {productOptions.map(opt => (
//                       <option key={opt.value} value={opt.value}>{opt.label}</option>
//                     ))}
//                   </select>
//                 </Field>
//                 <Field>
//                   <Label>{labels.reason} *</Label>
//                   <select
//                     value={currentItem.reason}
//                     onChange={e => updateCurrent("reason", e.target.value)}
//                     className="w-full px-3 py-2 text-sm rounded-xl outline-none transition focus:ring-2 focus:ring-[var(--accent-2)] bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)] cursor-pointer"
//                   >
//                     <option value="">{labels.selectReasonPlaceholder}</option>
//                     {reasonOptions.map(opt => (
//                       <option key={opt.value} value={opt.value}>{opt.label}</option>
//                     ))}
//                   </select>
//                 </Field>
//               </div>

//               {currentItem.product && (
//                 <>
//                   {/* Batch & Expiry Date Row */}
//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
//                     <Field>
//                       <Label>{labels.batch}</Label>
//                       <select
//                         value={currentItem.batchNumber}
//                         onChange={e => {
//                           const val = e.target.value;
//                           const b = batchOptions.find(o => o.value === val);
//                           updateCurrent("batchNumber", val);
//                           if (b?.expiryDate) {
//                             updateCurrent("expiryDate", new Date(b.expiryDate).toISOString().split("T")[0]);
//                           }
//                         }}
//                         className="w-full px-3 py-2 text-sm rounded-xl outline-none transition focus:ring-2 focus:ring-[var(--accent-2)] bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)] cursor-pointer"
//                       >
//                         <option value="">{labels.selectBatchPlaceholder}</option>
//                         {batchOptions.map(opt => (
//                           <option key={opt.value} value={opt.value}>{opt.label}</option>
//                         ))}
//                       </select>
//                     </Field>
//                     <Field>
//                       <Label>{labels.expiryDate}</Label>
//                       <Input
//                         type="date"
//                         value={currentItem.expiryDate}
//                         onChange={e => updateCurrent("expiryDate", e.target.value)}
//                       />
//                     </Field>
//                   </div>

//                   {/* Quantity & Cost Price Row */}
//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
//                     <Field>
//                       <Label>{labels.quantity} *</Label>
//                       <Input
//                         type="number"
//                         min="0.01"
//                         step="0.01"
//                         placeholder="0.00"
//                         value={currentItem.quantity}
//                         onChange={e => updateCurrent("quantity", e.target.value)}
//                       />
//                     </Field>
//                     <Field>
//                       <Label>Cost Price</Label>
//                       <Input
//                         type="number"
//                         min="0"
//                         step="0.01"
//                         placeholder="0.00"
//                         value={currentItem.costPrice}
//                         onChange={e => updateCurrent("costPrice", e.target.value)}
//                       />
//                     </Field>
//                   </div>

//                   {/* Notes Field */}
//                   <Field>
//                     <Label>{labels.notes} {currentItem.reason === "other" ? "*" : ""}</Label>
//                     <Textarea
//                       rows={2}
//                       placeholder={labels.itemLevelNotes}
//                       value={currentItem.notes}
//                       onChange={e => updateCurrent("notes", e.target.value)}
//                     />
//                   </Field>

//                   {/* Action Buttons */}
//                   <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end pt-2 sm:pt-3">
//                     {editingIndex >= 0 && (
//                       <Button variant="secondary" size="sm" onClick={cancelEdit} className="w-full sm:w-auto">
//                         {labels.cancelEdit}
//                       </Button>
//                     )}
//                     <Button
//                       variant="primary"
//                       size="sm"
//                       onClick={handleAddItem}
//                       disabled={!currentItem.product || !currentItem.quantity || !currentItem.reason}
//                       className="w-full sm:w-auto"
//                     >
//                       {editingIndex >= 0 ? (
//                         <>
//                           <CheckCircle className="w-3.5 h-3.5" />
//                           {labels.updateItem}
//                         </>
//                       ) : (
//                         <>
//                           <Plus className="w-3.5 h-3.5" />
//                           {labels.addItem}
//                         </>
//                       )}
//                     </Button>
//                   </div>
//                 </>
//               )}
//             </div>
//           </Card>

//           {/* Confirmed Items */}
//           {items.length > 0 && (
//             <Card title={`${labels.items} (${items.length})`}>
//               <div className="space-y-2">
//                 {items.map((item, i) => (
//                   <div
//                     key={i}
//                     className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-xl sm:rounded-2xl transition border ${editingIndex === i
//                         ? "border-[var(--accent-2)] bg-[var(--accent-2)]/5"
//                         : "border-[var(--border)] bg-[var(--surface)]"
//                       }`}
//                   >
//                     <div className="flex flex-col gap-0.5 min-w-0 flex-1">
//                       <span className="text-sm font-semibold truncate text-[var(--ink)]">
//                         {item.productName || item.product}
//                       </span>
//                       <span className="text-xs text-[var(--muted)] line-clamp-2">
//                         Qty: {item.quantity}
//                         {item.batchNumber && ` · Batch: ${item.batchNumber}`}
//                         {" · "}{reasonOptions.find(r => r.value === item.reason)?.label ?? item.reason}
//                         {Number(item.costPrice) > 0 && ` · Loss: Rs. ${(Number(item.quantity) * Number(item.costPrice)).toFixed(2)}`}
//                       </span>
//                     </div>
//                     <div className="flex items-center gap-1 shrink-0">
//                       <button
//                         onClick={() => handleEditItem(i)}
//                         className="p-1.5 rounded-lg transition text-[var(--muted)] hover:text-[var(--accent-2)] hover:bg-[var(--accent-2)]/10"
//                       >
//                         <Pencil className="w-3.5 h-3.5" />
//                       </button>
//                       <button
//                         onClick={() => removeItem(i)}
//                         className="p-1.5 rounded-lg transition text-[var(--muted)] hover:text-red-600 hover:bg-red-50"
//                       >
//                         <Trash2 className="w-3.5 h-3.5" />
//                       </button>
//                     </div>
//                   </div>
//                 ))}

//                 <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-3 mt-1 border-t border-[var(--border)]">
//                   <span className="text-sm font-semibold text-[var(--ink)]">{labels.totalLoss}</span>
//                   <span className="text-base sm:text-lg font-black tabular-nums text-[var(--accent)]">
//                     Rs. {totalLoss.toFixed(2)}
//                   </span>
//                 </div>
//               </div>
//             </Card>
//           )}
//         </div>

//         {/* ─── Footer ────────────────────────────────────────────────────── */}
//         <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-[var(--border)] bg-[var(--app-bg)]">
//           <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
//             {labels.cancel}
//           </Button>
//           <Button
//             variant="primary"
//             onClick={handleSubmit}
//             disabled={isSubmitting || !items.length}
//             className="w-full sm:w-auto"
//           >
//             {isSubmitting
//               ? (isUpdate ? labels.updating : labels.saving)
//               : isUpdate
//                 ? `${labels.updateWastage} (${items.length})`
//                 : `${labels.saveWastage} (${items.length})`
//             }
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }
// src/modules/wastage/components/WastageModal.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { X, Plus, CheckCircle, Pencil, Trash2, Trash } from "lucide-react";
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
import { useCreateWastage, useUpdateWastage, useWastage } from "../services/wastage.service.js";
import { useProducts } from "../../productsModule/services/product.service.js";
import { useBatchesByProduct } from "../../productPurchases/services/batch.service.js";
import { useSelector } from "react-redux";

// ─── Constants ──────────────────────────────────────────────────────────────
const REASONS = [
  { label: "Expired", value: "expired" },
  { label: "Damaged", value: "damaged" },
  { label: "Stolen", value: "stolen" },
  { label: "Spillage", value: "spillage" },
  { label: "Quality Issue", value: "quality_issue" },
  { label: "Other", value: "other" },
];

const UNITS = ["Tablet", "Strip", "Bottle", "Box", "Piece", "Sachet", "Vial", "ml", "g", "kg", "unit"];

const blankItem = () => ({
  product: "", 
  productName: "", 
  batchNumber: "",
  expiryDate: "", 
  quantity: "", 
  unit: "", 
  costPrice: "",
  reason: "", 
  notes: "",
});

const emptyForm = () => ({
  wastageDate: new Date().toISOString().split("T")[0],
  notes: "",
});

// ─── Theme Components ──────────────────────────────────────────────────────
const Label = ({ children }) => (
  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-[var(--muted)]">
    {children}
  </label>
);

const Field = ({ children, className = "" }) => (
  <div className={`flex flex-col ${className}`}>{children}</div>
);

const Input = ({ className = "", ...props }) => (
  <input
    {...props}
    className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition focus:ring-2 focus:ring-[var(--accent-2)] bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)] placeholder:text-[var(--muted)] ${className}`}
  />
);

const Textarea = ({ className = "", ...props }) => (
  <textarea
    {...props}
    className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition resize-none focus:ring-2 focus:ring-[var(--accent-2)] bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)] placeholder:text-[var(--muted)] ${className}`}
  />
);

const Button = ({ children, variant = "primary", size = "md", className = "", ...props }) => {
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-sm",
  };

  const variants = {
    primary: "bg-[var(--accent-2)] text-white hover:opacity-90",
    secondary: "bg-[var(--app-bg)] text-[var(--ink)] border border-[var(--border)] hover:bg-[var(--surface)]",
    ghost: "bg-transparent text-[var(--muted)] hover:bg-[var(--app-bg)]",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
  };

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-45 disabled:pointer-events-none cursor-pointer ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ title, children, className = "" }) => (
  <div className={`rounded-2xl overflow-hidden bg-[var(--surface)] border border-[var(--border)] ${className}`}>
    {title && (
      <div className="px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b border-[var(--border)] bg-[var(--app-bg)] text-[var(--muted)]">
        {title}
      </div>
    )}
    <div className="p-4">{children}</div>
  </div>
);

// ─── Main Modal ─────────────────────────────────────────────────────────────
export default function WastageModal({ mode = "create", wastageId, onClose, onSuccess }) {
  const language = useSelector(s => s.auth?.user?.language ?? "en");
  const t = (en, ur) => language === "en" ? en : ur;
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
      unit: it.unit ?? "",
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

  const unitOptions = UNITS.map(u => ({ label: u, value: u }));
  const reasonOptions = REASONS;

  const totalLoss = useMemo(() =>
    items.reduce((sum, it) => sum + (Number(it.quantity || 0) * Number(it.costPrice || 0)), 0),
    [items]
  );

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleAddItem = () => {
    console.log("Adding item:", currentItem);
    
    if (!currentItem.product) {
      showError("Select a product");
      return;
    }
    if (!currentItem.quantity || Number(currentItem.quantity) <= 0) {
      showError("Enter a valid quantity");
      return;
    }
    if (!currentItem.reason) {
      showError("Select a reason");
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
      showError("Add at least one item");
      return;
    }

    const payload = { ...form, items };
    console.log("Submitting payload:", payload);

    try {
      if (isUpdate) {
        await updateWastage({ id: wastageId, ...payload }).unwrap();
        showSuccess("Wastage updated!");
      } else {
        await createWastage(payload).unwrap();
        showSuccess("Wastage recorded!");
        setForm(emptyForm());
        setItems([]);
      }
      onSuccess?.();
      onClose();
    } catch (e) {
      console.error("Submit error:", e);
      showError(e?.data?.message ?? "Operation failed.");
    }
  };

  // ── Loading State ──────────────────────────────────────────────────────
  if (isUpdate && isFetching && !existingWastage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="rounded-2xl p-8 text-sm bg-[var(--surface)] text-[var(--muted)]">Loading…</div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-3 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl my-4 rounded-3xl shadow-2xl overflow-hidden bg-[var(--surface)] border border-[var(--border)]"
        onClick={e => e.stopPropagation()}
      >
        {/* ─── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-30 bg-[var(--surface)] border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[var(--accent)]">
              <Trash className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight text-[var(--ink)] font-display">
                {isUpdate ? "Update Wastage" : "Record Wastage"}
              </h2>
              <p className="text-xs text-[var(--muted)]">Track product losses</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition bg-[var(--app-bg)] text-[var(--muted)] hover:text-[var(--ink)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ─── Body ──────────────────────────────────────────────────────── */}
        <div className="p-5 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
          {/* Date & Notes */}
          <Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <Label>Wastage Date *</Label>
                <Input
                  type="date"
                  value={form.wastageDate}
                  onChange={e => updateForm("wastageDate", e.target.value)}
                />
              </Field>
              <Field>
                <Label>Notes</Label>
                <Input
                  placeholder="Optional overall notes…"
                  value={form.notes}
                  onChange={e => updateForm("notes", e.target.value)}
                />
              </Field>
            </div>
          </Card>

          {/* Item Form */}
          <Card title={editingIndex >= 0 ? `Editing Item #${editingIndex + 1}` : "Add Item"}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field>
                  <Label>Product *</Label>
                  <select
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
                    className="w-full px-3 py-2 text-sm rounded-xl outline-none transition focus:ring-2 focus:ring-[var(--accent-2)] bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)] cursor-pointer"
                  >
                    <option value="">Select product…</option>
                    {productOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </Field>
                <Field>
                  <Label>Reason *</Label>
                  <select
                    value={currentItem.reason}
                    onChange={e => updateCurrent("reason", e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl outline-none transition focus:ring-2 focus:ring-[var(--accent-2)] bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)] cursor-pointer"
                  >
                    <option value="">Select reason…</option>
                    {reasonOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {currentItem.product && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                        value={currentItem.quantity}
                        onChange={e => updateCurrent("quantity", e.target.value)}
                      />
                    </Field>
                    <Field>
                      <Label>Unit</Label>
                      <select
                        value={currentItem.unit}
                        onChange={e => updateCurrent("unit", e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-xl outline-none transition focus:ring-2 focus:ring-[var(--accent-2)] bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)] cursor-pointer"
                      >
                        <option value="">Unit…</option>
                        {unitOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <Label>Batch</Label>
                      <select
                        value={currentItem.batchNumber}
                        onChange={e => {
                          const val = e.target.value;
                          const b = batchOptions.find(o => o.value === val);
                          updateCurrent("batchNumber", val);
                          if (b?.expiryDate) {
                            updateCurrent("expiryDate", new Date(b.expiryDate).toISOString().split("T")[0]);
                          }
                        }}
                        className="w-full px-3 py-2 text-sm rounded-xl outline-none transition focus:ring-2 focus:ring-[var(--accent-2)] bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)] cursor-pointer"
                      >
                        <option value="">Select batch…</option>
                        {batchOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </Field>
                    <Field>
                      <Label>Expiry Date</Label>
                      <Input
                        type="date"
                        value={currentItem.expiryDate}
                        onChange={e => updateCurrent("expiryDate", e.target.value)}
                      />
                    </Field>
                  </div>

                  <Field>
                    <Label>Notes {currentItem.reason === "other" ? "*" : ""}</Label>
                    <Textarea
                      rows={2}
                      placeholder="Item-level notes…"
                      value={currentItem.notes}
                      onChange={e => updateCurrent("notes", e.target.value)}
                    />
                  </Field>

                  <div className="flex gap-2 justify-end">
                    {editingIndex >= 0 && (
                      <Button variant="secondary" size="sm" onClick={cancelEdit}>
                        Cancel Edit
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddItem}
                      disabled={!currentItem.product || !currentItem.quantity || !currentItem.reason}
                    >
                      {editingIndex >= 0 ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          Update Item
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          Add Item
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Confirmed Items */}
          {items.length > 0 && (
            <Card title={`Items (${items.length})`}>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl transition border ${
                      editingIndex === i
                        ? "border-[var(--accent-2)] bg-[var(--accent-2)]/5"
                        : "border-[var(--border)] bg-[var(--surface)]"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="text-sm font-semibold truncate text-[var(--ink)]">
                        {item.productName || item.product}
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        Qty: {item.quantity}
                        {item.unit && ` · ${item.unit}`}
                        {item.batchNumber && ` · Batch: ${item.batchNumber}`}
                        {" · "}{REASONS.find(r => r.value === item.reason)?.label ?? item.reason}
                        {Number(item.costPrice) > 0 && ` · Loss: Rs. ${(Number(item.quantity) * Number(item.costPrice)).toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEditItem(i)}
                        className="p-1.5 rounded-lg transition text-[var(--muted)] hover:text-[var(--accent-2)] hover:bg-[var(--accent-2)]/10"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeItem(i)}
                        className="p-1.5 rounded-lg transition text-[var(--muted)] hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between items-center pt-3 mt-1 border-t border-[var(--border)]">
                  <span className="text-sm font-semibold text-[var(--ink)]">Total Loss</span>
                  <span className="text-base font-black tabular-nums text-[var(--accent)]">
                    Rs. {totalLoss.toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* ─── Footer ────────────────────────────────────────────────────── */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--app-bg)]">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !items.length}
          >
            {isSubmitting
              ? (isUpdate ? "Updating..." : "Saving...")
              : isUpdate
                ? `Update (${items.length} items)`
                : `Save Wastage (${items.length} items)`
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
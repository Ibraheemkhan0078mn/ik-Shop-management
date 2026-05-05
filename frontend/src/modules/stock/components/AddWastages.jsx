import { useState } from "react";
import { Plus, Trash2, X, Pencil, CheckCircle } from "lucide-react";
import { useCreateWastage } from "../services/wastage.service";
import { useProducts } from "../../productsModule/services/product.service.js";
import { FormField, Input, Textarea, SearchableSelect } from "../../../components/common/FormFields";

const blankItem = () => ({
    product:     "",
    batchNumber: "",
    expiryDate:  "",
    quantity:    "",
    unit:        "",
    costPrice:   "",
    reason:      "",
    notes:       "",
});

const UNITS = ["Tablet", "Strip", "Bottle", "Box", "Piece", "Sachet", "Vial", "ml", "g", "kg"];

const REASONS = [
    { label: "Expired",       value: "expired" },
    { label: "Damaged",       value: "damaged" },
    { label: "Stolen",        value: "stolen" },
    { label: "Spillage",      value: "spillage" },
    { label: "Quality Issue", value: "quality_issue" },
    { label: "Other",         value: "other" },
];

export default function AddWastage({ open, onClose }) {
    const [createWastage, { isLoading }] = useCreateWastage();
    const { data: productsRaw = [] }     = useProducts();
    const products = productsRaw?.data || productsRaw;

    const [formData, setFormData] = useState({
        wastageDate: new Date().toISOString().split("T")[0],
    });

    // current item being filled in form
    const [currentItem, setCurrentItem]   = useState(blankItem());
    // confirmed items list
    const [items, setItems]               = useState([]);
    // index of item being edited (-1 = new)
    const [editingIndex, setEditingIndex] = useState(-1);

    const update      = (field, value) => setFormData((p) => ({ ...p, [field]: value }));
    const updateCurrent = (field, value) => setCurrentItem((p) => ({ ...p, [field]: value }));

    const productOptions = products.map((p) => ({ label: p.name, value: p._id }));
    const unitOptions    = UNITS.map((u) => ({ label: u, value: u }));

    const getBatchOptions = (productId) => {
        const product = products.find((p) => p._id === productId);
        return (product?.batches || []).map((b) => ({
            label:      `${b.batchNumber} — Exp: ${b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : "N/A"}`,
            value:      b.batchNumber,
            expiryDate: b.expiryDate || "",
        }));
    };

    const getProductName = (id) => products.find((p) => p._id === id)?.name || id;

    // ── Add / Update item in list ────────────────────────────
    const handleAddItem = () => {
        if (!currentItem.product || !currentItem.quantity || !currentItem.reason) return;

        if (editingIndex >= 0) {
            // update existing
            setItems((p) => p.map((item, i) => (i === editingIndex ? currentItem : item)));
            setEditingIndex(-1);
        } else {
            // add new
            setItems((p) => [...p, currentItem]);
        }
        setCurrentItem(blankItem());
    };

    // ── Edit: load item back into form ───────────────────────
    const handleEdit = (i) => {
        setCurrentItem(items[i]);
        setEditingIndex(i);
    };

    // ── Cancel edit ──────────────────────────────────────────
    const handleCancelEdit = () => {
        setCurrentItem(blankItem());
        setEditingIndex(-1);
    };

    // ── Delete from list ─────────────────────────────────────
    const handleDelete = (i) => {
        setItems((p) => p.filter((_, idx) => idx !== i));
        if (editingIndex === i) {
            setCurrentItem(blankItem());
            setEditingIndex(-1);
        }
    };

    // ── Final submit ─────────────────────────────────────────
    const onSubmit = async () => {
        if (items.length === 0) return;
        try {
            await createWastage({ ...formData, items }).unwrap();
            onClose();
        } catch {}
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-(--surface) border border-(--border) rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-(--text)">Add Wastage</h2>
                    <button onClick={onClose} className="text-(--muted) hover:text-(--text) transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ── Wastage Date ──────────────────────────────── */}
                <div className="grid grid-cols-2 gap-4">
                    <FormField label="* Wastage Date">
                        <Input
                            type="date"
                            value={formData.wastageDate}
                            onChange={(e) => update("wastageDate", e.target.value)}
                            required
                        />
                    </FormField>
                </div>

                {/* ── Item Form ─────────────────────────────────── */}
                <div className="p-4 rounded-2xl border border-(--border) space-y-3">
                    <h4 className="text-sm font-semibold text-(--text)">
                        {editingIndex >= 0 ? `Editing Item #${editingIndex + 1}` : "New Item"}
                    </h4>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">

                        <FormField label="* Product">
                            <SearchableSelect
                                options={productOptions}
                                value={currentItem.product}
                                onChange={(val) => updateCurrent("product", val)}
                                placeholder="Select product..."
                            />
                        </FormField>

                        <FormField label="* Reason">
                            <SearchableSelect
                                options={REASONS}
                                value={currentItem.reason}
                                onChange={(val) => updateCurrent("reason", val)}
                                placeholder="Select reason..."
                            />
                        </FormField>

                        {currentItem.product && (
                            <>
                                <FormField label="* Quantity">
                                    <Input
                                        type="number"
                                        min={1}
                                        value={currentItem.quantity}
                                        onChange={(e) => updateCurrent("quantity", e.target.value)}
                                        placeholder="0"
                                    />
                                </FormField>

                                <FormField label="Unit">
                                    <SearchableSelect
                                        options={unitOptions}
                                        value={currentItem.unit}
                                        onChange={(val) => updateCurrent("unit", val)}
                                        placeholder="Select unit..."
                                    />
                                </FormField>

                                <FormField label="Batch">
                                    <SearchableSelect
                                        options={getBatchOptions(currentItem.product)}
                                        value={currentItem.batchNumber}
                                        onChange={(val) => {
                                            const batch = getBatchOptions(currentItem.product).find((b) => b.value === val);
                                            updateCurrent("batchNumber", val);
                                            if (batch?.expiryDate) updateCurrent("expiryDate", new Date(batch.expiryDate).toISOString().split("T")[0]);
                                        }}
                                        placeholder="Select batch..."
                                    />
                                </FormField>

                                <FormField label="Expiry Date">
                                    <Input
                                        type="date"
                                        value={currentItem.expiryDate}
                                        onChange={(e) => updateCurrent("expiryDate", e.target.value)}
                                    />
                                </FormField>

                                <FormField label="Cost Price">
                                    <Input
                                        type="number"
                                        min={0}
                                        value={currentItem.costPrice}
                                        onChange={(e) => updateCurrent("costPrice", e.target.value)}
                                        placeholder="0.00"
                                    />
                                </FormField>

                                <div className="col-span-2 md:col-span-3">
                                    <FormField label={`Notes${currentItem.reason === "other" ? " *" : ""}`}>
                                        <Textarea
                                            rows={2}
                                            value={currentItem.notes}
                                            onChange={(e) => updateCurrent("notes", e.target.value)}
                                            placeholder="Additional details for this item..."
                                            required={currentItem.reason === "other"}
                                        />
                                    </FormField>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Add / Update item button */}
                    <div className="flex gap-2 justify-end pt-1">
                        {editingIndex >= 0 && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="px-3 py-1.5 rounded-xl border border-(--border) text-xs text-(--muted) hover:text-(--text) transition"
                            >
                                Cancel Edit
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleAddItem}
                            disabled={!currentItem.product || !currentItem.quantity || !currentItem.reason}
                            className="px-3 py-1.5 rounded-xl bg-cyan-600 text-white text-xs hover:bg-cyan-700 disabled:opacity-40 transition flex items-center gap-1"
                        >
                            {editingIndex >= 0
                                ? <><CheckCircle className="w-3.5 h-3.5" /> Update Item</>
                                : <><Plus className="w-3.5 h-3.5" /> Add Item</>
                            }
                        </button>
                    </div>
                </div>

                {/* ── Added Items List ──────────────────────────── */}
                {items.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-(--text)">
                            Added Items ({items.length})
                        </h4>

                        {items.map((item, i) => (
                            <div
                                key={i}
                                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border transition ${
                                    editingIndex === i
                                        ? "border-cyan-500 bg-cyan-50"
                                        : "border-(--border) bg-(--surface)"
                                }`}
                            >
                                <div className="flex flex-col gap-0.5 text-sm">
                                    <span className="font-medium text-(--text)">{getProductName(item.product)}</span>
                                    <span className="text-xs text-(--muted)">
                                        Qty: {item.quantity} {item.unit && `• ${item.unit}`} {item.batchNumber && `• Batch: ${item.batchNumber}`} • {REASONS.find((r) => r.value === item.reason)?.label || item.reason}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(i)}
                                        className="p-1.5 rounded-lg text-(--muted) hover:text-cyan-600 hover:bg-cyan-50 transition"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(i)}
                                        className="p-1.5 rounded-lg text-(--muted) hover:text-red-500 hover:bg-red-50 transition"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Footer ────────────────────────────────────── */}
                <div className="flex justify-end gap-3 pt-2 border-t border-(--border)">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl border border-(--border) text-sm text-(--muted) hover:text-(--text) transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={isLoading || items.length === 0}
                        className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm hover:bg-cyan-700 disabled:opacity-50 transition"
                    >
                        {isLoading ? "Saving..." : `Save Wastage (${items.length} items)`}
                    </button>
                </div>

            </div>
        </div>
    );
}
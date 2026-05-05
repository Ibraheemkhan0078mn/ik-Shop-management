import { useState, useEffect } from "react";
import { Plus, Trash2, X, Pencil, CheckCircle } from "lucide-react";
import { useWastage, useUpdateWastage } from "../services/wastage.service";
import { useProducts } from "../../productsModule/services/product.service.js";
import { FormField, Input, Textarea, SearchableSelect } from "../../../components/common/FormFields";

const blankItem = () => ({
    product: "",
    batchNumber: "",
    expiryDate: "",
    quantity: "",
    unit: "",
    costPrice: "",
    reason: "",
    notes: "",
});

const UNITS = ["Tablet", "Strip", "Bottle", "Box", "Piece", "Sachet", "Vial", "ml", "g", "kg"];

const REASONS = [
    { label: "Expired", value: "expired" },
    { label: "Damaged", value: "damaged" },
    { label: "Stolen", value: "stolen" },
    { label: "Spillage", value: "spillage" },
    { label: "Quality Issue", value: "quality_issue" },
    { label: "Other", value: "other" },
];

export default function UpdateWastage({ id, open, onClose }) {
    const [updateWastage, { isLoading }] = useUpdateWastage();
    const { data: wastageData, isLoading: isFetching } = useWastage(id, { skip: !id });
    const { data: productsRaw = [] } = useProducts();
    const products = productsRaw?.data || productsRaw;

    const [formData, setFormData] = useState({
        wastageDate: new Date().toISOString().split("T")[0],
    });

    const [currentItem, setCurrentItem] = useState(blankItem());
    const [items, setItems] = useState([]);
    const [editingIndex, setEditingIndex] = useState(-1);

    // ── Prefill on fetch ─────────────────────────────────────
    useEffect(() => {
        if (!wastageData) return;

        setFormData({
            wastageDate: wastageData.wastageDate
                ? new Date(wastageData.wastageDate).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0],
        });

        setItems(
            (wastageData.items || []).map((item) => ({
                product: item.product?._id || item.product || "",
                batchNumber: item.batchNumber || "",
                expiryDate: item.expiryDate
                    ? new Date(item.expiryDate).toISOString().split("T")[0]
                    : "",
                quantity: item.quantity ?? "",
                unit: item.unit || "",
                costPrice: item.costPrice ?? "",
                reason: item.reason || "",
                notes: item.notes || "",
            }))
        );
    }, [wastageData]);

    const update = (field, value) => setFormData((p) => ({ ...p, [field]: value }));
    const updateCurrent = (field, value) => setCurrentItem((p) => ({ ...p, [field]: value }));

    const productOptions = products.map((p) => ({ label: p.name, value: p._id }));
    const unitOptions = UNITS.map((u) => ({ label: u, value: u }));

    const getBatchOptions = (productId) => {
        const product = products.find((p) => p._id === productId);
        return (product?.batches || []).map((b) => ({
            label: `${b.batchNumber} — Exp: ${b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : "N/A"}`,
            value: b.batchNumber,
            expiryDate: b.expiryDate || "",
        }));
    };

    const getProductName = (pid) => products.find((p) => p._id === pid)?.name || pid;

    const handleAddItem = () => {
        if (!currentItem.product || !currentItem.quantity || !currentItem.reason) return;
        if (editingIndex >= 0) {
            setItems((p) => p.map((item, i) => (i === editingIndex ? currentItem : item)));
            setEditingIndex(-1);
        } else {
            setItems((p) => [...p, currentItem]);
        }
        setCurrentItem(blankItem());
    };

    const handleEdit = (i) => {
        setCurrentItem(items[i]);
        setEditingIndex(i);
    };

    const handleCancelEdit = () => {
        setCurrentItem(blankItem());
        setEditingIndex(-1);
    };

    const handleDelete = (i) => {
        setItems((p) => p.filter((_, idx) => idx !== i));
        if (editingIndex === i) {
            setCurrentItem(blankItem());
            setEditingIndex(-1);
        }
    };

    // ── Submit — id + updated data ───────────────────────────
    const onSubmit = async () => {
        if (items.length === 0) return;
        try {
            await updateWastage({ id, ...formData, items }).unwrap();
            onClose();
        } catch { }
    };

    if (!open) return null;

    if (isFetching && !wastageData) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
                <div className="bg-(--surface) rounded-2xl p-8 text-(--muted) text-sm">
                    Loading wastage...
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-(--surface) border border-(--border) rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-(--text)">Edit Wastage</h2>
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

                {/* ── Items List ────────────────────────────────── */}
                {items.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-(--text)">
                            Items ({items.length})
                        </h4>

                        {items.map((item, i) => (
                            <div
                                key={i}
                                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border transition ${editingIndex === i
                                        ? "border-cyan-500 bg-cyan-50"
                                        : "border-(--border) bg-(--surface)"
                                    }`}
                            >
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-medium text-(--text)">{getProductName(item.product)}</span>
                                    <span className="text-xs text-(--muted)">
                                        Qty: {item.quantity} {item.unit && `• ${item.unit}`} {item.batchNumber && `• Batch: ${item.batchNumber}`} • {REASONS.find((r) => r.value === item.reason)?.label || item.reason}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button type="button" onClick={() => handleEdit(i)}
                                        className="p-1.5 rounded-lg text-(--muted) hover:text-cyan-600 hover:bg-cyan-50 transition">
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button type="button" onClick={() => handleDelete(i)}
                                        className="p-1.5 rounded-lg text-(--muted) hover:text-red-500 hover:bg-red-50 transition">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Footer ────────────────────────────────────── */}
                <div className="flex justify-end gap-3 pt-2 border-t border-(--border)">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 rounded-xl border border-(--border) text-sm text-(--muted) hover:text-(--text) transition">
                        Cancel
                    </button>
                    <button type="button" onClick={onSubmit}
                        disabled={isLoading || items.length === 0}
                        className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm hover:bg-cyan-700 disabled:opacity-50 transition">
                        {isLoading ? "Updating..." : `Update Wastage (${items.length} items)`}
                    </button>
                </div>

            </div>
        </div>
    );
}
// ─── components/InventoryCreate.jsx ────────────────────────────────────────
import React, { useState } from "react";
import { X, Package } from "lucide-react";
import { toast } from "sonner";
import { toInputDateFormat } from '../../../shared/utilities/date.utility.js';
import { useCreateInventoryMutation, useGetInventoryCategoriesQuery } from "../services/inventory.service.js";

const Field = ({ label, children }) => (
    <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">{label}</label>
        {children}
    </div>
);

const inputCls = "w-full border-2 border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-2)] transition-colors bg-[var(--surface)]";
const selectCls = inputCls + " cursor-pointer";

export default function InventoryCreation({ setVisibility, getInventoryFunc }) {
    const [createInventory, { isLoading: loading }] = useCreateInventoryMutation();
    const { data: categoriesResponse } = useGetInventoryCategoriesQuery();
    const categories = categoriesResponse?.data?.categories || categoriesResponse?.categories || [];

    const [form, setForm] = useState({
        name: "", category: "", description: "", totalQuantity: "",
        purchaseDate: toInputDateFormat(new Date()), vendor: "",
        purchasePrice: "", totalCost: "", invoiceNumber: "", warrantyExpiry: "",
    });

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleCreate = async () => {
        if (!form.name || !form.category) return toast.error("Name and category are required");
        try {
            const result = await createInventory(form).unwrap();
            if (result?.success) {
                await getInventoryFunc("reset");
                setVisibility(false);
            } else toast.error(result?.reason || "Creation failed");
        } catch (error) {
            console.error(error);
            toast.error(error?.data?.reason || "Creation failed");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
            <div className="bg-[var(--surface)] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4 custom-scrollbar">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-[var(--border)] sticky top-0 bg-[var(--surface)] z-10 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--accent-2)]/10 rounded-xl">
                            <Package size={20} className="text-[var(--accent-2)]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[var(--ink)] font-display">Add Inventory Item</h2>
                            <p className="text-xs text-[var(--muted)]">Fill in the details below</p>
                        </div>
                    </div>
                    <button onClick={() => setVisibility(false)} className="p-2 hover:bg-[var(--app-bg)] rounded-xl transition-colors">
                        <X size={18} className="text-[var(--muted)]" />
                    </button>
                </div>

                {/* Form */}
                <div className="px-8 py-6 grid grid-cols-2 gap-5">
                    <div className="col-span-2">
                        <p className="text-xs font-bold text-[var(--accent-2)] uppercase tracking-widest mb-3">Basic Info</p>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Item Name *">
                                <input name="name" value={form.name} onChange={handleChange} className={inputCls} placeholder="e.g. Wooden Chair" />
                            </Field>
                            <Field label="Category *">
                                <select name="category" value={form.category} onChange={handleChange} className={selectCls}>
                                    <option value="">Select Category...</option>
                                    {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                </select>
                            </Field>
                            <Field label="Description">
                                <input name="description" value={form.description} onChange={handleChange} className={inputCls} placeholder="Short description..." />
                            </Field>
                            <Field label="Total Qty">
                                <input type="number" onWheel={e => e.target.blur()} name="totalQuantity" value={form.totalQuantity} onChange={handleChange} className={inputCls} placeholder="0" min="0" />
                            </Field>
                        </div>
                    </div>

                    <div className="col-span-2">
                        <p className="text-xs font-bold text-[var(--accent-2)] uppercase tracking-widest mb-3">Purchase Info</p>
                        <div className="grid grid-cols-3 gap-4">
                            <Field label="Purchase Date">
                                <input type="date" name="purchaseDate" value={form.purchaseDate} onChange={handleChange} className={inputCls} />
                            </Field>
                            <Field label="Vendor / Supplier">
                                <input name="vendor" value={form.vendor} onChange={handleChange} className={inputCls} placeholder="Supplier name" />
                            </Field>
                            <Field label="Purchase Price">
                                <input type="number" onWheel={e => e.target.blur()} name="purchasePrice" value={form.purchasePrice} onChange={handleChange} className={inputCls} placeholder="0" />
                            </Field>
                            <Field label="Total Cost">
                                <input type="number" onWheel={e => e.target.blur()} name="totalCost" value={form.totalCost} onChange={handleChange} className={inputCls} placeholder="0" />
                            </Field>
                            <Field label="Invoice Number">
                                <input name="invoiceNumber" value={form.invoiceNumber} onChange={handleChange} className={inputCls} placeholder="INV-0001" />
                            </Field>
                            <Field label="Warranty Expiry">
                                <input type="date" name="warrantyExpiry" value={form.warrantyExpiry} onChange={handleChange} className={inputCls} />
                            </Field>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-[var(--border)] sticky bottom-0 bg-[var(--surface)] rounded-b-2xl">
                    <button onClick={() => setVisibility(false)} className="px-6 py-2.5 rounded-xl border-2 border-[var(--border)] text-[var(--muted)] font-semibold text-sm hover:bg-[var(--app-bg)] transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleCreate} disabled={loading} className="px-6 py-2.5 rounded-xl bg-[var(--accent-2)] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60">
                        {loading ? "Creating..." : "Create Item"}
                    </button>
                </div>
            </div>
        </div>
    );
}
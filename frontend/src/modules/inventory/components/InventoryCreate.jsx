import React, { useEffect, useState } from "react";
import { X, Package } from "lucide-react";
import api from "@shared/services/axiosInstance.js";
import { toast } from "react-toastify";
import { toInputDateFormat } from '@shared/utilities/date.utility.js'
const CATEGORIES = ["furniture", "electronics", "stationery", "sports", "lab-equipment", "books", "other"];
// const CONDITIONS = ["new", "good", "fair", "poor", "damaged"];
// const STATUSES = ["active", "in-repair", "disposed", "lost"];

function Field({ label, children }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
            {children}
        </div>
    );
}

const inputCls = "w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-cyan-400 transition-colors bg-white";
const selectCls = inputCls + " cursor-pointer";

export default function InventoryCreation({ setVisibility, getInventoryFunc }) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: "", category: "",
        description: "", totalQuantity: "", availableQuantity: "", inUseQuantity: "",
        damagedQuantity: "", minimumThreshold: "", assignedTo: "",
        location: { room: "", building: "" },
        purchaseDate: toInputDateFormat(new Date()), vendor: "", purchasePrice: "", totalCost: "",
        invoiceNumber: "", warrantyExpiry: "", condition: "new",
        lastInspectionDate: "", nextMaintenanceDate: "",
        status: "active", disposalDate: "", disposalReason: "",
    });
    const [inventoryCategories, setInventoryCategories] = useState([]);




    async function getCategories() {
        try {
            setLoading(true);
            const res = await api.get("/inventoryRoutes/getAllInventoryCatagory");
            if (res.data?.success) setInventoryCategories(res.data.categories || []);
            else setInventoryCategories([]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }





    useEffect(() => { getCategories() }, [])




    function handleChange(e) {
        const { name, value } = e.target;
        if (name === "room" || name === "building") {
            setForm(prev => ({ ...prev, location: { ...prev.location, [name]: value } }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    }

    async function handleCreate() {
        try {
            if (!form.name || !form.category) return toast.error("Name and category are required");
            setLoading(true);
            const res = await api.post("/inventoryRoutes/inventoryCreate", form);
            if (res.data?.success) {
                await getInventoryFunc("reset");
                setVisibility(false);
            } else {
                toast.error(res.data?.reason || "Creation failed");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4">

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-50 rounded-xl">
                            <Package size={20} className="text-cyan-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Add Inventory Item</h2>
                            <p className="text-xs text-slate-400">Fill in the details below</p>
                        </div>
                    </div>
                    <button onClick={() => setVisibility(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X size={18} className="text-slate-500" />
                    </button>
                </div>

                <div className="px-8 py-6 grid grid-cols-2 gap-5">

                    {/* Basic Info */}
                    <div className="col-span-2">
                        <p className="text-xs font-bold text-cyan-600 uppercase tracking-widest mb-3">Basic Info</p>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Item Name *">
                                <input name="name" value={form.name} onChange={handleChange} className={inputCls} placeholder="e.g. Wooden Chair" />
                            </Field>
                            {/* <Field label="Item Code">
                                <input name="itemCode" value={form.itemCode} onChange={handleChange} className={inputCls} placeholder="e.g. CHR-001" />
                            </Field> */}
                            <Field label="Category *">
                                <select name="category" value={form.category} onChange={handleChange} className={selectCls}>
                                    <option value="">Select Category....</option>
                                    {inventoryCategories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                </select>
                            </Field>
                            {/* <Field label="Type">
                                <select name="type" value={form.type} onChange={handleChange} className={selectCls}>
                                    <option value="non-consumable">Non-Consumable</option>
                                    <option value="consumable">Consumable</option>
                                </select>
                            </Field> */}
                            <Field label="Description">
                                <input name="description" value={form.description} onChange={handleChange} className={inputCls} placeholder="Short description..." />
                            </Field>
                            {/* <Field label="Assigned To">
                                <input name="assignedTo" value={form.assignedTo} onChange={handleChange} className={inputCls} placeholder="e.g. Class 10A / Science Lab" />
                            </Field> */}

                            <div className="flex flex-wrap gap-4">
                                {[
                                    ["totalQuantity", "Total Qty"],
                                    // ["availableQuantity", "Available Qty"],
                                    // ["inUseQuantity", "In-Use Qty"],
                                    // ["damagedQuantity", "Damaged Qty"],
                                    // ["minimumThreshold", "Min. Threshold"],
                                ].map(([name, label]) => (
                                    <Field key={name} label={label}>
                                        <input type="number"
                                            onWheel={(e) => e.target.blur()} name={name} value={form[name]} onChange={handleChange} className={inputCls} placeholder="0" min="0" />
                                    </Field>
                                ))}
                            </div>



                        </div>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-2">
                        {/* <p className="text-xs font-bold text-cyan-600 uppercase tracking-widest mb-3">Quantity</p> */}

                    </div>

                    {/* Location */}
                    {/* <div className="col-span-2">
                        <p className="text-xs font-bold text-cyan-600 uppercase tracking-widest mb-3">Location</p>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Room / Lab">
                                <input name="room" value={form.location.room} onChange={handleChange} className={inputCls} placeholder="e.g. Room 5, Lab B" />
                            </Field>
                            <Field label="Building / Floor">
                                <input name="building" value={form.location.building} onChange={handleChange} className={inputCls} placeholder="e.g. Block A, Floor 2" />
                            </Field>
                        </div>
                    </div> */}

                    {/* Purchase Info */}
                    <div className="col-span-2">
                        <p className="text-xs font-bold text-cyan-600 uppercase tracking-widest mb-3">Purchase Info</p>
                        <div className="grid grid-cols-3 gap-4">
                            <Field label="Purchase Date">
                                <input type="date" name="purchaseDate" value={form.purchaseDate} onChange={handleChange} className={inputCls} />
                            </Field>
                            <Field label="Vendor / Supplier">
                                <input name="vendor" value={form.vendor} onChange={handleChange} className={inputCls} placeholder="Supplier name" />
                            </Field>
                            <Field label="Purchase Price">
                                <input type="number"
                                    onWheel={(e) => e.target.blur()} name="purchasePrice" value={form.purchasePrice} onChange={handleChange} className={inputCls} placeholder="0" />
                            </Field>
                            <Field label="Total Cost">
                                <input type="number"
                                    onWheel={(e) => e.target.blur()} name="totalCost" value={form.totalCost} onChange={handleChange} className={inputCls} placeholder="0" />
                            </Field>
                            <Field label="Invoice Number">
                                <input name="invoiceNumber" value={form.invoiceNumber} onChange={handleChange} className={inputCls} placeholder="INV-0001" />
                            </Field>
                            <Field label="Warranty Expiry">
                                <input type="date" name="warrantyExpiry" value={form.warrantyExpiry} onChange={handleChange} className={inputCls} />
                            </Field>
                        </div>
                    </div>

                    {/* Condition & Status */}
                    {/* <div className="col-span-2">
                        <p className="text-xs font-bold text-cyan-600 uppercase tracking-widest mb-3">Condition & Status</p>
                        <div className="grid grid-cols-3 gap-4">
                            <Field label="Condition">
                                <select name="condition" value={form.condition} onChange={handleChange} className={selectCls}>
                                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </Field>
                            <Field label="Status">
                                <select name="status" value={form.status} onChange={handleChange} className={selectCls}>
                                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </Field>
                            <Field label="Last Inspection">
                                <input type="date" name="lastInspectionDate" value={form.lastInspectionDate} onChange={handleChange} className={inputCls} />
                            </Field>
                            <Field label="Next Maintenance">
                                <input type="date" name="nextMaintenanceDate" value={form.nextMaintenanceDate} onChange={handleChange} className={inputCls} />
                            </Field>
                            <Field label="Disposal Date">
                                <input type="date" name="disposalDate" value={form.disposalDate} onChange={handleChange} className={inputCls} />
                            </Field>
                            <Field label="Disposal Reason">
                                <input name="disposalReason" value={form.disposalReason} onChange={handleChange} className={inputCls} placeholder="If disposed..." />
                            </Field>
                        </div>
                    </div> */}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-slate-100 sticky bottom-0 bg-white rounded-b-2xl">
                    <button onClick={() => setVisibility(false)} className="px-6 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={loading}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-semibold text-sm shadow hover:opacity-90 transition-opacity disabled:opacity-60"
                    >
                        {loading ? "Creating..." : "Create Item"}
                    </button>
                </div>
            </div>
        </div>
    );
}
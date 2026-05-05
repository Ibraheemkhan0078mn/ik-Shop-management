import React, { useEffect, useState } from "react";
import { X, PlusCircle, Pencil, Trash2, Tag, Check } from "lucide-react";
import api from "../../../services/axiosInstance.js";
import { toast } from "react-toastify";

// ── Small inline create/edit form ────────────────────────────────────────────
function CategoryForm({ initialValue = "", onSubmit, onCancel, loading }) {
    const [name, setName] = useState(initialValue);

    return (
        <div className="flex items-center gap-2 p-3 bg-slate-50 border-2 border-cyan-200 rounded-xl">
            <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") onSubmit(name); if (e.key === "Escape") onCancel(); }}
                className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400 transition-colors bg-white"
                placeholder="Category name..."
            />
            <button
                onClick={() => onSubmit(name)}
                disabled={loading || !name.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
                <Check size={14} />
                {loading ? "Saving..." : "Save"}
            </button>
            <button
                onClick={onCancel}
                className="p-2 rounded-xl hover:bg-slate-200 transition-colors text-slate-500"
            >
                <X size={14} />
            </button>
        </div>
    );
}

// ── Each category row ────────────────────────────────────────────────────────
function EachCategoryRow({ category, onDeleteDone, onUpdateDone }) {
    const [editMode, setEditMode] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    async function handleUpdate(name) {
        try {
            if (!name?.trim()) return;
            setUpdateLoading(true);
            const res = await api.put(`/inventoryRoutes/inventoryCatagUpdate/${category._id}`, { name });
            if (res.data?.success) {
                onUpdateDone(category._id, name.trim());
                setEditMode(false);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setUpdateLoading(false);
        }
    }

    async function handleDelete() {
        try {
            setDeleteLoading(true);
            const res = await api.delete(`/inventoryRoutes/inventoryCatagDelete/${category._id}`);
            if (res.data?.success) onDeleteDone(category._id);
        } catch (error) {
            console.error(error);
        } finally {
            setDeleteLoading(false);
        }
    }

    if (editMode) {
        return (
            <div className="border-b border-slate-100 py-2">
                <CategoryForm
                    initialValue={category.name}
                    onSubmit={handleUpdate}
                    onCancel={() => setEditMode(false)}
                    loading={updateLoading}
                />
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between border-b border-slate-100 hover:bg-slate-50 transition-colors duration-100 py-3 px-4">
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-cyan-50 rounded-lg">
                    <Tag size={13} className="text-cyan-600" />
                </div>
                <span className="text-sm font-semibold text-slate-700">{category.name}</span>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setEditMode(true)}
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                >
                    <Pencil size={14} />
                </button>
                <button
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors disabled:opacity-50"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function InventoryCategory({ setVisibility }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [createFormOpen, setCreateFormOpen] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);

    async function getCategories() {
        try {
            setLoading(true);
            const res = await api.get("/inventoryRoutes/getAllInventoryCatagory");
            if (res.data?.success) setCategories(res.data.categories || []);
            else setCategories([]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { getCategories(); }, []);

    async function handleCreate(name) {
        try {
            if (!name?.trim()) return;
            setCreateLoading(true);
            const res = await api.post("/inventoryRoutes/inventoryCatagCreate", { name });
            if (res.data?.success) {
                setCategories(prev => [res.data.category, ...prev]);
                setCreateFormOpen(false);
            } else {
                toast.error(res?.data?.reason || res?.data?.msg)
            }
        } catch (error) {
            console.error(error);
        } finally {
            setCreateLoading(false);
        }
    }

    function handleUpdateDone(id, newName) {
        setCategories(prev =>
            prev.map(c => c._id === id ? { ...c, name: newName } : c)
        );
    }

    function handleDeleteDone(id) {
        setCategories(prev => prev.filter(c => c._id !== id));
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[85vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-50 rounded-xl">
                            <Tag size={18} className="text-cyan-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Inventory Categories</h2>
                            <p className="text-xs text-slate-400">{categories.length} categories</p>
                        </div>
                    </div>
                    <button onClick={() => setVisibility(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X size={18} className="text-slate-500" />
                    </button>
                </div>

                {/* Add button + create form */}
                <div className="px-6 py-4 border-b border-slate-100">
                    {!createFormOpen ? (
                        <button
                            onClick={() => setCreateFormOpen(true)}
                            className="flex items-center gap-2 w-full justify-center bg-gradient-to-r from-cyan-600 to-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm shadow hover:opacity-90 transition-opacity"
                        >
                            <PlusCircle size={15} />
                            Add Category
                        </button>
                    ) : (
                        <CategoryForm
                            onSubmit={handleCreate}
                            onCancel={() => setCreateFormOpen(false)}
                            loading={createLoading}
                        />
                    )}
                </div>

                {/* Categories list */}
                <div className="overflow-y-auto flex-1 px-2 py-2">
                    {loading ? (
                        <div className="flex justify-center items-center h-32 text-slate-400 text-sm">
                            Loading categories...
                        </div>
                    ) : categories.length < 1 ? (
                        <div className="flex flex-col justify-center items-center h-32 gap-2 text-slate-400 text-sm">
                            <Tag size={28} className="text-slate-200" />
                            No categories yet
                        </div>
                    ) : (
                        categories.map(category => (
                            <EachCategoryRow
                                key={category._id}
                                category={category}
                                onUpdateDone={handleUpdateDone}
                                onDeleteDone={handleDeleteDone}
                            />
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}
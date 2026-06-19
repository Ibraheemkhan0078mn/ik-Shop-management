import React, { useEffect, useMemo, useRef, useState } from "react";
import InventoryCreation from "../components/InventoryCreate.jsx";
import InventoryUpdate from "../components/InventoryUpdate.jsx";
import { PlusCircle, Search, Pencil, Trash2, Package, AlertTriangle, CassetteTape } from "lucide-react";
import ScreenTabButton from "@shared/components/ScreenTabButton.jsx";
import InventoryCategory from "../components/InventoryCategory.jsx";
import ConfirmDialog from "@shared/components/ConfirmationDialog.jsx";
import api from "@shared/services/api.js";
import {
    useDeleteInventoryMutation,
    useGetInventoryCategoriesQuery,
    useLazyGetInventoryListQuery,
} from "../services/inventory.service.js";

const CATEGORIES = ["all", "furniture", "electronics", "stationery", "sports", "lab-equipment", "books", "other"];
const STATUSES = ["all", "active", "in-repair", "disposed", "lost"];

const CONDITION_META = {
    new: { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
    good: { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
    fair: { color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" },
    poor: { color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" },
    damaged: { color: "text-red-500", bg: "bg-red-50", border: "border-red-200" },
};

const STATUS_META = {
    active: { color: "text-emerald-600", bg: "bg-emerald-50" },
    "in-repair": { color: "text-yellow-600", bg: "bg-yellow-50" },
    disposed: { color: "text-slate-500", bg: "bg-slate-100" },
    lost: { color: "text-red-500", bg: "bg-red-50" },
};

function EachInventoryRow({ item, onEdit, onDelete }) {
    const condMeta = CONDITION_META[item?.condition] || CONDITION_META["good"];
    const statusMeta = STATUS_META[item?.status] || STATUS_META["active"];
    const isLow = item?.availableQuantity <= item?.minimumThreshold && item?.minimumThreshold > 0;

    return (
        <div className="flex justify-between items-center w-full border-b border-slate-100 hover:bg-slate-50 transition-colors duration-100 py-3 px-2">
            {/* Name + code */}
            <div className="w-[22%] px-4">
                <p className="text-sm font-semibold text-slate-700 truncate">{item?.name}</p>
                {item?.itemCode && <p className="text-xs font-mono text-slate-400">{item.itemCode}</p>}
            </div>

            {/* Category */}
            <div className="w-[13%] px-4 text-center">
                <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200 capitalize">
                    {item?.category}
                </span>
            </div>

            {/* Quantity */}
            {/* <div className="w-[15%] px-4 text-center">
                <div className="flex items-center justify-center gap-1">
                    <span className="text-sm font-bold text-slate-700">{item?.availableQuantity}</span>
                    <span className="text-xs text-slate-400">/ {item?.totalQuantity}</span>
                    {isLow && <AlertTriangle size={12} className="text-orange-500 ml-1" title="Low stock!" />}
                </div>
            </div> */}

            {/* Condition */}
            {/* <div className="w-[11%] px-4 text-center">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${condMeta.bg} ${condMeta.color} ${condMeta.border}`}>
                    {item?.condition}
                </span>
            </div> */}

            {/* Status */}
            {/* <div className="w-[10%] px-4 text-center">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusMeta.bg} ${statusMeta.color}`}>
                    {item?.status}
                </span>
            </div> */}

            {/* Location */}
            {/* <div className="w-[14%] px-4 text-center">
                <span className="text-xs text-slate-400 truncate block">
                    {item?.location?.room || item?.assignedTo || "—"}
                </span>
            </div> */}

            {/* Purchase price */}
            <div className="w-[10%] px-4 text-center">
                <span className="text-xs text-slate-600 font-semibold">
                    {item?.purchasePrice ? `PKR ${item.purchasePrice.toLocaleString()}` : "—"}
                </span>
            </div>

            {/* Actions */}
            <div className="w-[10%] px-4 flex items-center justify-center gap-2">
                <button onClick={() => onEdit(item)}
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors">
                    <Pencil size={14} />
                </button>
                <ConfirmDialog onConfirm={() => { onDelete(item._id) }} message="Are you want to delete Inventory Record?">
                    <button
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                        <Trash2 size={14} />
                    </button>
                </ConfirmDialog>
            </div>
        </div>
    );
}

export default function Inventory() {
    const pageRef = useRef();
    const skipRef = useRef(0);
    const limit = 20;

    const [inventoryData, setInventoryData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleteInventory] = useDeleteInventoryMutation();
    const [hasMore, setHasMore] = useState(true);
    const [totalInventory, setTotalInventory] = useState(0);
    const [creationVisibility, setCreationVisibility] = useState(false);
    const [updateVisibility, setUpdateVisibility] = useState(false);
    const [currentToUpdateItem, setCurrentToUpdateItem] = useState(null);
    const [categoryVisibility, setCategoryVisibility] = useState(false);

    // filter state
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const appliedFilters = useRef({ search: "", category: "all", status: "all" });
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




    async function getInventory(origin) {
        try {
            if (loading && origin !== "reset") return;
            if (origin === "reset") { skipRef.current = 0; setHasMore(true); setInventoryData([]); }
            setLoading(true);

            const skipTo = origin === "reset" ? 0 : skipRef.current;
            const f = appliedFilters.current;

            const res = await api.post(`/inventoryRoutes/getAllInventory/${skipTo}/${limit}`, {
                category: f.category,
                status: f.status,
                search: f.search,
            });

            if (res.data?.success) {
                const incoming = res.data.inventory || [];
                setTotalInventory(res.data.totalInventory || 0);

                if (origin === "reset") {
                    setInventoryData(incoming);
                    skipRef.current = incoming.length;
                } else {
                    setInventoryData(prev => [...prev, ...incoming]);
                    skipRef.current = skipRef.current + incoming.length;
                }
                if (incoming.length < limit) setHasMore(false);
            } else {
                if (origin === "reset") setInventoryData([]);
                setHasMore(false);
            }
        } catch (error) {
            console.error(error);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { getInventory("reset"); }, []);

    function handleSearch() {
        appliedFilters.current = { search, category: filterCategory, status: filterStatus };
        getInventory("reset");
    }


    useEffect(() => {
        if (search || filterCategory || filterStatus) {
            handleSearch()
        }
    }, [search, filterCategory, filterStatus])

    function handleScroll() {
        const container = pageRef.current;
        if (!container) return;
        const nearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
        if (nearBottom && !loading && hasMore) getInventory("scroll");
    }

    async function handleDelete(id) {
        try {
            const res = await deleteInventory(id).unwrap();
            if (res?.success) getInventory("reset");
        } catch (error) { console.error(error); }
    }

    function handleEdit(item) {
        setCurrentToUpdateItem(item);
        setUpdateVisibility(true);
    }

    return (
        <div className="h-full overflow-hidden relative flex">
            {/* <Navbar /> */}

            {creationVisibility && (
                <InventoryCreation
                    setVisibility={setCreationVisibility}
                    getInventoryFunc={getInventory}
                />
            )}

            {updateVisibility && (
                <InventoryUpdate
                    setVisibility={setUpdateVisibility}
                    itemData={currentToUpdateItem}
                    getInventoryFunc={getInventory}
                />
            )}


            {
                categoryVisibility && (
                    <InventoryCategory
                        setVisibility={setCategoryVisibility}
                    />
                )
            }

            <div
                ref={pageRef}
                onWheel={(e) => { pageRef.current.scrollTop += e.deltaY; }}
                onScroll={handleScroll}
                className="h-screen overflow-y-scroll flex-1 p-10 font-sans"
            >
                {/* Header */}
                <div className="mb-8">
                    <h1 className="w-max bg-gradient-to-r from-cyan-600 to-blue-800 bg-clip-text text-4xl font-bold text-transparent">
                        Inventory
                    </h1>
                    <p className="text-slate-500 text-lg font-medium">
                        All school assets and resources are managed here.
                        {totalInventory > 0 && (
                            <span className="ml-2 text-sm text-cyan-600 font-semibold">{totalInventory.toLocaleString()} items</span>
                        )}
                    </p>
                </div>

                {/* Controls */}
                <div className="flex  items-center gap-4 px-2 flex-wrap mb-4">
                    <div onClick={() => setCreationVisibility(true)}>
                        <ScreenTabButton text={"Add Item"} lucideIcon={PlusCircle} />
                    </div>


                    <div onClick={() => setCategoryVisibility(true)}>
                        <ScreenTabButton text={"Category"} lucideIcon={CassetteTape} />
                    </div>

                    {/* Category filter */}
                    <select
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                        className="border-2 border-slate-200 bg-white shadow-sm text-zinc-700 p-2.5 px-4 rounded-xl font-semibold text-sm outline-none focus:border-cyan-400 transition-colors cursor-pointer capitalize"
                    >
                        {inventoryCategories.map(c => <option key={c._id} value={c.name} className="capitalize">{c.name}</option>)}
                    </select>

                    {/* Status filter */}
                    {/* <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="border-2 border-slate-200 bg-white shadow-sm text-zinc-700 p-2.5 px-4 rounded-xl font-semibold text-sm outline-none focus:border-cyan-400 transition-colors cursor-pointer"
                    >
                        {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select> */}

                    {/* Search */}
                    <div className="flex items-center gap-2 bg-white border-2 border-slate-200 shadow-sm text-zinc-700 p-2.5 px-5 rounded-xl font-semibold focus-within:border-cyan-400 transition-colors flex-1 min-w-[200px]">
                        <input
                            value={search}
                            type="text"
                            className="flex-1 focus:ring-0 outline-0 border-0 text-sm"
                            placeholder="Search name, code, vendor..."
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
                        />
                    </div>

                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-700 text-white p-2.5 px-6 rounded-xl font-semibold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60 text-sm"
                    >
                        <Search size={14} /> Search
                    </button>
                </div>

                {/* Table header */}
                <div className="flex justify-between w-full border-b mt-8 border-gray-600 bg-slate-100 font-semibold text-slate-700 rounded-t-lg">
                    <div className="w-[22%] px-5 py-3 text-sm">Item</div>
                    <div className="w-[13%] px-5 py-3 text-center text-sm">Category</div>
                    {/* <div className="w-[15%] px-5 py-3 text-center text-sm">Qty (Avail / Total)</div> */}
                    {/* <div className="w-[11%] px-5 py-3 text-center text-sm">Condition</div> */}
                    {/* <div className="w-[10%] px-5 py-3 text-center text-sm">Status</div> */}
                    {/* <div className="w-[14%] px-5 py-3 text-center text-sm">Location</div> */}
                    <div className="w-[10%] px-5 py-3 text-center text-sm">Price</div>
                    <div className="w-[10%] px-5 py-3 text-center text-sm">Actions</div>
                </div>

                {/* Rows */}
                {inventoryData.length < 1 ? (
                    <div className="text-gray-600 h-[50vh] w-full flex flex-col justify-center items-center gap-3">
                        <Package size={40} className="text-slate-300" />
                        <span>{loading ? "Loading inventory..." : "No inventory items found"}</span>
                    </div>
                ) : (
                    <div className="w-full">
                        {inventoryData.map((item, index) => (
                            <EachInventoryRow
                                key={item._id || index}
                                item={item}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                        {loading && (
                            <div className="w-full py-4 text-center text-gray-500 text-sm">Loading more...</div>
                        )}
                        {!hasMore && inventoryData.length > 0 && (
                            <div className="w-full py-4 text-center text-slate-400 text-xs">— All items loaded —</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}


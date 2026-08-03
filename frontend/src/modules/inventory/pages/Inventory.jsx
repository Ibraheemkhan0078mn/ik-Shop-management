// ─── pages/Inventory.jsx ────────────────────────────────────────────────────
import React, { useRef, useState, useEffect } from "react";
import InventoryCreation from "../components/InventoryCreate.jsx";
import InventoryUpdate from "../components/InventoryUpdate.jsx";
import { PlusCircle, Search, Pencil, Trash2, Package, CassetteTape } from "lucide-react";
import InventoryCategory from "../components/InventoryCategory.jsx";
import ConfirmDialog from "../../../shared/components/ConfirmationDialog.jsx";
import api from "../../../shared/services/api.js";
import { useDeleteInventoryMutation } from "../services/inventory.service.js";

// ─── Constants ──────────────────────────────────────────────────────────────
const limit = 20;

// ─── Row Component ──────────────────────────────────────────────────────────
const InventoryRow = ({ item, onEdit, onDelete }) => (
  <div className="flex justify-between items-center w-full border-b border-[var(--border)] hover:bg-[var(--app-bg)] transition-colors py-3 px-2">
    <div className="w-[22%] px-4">
      <p className="text-sm font-semibold text-[var(--ink)] truncate">{item?.name}</p>
      {item?.itemCode && <p className="text-xs font-mono text-[var(--muted)]">{item.itemCode}</p>}
    </div>
    <div className="w-[13%] px-4 text-center">
      <span className="text-xs font-mono bg-[var(--app-bg)] text-[var(--muted)] px-2.5 py-1 rounded-md border border-[var(--border)] capitalize">
        {item?.category}
      </span>
    </div>
    <div className="w-[10%] px-4 text-center">
      <span className="text-xs text-[var(--muted)] font-semibold">
        {item?.purchasePrice ? `PKR ${item.purchasePrice.toLocaleString()}` : "—"}
      </span>
    </div>
    <div className="w-[10%] px-4 flex items-center justify-center gap-2">
      <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg hover:bg-[var(--app-bg)] text-[var(--muted)] hover:text-[var(--accent-2)] transition-colors">
        <Pencil size={14} />
      </button>
      <ConfirmDialog onConfirm={() => onDelete(item._id)} message="Are you sure you want to delete this inventory record?">
        <button className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--muted)] hover:text-red-500 transition-colors">
          <Trash2 size={14} />
        </button>
      </ConfirmDialog>
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Inventory() {
  const pageRef = useRef();
  const skipRef = useRef(0);

  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalInventory, setTotalInventory] = useState(0);
  const [creationVisible, setCreationVisible] = useState(false);
  const [updateVisible, setUpdateVisible] = useState(false);
  const [categoryVisible, setCategoryVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [inventoryCategories, setInventoryCategories] = useState([]);
  const [deleteInventory] = useDeleteInventoryMutation();

  // ── Get Categories ──────────────────────────────────────────────────────
  const getCategories = async () => {
    try {
      const res = await api.get("/inventoryRoutes/getAllInventoryCatagory");
      if (res.data?.success) setInventoryCategories(res.data.categories || []);
    } catch (error) { console.error(error); }
  };
  useEffect(() => { getCategories(); }, []);

  // ── Get Inventory ──────────────────────────────────────────────────────
  const getInventory = async (origin) => {
    if (loading && origin !== "reset") return;
    if (origin === "reset") { skipRef.current = 0; setHasMore(true); setInventoryData([]); }

    setLoading(true);
    try {
      const skipTo = origin === "reset" ? 0 : skipRef.current;
      const res = await api.post(`/inventoryRoutes/getAllInventory/${skipTo}/${limit}`, {
        category: filterCategory,
        search: search,
      });

      if (res.data?.success) {
        const incoming = res.data.inventory || [];
        setTotalInventory(res.data.totalInventory || 0);

        if (origin === "reset") {
          setInventoryData(incoming);
          skipRef.current = incoming.length;
        } else {
          setInventoryData(prev => [...prev, ...incoming]);
          skipRef.current += incoming.length;
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
  };

  useEffect(() => { getInventory("reset"); }, [filterCategory, search]);

  // ── Scroll Handler ──────────────────────────────────────────────────────
  const handleScroll = () => {
    const container = pageRef.current;
    if (!container) return;
    const nearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
    if (nearBottom && !loading && hasMore) getInventory("scroll");
  };

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      const res = await deleteInventory(id).unwrap();
      if (res?.success) getInventory("reset");
    } catch (error) { console.error(error); }
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    setUpdateVisible(true);
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="h-full overflow-hidden relative flex bg-[var(--app-bg)]">
      {creationVisible && <InventoryCreation setVisibility={setCreationVisible} getInventoryFunc={getInventory} />}
      {updateVisible && <InventoryUpdate setVisibility={setUpdateVisible} itemData={currentItem} getInventoryFunc={getInventory} />}
      {categoryVisible && <InventoryCategory setVisibility={setCategoryVisible} />}

      <div
        ref={pageRef}
        onScroll={handleScroll}
        className="h-screen overflow-y-scroll flex-1 p-10 font-sans custom-scrollbar"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="w-max bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent)] bg-clip-text text-4xl font-bold text-transparent font-display">
            Inventory
          </h1>
          <p className="text-[var(--muted)] text-lg font-medium">
            All school assets and resources are managed here.
            {totalInventory > 0 && (
              <span className="ml-2 text-sm text-[var(--accent-2)] font-semibold">{totalInventory.toLocaleString()} items</span>
            )}
          </p>
        </div>

        {/* Controls - Using theme buttons */}
        <div className="flex items-center gap-4 px-2 flex-wrap mb-4">
          <button
            onClick={() => setCreationVisible(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)] font-medium text-sm hover:bg-[var(--app-bg)] transition-all shadow-sm hover:shadow-md"
          >
            <PlusCircle size={16} className="text-[var(--accent-2)]" />
            Add Item
          </button>

          <button
            onClick={() => setCategoryVisible(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)] font-medium text-sm hover:bg-[var(--app-bg)] transition-all shadow-sm hover:shadow-md"
          >
            <CassetteTape size={16} className="text-[var(--accent-2)]" />
            Category
          </button>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] px-4 py-2 rounded-full font-medium text-sm outline-none focus:border-[var(--accent-2)] transition-colors cursor-pointer shadow-sm"
          >
            {inventoryCategories.map(c => (
              <option key={c._id} value={c.name} className="capitalize">{c.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] shadow-sm px-5 py-2 rounded-full font-medium focus-within:border-[var(--accent-2)] transition-colors flex-1 min-w-[200px]">
            <Search size={16} className="text-[var(--muted)]" />
            <input
              value={search}
              type="text"
              className="flex-1 focus:ring-0 outline-none border-0 text-sm bg-transparent text-[var(--ink)] placeholder:text-[var(--muted)]"
              placeholder="Search name, code, vendor..."
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table Header */}
        <div className="flex justify-between w-full border-b border-[var(--border)] bg-[var(--surface)] font-semibold text-[var(--muted)] rounded-t-lg">
          <div className="w-[22%] px-5 py-3 text-sm">Item</div>
          <div className="w-[13%] px-5 py-3 text-center text-sm">Category</div>
          <div className="w-[10%] px-5 py-3 text-center text-sm">Price</div>
          <div className="w-[10%] px-5 py-3 text-center text-sm">Actions</div>
        </div>

        {/* Rows */}
        {inventoryData.length < 1 ? (
          <div className="text-[var(--muted)] h-[50vh] w-full flex flex-col justify-center items-center gap-3">
            <Package size={40} className="text-[var(--border)]" />
            <span>{loading ? "Loading inventory..." : "No inventory items found"}</span>
          </div>
        ) : (
          <div className="w-full bg-[var(--surface)] rounded-b-lg border border-[var(--border)] border-t-0">
            {inventoryData.map((item, index) => (
              <InventoryRow
                key={item._id || index}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
            {loading && (
              <div className="w-full py-4 text-center text-[var(--muted)] text-sm">Loading more...</div>
            )}
            {!hasMore && inventoryData.length > 0 && (
              <div className="w-full py-4 text-center text-[var(--muted)] text-xs">— All items loaded —</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
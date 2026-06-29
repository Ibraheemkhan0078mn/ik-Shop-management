// features/products/pages/Products.jsx
import { useState, useCallback } from "react";
import { Edit, Trash2, AlertTriangle, PackageX, Filter, Package } from "lucide-react";
import { useDeleteProduct, useDeleteProductWithBatches, useProducts } from "../services/product.service.js";
import { useUser } from "../../auth/services/auth.service.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import ProductCRUDModal from "../components/ProductCRUDModal.jsx";
import ProductFilterPanel from "../components/ProductFilterPanel.jsx";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";

const IMAGE_BASE = "http://localhost:5001/uploads";

const PlaceholderImg = ({ size = 12 }) => (
    <div className={`w-${size} h-${size} rounded-xl bg-(--surface-muted) flex items-center justify-center`}>
        <Package className="w-5 h-5 text-(--muted)" strokeWidth={1.5} />
    </div>
);

const StockBadge = ({ qty }) => (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ background: qty > 0 ? "rgba(15,118,110,0.12)" : "rgba(100,100,100,0.1)", color: qty > 0 ? "var(--accent-2)" : "var(--muted)" }}>
        {qty ?? 0}
    </span>
);

const StatusBadge = ({ active }) => (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${active ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"}`}>
        {active ? "Active" : "Inactive"}
    </span>
);

const IconBtn = ({ onClick, icon: Icon, hoverClass }) => (
    <button onClick={onClick}
        className={`p-2 rounded-lg bg-(--surface-muted) border border-(--border) transition-all duration-150 hover:scale-105 ${hoverClass}`}>
        <Icon size={15} />
    </button>
);

export default function Products() {
    const { data: userQuery } = useUser();
    const [deleteProduct] = useDeleteProduct();
    const [deleteProductWithBatches] = useDeleteProductWithBatches();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create");
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [filterPanelOpen, setFilterPanelOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [uniqueBrands] = useState([]);

    const language = userQuery?.data?.language ?? userQuery?.language ?? "en";
    const isEn = language === "en";

    const handleFiltersChange = useCallback((f) => { setActiveFilters(f); setCurrentPage(1); }, []);
    const openEdit = (id) => { setSelectedProductId(id); setModalMode("update"); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setModalMode("create"); setSelectedProductId(null); };
    const openDeleteConfirm = (item) => setDeleteTarget({ id: item._id, name: item.name, step: "confirm", batchCount: 0 });

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await deleteProduct(deleteTarget.id).unwrap();
            showSuccess("Product deleted successfully");
            setDeleteTarget(null);
        } catch (err) {
            if (err?.data?.code === "PRODUCT_HAS_BATCHES") {
                setDeleteTarget((p) => ({ ...p, step: "withBatches", batchCount: err.data.batchCount || 0 }));
            } else {
                showError(err?.data?.message || "Failed to delete product");
                setDeleteTarget(null);
            }
        }
        setDeleteLoading(false);
    };

    const handleConfirmHardDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await deleteProductWithBatches(deleteTarget.id).unwrap();
            showSuccess("Product and all batches deleted");
            setDeleteTarget(null);
        } catch (err) {
            showError(err?.data?.message || "Failed to delete");
            setDeleteTarget(null);
        }
        setDeleteLoading(false);
    };

    const renderItems = (items) => {
        if (!items?.length) return null;
        return (
            <div className="flex flex-col gap-0">
                {/* Desktop header */}
                <div className="hidden md:grid md:grid-cols-12 gap-3 px-5 py-3 rounded-t-2xl text-xs font-bold uppercase tracking-wider"
                    style={{ background: "var(--surface-muted)", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                    <div className="col-span-1">Image</div>
                    <div className="col-span-2">Name</div>
                    <div className="col-span-2">Code</div>
                    <div className="col-span-2">Barcode</div>
                    <div className="col-span-1">Price</div>
                    <div className="col-span-1">Stock</div>
                    <div className="col-span-1">Category</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-1">Actions</div>
                </div>

                {/* Desktop rows */}
                {items.map((item, i) => (
                    <div key={item._id}
                        className="hidden md:grid md:grid-cols-12 gap-3 px-5 py-3.5 items-center transition-all duration-150 hover:bg-(--surface-muted) group"
                        style={{ background: i % 2 === 0 ? "var(--surface)" : "rgba(255,250,243,0.6)", borderBottom: "1px solid var(--border)" }}>
                        <div className="col-span-1">
                            {item.image
                                ? <img src={`${IMAGE_BASE}/${item.image}`} alt={item.name} className="w-11 h-11 rounded-xl object-cover ring-1 ring-(--border) group-hover:ring-(--accent-2) transition-all" />
                                : <PlaceholderImg size={11} />}
                        </div>
                        <div className="col-span-2 font-semibold text-(--ink) truncate text-sm">{item.name}</div>
                        <div className="col-span-2 text-sm text-(--muted) font-mono">{item.productCode || "—"}</div>
                        <div className="col-span-2 text-sm text-(--muted) font-mono">{item.barcode || "—"}</div>
                        <div className="col-span-1 text-sm font-semibold text-(--ink)">{item.defaultRetailPrice ?? 0}</div>
                        <div className="col-span-1"><StockBadge qty={item.currentStockLevel} /></div>
                        <div className="col-span-1 text-xs text-(--muted) truncate">
                            {item.category?.name}{item.subCategory?.name && <span className="text-(--muted)/50"> › {item.subCategory.name}</span>}
                        </div>
                        <div className="col-span-1"><StatusBadge active={item.isActive} /></div>
                        <div className="col-span-1 flex items-center gap-1.5">
                            <IconBtn onClick={() => openEdit(item._id)} icon={Edit} hoverClass="hover:border-(--accent-2) hover:text-(--accent-2)" />
                            <IconBtn onClick={() => openDeleteConfirm(item)} icon={Trash2} hoverClass="hover:border-red-400 hover:text-red-500" />
                        </div>
                    </div>
                ))}

                {/* Mobile cards */}
                <div className="md:hidden flex flex-col gap-3 pt-1">
                    {items.map((item) => (
                        <div key={`m-${item._id}`} className="rounded-2xl p-4 border transition-all duration-150 hover:shadow-md"
                            style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "0 2px 12px rgba(64,45,28,0.07)" }}>
                            <div className="flex items-start gap-3">
                                {item.image
                                    ? <img src={`${IMAGE_BASE}/${item.image}`} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0 ring-1 ring-(--border)" />
                                    : <PlaceholderImg size={16} />}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h3 className="font-bold text-(--ink) text-sm leading-snug truncate">{item.name}</h3>
                                        <StatusBadge active={item.isActive} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-(--muted) mt-1">
                                        {item.productCode && <span>Code: <span className="font-mono text-(--ink)">{item.productCode}</span></span>}
                                        {item.barcode && <span>Barcode: <span className="font-mono text-(--ink)">{item.barcode}</span></span>}
                                        <span>Price: <span className="font-semibold text-(--ink)">{item.defaultRetailPrice ?? 0}</span></span>
                                        <span>Stock: <StockBadge qty={item.currentStockLevel} /></span>
                                    </div>
                                    {(item.category?.name) && (
                                        <div className="text-xs mt-1.5 px-2 py-0.5 rounded-md inline-block"
                                            style={{ background: "var(--surface-muted)", color: "var(--muted)" }}>
                                            {item.category.name}{item.subCategory?.name && ` › ${item.subCategory.name}`}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                                <button onClick={() => openEdit(item._id)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all border hover:border-(--accent-2) hover:text-(--accent-2)"
                                    style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--muted)" }}>
                                    <Edit size={14} /> Edit
                                </button>
                                <button onClick={() => openDeleteConfirm(item)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all border hover:border-red-400 hover:text-red-500"
                                    style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--muted)" }}>
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {isModalOpen && <ProductCRUDModal mode={modalMode} productId={selectedProductId} open={isModalOpen} onClose={closeModal} />}

            {/* Delete modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 app-overlay app-enter">
                    <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ background: "var(--surface)" }}>
                        {deleteTarget.step === "confirm" ? (
                            <>
                                <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-4 text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
                                        <AlertTriangle className="w-7 h-7 text-red-500" />
                                    </div>
                                    <h3 className="text-lg font-bold text-(--ink)">Delete Product?</h3>
                                    <p className="text-sm text-(--muted)">
                                        This will permanently remove <strong className="text-(--ink)">{deleteTarget.name}</strong> and cannot be undone.
                                    </p>
                                </div>
                                <div className="flex gap-3 px-6 py-5" style={{ borderTop: "1px solid var(--border)" }}>
                                    <button onClick={() => setDeleteTarget(null)} disabled={deleteLoading}
                                        className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                                        style={{ background: "var(--app-bg)", color: "var(--muted)" }}>Cancel</button>
                                    <button onClick={handleConfirmDelete} disabled={deleteLoading}
                                        className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all disabled:opacity-60">
                                        {deleteLoading ? "Deleting…" : "Delete"}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-4 text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                        <PackageX className="w-7 h-7 text-amber-500" />
                                    </div>
                                    <h3 className="text-lg font-bold text-(--ink)">Batches Connected</h3>
                                    <p className="text-sm text-(--muted)">
                                        <strong className="text-(--ink)">{deleteTarget.name}</strong> has{" "}
                                        <strong className="text-amber-500">{deleteTarget.batchCount} batch(es)</strong> linked to it.
                                    </p>
                                    <div className="w-full rounded-xl px-4 py-2.5 text-xs text-amber-700 text-center"
                                        style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
                                        Deleting will permanently remove this product along with all its batches and history.
                                    </div>
                                </div>
                                <div className="flex gap-3 px-6 py-5" style={{ borderTop: "1px solid var(--border)" }}>
                                    <button onClick={() => setDeleteTarget(null)} disabled={deleteLoading}
                                        className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                                        style={{ background: "var(--app-bg)", color: "var(--muted)" }}>Cancel</button>
                                    <button onClick={handleConfirmHardDelete} disabled={deleteLoading}
                                        className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-all disabled:opacity-60">
                                        {deleteLoading ? "Deleting…" : "Delete with Batches"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="flex-none">
                <PageHeading
                    heading={isEn ? "Products" : "مصنوعات"}
                    subheading={isEn ? "Manage your products" : "اپنی مصنوعات کا انتظام کریں"}>
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                        <button onClick={() => setFilterPanelOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all hover:border-(--accent-2) hover:text-(--accent-2)"
                            style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--muted)" }}>
                            <Filter size={15} /> {isEn ? "Filters" : "فلٹرز"}
                        </button>
                        <button onClick={() => { setModalMode("create"); setIsModalOpen(true); }} className="btn-add">
                            {isEn ? "+ Add Product" : "+ مصنوعات شامل کریں"}
                        </button>
                    </div>
                </PageHeading>
            </div>

            <div className="flex-1 overflow-hidden">
                <PaginatedList
                    rtkQuery={useProducts}
                    limit={20}
                    dataKey="data"
                    wrapperClassName="h-full"
                    renderItems={renderItems}
                    queryArgs={{ page: currentPage, limit: 20, ...activeFilters }}
                />
            </div>

            <ProductFilterPanel
                isOpen={filterPanelOpen}
                onClose={() => setFilterPanelOpen(false)}
                onFiltersChange={handleFiltersChange}
                brands={uniqueBrands}
            />
        </div>
    );
}









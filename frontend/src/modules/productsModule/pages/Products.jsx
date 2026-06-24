// features/products/pages/Products.jsx
import { useState } from "react";
import { Edit, Trash2, AlertTriangle, PackageX } from "lucide-react";
import { useDeleteProduct, useDeleteProductWithBatches, useProducts } from "../services/product.service.js";
import { useUser } from "../../auth/services/auth.service.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import ProductCRUDModal from "../components/ProductCRUDModal.jsx";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";

const IMAGE_BASE = "http://localhost:5001/uploads";

const PlaceholderImg = ({ size = 12 }) => (
    <div className={`w-${size} h-${size} rounded-lg bg-(--surface-muted) flex items-center justify-center text-(--muted)`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />
            <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="1.5" />
            <polyline points="21 15 16 10 5 21" strokeWidth="1.5" />
        </svg>
    </div>
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

    const language = userQuery?.data?.language || userQuery?.language || "en";

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
        } catch (error) {
            if (error?.data?.code === "PRODUCT_HAS_BATCHES") {
                setDeleteTarget((prev) => ({ ...prev, step: "withBatches", batchCount: error.data.batchCount || 0 }));
            } else {
                showError(error?.data?.message || "Failed to delete product");
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
            showSuccess("Product and all connected batches deleted");
            setDeleteTarget(null);
        } catch (error) {
            showError(error?.data?.message || "Failed to delete product");
            setDeleteTarget(null);
        }
        setDeleteLoading(false);
    };

    const renderItems = (items) => {
        if (!items?.length) return null;
        return (
            <div className="flex flex-col">
                {/* Desktop Header */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 bg-(--surface-muted) rounded-t-xl border-b border-(--border) text-xs font-semibold text-(--muted)">
                    <div className="col-span-1">Image</div>
                    <div className="col-span-2">Name</div>
                    <div className="col-span-2">Code</div>
                    <div className="col-span-2">Barcode</div>
                    <div className="col-span-1">Price</div>
                    <div className="col-span-2">Category</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-1">Actions</div>
                </div>

                {/* Desktop Rows */}
                {items.map((item) => (
                    <div key={item._id} className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 bg-(--surface) border-b border-(--border) hover:bg-(--surface-muted) transition-all items-center">
                        <div className="col-span-1">
                            {item.image
                                ? <img src={`${IMAGE_BASE}/${item.image}`} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                                : <PlaceholderImg size={12} />}
                        </div>
                        <div className="col-span-2 font-medium text-(--ink) truncate">{item.name}</div>
                        <div className="col-span-2 text-sm text-(--muted)">{item.productCode || "—"}</div>
                        <div className="col-span-2 text-sm text-(--muted)">{item.barcode || "—"}</div>
                        <div className="col-span-1 text-sm text-(--muted)">{item.defaultRetailPrice ?? 0}</div>
                        <div className="col-span-2 text-sm text-(--muted)">
                            {item.category?.name}{item.subCategory?.name && ` > ${item.subCategory.name}`}
                        </div>
                        <div className="col-span-1">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.isActive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                                {item.isActive ? "Active" : "Inactive"}
                            </span>
                        </div>
                        <div className="col-span-1 flex items-center gap-2">
                            <button onClick={() => openEdit(item._id)} className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-(--accent-2) hover:text-(--accent-2) transition-all">
                                <Edit size={16} />
                            </button>
                            <button onClick={() => openDeleteConfirm(item)} className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-red-500 hover:text-red-500 transition-all">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Mobile Cards */}
                {items.map((item) => (
                    <div key={`m-${item._id}`} className="md:hidden bg-(--surface) rounded-xl p-4 border border-(--border) mb-3">
                        <div className="flex items-start gap-3">
                            {item.image
                                ? <img src={`${IMAGE_BASE}/${item.image}`} alt={item.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                                : <PlaceholderImg size={16} />}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="font-semibold text-(--ink) truncate">{item.name}</h3>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${item.isActive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                                        {item.isActive ? "Active" : "Inactive"}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-(--muted)">
                                    {item.productCode && <span>Code: {item.productCode}</span>}
                                    {item.barcode && <span>Barcode: {item.barcode}</span>}
                                    <span>Price: {item.defaultRetailPrice ?? 0}</span>
                                </div>
                                <div className="text-xs text-(--muted)/70 mt-1">
                                    {item.category?.name}{item.subCategory?.name && ` > ${item.subCategory.name}`}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-3 pt-3 border-t border-(--border)">
                            <button onClick={() => openEdit(item._id)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-(--accent-2) hover:text-(--accent-2) transition-all text-sm">
                                <Edit size={16} /> Edit
                            </button>
                            <button onClick={() => openDeleteConfirm(item)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-red-500 hover:text-red-500 transition-all text-sm">
                                <Trash2 size={16} /> Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {isModalOpen && (
                <ProductCRUDModal mode={modalMode} productId={selectedProductId} open={isModalOpen} onClose={closeModal} />
            )}

            {/* Delete Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-[var(--surface)] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                        {deleteTarget.step === "confirm" ? (
                            <>
                                <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-2">
                                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
                                        <AlertTriangle className="w-7 h-7 text-red-500" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-[var(--ink)]">Delete Product?</h3>
                                    <p className="text-sm text-[var(--muted)] text-center">
                                        Are you sure you want to delete <strong className="text-[var(--ink)]">{deleteTarget.name}</strong>? This action cannot be undone.
                                    </p>
                                </div>
                                <div className="flex gap-3 px-6 py-5">
                                    <button onClick={() => setDeleteTarget(null)} disabled={deleteLoading} className="flex-1 py-2.5 rounded-xl bg-[var(--app-bg)] text-[var(--muted)] font-medium text-sm hover:opacity-80 transition-all">Cancel</button>
                                    <button onClick={handleConfirmDelete} disabled={deleteLoading} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-all disabled:opacity-60">
                                        {deleteLoading ? "Deleting…" : "Delete"}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-2">
                                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                        <PackageX className="w-7 h-7 text-amber-500" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-[var(--ink)]">Batches Connected</h3>
                                    <p className="text-sm text-[var(--muted)] text-center">
                                        <strong className="text-[var(--ink)]">{deleteTarget.name}</strong> has{" "}
                                        <strong className="text-amber-500">{deleteTarget.batchCount} batch(es)</strong> connected.
                                    </p>
                                    <div className="w-full rounded-lg border border-amber-400/30 bg-amber-500/5 px-3 py-2">
                                        <p className="text-xs text-amber-600 text-center">Deleting will permanently remove the product along with all its batches and history.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 px-6 py-5">
                                    <button onClick={() => setDeleteTarget(null)} disabled={deleteLoading} className="flex-1 py-2.5 rounded-xl bg-[var(--app-bg)] text-[var(--muted)] font-medium text-sm hover:opacity-80 transition-all">Cancel</button>
                                    <button onClick={handleConfirmHardDelete} disabled={deleteLoading} className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 transition-all disabled:opacity-60">
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
                    heading={language === "en" ? "Products" : "مصنوعات"}
                    subheading={language === "en" ? "Manage your products" : "اپنی مصنوعات کا انتظام کریں"}
                >
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                        <button onClick={() => { setModalMode("create"); setIsModalOpen(true); }} className="btn-add">
                            {language === "en" ? "+ Add Product" : "+ مصنوعات شامل کریں"}
                        </button>
                    </div>
                </PageHeading>
            </div>

            <div className="flex-1  overflow-hidden">
                <PaginatedList rtkQuery={useProducts} limit={20} dataKey="data" wrapperClassName="h-full" renderItems={renderItems} />
            </div>
        </div>
    );
}
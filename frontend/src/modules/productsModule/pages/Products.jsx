// features/products/pages/Products.jsx
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2, AlertTriangle, PackageX, Filter, Package } from "lucide-react";
import { useDeleteProduct, useDeleteProductWithBatches, useProducts } from "../services/product.service.js";
import { useUser } from "../../auth/services/auth.service.js";
import { getProductLabels } from "../labels/productLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import ProductCRUDModal from "../components/ProductCRUDModal.jsx";
import ProductFilterPanel from "../components/ProductFilterPanel.jsx";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";

const IMAGE_BASE = "http://localhost:5001/uploads";

const PlaceholderImg = ({ size = 12, name = "" }) => (
    <div className={`w-${size} h-${size} rounded-xl bg-(--surface-muted) flex items-center justify-center`}>
        {name ? <span className="text-lg font-bold text-(--muted)">{name.charAt(0).toUpperCase()}</span> : <Package className="w-5 h-5 text-(--muted)" strokeWidth={1.5} />}
    </div>
);

const StockBadge = ({ qty }) => (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ background: qty > 0 ? "rgba(15,118,110,0.12)" : "rgba(100,100,100,0.1)", color: qty > 0 ? "var(--accent-2)" : "var(--muted)" }}>
        {qty ?? 0}
    </span>
);

const StatusBadge = ({ active, labels }) => (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${active ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"}`}>
        {active ? labels.active : labels.inactive}
    </span>
);

const IconBtn = ({ onClick, icon: Icon, hoverClass }) => (
    <button onClick={onClick}
        className={`p-2 rounded-lg bg-(--surface-muted) border border-(--border) transition-all duration-150 hover:scale-105 ${hoverClass}`}>
        <Icon size={15} />
    </button>
);

export default function Products() {
    const navigate = useNavigate();
    const { data: userQuery } = useUser();
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getProductLabels(language);

    const [deleteProduct] = useDeleteProduct();
    const [deleteProductWithBatches] = useDeleteProductWithBatches();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create");
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [filterPanelOpen, setFilterPanelOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [uniqueBrands] = useState([]);

    const handleFiltersChange = useCallback((f) => { setActiveFilters(f); setCurrentPage(1); }, []);
    const openEdit = (id) => { setSelectedProductId(id); setModalMode("update"); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setModalMode("create"); setSelectedProductId(null); };
    
    const handleDelete = async (id) => {
        try {
            await deleteProduct(id).unwrap();
            showSuccess(labels.productDeleted);
        } catch (err) {
            showError(err?.data?.message || labels.deleteFailed);
        }
    };

    const openDeleteConfirm = (item) => {
        handleDelete(item._id);
    };

    const renderItems = (items) => {
        if (!items?.length) return null;
        return (
            <div className="flex flex-col gap-0">
                {/* Desktop header */}
                <div className="hidden md:grid md:grid-cols-11 gap-3 px-5 py-3 rounded-t-2xl text-xs font-bold uppercase tracking-wider"
                    style={{ background: "var(--surface-muted)", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                    <div className="col-span-1">{labels.image}</div>
                    <div className="col-span-2">{labels.name}</div>
                    <div className="col-span-2">Product Code</div>
                    <div className="col-span-2">{labels.barcode}</div>
                    <div className="col-span-1">{labels.stock}</div>
                    <div className="col-span-1">{labels.category}</div>
                    <div className="col-span-1">{labels.status}</div>
                    <div className="col-span-1">{labels.actions}</div>
                </div>

                {/* Desktop rows */}
                {items.map((item, i) => (
                    <div key={item._id}
                        onClick={() => navigate(`/products/${item._id}`)}
                        className="hidden md:grid md:grid-cols-11 gap-3 px-5 py-3.5 items-center transition-all duration-150 hover:bg-(--surface-muted) group cursor-pointer"
                        style={{ background: i % 2 === 0 ? "var(--surface)" : "rgba(255,250,243,0.6)", borderBottom: "1px solid var(--border)" }}>
                        <div className="col-span-1">
                            {item.image
                                ? <img src={`${IMAGE_BASE}/${item.image}`} alt={item.name} className="w-11 h-11 rounded-xl object-cover ring-1 ring-(--border) group-hover:ring-(--accent-2) transition-all" />
                                : <PlaceholderImg size={11} name={item.name} />}
                        </div>
                        <div className="col-span-2 font-semibold text-(--ink) truncate text-sm">{item.name}</div>
                        <div className="col-span-2 text-sm text-(--muted) font-mono">{item.productCode || "—"}</div>
                        <div className="col-span-2 text-sm text-(--muted) font-mono">{item.barcode || "—"}</div>
                        <div className="col-span-1"><StockBadge qty={item.currentStockLevel} /></div>
                        <div className="col-span-1 text-xs text-(--muted) truncate">
                            {item.category?.name}{item.subCategory?.name && <span className="text-(--muted)/50"> › {item.subCategory.name}</span>}
                        </div>
                        <div className="col-span-1"><StatusBadge active={item.isActive} labels={labels} /></div>
                        <div onClick={e=> e.stopPropagation()} className="col-span-1 flex items-center gap-1.5">
                            <PermissionGuard 
                                execute={() => openEdit(item._id)} 
                                permission="products.update" 
                                isConfirmation={true}
                            >
                                <button id={`products-edit-${item._id}`} className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) transition-all duration-150 hover:scale-105 hover:border-(--accent-2) hover:text-(--accent-2)">
                                    <Edit size={15} />
                                </button>
                            </PermissionGuard>
                            <PermissionGuard 
                                execute={() => handleDelete(item._id)} 
                                permission="products.delete" 
                                isConfirmation={true}
                            >
                                <button id={`products-delete-${item._id}`} className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) transition-all duration-150 hover:scale-105 hover:border-red-400 hover:text-red-500">
                                    <Trash2 size={15} />
                                </button>
                            </PermissionGuard>
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
                                    : <PlaceholderImg size={16} name={item.name} />}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h3 className="font-bold text-(--ink) text-sm leading-snug truncate">{item.name}</h3>
                                        <StatusBadge active={item.isActive} labels={labels} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-(--muted) mt-1">
                                        {item.productCode && <span>Product Code: <span className="font-mono text-(--ink)">{item.productCode}</span></span>}
                                        {item.barcode && <span>{labels.barcode}: <span className="font-mono text-(--ink)">{item.barcode}</span></span>}
                                        <span>{labels.stock}: <StockBadge qty={item.currentStockLevel} /></span>
                                    </div>
                                    {(item.category?.name) && (
                                        <div className="text-xs mt-1.5 px-2 py-0.5 rounded-md inline-block"
                                            style={{ background: "var(--surface-muted)", color: "var(--muted)" }}>
                                            {item.category.name}{item.subCategory?.name && ` › ${item.subCategory.name}`}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div onClick={e => e.stopPropagation()} className="flex gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                                <PermissionGuard 
                                    execute={() => openEdit(item._id)} 
                                    permission="products.update" 
                                    isConfirmation={true}
                                >
                                    <button id={`products-mobile-edit-${item._id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all border hover:border-(--accent-2) hover:text-(--accent-2)"
                                        style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--muted)" }}>
                                        <Edit size={14} /> {labels.edit}
                                    </button>
                                </PermissionGuard>
                                <PermissionGuard 
                                    execute={() => openDeleteConfirm(item)} 
                                    permission="products.delete" 
                                    isConfirmation={true}
                                >
                                    <button id={`products-mobile-delete-${item._id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all border hover:border-red-400 hover:text-red-500"
                                        style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--muted)" }}>
                                        <Trash2 size={14} /> {labels.delete}
                                    </button>
                                </PermissionGuard>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {isModalOpen && <ProductCRUDModal id="products-crud-modal" mode={modalMode} productId={selectedProductId} open={isModalOpen} onClose={closeModal} />}

            <div className="flex-none">
                <PageHeading
                    id="products-page-heading"
                    heading={labels.productManagement}
                    subheading={labels.manageProducts}
                    leftActions={
                        <>
                            <div id="products-filter-button" onClick={() => setFilterPanelOpen(true)}>
                                <ScreenTabButton lucideIcon={Filter} text="Filter" />
                            </div>
                            <PermissionGuard 
                                execute={() => { setModalMode("create"); setIsModalOpen(true); }} 
                                permission="products.create" 
                                isConfirmation={false}
                            >
                                <div id="products-add-button">
                                    <ScreenTabButton lucideIcon={Package} text={labels.addProduct} />
                                </div>
                            </PermissionGuard>
                        </>
                    }
                />
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









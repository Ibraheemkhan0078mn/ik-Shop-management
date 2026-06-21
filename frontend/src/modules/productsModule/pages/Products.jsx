


// ============================================================
//  features/products/pages/Products.jsx
//
//  Products page — yahan sirf config hai.
//  PaginatedTable sab handle karta hai:
//    → API call (endpoint se)
//    → Filter bar
//    → Table render
//    → Pagination
//    → Update modal (UpdateComp se)
//    → Delete (onDelete se)
//  Create modal yahan hai kyunki "Add Product" button page par hai.
// ============================================================

import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useDeleteProduct, useProducts } from "../services/product.service.js";
import { useUser } from "../../auth/services/auth.service.js";
import { useGetCategoriesQuery } from "../services/category.service.js";
import PaginatedList from "@shared/components/PaginatedList.jsx";
import ProductCRUDModal from "../components/ProductCRUDModal.jsx";
import Categories from "../components/Categories.jsx";
import SubCategories from "../components/SubCategories.jsx";
import PageHeading from "@shared/components/PageHeading.jsx";

export default function Products() {
    const { data: userQuery } = useUser();
    const { data: categories = [] } = useGetCategoriesQuery();

    // RTK Query delete mutation
    const [deleteProduct] = useDeleteProduct();

    // Create/Update modal visibility
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create");
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isSubCategoryOpen, setIsSubCategoryOpen] = useState(false);

    const language = userQuery?.data?.language || userQuery?.language || "en";

    // ── Render items for PaginatedList ──────────────────────────────────
    const renderItems = (items) => {
        if (!items || items.length === 0) return null;

        return (
            <div className="flex flex-col">
                {/* Header - Desktop */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 bg-(--surface-muted) rounded-t-xl border-b border-(--border) text-xs font-semibold text-(--muted)">
                    <div className="col-span-1">Image</div>
                    <div className="col-span-3">Name</div>
                    <div className="col-span-2">SKU</div>
                    <div className="col-span-1">Stock</div>
                    <div className="col-span-1">Price</div>
                    <div className="col-span-2">Category</div>
                    <div className="col-span-2">Actions</div>
                </div>

                {/* Rows */}
                {items.map((item) => (
                    <div
                        key={item._id}
                        className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 bg-(--surface) border-b border-(--border) hover:bg-(--surface-muted) transition-all items-center"
                    >
                        {/* Image */}
                        <div className="col-span-1">
                            {item.image ? (
                                <img
                                    src={`http://localhost:5001/uploads/${item.image}`}
                                    alt={item.name}
                                    className="w-12 h-12 rounded-lg object-cover bg-(--surface-muted)"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-lg bg-(--surface-muted) flex items-center justify-center text-(--muted)">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />
                                        <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="1.5" />
                                        <polyline points="21 15 16 10 5 21" strokeWidth="1.5" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Name */}
                        <div className="col-span-3">
                            <h3 className="font-medium text-(--ink) truncate">{item.name}</h3>
                        </div>

                        {/* SKU */}
                        <div className="col-span-2 text-sm text-(--muted)">{item.hotKeySku}</div>

                        {/* Stock */}
                        <div className="col-span-1 text-sm text-(--muted)">{item.currentStockLevel || 0}</div>

                        {/* Price */}
                        <div className="col-span-1 text-sm text-(--muted)">{item.defaultSalePrice || 0}</div>

                        {/* Category */}
                        <div className="col-span-2 text-sm text-(--muted)">
                            {item.category?.name} {item.subCategory?.name && `> ${item.subCategory.name}`}
                        </div>

                        {/* Actions */}
                        <div className="col-span-2 flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setSelectedProductId(item._id);
                                    setModalMode("update");
                                    setIsModalOpen(true);
                                }}
                                className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-(--accent-2) hover:text-(--accent-2) transition-all"
                            >
                                <Edit size={16} />
                            </button>
                            <button
                                onClick={() => deleteProduct(item._id)}
                                className="p-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-red-500 hover:text-red-500 transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Mobile Card View */}
                {items.map((item) => (
                    <div
                        key={`mobile-${item._id}`}
                        className="md:hidden bg-(--surface) rounded-xl p-4 border border-(--border) mb-3"
                    >
                        <div className="flex items-start gap-3">
                            {/* Image */}
                            {item.image ? (
                                <img
                                    src={`http://localhost:5001/uploads/${item.image}`}
                                    alt={item.name}
                                    className="w-16 h-16 rounded-lg object-cover bg-(--surface-muted) shrink-0"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-lg bg-(--surface-muted) flex items-center justify-center text-(--muted) shrink-0">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />
                                        <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="1.5" />
                                        <polyline points="21 15 16 10 5 21" strokeWidth="1.5" />
                                    </svg>
                                </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-(--ink) truncate">{item.name}</h3>
                                <div className="flex flex-wrap gap-2 mt-1 text-sm text-(--muted)">
                                    <span>SKU: {item.hotKeySku}</span>
                                    <span>Stock: {item.currentStockLevel || 0}</span>
                                    <span>Price: {item.defaultSalePrice || 0}</span>
                                </div>
                                <div className="text-xs text-(--muted)/70 mt-1">
                                    {item.category?.name} {item.subCategory?.name && `> ${item.subCategory.name}`}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-(--border)">
                            <button
                                onClick={() => {
                                    setSelectedProductId(item._id);
                                    setModalMode("update");
                                    setIsModalOpen(true);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-(--accent-2) hover:text-(--accent-2) transition-all text-sm"
                            >
                                <Edit size={16} /> Edit
                            </button>
                            <button
                                onClick={() => deleteProduct(item._id)}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-(--surface-muted) border border-(--border) hover:border-red-500 hover:text-red-500 transition-all text-sm"
                            >
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

            {/* CRUD modal — single modal for both create and update */}
            {isModalOpen && (
                <ProductCRUDModal
                    mode={modalMode}
                    productId={selectedProductId}
                    open={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setModalMode("create");
                        setSelectedProductId(null);
                    }}
                />
            )}
            {isCategoryOpen && <Categories setVisibility={setIsCategoryOpen} />}
            {isSubCategoryOpen && <SubCategories setVisibility={setIsSubCategoryOpen} />}


            <div className="flex-none">
                <PageHeading
                    heading={language === "en" ? "Products" : "مصنوعات"}
                    subheading={language === "en" ? "Manage your products" : "اپنی مصنوعات کا انتظام کریں"}
                >
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                        <button onClick={() => {
                            setModalMode("create");
                            setIsModalOpen(true);
                        }} className="btn-add">
                            {language === "en" ? "+ Add Product" : "+ مصنوعات شامل کریں"}
                        </button>
                        <button onClick={() => setIsCategoryOpen(true)} className="btn-add">
                            {language === "en" ? "Categories" : "زمرہ جات"}
                        </button>
                        <button onClick={() => setIsSubCategoryOpen(true)} className="btn-add">
                            {language === "en" ? "SubCategories" : "زمرہ جات"}
                        </button>
                    </div>
                </PageHeading>
            </div>

            {/*
                PaginatedList — isko sirf config do:
                  endpoint    → kahan se data aayega
                  renderItems → kaise dikhana hai
                  dataKey     → response mein kaun se key se data nikalna hai

                Baaki sab — pagination, filter, list — khud handle hoga.
            */}
            <div className="flex-1 overflow-hidden">
                <PaginatedList
                    endpoint="/products/pagination"
                    limit={20}
                    dataKey="data"
                    wrapperClassName="h-full"
                    renderItems={renderItems}
                    rtkGetDataQuery={useProducts}
                />
            </div>
        </div>
    );
}

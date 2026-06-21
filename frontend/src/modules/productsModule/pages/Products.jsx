


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
import { Plus } from "lucide-react";
import { useDeleteProduct, useProducts } from "../services/product.service.js";
import { useUser } from "../../auth/services/auth.service.js";
import { useGetCategoriesQuery } from "../services/category.service.js";
import PaginatedTable from "@shared/components/PaginatedTable.jsx";
import AddProduct from "../components/AddProduct.jsx";
import UpdateProduct from "../components/UpdateProduct.jsx";
import Categories from "../components/Categories.jsx";
import SubCategories from "../components/SubCategories.jsx";
import PageHeading from "@shared/components/PageHeading.jsx";

export default function Products() {
    const { data: userQuery } = useUser();
    const { data: categories = [] } = useGetCategoriesQuery();

    // RTK Query delete mutation
    const [deleteProduct] = useDeleteProduct();

    // Create modal visibility
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isSubCategoryOpen, setIsSubCategoryOpen] = useState(false);

    const language = userQuery?.data?.language || userQuery?.language || "en";

    // ── Table columns config ──────────────────────────────────
    // Key = column header label, Value = field path (nested bhi kaam karta hai)
    const columns = {
        "Product Name": "name",
        "Stock": "currentStockLevel",
        "Price": "batchSellingPrice",
        "Product Code": "productCode",
        "Barcode": "barcode",
        "Category": "category.name",
        "Total Batches": "batches.length",
        "Notes": "description",
    };



    return (
        <div className="h-screen flex flex-col">

            {/* Create modal — PaginatedTable se bahar hai, page level par */}
            {isAddOpen && (
                <AddProduct
                    open={isAddOpen}
                    onClose={() => setIsAddOpen(false)}
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
                        <button onClick={() => setIsAddOpen(true)} className="btn-add">
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
                PaginatedTable — isko sirf config do:
                  endpoint    → kahan se data aayega
                  columns     → kya dikhana hai
                  filterFields→ filter bar kaise hogi
                  UpdateComp  → update modal component (PaginatedTable khud manage karega)
                  onDelete    → delete kaise hoga

                Baaki sab — pagination, filter, table, modal — khud handle hoga.
            */}
            <div className="flex-1 overflow-hidden">
                <PaginatedTable
                    endpoint="/api/products/pagination"
                    columns={columns}
                    limit={20}
                    isUpdate={true}
                    isDelete={true}
                    UpdateComp={UpdateProduct}
                    onDelete={(id) => deleteProduct(id)}
                    rtkGetDataQuery={useProducts}
                />
            </div>
        </div>
    );
}




// ============================================================
//  features/products/components/UpdateProduct.jsx
//
//  Product update karne ka modal.
//  productId se data fetch karta hai, form mein prefill karta hai.
//  Submit par RTK Query cache automatically invalidate hoti hai —
//  table khud refresh hoga, fetchPage() manually nahi bulana padega.
//
//  Props:
//    productId → string — update karne wala product ka ID
//    open      → boolean
//    onClose   → () => void
// ============================================================

import { useState, useEffect } from "react";
import { Scan, Sparkles, Plus } from "lucide-react";
import { useGetCategoriesQuery } from "../services/category.service.js";
import { useGetSubCategoriesQuery } from "../services/subCategories.service.js";
import { useProduct, useUpdateProduct } from "../services/product.service.js";
import { Scanner } from "@shared/utilities/Scanner.jsx";
import FormLayout from "@shared/components/FormLayout.jsx";
import SubCategoryCrudModel from "./SubCategoryCrudModel.jsx";
import AddCategories from "./AddCategories.jsx";

export default function UpdateProduct({ id, open, onClose }) {
    const [updateProduct, { isLoading }] = useUpdateProduct();

    // ── Existing product data fetch karo ─────────────────────
    // skip: productId nahi hai to query mat chalao
    const { data: productData, isLoading: isFetching } = useProduct(id, {
        skip: !id,
    });

    // ── Form state ────────────────────────────────────────────
    const [formData, setFormData] = useState({
        id: "",
        // ─── Basic Info ───────────────────────────────────────────────
        name: "",
        genericName: "",
        brandName: "",
        hotKeySku: "",
        productCode: "",
        barcode: "",
        description: "",
        images: [],

        // ─── Classification ───────────────────────────────────────────
        category: "",
        subCategory: "",
        form: "",
        strength: "",
        drugType: "",
        scheduleType: "",
        isNarcotic: false,

        // ─── Units ────────────────────────────────────────────────────
        unit: "Units",
        purchaseUnit: "Box",

        // ─── Manufacturer & Supplier ──────────────────────────────────
        manufacturer: "",
        defaultSupplier: "",
        countryOfOrigin: "",

        // ─── Pricing Defaults ─────────────────────────────────────────
        defaultSalePrice: 0,
        defaultPurchasePrice: 0,
        taxPercent: 0,
        isDiscountAllowed: true,

        // ─── Stock Settings ───────────────────────────────────────────
        minStockLevel: 0,
        maxStockLevel: 0,
        allowNegativeStock: true,
        rackLocation: "",
        storageCondition: "",

        // ─── Medical Info ─────────────────────────────────────────────
        substitutes: [],
        drugInteractionWarning: "",

        // ─── Status ───────────────────────────────────────────────────
        isActive: true,
    });

    const { data: categories = [] } = useGetCategoriesQuery();
    const { data: subCategories = [] } = useGetSubCategoriesQuery();

    const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);
    const [showSubCategoryDialog, setShowSubCategoryDialog] = useState(false);

    // ── Prefill: jab product data aaye to form mein load karo ─
    useEffect(() => {
        if (!productData) return;

        // setFormData({
        //     ...productData,
        //     id: productData._id,
        //     // category aur subCategory object hote hain — sirf ID chahiye select ke liye
        //     category: productData.category?._id || productData.category || "",
        //     subCategory: productData.subCategory?._id || productData.subCategory || "",
        // });


        setFormData({
            id: productData._id || "",

            // ─── Basic Info ───────────────────────────────────────────────
            name: productData.name || "",
            genericName: productData.genericName || "",
            brandName: productData.brandName || "",
            hotKeySku: productData.hotKeySku || "",
            productCode: productData.productCode || "",
            barcode: productData.barcode || "",
            description: productData.description || "",
            images: productData.images || [],

            // ─── Classification ───────────────────────────────────────────
            category: productData.category?._id || productData.category || "",
            subCategory: productData.subCategory?._id || productData.subCategory || "",
            form: productData.form || "",
            strength: productData.strength || "",
            drugType: productData.drugType || "",
            scheduleType: productData.scheduleType || "",
            isNarcotic: productData.isNarcotic ?? false,

            // ─── Units ────────────────────────────────────────────────────
            unit: productData.unit || "Units",
            purchaseUnit: productData.purchaseUnit || "Box",

            // ─── Manufacturer & Supplier ──────────────────────────────────
            manufacturer: productData.manufacturer || "",
            defaultSupplier: productData.defaultSupplier?._id || productData.defaultSupplier || "",
            countryOfOrigin: productData.countryOfOrigin || "",

            // ─── Pricing Defaults ─────────────────────────────────────────
            defaultSalePrice: productData.defaultSalePrice ?? 0,
            defaultPurchasePrice: productData.defaultPurchasePrice ?? 0,
            taxPercent: productData.taxPercent ?? 0,
            isDiscountAllowed: productData.isDiscountAllowed ?? true,

            // ─── Stock Settings ───────────────────────────────────────────
            minStockLevel: productData.minStockLevel ?? 0,
            maxStockLevel: productData.maxStockLevel ?? 0,
            allowNegativeStock: productData.allowNegativeStock ?? true,
            rackLocation: productData.rackLocation || "",
            storageCondition: productData.storageCondition || "",

            // ─── Medical Info ─────────────────────────────────────────────
            substitutes: productData.substitutes || [],
            drugInteractionWarning: productData.drugInteractionWarning || "",

            // ─── Status ───────────────────────────────────────────────────
            isActive: productData.isActive ?? true,
        });
    }, [productData]);

    // ── Helpers ───────────────────────────────────────────────
    const updateField = (field, value) =>
        setFormData((prev) => ({ ...prev, [field]: value }));

    const generateSKU = () =>
        updateField("hotKeySku", `SKU-${Math.random().toString(36).substring(2, 10).toUpperCase()}`);

    const generateBarcode = () =>
        updateField("barcode", (Math.floor(Math.random() * 9000000000000) + 1000000000000).toString());

    // ── Submit ────────────────────────────────────────────────
    // RTK Query invalidatesTags se table aur single product dono refresh honge
    // fetchPage() manually nahi bulana — sab automatic hai
    const onSubmit = async () => {
        try {
            await updateProduct(formData).unwrap();
            onClose();
        } catch {
            // Error toast RTK Query service mein handle ho chuka hai
        }
    };

    // ── Form config — AddProduct jesi hi, title alag ─────────
    // const config = {
    //     title: "Product Update Karein",
    //     columns: 2,
    //     submitLabel: isLoading ? "Update ho raha hai..." : "Update Karein",
    //     fields: [
    //         {
    //             name: "name",
    //             label: "Product Name",
    //             type: "text",
    //             placeholder: "Product ka naam likhein",
    //             required: true,
    //         },
    //         {
    //             name: "hotKeySku",
    //             label: "Hot Key / SKU",
    //             type: "text",
    //             placeholder: "SKU-XXXXXXXX",
    //             buttons: [
    //                 { label: "Generate", icon: <Sparkles className="h-4 w-4" />, onClick: generateSKU },
    //             ],
    //         },
    //         {
    //             name: "productCode",
    //             label: "Product Code",
    //             type: "text",
    //             placeholder: "e.g., PROD-001",
    //             required: true,
    //         },
    //         {
    //             name: "barcode",
    //             label: "Barcode",
    //             type: "text",
    //             placeholder: "Barcode number",
    //             buttons: [
    //                 { label: "Generate", icon: <Sparkles className="h-4 w-4" />, onClick: generateBarcode },
    //                 { label: "Scan", icon: <Scan className="h-4 w-4" />, onClick: () => setIsBarcodeOpen(true) },
    //             ],
    //         },
    //         {
    //             name: "category",
    //             label: "Category",
    //             type: "select",
    //             required: true,
    //             placeholder: "Category chunein...",
    //             options: categories.map((c) => ({ label: c.name, value: c._id })),
    //             buttons: [
    //                 { label: "", icon: <Plus className="h-4 w-4" />, onClick: () => setShowCategoryDialog(true) },
    //             ],
    //         },
    //         {
    //             name: "subCategory",
    //             label: "Sub Category",
    //             type: "select",
    //             placeholder: "Sub category chunein...",
    //             visible: !!formData.category,
    //             options: subCategories.map((c) => ({ label: c.name, value: c._id })),
    //             buttons: [
    //                 { label: "", icon: <Plus className="h-4 w-4" />, onClick: () => setShowSubCategoryDialog(true) },
    //             ],
    //         },
    //         {
    //             name: "description",
    //             label: "Description",
    //             type: "textarea",
    //             placeholder: "Product description likhein",
    //             rows: 4,
    //             span: "full",
    //         },
    //         {
    //             name: "images",
    //             label: "Product Images",
    //             type: "image",
    //             multiple: true,
    //             placeholder: "Drag & drop images, ya chunein",
    //             span: "full",
    //             hint: "PNG, JPG, WebP — max 5MB each",
    //         },
    //     ],
    // };


    const config = {
        title: "Edit Master Product",
        columns: 2,
        submitLabel: isLoading ? "Save ho raha hai..." : "Product Save Karein",
        fields: [
            // ─── Most Important ───────────────────────────────────────────
            { name: "images", label: "Product Images", type: "image", multiple: true, placeholder: "Drag & drop images, ya chunein", span: "full", hint: "PNG, JPG, WebP — max 5MB each" },

            { name: "name", label: "* Product Name", type: "text", required: true, placeholder: "Product ka naam likhein" },
            { name: "genericName", label: "* Generic Name", type: "text", required: true, placeholder: "e.g., Paracetamol" },
            { name: "category", label: "* Category", type: "select", required: true, placeholder: "Category chunein...", options: categories.map((c) => ({ label: c.name, value: c._id })), buttons: [{ label: "", icon: <Plus className="h-4 w-4" />, onClick: () => setShowCategoryDialog(true) }] },
            { name: "subCategory", label: "* Sub Category", type: "select", required: true, placeholder: "Sub category chunein...", visible: !!formData.category, options: subCategories.map((c) => ({ label: c.name, value: c._id })), buttons: [{ label: "", icon: <Plus className="h-4 w-4" />, onClick: () => setShowSubCategoryDialog(true) }] },
            { name: "hotKeySku", label: "* Hot Key / SKU", type: "text", required: true, placeholder: "SKU-XXXXXXXX", buttons: [{ label: "Generate", icon: <Sparkles className="h-4 w-4" />, onClick: generateSKU }] },
            { name: "defaultSalePrice", label: "* Default Sale Price", type: "number", required: true, placeholder: "0.00" },
            { name: "form", label: "* Form", type: "text", required: true, placeholder: "e.g., Tablet, Syrup, Injection" },
            { name: "strength", label: "* Strength", type: "text", required: true, placeholder: "e.g., 500mg, 250ml" },
            { name: "unit", label: "* Sale Unit", type: "text", required: true, placeholder: "e.g., Strip, Bottle, Piece" },
            { name: "scheduleType", label: "* Schedule Type", type: "text", required: true, placeholder: "e.g., OTC, Prescription" },
            { type: "divider" },
            { type: "divider" },

            // ─── Toggles ──────────────────────────────────────────────────
            { name: "isNarcotic", label: "Narcotic / Controlled", type: "toggle" },
            { name: "isDiscountAllowed", label: "Discount Allowed", type: "toggle" },
            { name: "allowNegativeStock", label: "Allow Negative Stock", type: "toggle" },
            { name: "isActive", label: "Active", type: "toggle" },
            { type: "divider" },
            { type: "divider" },

            // ─── Important ────────────────────────────────────────────────
            { name: "brandName", label: "Brand Name", type: "text", placeholder: "e.g., Panadol" },
            { name: "manufacturer", label: "Manufacturer", type: "text", placeholder: "Manufacturer ka naam" },
            // { name: "defaultSupplier",          label: "Default Supplier",          type: "select",   placeholder: "Supplier chunein...",      options: [] },
            { name: "defaultPurchasePrice", label: "Default Purchase Price", type: "number", placeholder: "0.00" },
            // { name: "barcode",                  label: "Barcode",                   type: "text",     placeholder: "Barcode number",           buttons: [{ label: "Generate", icon: <Sparkles className="h-4 w-4" />, onClick: generateBarcode }, { label: "Scan", icon: <Scan className="h-4 w-4" />, onClick: () => setIsBarcodeOpen(true) }] },
            { name: "productCode", label: "Product Code", type: "text", placeholder: "e.g., PROD-001" },
            { name: "minStockLevel", label: "Min Stock Level", type: "number", placeholder: "0" },
            { name: "maxStockLevel", label: "Max Stock Level", type: "number", placeholder: "0" },
            // { name: "purchaseUnit", label: "Purchase Unit", type: "text", placeholder: "e.g., Box, Carton" },
            { type: "divider" },
            { type: "divider" },
            { type: "divider" },




            // ─── Less Important ───────────────────────────────────────────
            { name: "drugType", label: "Drug Type", type: "text", placeholder: "e.g., Branded, Generic" },
            { name: "rackLocation", label: "Rack Location", type: "text", placeholder: "e.g., A1, B3" },
            { name: "storageCondition", label: "Storage Condition", type: "text", placeholder: "e.g., Normal, Refrigerated" },
            { name: "taxPercent", label: "Tax %", type: "number", placeholder: "0" },
            { name: "countryOfOrigin", label: "Country of Origin", type: "text", placeholder: "e.g., Pakistan, China" },
            { name: "drugInteractionWarning", label: "Drug Interaction Warning", type: "textarea", placeholder: "Koi drug interaction warning...", rows: 3, span: "full" },
            { name: "description", label: "Description", type: "textarea", placeholder: "Product description likhein", rows: 4, span: "full" },
        ],
    };

    if (!open) return null;

    // Data load hone tak spinner dikhao
    if (isFetching && !productData) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
                <div className="bg-(--surface) rounded-2xl p-8 text-(--muted) text-sm">
                    Product load ho raha hai...
                </div>
            </div>
        );
    }

    return (
        <>
            {isBarcodeOpen && (
                <Scanner
                    isOpen={isBarcodeOpen}
                    setIsOpen={setIsBarcodeOpen}
                    valueSetter={(value) => updateField("barcode", value)}
                />
            )}

            {showCategoryDialog && (
                <AddCategories
                    setVisibility={setShowCategoryDialog}
                />
            )}

            {showSubCategoryDialog && (
                <SubCategoryCrudModel
                    type="Subcategory"
                    operation="update"
                    open={showSubCategoryDialog}
                    onSubmit={() => setShowSubCategoryDialog(false)}
                    onCancel={() => setShowSubCategoryDialog(false)}
                />
            )}

            <FormLayout
                setVisibility={onClose}
                config={config}
                formData={formData}
                setFormData={setFormData}
                onSubmit={onSubmit}
            />
        </>
    );
}

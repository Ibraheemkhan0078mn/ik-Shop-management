
import { useEffect, useState } from "react";
import { Scan, Sparkles, Plus } from "lucide-react";
import { useCreateProduct } from "../services/product.service";
import { Scanner } from "../../../utils/Scanner";
import FormLayout from "../../../components/common/FormLayout";
import CategoriesFormModel from "./SubCategoriesFormModel.jsx"
import AddSubCategories from "./SubCategoryCrudModel.jsx";
import { useGetCategoriesQuery } from "../services/category.service.js";
import { useGetSubCategoriesByCatagIdQuery } from "../services/subCategories.service.js";
import AddCategories from "./AddCategories.jsx";
import SubCategoryCrudModel from "./SubCategoryCrudModel.jsx";

export default function AddProduct({ open, onClose }) {
    const [createProduct, { isLoading }] = useCreateProduct();



    const [formData, setFormData] = useState({
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
        minStockLevel: 5,
        maxStockLevel: 10,
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
    // const { data: subCategories = [] } = useGetSubCategoriesQuery();
    const { data: subCategories = [] } = useGetSubCategoriesByCatagIdQuery(
        formData.category,
        { skip: !formData.category }
    );




    // Side modals ke liye visibility state
    const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);
    const [showSubCategoryDialog, setShowSubCategoryDialog] = useState(false);
    const [categoriesState, setCategoriesState] = useState([])
    const [subCategoriesState, setSubCategoriesState] = useState([])




    // useEffect(() => {
    //     if (categories?.length) {
    //         setCategoriesState(categories)
    //     }


    //     if (formData.category) {

    //         async function getSubCategories() {
    //             const res = await getSubCategoriesMutation(formData.category);
    //             setSubCategoriesState(res.data);
    //         }
    //         getSubCategories();
    //     }


    // }, [formData.category])

    // useEffect(() => {
    //     if (subCategories?.length) {
    //         setSubCategoriesState(subCategories)
    //     }
    // }, [subCategories])








    // ── Field helpers ─────────────────────────────────────────
    const updateField = (field, value) =>
        setFormData((prev) => ({ ...prev, [field]: value }));

    const generateSKU = () =>
        updateField("hotKeySku", `SKU-${Math.random().toString(36).substring(2, 10).toUpperCase()}`);

    const generateBarcode = () =>
        updateField("barcode", (Math.floor(Math.random() * 9000000000000) + 1000000000000).toString());

    // ── Submit ────────────────────────────────────────────────
    // RTK Query mutation — toast aur cache invalidation khud handle karega
    const onSubmit = async () => {
        try {
            await createProduct(formData).unwrap();
            onClose(); // Success par modal band karo
        } catch {
            // Error toast RTK Query service mein handle ho chuka hai
        }
    };

    const config = {
        title: "Add Product",
        columns: 2,
        submitLabel: isLoading ? "Saving..." : "Save Product",
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

    return (
        <>
            {isBarcodeOpen && (<Scanner isOpen={isBarcodeOpen} setIsOpen={setIsBarcodeOpen} valueSetter={(value) => updateField("barcode", value)} />)}
            {showCategoryDialog && (<AddCategories setVisibility={setShowCategoryDialog} operation="create" />)}
            {showSubCategoryDialog && (<SubCategoryCrudModel catagId={formData.category} setVisibility={setShowSubCategoryDialog} />)}







            <FormLayout
                setVisibility={onClose}
                config={config}
                formData={formData}
                setFormData={setFormData}
                onSubmit={onSubmit}
                zIndex={60}
            />
        </>
    );
}
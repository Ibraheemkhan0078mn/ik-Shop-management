import { useState, useEffect, useMemo, useRef } from "react";
import { Scan, Sparkles, Plus, ChevronLeft, ChevronRight, AlertCircle, Check } from "lucide-react";
import { useCreateProduct, useUpdateProduct } from "../services/product.service";
import { useGetCategoriesQuery } from "../services/category.service.js";
import { useGetSubCategoriesQuery } from "../services/subCategories.service.js";
import { useProduct } from "../services/product.service.js";
import Scanner from "@shared/components/Scanner";
import CategoryCRUDModal from "./CategoryCRUDModal.jsx";
import SubCategoryCrudModel from "./SubCategoryCRUDModal.jsx";
import { showSuccess, showError } from "@shared/utilities/toastHelpers.js";

const IMAGE_BASE = "http://localhost:5001/uploads";

const EMPTY_FORM = {
  name: "", genericName: "", brandName: "", hotKeySku: "", productCode: "",
  barcode: "", description: "", image: "", category: "", subCategory: "",
  form: "", strength: "", drugType: "", scheduleType: "", isNarcotic: false,
  unit: "Units", purchaseUnit: "Box", manufacturer: "", defaultSupplier: "",
  countryOfOrigin: "", defaultSalePrice: 0, defaultPurchasePrice: 0,
  taxPercent: 0, isDiscountAllowed: true, minStockLevel: 5, maxStockLevel: 10,
  allowNegativeStock: true, rackLocation: "", storageCondition: "",
  drugInteractionWarning: "", isActive: true,
};

function buildSteps({ categories, subCategories, currentCategory, openCategoryDialog, openSubCategoryDialog, generateSKU, generateBarcode, openScanner }) {
  return [
    {
      id: "basic",
      title: "Basic Info",
      fields: [
        { name: "image", label: "Product Image", type: "image", span: "full", hint: "PNG, JPG, WebP — max 5MB" },
        { name: "name", label: "Product Name", type: "text", required: true, placeholder: "Product ka naam likhein" },
        { name: "genericName", label: "Generic Name", type: "text", required: true, placeholder: "e.g., Paracetamol" },
        { name: "brandName", label: "Brand Name", type: "text", placeholder: "e.g., Panadol" },
        { name: "hotKeySku", label: "Hot Key / SKU", type: "text", required: true, placeholder: "SKU-XXXXXXXX", action: { label: "Generate", icon: Sparkles, onClick: generateSKU } },
        { name: "productCode", label: "Product Code", type: "text", placeholder: "e.g., PROD-001" },
        { name: "barcode", label: "Barcode", type: "text", placeholder: "Scan or type barcode", action: { label: "Scan", icon: Scan, onClick: openScanner } },
        { name: "description", label: "Description", type: "textarea", rows: 3, span: "full", placeholder: "Product description likhein" },
      ],
    },
    {
      id: "classification",
      title: "Classification",
      fields: [
        { name: "category", label: "Category", type: "select", required: true, placeholder: "Category chunein...", options: categories.map(c => ({ label: c.name, value: c._id })), action: { label: "New", icon: Plus, onClick: openCategoryDialog } },
        { name: "subCategory", label: "Sub Category", type: "select", required: true, placeholder: "Sub category chunein...", disabled: !currentCategory, options: subCategories.map(c => ({ label: c.name, value: c._id })), action: { label: "New", icon: Plus, onClick: openSubCategoryDialog } },
        { name: "form", label: "Form", type: "text", required: true, placeholder: "e.g., Tablet, Syrup, Injection" },
        { name: "strength", label: "Strength", type: "text", required: true, placeholder: "e.g., 500mg, 250ml" },
        { name: "drugType", label: "Drug Type", type: "text", placeholder: "e.g., Branded, Generic" },
        { name: "scheduleType", label: "Schedule Type", type: "text", required: true, placeholder: "e.g., OTC, Prescription" },
        { name: "isNarcotic", label: "Narcotic / Controlled", type: "toggle" },
      ],
    },
    {
      id: "pricing",
      title: "Units & Pricing",
      fields: [
        { name: "unit", label: "Sale Unit", type: "text", required: true, placeholder: "e.g., Strip, Bottle, Piece" },
        { name: "purchaseUnit", label: "Purchase Unit", type: "text", placeholder: "e.g., Box, Carton" },
        { name: "defaultSalePrice", label: "Default Sale Price", type: "number", required: true, placeholder: "0.00" },
        { name: "defaultPurchasePrice", label: "Default Purchase Price", type: "number", placeholder: "0.00" },
        { name: "taxPercent", label: "Tax %", type: "number", placeholder: "0" },
        { name: "isDiscountAllowed", label: "Discount Allowed", type: "toggle" },
      ],
    },
    {
      id: "stock",
      title: "Stock & Storage",
      fields: [
        { name: "minStockLevel", label: "Min Stock Level", type: "number", placeholder: "0" },
        { name: "maxStockLevel", label: "Max Stock Level", type: "number", placeholder: "0" },
        { name: "allowNegativeStock", label: "Allow Negative Stock", type: "toggle" },
        { name: "rackLocation", label: "Rack Location", type: "text", placeholder: "e.g., A1, B3" },
        { name: "storageCondition", label: "Storage Condition", type: "text", placeholder: "e.g., Normal, Refrigerated" },
      ],
    },
    {
      id: "other",
      title: "Manufacturer & Medical Info",
      fields: [
        { name: "manufacturer", label: "Manufacturer", type: "text", placeholder: "Manufacturer ka naam" },
        { name: "defaultSupplier", label: "Default Supplier", type: "text", placeholder: "Supplier ID / name" },
        { name: "countryOfOrigin", label: "Country of Origin", type: "text", placeholder: "e.g., Pakistan, China" },
        { name: "drugInteractionWarning", label: "Drug Interaction Warning", type: "textarea", rows: 3, span: "full", placeholder: "Koi drug interaction warning..." },
        { name: "isActive", label: "Active", type: "toggle" },
      ],
    },
  ];
}

export default function ProductCRUDModal({ mode = "create", productId = null, open, onClose }) {
  const isCreate = mode === "create";
  const [createProduct, { isLoading: isCreating }] = useCreateProduct();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProduct();
  const isSaving = isCreating || isUpdating;

  const { data: productData, isLoading: isFetching } = useProduct(productId, { skip: !productId || isCreate });
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: subCategories = [] } = useGetSubCategoriesQuery();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showSubCategoryDialog, setShowSubCategoryDialog] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isCreate && productData) {
      setFormData({
        ...EMPTY_FORM,
        ...productData,
        id: productData._id || "",
        category: productData.category?._id || productData.category || "",
        subCategory: productData.subCategory?._id || productData.subCategory || "",
        defaultSupplier: productData.defaultSupplier?._id || productData.defaultSupplier || "",
        substitutes: productData.substitutes || [],
      });
      setImagePreview(productData.image ? `${IMAGE_BASE}/${productData.image}` : null);
    }
  }, [isCreate, productData]);

  useEffect(() => {
    if (isCreate && open) {
      setFormData(EMPTY_FORM);
      setImagePreview(null);
      setStep(0);
      setErrors({});
      setBanner(null);
    }
  }, [isCreate, open]);

  useEffect(() => {
    return () => { if (imagePreview?.startsWith?.("blob:")) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);

  const updateField = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  const generateSKU = () => updateField("hotKeySku", `SKU-${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
  const generateBarcode = () => updateField("barcode", (Math.floor(Math.random() * 9000000000000) + 1000000000000).toString());

  const handleImageChange = (file) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      setErrors(prev => ({ ...prev, image: "Only PNG, JPG, JPEG or WebP allowed" }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: "Max file size is 5MB" }));
      return;
    }
    updateField("image", file);
    setImagePreview(URL.createObjectURL(file));
  };

  const steps = useMemo(() => buildSteps({
    categories, subCategories, currentCategory: formData.category,
    openCategoryDialog: () => setShowCategoryDialog(true),
    openSubCategoryDialog: () => setShowSubCategoryDialog(true),
    generateSKU, generateBarcode,
    openScanner: () => setIsBarcodeOpen(true),
  }), [categories, subCategories, formData.category]);

  const validateStep = (stepIndex) => {
    const stepErrors = {};
    for (const field of steps[stepIndex].fields) {
      if (!field.required) continue;
      const val = formData[field.name];
      const isEmpty = val === "" || val === null || val === undefined || (typeof val === "number" && Number.isNaN(val));
      if (isEmpty) stepErrors[field.name] = `${field.label} is required`;
    }
    return stepErrors;
  };

  const validateAll = () => {
    for (let i = 0; i < steps.length; i++) {
      const stepErrors = validateStep(i);
      if (Object.keys(stepErrors).length > 0) {
        setStep(i);
        setErrors(stepErrors);
        setBanner(`"${steps[i].title}" section has ${Object.keys(stepErrors).length} field(s) that still need to be filled.`);
        return false;
      }
    }
    setBanner(null);
    return true;
  };

  const goNext = () => {
    const stepErrors = validateStep(step);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      setBanner(`Please fill the required fields in "${steps[step].title}" before continuing.`);
      return;
    }
    setBanner(null);
    setStep(s => Math.min(s + 1, steps.length - 1));
  };

  const goBack = () => { setBanner(null); setStep(s => Math.max(s - 1, 0)); };

  const onSubmit = async () => {
    if (!validateAll()) return;
    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "image") return;
      if (value === undefined || value === null) return;
      payload.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
    });
    if (formData.image instanceof File) {
      payload.append("image", formData.image);
    }
    try {
      if (isCreate) {
        await createProduct(payload).unwrap();
        showSuccess("Product created successfully");
      } else {
        await updateProduct({payload, id: productData._id}).unwrap();
        showSuccess("Product updated successfully");
      }
      onClose();
    } catch (error) {
      const errorMessage = error?.data?.message || error?.message || "Something went wrong while saving the product.";
      showError(errorMessage);
      setBanner(errorMessage);
    }
  };

  if (!open) return null;
  if (!isCreate && isFetching && !productData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
        <div className="bg-[var(--surface)] rounded-2xl p-8 text-[var(--muted)] text-sm">Product load ho raha hai...</div>
      </div>
    );
  }

  const current = steps[step];

  return (
    <>
      {isBarcodeOpen && <Scanner isOpen={isBarcodeOpen} setIsOpen={setIsBarcodeOpen} valueSetter={(v) => updateField("barcode", v)} />}
      {showCategoryDialog && <CategoryCRUDModal setVisibility={setShowCategoryDialog} operation="create" />}
      {showSubCategoryDialog && <SubCategoryCrudModel catagId={formData.category} setVisibility={setShowSubCategoryDialog} />}

      {/* ─── Overlay with blur ─── */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        {/* ─── Card ─── */}
        <div className="bg-[var(--surface)] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--ink)]">
              {isCreate ? "Add Product" : "Edit Product"}
            </h2>
            <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--ink)] text-sm transition-colors">
              ✕
            </button>
          </div>

          {/* Step Tabs */}
          <div className="flex gap-1 px-6 pt-4 overflow-x-auto no-scrollbar">
            {steps.map((s, i) => {
              const hasError = i === step && banner && Object.keys(errors).some(k => s.fields.some(f => f.name === k));
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStep(i)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                    ${i === step
                      ? "bg-[var(--accent-2)] text-white"
                      : "text-[var(--muted)] hover:bg-[var(--app-bg)]"
                    }`}
                >
                  {hasError && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                  {i + 1}. {s.title}
                </button>
              );
            })}
          </div>

          {/* Banner */}
          {banner && (
            <div className="mx-6 mt-3 flex items-start gap-2 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{banner}</span>
            </div>
          )}

          {/* Fields */}
          <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {current.fields.map((field) => (
                <FieldRenderer
                  key={field.name}
                  field={field}
                  value={formData[field.name]}
                  error={errors[field.name]}
                  onChange={(v) => updateField(field.name, v)}
                  onImageChange={handleImageChange}
                  imagePreview={imagePreview}
                  fileInputRef={fileInputRef}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)] bg-[var(--app-bg)]">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-[var(--muted)] disabled:opacity-40 hover:bg-[var(--surface)] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm bg-[var(--accent-2)] text-white hover:opacity-90 transition-opacity"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={isSaving}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm bg-[var(--accent-2)] text-white hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                <Check className="h-4 w-4" /> {isSaving ? "Saving..." : isCreate ? "Save Product" : "Update Product"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function FieldRenderer({ field, value, error, onChange, onImageChange, imagePreview, fileInputRef }) {
  const baseInput = `w-full rounded-lg border px-3 py-2 text-sm bg-[var(--app-bg)] text-[var(--ink)]
    placeholder:text-[var(--muted)] outline-none transition-colors
    ${error ? "border-red-500 focus:border-red-500" : "border-[var(--border)] focus:border-[var(--accent-2)]"}`;

  const wrapperSpan = field.span === "full" ? "sm:col-span-2" : "";

  const Label = () => (
    <label className="flex items-center justify-between text-xs font-medium text-[var(--muted)] mb-1">
      <span>
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {field.action && (
        <button
          type="button"
          onClick={field.action.onClick}
          className="flex items-center gap-1 text-[var(--accent-2)] hover:underline text-xs"
        >
          <field.action.icon className="h-3 w-3" /> {field.action.label}
        </button>
      )}
    </label>
  );

  return (
    <div className={wrapperSpan}>
      {field.type !== "toggle" && <Label />}

      {field.type === "text" && (
        <input
          className={baseInput}
          value={value || ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === "number" && (
        <input
          type="number"
          className={baseInput}
          value={value ?? 0}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.valueAsNumber ?? 0)}
        />
      )}

      {field.type === "textarea" && (
        <textarea
          rows={field.rows || 3}
          className={baseInput}
          value={value || ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === "select" && (
        <select
          disabled={field.disabled}
          className={baseInput}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{field.placeholder}</option>
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}

      {field.type === "tags" && (
        <input
          className={baseInput}
          placeholder={field.placeholder}
          value={(value || []).join(", ")}
          onChange={(e) => onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
        />
      )}

      {field.type === "toggle" && (
        <label className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--app-bg)] px-3 py-2 cursor-pointer">
          <span className="text-sm text-[var(--ink)]">{field.label}</span>
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent-2)]"
          />
        </label>
      )}

      {field.type === "image" && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); onImageChange(e.dataTransfer.files?.[0]); }}
          className={`flex items-center gap-3 rounded-lg border border-dashed px-3 py-3 cursor-pointer
            ${error ? "border-red-500" : "border-[var(--border)]"} bg-[var(--app-bg)]`}
        >
          {imagePreview ? (
            <img src={imagePreview} alt="preview" className="h-14 w-14 rounded-md object-cover" />
          ) : (
            <div className="h-14 w-14 rounded-md bg-[var(--surface)] flex items-center justify-center text-[var(--muted)] text-xs">
              No image
            </div>
          )}
          <div className="text-xs text-[var(--muted)]">
            <p className="text-[var(--ink)] text-sm">Click or drop to upload</p>
            {field.hint && <p>{field.hint}</p>}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={(e) => onImageChange(e.target.files?.[0])}
          />
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {field.hint && field.type !== "image" && !error && (
        <p className="mt-1 text-xs text-[var(--muted)]">{field.hint}</p>
      )}
    </div>
  );
}


























// import { useState, useEffect, useMemo, useRef } from "react";
// import { Scan, Sparkles, Plus, ChevronLeft, ChevronRight, AlertCircle, Check } from "lucide-react";
// import { useCreateProduct, useUpdateProduct } from "../services/product.service";
// import { useGetCategoriesQuery } from "../services/category.service.js";
// import { useGetSubCategoriesQuery } from "../services/subCategories.service.js";
// import { useProduct } from "../services/product.service.js";
// import Scanner from "@shared/components/Scanner";
// import CategoryCRUDModal from "./CategoryCRUDModal.jsx"; // FIX: was rendered as <AddCategories /> with no import
// import SubCategoryCrudModel from "./SubCategoryCRUDModal.jsx";
// import { showSuccess, showError, dismiss } from "@shared/utilities/toastHelpers.js";

// // ───────────────────────────────────────────────────────────────────────────
// // Section / step definitions. Each field optionally carries `required`.
// // Keeping this as one declarative table makes it easy to add/move fields
// // between sections without touching the render or validation logic below.
// // ───────────────────────────────────────────────────────────────────────────
// const EMPTY_FORM = {
//     name: "", genericName: "", brandName: "", hotKeySku: "", productCode: "",
//     barcode: "", description: "", image: "",
//     category: "", subCategory: "", form: "", strength: "", drugType: "",
//     scheduleType: "", isNarcotic: false,
//     unit: "Units", purchaseUnit: "Box",
//     manufacturer: "", defaultSupplier: "", countryOfOrigin: "",
//     defaultSalePrice: 0, defaultPurchasePrice: 0, taxPercent: 0, isDiscountAllowed: true,
//     minStockLevel: 5, maxStockLevel: 10, allowNegativeStock: true,
//     rackLocation: "", storageCondition: "",
//     drugInteractionWarning: "",
//     isActive: true,
// };

// function buildSteps({ categories, subCategories, currentCategory, openCategoryDialog, openSubCategoryDialog, generateSKU, generateBarcode, openScanner }) {
//     return [
//         {
//             id: "basic",
//             title: "Basic Info",
//             fields: [
//                 { name: "image", label: "Product Image", type: "image", span: "full", hint: "PNG, JPG, WebP — max 5MB" },
//                 { name: "name", label: "Product Name", type: "text", required: true, placeholder: "Product ka naam likhein" },
//                 { name: "genericName", label: "Generic Name", type: "text", required: true, placeholder: "e.g., Paracetamol" },
//                 { name: "brandName", label: "Brand Name", type: "text", placeholder: "e.g., Panadol" },
//                 { name: "hotKeySku", label: "Hot Key / SKU", type: "text", required: true, placeholder: "SKU-XXXXXXXX", action: { label: "Generate", icon: Sparkles, onClick: generateSKU } },
//                 { name: "productCode", label: "Product Code", type: "text", placeholder: "e.g., PROD-001" },
//                 { name: "barcode", label: "Barcode", type: "text", placeholder: "Scan or type barcode", action: { label: "Scan", icon: Scan, onClick: openScanner } },
//                 { name: "description", label: "Description", type: "textarea", rows: 3, span: "full", placeholder: "Product description likhein" },
//             ],
//         },
//         {
//             id: "classification",
//             title: "Classification",
//             fields: [
//                 { name: "category", label: "Category", type: "select", required: true, placeholder: "Category chunein...", options: categories.map(c => ({ label: c.name, value: c._id })), action: { label: "New", icon: Plus, onClick: openCategoryDialog } },
//                 { name: "subCategory", label: "Sub Category", type: "select", required: true, placeholder: "Sub category chunein...", disabled: !currentCategory, options: subCategories.map(c => ({ label: c.name, value: c._id })), action: { label: "New", icon: Plus, onClick: openSubCategoryDialog } },
//                 { name: "form", label: "Form", type: "text", required: true, placeholder: "e.g., Tablet, Syrup, Injection" },
//                 { name: "strength", label: "Strength", type: "text", required: true, placeholder: "e.g., 500mg, 250ml" },
//                 { name: "drugType", label: "Drug Type", type: "text", placeholder: "e.g., Branded, Generic" },
//                 { name: "scheduleType", label: "Schedule Type", type: "text", required: true, placeholder: "e.g., OTC, Prescription" },
//                 { name: "isNarcotic", label: "Narcotic / Controlled", type: "toggle" },
//             ],
//         },
//         {
//             id: "pricing",
//             title: "Units & Pricing",
//             fields: [
//                 { name: "unit", label: "Sale Unit", type: "text", required: true, placeholder: "e.g., Strip, Bottle, Piece" },
//                 { name: "purchaseUnit", label: "Purchase Unit", type: "text", placeholder: "e.g., Box, Carton" },
//                 { name: "defaultSalePrice", label: "Default Sale Price", type: "number", required: true, placeholder: "0.00" },
//                 { name: "defaultPurchasePrice", label: "Default Purchase Price", type: "number", placeholder: "0.00" },
//                 { name: "taxPercent", label: "Tax %", type: "number", placeholder: "0" },
//                 { name: "isDiscountAllowed", label: "Discount Allowed", type: "toggle" },
//             ],
//         },
//         {
//             id: "stock",
//             title: "Stock & Storage",
//             fields: [
//                 { name: "minStockLevel", label: "Min Stock Level", type: "number", placeholder: "0" },
//                 { name: "maxStockLevel", label: "Max Stock Level", type: "number", placeholder: "0" },
//                 { name: "allowNegativeStock", label: "Allow Negative Stock", type: "toggle" },
//                 { name: "rackLocation", label: "Rack Location", type: "text", placeholder: "e.g., A1, B3" },
//                 { name: "storageCondition", label: "Storage Condition", type: "text", placeholder: "e.g., Normal, Refrigerated" },
//             ],
//         },
//         {
//             id: "other",
//             title: "Manufacturer & Medical Info",
//             fields: [
//                 { name: "manufacturer", label: "Manufacturer", type: "text", placeholder: "Manufacturer ka naam" },
//                 { name: "defaultSupplier", label: "Default Supplier", type: "text", placeholder: "Supplier ID / name" },
//                 { name: "countryOfOrigin", label: "Country of Origin", type: "text", placeholder: "e.g., Pakistan, China" },
//                 // { name: "substitutes", label: "Substitutes", type: "tags", span: "full", placeholder: "Comma separated, e.g., Panadol, Calpol" },
//                 { name: "drugInteractionWarning", label: "Drug Interaction Warning", type: "textarea", rows: 3, span: "full", placeholder: "Koi drug interaction warning..." },
//                 { name: "isActive", label: "Active", type: "toggle" },
//             ],
//         },
//     ];
// }

// export default function ProductCRUDModal({ mode = "create", productId = null, open, onClose }) {
//     const isCreate = mode === "create";
//     const [createProduct, { isLoading: isCreating }] = useCreateProduct();
//     const [updateProduct, { isLoading: isUpdating }] = useUpdateProduct();
//     const isSaving = isCreating || isUpdating;

//     const { data: productData, isLoading: isFetching } = useProduct(productId, { skip: !productId || isCreate });
//     const { data: categories = [] } = useGetCategoriesQuery();
//     const { data: subCategories = [] } = useGetSubCategoriesQuery();

//     const [formData, setFormData] = useState(EMPTY_FORM);
//     const [step, setStep] = useState(0);
//     const [errors, setErrors] = useState({});
//     const [banner, setBanner] = useState(null);
//     const [imagePreview, setImagePreview] = useState(null);
//     const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
//     const [showCategoryDialog, setShowCategoryDialog] = useState(false);
//     const [showSubCategoryDialog, setShowSubCategoryDialog] = useState(false);
//     const fileInputRef = useRef(null);

//     // Prefill (update) / reset (create)
//     useEffect(() => {
//         if (!isCreate && productData) {
//             setFormData({
//                 ...EMPTY_FORM,
//                 ...productData,
//                 id: productData._id || "",
//                 category: productData.category?._id || productData.category || "",
//                 subCategory: productData.subCategory?._id || productData.subCategory || "",
//                 defaultSupplier: productData.defaultSupplier?._id || productData.defaultSupplier || "",
//                 substitutes: productData.substitutes || [],
//             });
//             setImagePreview(productData.image ? `${IMAGE_BASE}/${productData.image}` : null);
//         }
//     }, [isCreate, productData]);

//     useEffect(() => {
//         if (isCreate && open) {
//             setFormData(EMPTY_FORM);
//             setImagePreview(null);
//             setStep(0);
//             setErrors({});
//             setBanner(null);
//         }
//     }, [isCreate, open]);

//     // Revoke object URLs created for local file previews
//     useEffect(() => {
//         return () => { if (imagePreview?.startsWith?.("blob:")) URL.revokeObjectURL(imagePreview); };
//     }, [imagePreview]);

//     const updateField = (name, value) => {
//         setFormData(prev => ({ ...prev, [name]: value }));
//         setErrors(prev => (prev[name] ? { ...prev, [name]: undefined } : prev));
//     };

//     const generateSKU = () => updateField("hotKeySku", `SKU-${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
//     const generateBarcode = () => updateField("barcode", (Math.floor(Math.random() * 9000000000000) + 1000000000000).toString());

//     const handleImageChange = (file) => {
//         if (!file) return;
//         if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
//             setErrors(prev => ({ ...prev, image: "Only PNG, JPG, JPEG or WebP allowed" }));
//             return;
//         }
//         if (file.size > 5 * 1024 * 1024) {
//             setErrors(prev => ({ ...prev, image: "Max file size is 5MB" }));
//             return;
//         }
//         updateField("image", file);
//         setImagePreview(URL.createObjectURL(file));
//     };

//     const steps = useMemo(() => buildSteps({
//         categories, subCategories, currentCategory: formData.category,
//         openCategoryDialog: () => setShowCategoryDialog(true),
//         openSubCategoryDialog: () => setShowSubCategoryDialog(true),
//         generateSKU, generateBarcode,
//         openScanner: () => setIsBarcodeOpen(true),
//     }), [categories, subCategories, formData.category]);

//     // Returns { fieldName: message } for missing required fields in a step
//     const validateStep = (stepIndex) => {
//         const stepErrors = {};
//         for (const field of steps[stepIndex].fields) {
//             if (!field.required) continue;
//             const val = formData[field.name];
//             const isEmpty = val === "" || val === null || val === undefined || (typeof val === "number" && Number.isNaN(val));
//             if (isEmpty) stepErrors[field.name] = `${field.label} is required`;
//         }
//         return stepErrors;
//     };

//     // Validates every step in order; on first failure jumps there and returns false
//     const validateAll = () => {
//         for (let i = 0; i < steps.length; i++) {
//             const stepErrors = validateStep(i);
//             if (Object.keys(stepErrors).length > 0) {
//                 setStep(i);
//                 setErrors(stepErrors);
//                 setBanner(`"${steps[i].title}" section has ${Object.keys(stepErrors).length} field(s) that still need to be filled.`);
//                 return false;
//             }
//         }
//         setBanner(null);
//         return true;
//     };

//     const goNext = () => {
//         const stepErrors = validateStep(step);
//         if (Object.keys(stepErrors).length > 0) {
//             setErrors(stepErrors);
//             setBanner(`Please fill the required fields in "${steps[step].title}" before continuing.`);
//             return;
//         }
//         setBanner(null);
//         setStep(s => Math.min(s + 1, steps.length - 1));
//     };

//     const goBack = () => { setBanner(null); setStep(s => Math.max(s - 1, 0)); };

//     const onSubmit = async () => {
//         if (!validateAll()) return;

//         // Build multipart payload — the API route accepts the product fields
//         // and the image file together in one multipart/form-data request
//         // (multer's upload.single("image") + the yup-validated body).
//         const payload = new FormData();
//         Object.entries(formData).forEach(([key, value]) => {
//             if (key === "image") return;
//             if (value === undefined || value === null) return;
//             payload.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
//         });
//         if (formData.image instanceof File) {
//             payload.append("image", formData.image); // matches multer field name "image"
//         }

//         try {
//             if (isCreate) {
//                 await createProduct(payload).unwrap();
//                 showSuccess("Product created successfully");
//             } else {
//                 payload.append("id", productData._id);  
//                 await updateProduct({...payload}).unwrap();
//                 showSuccess("Product updated successfully");
//             }
//             onClose();
//         } catch (error) {
//             const errorMessage = error?.data?.message || error?.message || "Something went wrong while saving the product.";
//             showError(errorMessage);
//             setBanner(errorMessage);
//         }
//     };

//     if (!open) return null;

//     if (!isCreate && isFetching && !productData) {
//         return (
//             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
//                 <div className="bg-(--surface) rounded-2xl p-8 text-(--muted) text-sm">Product load ho raha hai...</div>
//             </div>
//         );
//     }

//     const current = steps[step];

//     return (
//         <>
//             {isBarcodeOpen && <Scanner isOpen={isBarcodeOpen} setIsOpen={setIsBarcodeOpen} valueSetter={(v) => updateField("barcode", v)} />}
//             {showCategoryDialog && <CategoryCRUDModal setVisibility={setShowCategoryDialog} operation="create" />}
//             {showSubCategoryDialog && <SubCategoryCrudModel catagId={formData.category} setVisibility={setShowSubCategoryDialog} />}

//             <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
//                 <div className="bg-(--surface) rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
//                     {/* Header */}
//                     <div className="flex items-center justify-between px-6 py-4 border-b border-(--border)">
//                         <h2 className="text-lg font-semibold text-(--foreground)">{isCreate ? "Add Product" : "Edit Product"}</h2>
//                         <button onClick={onClose} className="text-(--muted) hover:text-(--foreground) text-sm">✕</button>
//                     </div>

//                     {/* Step tabs */}
//                     <div className="flex gap-1 px-6 pt-4 overflow-x-auto">
//                         {steps.map((s, i) => {
//                             const hasError = i === step && banner && Object.keys(errors).some(k => s.fields.some(f => f.name === k));
//                             return (
//                                 <button
//                                     key={s.id}
//                                     type="button"
//                                     onClick={() => setStep(i)}
//                                     className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
//                                         ${i === step ? "bg-(--primary) text-(--primary-foreground)" : "text-(--muted) hover:bg-(--background)"}`}
//                                 >
//                                     {hasError && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
//                                     {i + 1}. {s.title}
//                                 </button>
//                             );
//                         })}
//                     </div>

//                     {/* Banner */}
//                     {banner && (
//                         <div className="mx-6 mt-3 flex items-start gap-2 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">
//                             <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
//                             <span>{banner}</span>
//                         </div>
//                     )}

//                     {/* Fields */}
//                     <div className="flex-1 overflow-y-auto px-6 py-4">
//                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                             {current.fields.map((field) => (
//                                 <FieldRenderer
//                                     key={field.name}
//                                     field={field}
//                                     value={formData[field.name]}
//                                     error={errors[field.name]}
//                                     onChange={(v) => updateField(field.name, v)}
//                                     onImageChange={handleImageChange}
//                                     imagePreview={imagePreview}
//                                     fileInputRef={fileInputRef}
//                                 />
//                             ))}
//                         </div>
//                     </div>

//                     {/* Footer nav */}
//                     <div className="flex items-center justify-between px-6 py-4 border-t border-(--border)">
//                         <button
//                             type="button"
//                             onClick={goBack}
//                             disabled={step === 0}
//                             className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-(--muted) disabled:opacity-40 hover:bg-(--background)"
//                         >
//                             <ChevronLeft className="h-4 w-4" /> Back
//                         </button>

//                         {step < steps.length - 1 ? (
//                             <button
//                                 type="button"
//                                 onClick={goNext}
//                                 className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm bg-(--primary) text-(--primary-foreground) hover:opacity-90"
//                             >
//                                 Next <ChevronRight className="h-4 w-4" />
//                             </button>
//                         ) : (
//                             <button
//                                 type="button"
//                                 onClick={onSubmit}
//                                 disabled={isSaving}
//                                 className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm bg-(--primary) text-(--primary-foreground) hover:opacity-90 disabled:opacity-60"
//                             >
//                                 <Check className="h-4 w-4" /> {isSaving ? "Saving..." : isCreate ? "Save Product" : "Update Product"}
//                             </button>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </>
//     );
// }

// // ───────────────────────────────────────────────────────────────────────────
// // Generic field renderer — keeps the same input styling conventions used
// // elsewhere in the app (bg-(--surface) / text-(--muted) / rounded tokens).
// // ───────────────────────────────────────────────────────────────────────────
// function FieldRenderer({ field, value, error, onChange, onImageChange, imagePreview, fileInputRef }) {
//     const baseInput = `w-full rounded-lg border px-3 py-2 text-sm bg-(--background) text-(--foreground)
//         placeholder:text-(--muted) outline-none transition-colors
//         ${error ? "border-red-500 focus:border-red-500" : "border-(--border) focus:border-(--primary)"}`;

//     const wrapperSpan = field.span === "full" ? "sm:col-span-2" : "";

//     const Label = () => (
//         <label className="flex items-center justify-between text-xs font-medium text-(--muted) mb-1">
//             <span>{field.label}{field.required && <span className="text-red-500"> *</span>}</span>
//             {field.action && (
//                 <button type="button" onClick={field.action.onClick} className="flex items-center gap-1 text-(--primary) hover:underline">
//                     <field.action.icon className="h-3 w-3" /> {field.action.label}
//                 </button>
//             )}
//         </label>
//     );

//     return (
//         <div className={wrapperSpan}>
//             {field.type !== "toggle" && <Label />}

//             {field.type === "text" && <input className={baseInput} value={value || ""} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />}

//             {field.type === "number" && <input type="number" className={baseInput} value={value ?? 0} placeholder={field.placeholder} onChange={(e) => onChange(e.target.valueAsNumber ?? 0)} />}

//             {field.type === "textarea" && <textarea rows={field.rows || 3} className={baseInput} value={value || ""} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />}

//             {field.type === "select" && (
//                 <select disabled={field.disabled} className={baseInput} value={value || ""} onChange={(e) => onChange(e.target.value)}>
//                     <option value="">{field.placeholder}</option>
//                     {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
//                 </select>
//             )}

//             {field.type === "tags" && (
//                 <input
//                     className={baseInput}
//                     placeholder={field.placeholder}
//                     value={(value || []).join(", ")}
//                     onChange={(e) => onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
//                 />
//             )}

//             {field.type === "toggle" && (
//                 <label className="flex items-center justify-between rounded-lg border border-(--border) bg-(--background) px-3 py-2">
//                     <span className="text-sm text-(--foreground)">{field.label}</span>
//                     <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-(--primary)" />
//                 </label>
//             )}

//             {field.type === "image" && (
//                 <div
//                     onClick={() => fileInputRef.current?.click()}
//                     onDragOver={(e) => e.preventDefault()}
//                     onDrop={(e) => { e.preventDefault(); onImageChange(e.dataTransfer.files?.[0]); }}
//                     className={`flex items-center gap-3 rounded-lg border border-dashed px-3 py-3 cursor-pointer
//                         ${error ? "border-red-500" : "border-(--border)"} bg-(--background)`}
//                 >
//                     {imagePreview ? (
//                         <img src={imagePreview} alt="preview" className="h-14 w-14 rounded-md object-cover" />
//                     ) : (
//                         <div className="h-14 w-14 rounded-md bg-(--surface) flex items-center justify-center text-(--muted) text-xs">No image</div>
//                     )}
//                     <div className="text-xs text-(--muted)">
//                         <p className="text-(--foreground) text-sm">Click or drop to upload</p>
//                         {field.hint && <p>{field.hint}</p>}
//                     </div>
//                     <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={(e) => onImageChange(e.target.files?.[0])} />
//                 </div>
//             )}

//             {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
//             {field.hint && field.type !== "image" && !error && <p className="mt-1 text-xs text-(--muted)">{field.hint}</p>}
//         </div>
//     );
// }






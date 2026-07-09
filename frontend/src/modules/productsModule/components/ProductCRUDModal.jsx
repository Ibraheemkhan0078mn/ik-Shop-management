// src/components/ProductCRUDModal.jsx
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Scan, Plus, AlertCircle, Check, ChevronDown, ChevronUp } from "lucide-react";
import { useCreateProduct, useUpdateProduct, useProduct } from "../services/product.service";
import { useGetCategoriesQuery } from "../services/category.service.js";
import { useGetSubCategoriesQuery } from "../services/subCategories.service.js";
import Scanner from "../../../shared/components/Scanner.jsx";
import CategoryCRUDModal from "./CategoryCRUDModal.jsx";
import SubCategoryCrudModel from "./SubCategoryCRUDModal.jsx";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import SubCategoryCRUDModal from "./SubCategoryCRUDModal.jsx";
import { getProductLabels } from "../labels/productLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";

const IMAGE_BASE = "http://localhost:5001/uploads";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

const EMPTY_FORM = {
  name: "",
  brandName: "",
  productCode: "",
  barcode: "",
  description: "",
  category: "",
  subCategory: "",
  unit: "pcs",
  defaultCostPrice: 0,
  defaultRetailPrice: 0,
  defaultWholesalePrice: 0,
  taxPercent: 0,
  taxType: "percentage",
  minStockLevel: 5,
  maxStockLevel: 10,
  allowNegativeStock: false,
  isDiscountAllowed: false,
  maxDiscountPercent: 0,
  rackLocation: "",
  isActive: true,
  image: "",
};

const safeArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && data.data) return Array.isArray(data.data) ? data.data : [];
  return [];
};

export default function ProductCRUDModal({ mode = "create", productId = null, open, onClose }) {
  const { settings } = useSettings();
  const language = settings?.language || "en";
  const labels = getProductLabels(language);
  
  const isCreate = mode === "create";
  const [createProduct, { isLoading: isCreating }] = useCreateProduct();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProduct();
  const isSaving = isCreating || isUpdating;

  const UNITS = [
    { value: "pcs", label: labels.countPcs },
    { value: "mg", label: labels.weightMg },
    { value: "g", label: labels.weightG },
    { value: "kg", label: labels.weightKg },
    { value: "ml", label: labels.volumeMl },
    { value: "L", label: labels.volumeL },
  ];

  const { data: productData, isLoading: isFetching, error: productError } = useProduct(productId, {
    skip: !productId || isCreate,
  });
  const { data: categoriesRaw, error: catError } = useGetCategoriesQuery();
  const { data: subCategoriesRaw, error: subError } = useGetSubCategoriesQuery();

  const categories = useMemo(() => safeArray(categoriesRaw), [categoriesRaw]);
  const subCategories = useMemo(() => safeArray(subCategoriesRaw), [subCategoriesRaw]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showSubCategoryDialog, setShowSubCategoryDialog] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isCreate && productData) {
      const safeGetId = (item) => item?._id || item || "";
      setForm({
        ...EMPTY_FORM,
        ...productData,
        id: productData._id || "",
        category: safeGetId(productData.category),
        subCategory: safeGetId(productData.subCategory),
      });
      setImagePreview(productData.image ? `${IMAGE_BASE}/${productData.image}` : null);
    }
  }, [isCreate, productData]);

  useEffect(() => {
    if (isCreate && open) {
      setForm(EMPTY_FORM);
      setImagePreview(null);
      setErrors({});
      setBanner(null);
      setShowMore(false);
    }
  }, [isCreate, open]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith?.("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    const apiError = productError || catError || subError;
    if (apiError) {
      setBanner(`⚠️ ${apiError?.data?.message || apiError?.message || "Failed to load data"}`);
    }
  }, [productError, catError, subError]);

  const updateField = useCallback((name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  }, []);

  // Handle category creation callback
  const handleCategoryCreated = useCallback((newCategory) => {
    console.log('Category created:', newCategory);
    // Invalidate the categories query to refetch
    // The RTK Query will automatically refetch when the component re-renders
    // Set the newly created category as selected
    if (newCategory?._id || newCategory?.data?._id) {
      const categoryId = newCategory._id || newCategory.data._id;
      updateField('category', categoryId);
    }
  }, [updateField]);

  // Handle subcategory creation callback
  const handleSubCategoryCreated = useCallback((newSubCategory) => {
    console.log('Subcategory created:', newSubCategory);
    // Invalidate the subcategories query to refetch
    // Set the newly created subcategory as selected
    if (newSubCategory?._id || newSubCategory?.data?._id) {
      const subCategoryId = newSubCategory._id || newSubCategory.data._id;
      updateField('subCategory', subCategoryId);
    }
  }, [updateField]);

  const handleImageChange = useCallback(
    (file) => {
      if (!file) return;
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setErrors((prev) => ({ ...prev, image: labels.onlyPngJpg }));
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setErrors((prev) => ({ ...prev, image: labels.maxFileSize }));
        return;
      }
      updateField("image", file);
      setImagePreview(URL.createObjectURL(file));
    },
    [updateField, labels]
  );

  const categoryOptions = useMemo(() => categories.map((c) => ({ label: c.name, value: c._id })), [categories]);
  const subCategoryOptions = useMemo(() => subCategories.map((c) => ({ label: c.name, value: c._id })), [subCategories]);
  const unitOptions = useMemo(() => UNITS.map((u) => ({ label: u.label, value: u.value })), []);

  const validateForm = useCallback(() => {
    const newErrors = {};

    // Always required
    if (!form.name?.trim()) newErrors.name = labels.productNameRequired;
    if (!form.image) newErrors.image = labels.productImageRequired;
    if (!form.category) newErrors.category = labels.categoryRequired;
    if (!form.subCategory) newErrors.subCategory = labels.subCategoryRequired;

    // Required inside "more options"
    if (showMore || !isCreate) {
      if (!form.brandName?.trim()) newErrors.brandName = labels.brandNameRequired;
      if (!form.barcode?.trim()) newErrors.barcode = labels.barcodeRequired;
      if (!form.description?.trim()) newErrors.description = labels.descriptionRequired;
      if (!form.unit) newErrors.unit = labels.unitRequired;
      const priceFields = ["defaultCostPrice", "defaultRetailPrice", "defaultWholesalePrice"];
      priceFields.forEach((f) => {
        if (form[f] === "" || form[f] === null || form[f] === undefined || isNaN(form[f]))
          newErrors[f] = `${f.replace("default", "").replace(/([A-Z])/g, " $1").trim()} is required`;
      });
      if (isNaN(form.minStockLevel)) newErrors.minStockLevel = labels.minStockLevelRequired;
      if (isNaN(form.maxStockLevel)) newErrors.maxStockLevel = labels.maxStockLevelRequired;
      if (form.maxStockLevel <= form.minStockLevel)
        newErrors.maxStockLevel = labels.maxGreaterThanMin;
      if (form.isDiscountAllowed && form.maxDiscountPercent <= 0)
        newErrors.maxDiscountPercent = labels.mustBeGreaterThanZero;
    }

    setErrors(newErrors);
    const count = Object.keys(newErrors).length;
    if (count > 0) {
      // Auto-expand if errors are in optional section
      const optionalKeys = ["brandName", "barcode", "description", "unit", "defaultCostPrice",
        "defaultRetailPrice", "defaultWholesalePrice", "minStockLevel", "maxStockLevel", "maxDiscountPercent"];
      if (optionalKeys.some((k) => newErrors[k])) setShowMore(true);
      setBanner(labels.fixErrors.replace('{count}', count));
      return false;
    }
    setBanner(null);
    return true;
  }, [form, showMore, isCreate, labels]);

  const onSubmit = useCallback(async () => {
    if (!validateForm()) return;
    const payload = new FormData();
    const exclude = ["batches", "createdAt", "updatedAt", "__v", "_id", "id", "batchSellingPrice"];
    Object.entries(form).forEach(([key, value]) => {
      if (key === "image" || exclude.includes(key)) return;
      if (value === undefined || value === null) return;
      payload.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
    });
    if (form.image instanceof File) payload.append("image", form.image);
    try {
      if (isCreate) {
        await createProduct(payload).unwrap();
        showSuccess("Product created successfully 🎉");
      } else {
        await updateProduct({ payload, id: productData._id }).unwrap();
        showSuccess("Product updated successfully ✅");
      }
      onClose();
    } catch (error) {
      const msg = error?.data?.message || error?.message || "Something went wrong.";
      showError(msg);
      setBanner(`❌ ${msg}`);
    }
  }, [form, isCreate, productData, createProduct, updateProduct, onClose, validateForm]);

  if (!open) return null;

  if (!isCreate && isFetching && !productData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
        <div className="bg-[var(--surface)] rounded-2xl p-8 text-[var(--muted)] text-sm animate-pulse">
          {labels.loadingProduct}
        </div>
      </div>
    );
  }

  return (
    <>
      {isBarcodeOpen && <Scanner isOpen={isBarcodeOpen} setIsOpen={setIsBarcodeOpen} valueSetter={(v) => updateField("barcode", v)} />}
      {showCategoryDialog && <CategoryCRUDModal mode="create" open={showCategoryDialog} onClose={setShowCategoryDialog} onCategoryCreated={handleCategoryCreated} />}
      {showSubCategoryDialog && <SubCategoryCRUDModal categoryId={form.category} mode="create" open={showSubCategoryDialog} onClose={setShowSubCategoryDialog} onSubCategoryCreated={handleSubCategoryCreated} />}

      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4">
        <div className="bg-[var(--surface)] rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
            <h2 className="text-base font-semibold text-[var(--ink)]">
              {isCreate ? labels.addProduct : labels.editProduct}
            </h2>
            <button
              onClick={onClose}
              className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors hover:rotate-90 duration-200 text-lg"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Banner */}
          {banner && (
            <div className="mx-5 mt-3 flex items-start gap-2 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-500 animate-in slide-in-from-top-1 duration-200">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{banner}</span>
            </div>
          )}

          {/* Form */}
          <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar space-y-5">

            {/* ── Core Section ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Image Upload */}
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-[var(--muted)] mb-1.5 block">
                  {labels.productImage} <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); handleImageChange(e.dataTransfer.files?.[0]); }}
                  className={`flex items-center gap-4 rounded-xl border-2 border-dashed px-4 py-3 cursor-pointer transition-all
                    ${errors.image
                      ? "border-red-500 bg-red-500/5"
                      : "border-[var(--border)] hover:border-[var(--accent-2)] hover:bg-[var(--accent-2)]/5"
                    } bg-[var(--app-bg)]`}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="h-14 w-14 rounded-lg object-cover ring-2 ring-[var(--accent-2)]/30" />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-[var(--surface)] flex items-center justify-center text-2xl shrink-0">
                      📷
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-[var(--ink)]">
                      {imagePreview ? labels.changeImage : labels.clickOrDrag}
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{labels.pngJpgWebp}</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={(e) => handleImageChange(e.target.files?.[0])}
                  />
                </div>
                {errors.image && <p className="mt-1 text-xs text-red-500">{errors.image}</p>}
              </div>

              {/* Name */}
              <Field
                label={labels.productName}
                name="name"
                value={form.name}
                onChange={updateField}
                error={errors.name}
                required
                placeholder="e.g., Paracetamol 500mg"
              />

              {/* Product Code — optional but visible */}
              <Field
                label={labels.productCode}
                name="productCode"
                value={form.productCode}
                onChange={updateField}
                error={errors.productCode}
                placeholder="e.g., PROD-001"
              />

              {/* Category */}
              <SelectField
                label={labels.category}
                name="category"
                value={form.category}
                onChange={updateField}
                options={categoryOptions}
                error={errors.category}
                required
                placeholder={labels.selectCategory}
                action={{ label: labels.new, icon: Plus, onClick: () => setShowCategoryDialog(true) }}
              />

              {/* Sub Category */}
              <SelectField
                label={labels.subCategory}
                name="subCategory"
                value={form.subCategory}
                onChange={updateField}
                options={subCategoryOptions}
                error={errors.subCategory}
                required
                placeholder={labels.selectSubCategory}
                disabled={!form.category}
                action={{ label: labels.new, icon: Plus, onClick: () => setShowSubCategoryDialog(true) }}
              />

              {/* Active Status */}
              <div className="sm:col-span-2">
                <ToggleField
                  label={labels.active}
                  name="isActive"
                  value={form.isActive}
                  onChange={updateField}
                />
              </div>
            </div>

            {/* ── More Options Toggle ── */}
            <button
              type="button"
              onClick={() => setShowMore((p) => !p)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--app-bg)] text-sm text-[var(--muted)] hover:border-[var(--accent-2)] hover:text-[var(--accent-2)] transition-all"
            >
              <span>{showMore ? labels.hideAdditionalFields : labels.showMoreOptions}</span>
              {showMore ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {/* ── Optional Fields ── */}
            {showMore && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">

                <Field
                  label={labels.brandName}
                  name="brandName"
                  value={form.brandName}
                  onChange={updateField}
                  error={errors.brandName}
                  placeholder="e.g., GSK"
                />

                {/* Barcode */}
                <Field
                  label={labels.barcode}
                  name="barcode"
                  value={form.barcode}
                  onChange={updateField}
                  error={errors.barcode}
                  placeholder={labels.scanOrType}
                  action={{ label: labels.scan, icon: Scan, onClick: () => setIsBarcodeOpen(true) }}
                />

                <div className="sm:col-span-2">
                  <Field
                    label={labels.description}
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    error={errors.description}
                    placeholder={labels.productDescription}
                    type="textarea"
                    rows={3}
                  />
                </div>

                <SelectField
                  label={labels.unit}
                  name="unit"
                  value={form.unit}
                  onChange={updateField}
                  options={unitOptions}
                  error={errors.unit}
                  placeholder={labels.selectUnit}
                />

                <Field
                  label={labels.defaultCostPrice}
                  name="defaultCostPrice"
                  value={form.defaultCostPrice}
                  onChange={updateField}
                  error={errors.defaultCostPrice}
                  type="number"
                  placeholder="0.00"
                />

                <Field
                  label={labels.defaultRetailPrice}
                  name="defaultRetailPrice"
                  value={form.defaultRetailPrice}
                  onChange={updateField}
                  error={errors.defaultRetailPrice}
                  type="number"
                  placeholder="0.00"
                />

                <Field
                  label={labels.defaultWholesalePrice}
                  name="defaultWholesalePrice"
                  value={form.defaultWholesalePrice}
                  onChange={updateField}
                  error={errors.defaultWholesalePrice}
                  type="number"
                  placeholder="0.00"
                />

                <Field
                  label={labels.taxPercent}
                  name="taxPercent"
                  value={form.taxPercent}
                  onChange={updateField}
                  type="number"
                  placeholder="0"
                />

                <SelectField
                  label={labels.taxType}
                  name="taxType"
                  value={form.taxType}
                  onChange={updateField}
                  options={[
                    { label: labels.percentage, value: "percentage" },
                    { label: labels.fixed, value: "fixed" },
                  ]}
                  placeholder={labels.selectTaxType}
                />

                <Field
                  label={labels.minStockLevel}
                  name="minStockLevel"
                  value={form.minStockLevel}
                  onChange={updateField}
                  error={errors.minStockLevel}
                  type="number"
                  placeholder="5"
                />

                <Field
                  label={labels.maxStockLevel}
                  name="maxStockLevel"
                  value={form.maxStockLevel}
                  onChange={updateField}
                  error={errors.maxStockLevel}
                  type="number"
                  placeholder="10"
                />

                <ToggleField
                  label={labels.allowNegativeStock}
                  name="allowNegativeStock"
                  value={form.allowNegativeStock}
                  onChange={updateField}
                />

                <ToggleField
                  label={labels.allowDiscount}
                  name="isDiscountAllowed"
                  value={form.isDiscountAllowed}
                  onChange={updateField}
                />

                {form.isDiscountAllowed && (
                  <Field
                    label={labels.maxDiscountPercent}
                    name="maxDiscountPercent"
                    value={form.maxDiscountPercent}
                    onChange={updateField}
                    error={errors.maxDiscountPercent}
                    type="number"
                    placeholder="e.g., 10"
                  />
                )}

                <Field
                  label={labels.rackLocation}
                  name="rackLocation"
                  value={form.rackLocation}
                  onChange={updateField}
                  placeholder="e.g., A1, B3"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[var(--border)] bg-[var(--app-bg)] shrink-0 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-[var(--muted)] hover:bg-[var(--surface)] transition-colors"
            >
              {labels.cancel}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm bg-[var(--accent-2)] text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
            >
              <Check className="h-4 w-4" />
              {isSaving ? labels.saving : isCreate ? labels.saveProduct : labels.updateProduct}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Sub Components ────────────────────────────────────────────────────

function Field({ label, name, value, onChange, error, required, type = "text", placeholder, rows, action }) {
  const base = `w-full rounded-lg border px-3 py-2 text-sm bg-[var(--app-bg)] text-[var(--ink)] placeholder:text-[var(--muted)] outline-none transition-colors`;
  const state = error
    ? "border-red-500 focus:border-red-500 ring-1 ring-red-500/20"
    : "border-[var(--border)] focus:border-[var(--accent-2)] focus:ring-1 focus:ring-[var(--accent-2)]/20";

  return (
    <div>
      <label className="flex items-center justify-between text-xs font-medium text-[var(--muted)] mb-1">
        <span>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</span>
        {action && (
          <button type="button" onClick={action.onClick}
            className="flex items-center gap-1 text-[var(--accent-2)] hover:opacity-75 text-[10px] transition-opacity">
            <action.icon className="h-3 w-3" /> {action.label}
          </button>
        )}
      </label>
      {type === "textarea" ? (
        <textarea rows={rows || 3} className={`${base} ${state}`} value={value || ""} placeholder={placeholder}
          onChange={(e) => onChange(name, e.target.value)} />
      ) : type === "number" ? (
        <input type="number" min={0} step="any" className={`${base} ${state}`} value={value ?? 0} placeholder={placeholder}
          onChange={(e) => onChange(name, e.target.valueAsNumber ?? 0)} />
      ) : (
        <input type="text" className={`${base} ${state}`} value={value || ""} placeholder={placeholder}
          onChange={(e) => onChange(name, e.target.value)} />
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, error, required, placeholder, disabled, action }) {
  const base = `w-full rounded-lg border px-3 py-2 text-sm bg-[var(--app-bg)] text-[var(--ink)] outline-none transition-colors`;
  const state = error
    ? "border-red-500 focus:border-red-500 ring-1 ring-red-500/20"
    : "border-[var(--border)] focus:border-[var(--accent-2)] focus:ring-1 focus:ring-[var(--accent-2)]/20";

  return (
    <div>
      <label className="flex items-center justify-between text-xs font-medium text-[var(--muted)] mb-1">
        <span>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</span>
        {action && (
          <button type="button" onClick={action.onClick}
            className="flex items-center gap-1 text-[var(--accent-2)] hover:opacity-75 text-[10px] transition-opacity">
            <action.icon className="h-3 w-3" /> {action.label}
          </button>
        )}
      </label>
      <select disabled={disabled} className={`${base} ${state} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        value={value || ""} onChange={(e) => onChange(name, e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function ToggleField({ label, name, value, onChange }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--app-bg)] px-3 py-2.5 cursor-pointer hover:border-[var(--accent-2)]/50 transition-colors">
      <span className="text-sm text-[var(--ink)]">{label}</span>
      <input type="checkbox" checked={!!value} onChange={(e) => onChange(name, e.target.checked)}
        className="h-4 w-4 rounded accent-[var(--accent-2)] cursor-pointer" />
    </label>
  );
}

































// import { useState, useEffect, useMemo, useRef } from "react";
// import { Scan, Sparkles, Plus, ChevronLeft, ChevronRight, AlertCircle, Check } from "lucide-react";
// import { useCreateProduct, useUpdateProduct } from "../services/product.service";
// import { useGetCategoriesQuery } from "../services/category.service.js";
// import { useGetSubCategoriesQuery } from "../services/subCategories.service.js";
// import { useProduct } from "../services/product.service.js";
// import Scanner from "../../../shared/components/Scanner.jsx";
// import CategoryCRUDModal from "./CategoryCRUDModal.jsx";
// import SubCategoryCrudModel from "./SubCategoryCRUDModal.jsx";
// import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";

// const IMAGE_BASE = "http://localhost:5001/uploads";

// const EMPTY_FORM = {
//   name: "", genericName: "", brandName: "", hotKeySku: "", productCode: "",
//   barcode: "", description: "", image: "", category: "", subCategory: "",
//   form: "", strength: "", drugType: "", scheduleType: "", isNarcotic: false,
//   unit: "Units", purchaseUnit: "Box", manufacturer: "", defaultSupplier: "",
//   countryOfOrigin: "", defaultSalePrice: 0, defaultPurchasePrice: 0,
//   taxPercent: 0, isDiscountAllowed: true, minStockLevel: 5, maxStockLevel: 10,
//   allowNegativeStock: true, rackLocation: "", storageCondition: "",
//   drugInteractionWarning: "", isActive: true,
// };

// function buildSteps({ categories, subCategories, currentCategory, openCategoryDialog, openSubCategoryDialog, generateSKU, generateBarcode, openScanner }) {
//   return [
//     {
//       id: "basic",
//       title: "Basic Info",
//       fields: [
//         { name: "image", label: "Product Image", type: "image", span: "full", hint: "PNG, JPG, WebP — max 5MB" },
//         { name: "name", label: "Product Name", type: "text", required: true, placeholder: "Product ka naam likhein" },
//         { name: "genericName", label: "Generic Name", type: "text", required: true, placeholder: "e.g., Paracetamol" },
//         { name: "brandName", label: "Brand Name", type: "text", placeholder: "e.g., Panadol" },
//         { name: "hotKeySku", label: "Hot Key / SKU", type: "text", required: true, placeholder: "SKU-XXXXXXXX", action: { label: "Generate", icon: Sparkles, onClick: generateSKU } },
//         { name: "productCode", label: "Product Code", type: "text", placeholder: "e.g., PROD-001" },
//         { name: "barcode", label: "Barcode", type: "text", placeholder: "Scan or type barcode", action: { label: "Scan", icon: Scan, onClick: openScanner } },
//         { name: "description", label: "Description", type: "textarea", rows: 3, span: "full", placeholder: "Product description likhein" },
//       ],
//     },
//     {
//       id: "classification",
//       title: "Classification",
//       fields: [
//         { name: "category", label: "Category", type: "select", required: true, placeholder: "Category chunein...", options: categories?.map(c => ({ label: c.name, value: c?._id })), action: { label: "New", icon: Plus, onClick: openCategoryDialog } },
//         { name: "subCategory", label: "Sub Category", type: "select", required: true, placeholder: "Sub category chunein...", disabled: !currentCategory, options: subCategories.map(c => ({ label: c.name, value: c._id })), action: { label: "New", icon: Plus, onClick: openSubCategoryDialog } },
//         { name: "form", label: "Form", type: "text", required: true, placeholder: "e.g., Tablet, Syrup, Injection" },
//         { name: "strength", label: "Strength", type: "text", required: true, placeholder: "e.g., 500mg, 250ml" },
//         { name: "drugType", label: "Drug Type", type: "text", placeholder: "e.g., Branded, Generic" },
//         { name: "scheduleType", label: "Schedule Type", type: "text", required: true, placeholder: "e.g., OTC, Prescription" },
//         { name: "isNarcotic", label: "Narcotic / Controlled", type: "toggle" },
//       ],
//     },
//     {
//       id: "pricing",
//       title: "Units & Pricing",
//       fields: [
//         { name: "unit", label: "Sale Unit", type: "text", required: true, placeholder: "e.g., Strip, Bottle, Piece" },
//         { name: "purchaseUnit", label: "Purchase Unit", type: "text", placeholder: "e.g., Box, Carton" },
//         { name: "defaultSalePrice", label: "Default Sale Price", type: "number", required: true, placeholder: "0.00" },
//         { name: "defaultPurchasePrice", label: "Default Purchase Price", type: "number", placeholder: "0.00" },
//         { name: "taxPercent", label: "Tax %", type: "number", placeholder: "0" },
//         { name: "isDiscountAllowed", label: "Discount Allowed", type: "toggle" },
//       ],
//     },
//     {
//       id: "stock",
//       title: "Stock & Storage",
//       fields: [
//         { name: "minStockLevel", label: "Min Stock Level", type: "number", placeholder: "0" },
//         { name: "maxStockLevel", label: "Max Stock Level", type: "number", placeholder: "0" },
//         { name: "allowNegativeStock", label: "Allow Negative Stock", type: "toggle" },
//         { name: "rackLocation", label: "Rack Location", type: "text", placeholder: "e.g., A1, B3" },
//         { name: "storageCondition", label: "Storage Condition", type: "text", placeholder: "e.g., Normal, Refrigerated" },
//       ],
//     },
//     {
//       id: "other",
//       title: "Manufacturer & Medical Info",
//       fields: [
//         { name: "manufacturer", label: "Manufacturer", type: "text", placeholder: "Manufacturer ka naam" },
//         { name: "defaultSupplier", label: "Default Supplier", type: "text", placeholder: "Supplier ID / name" },
//         { name: "countryOfOrigin", label: "Country of Origin", type: "text", placeholder: "e.g., Pakistan, China" },
//         { name: "drugInteractionWarning", label: "Drug Interaction Warning", type: "textarea", rows: 3, span: "full", placeholder: "Koi drug interaction warning..." },
//         { name: "isActive", label: "Active", type: "toggle" },
//       ],
//     },
//   ];
// }

// export default function ProductCRUDModal({ mode = "create", productId = null, open, onClose }) {
//   const isCreate = mode === "create";
//   const [createProduct, { isLoading: isCreating }] = useCreateProduct();
//   const [updateProduct, { isLoading: isUpdating }] = useUpdateProduct();
//   const isSaving = isCreating || isUpdating;

//   const { data: productData, isLoading: isFetching } = useProduct(productId, { skip: !productId || isCreate });
//   const { data: categories = [] } = useGetCategoriesQuery();
//   const { data: subCategories = [] } = useGetSubCategoriesQuery();

//   const [formData, setFormData] = useState(EMPTY_FORM);
//   const [step, setStep] = useState(0);
//   const [errors, setErrors] = useState({});
//   const [banner, setBanner] = useState(null);
//   const [imagePreview, setImagePreview] = useState(null);
//   const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
//   const [showCategoryDialog, setShowCategoryDialog] = useState(false);
//   const [showSubCategoryDialog, setShowSubCategoryDialog] = useState(false);
//   const fileInputRef = useRef(null);

//   useEffect(() => {
//     if (!isCreate && productData) {
//       setFormData({
//         ...EMPTY_FORM,
//         ...productData,
//         id: productData._id || "",
//         category: productData.category?._id || productData.category || "",
//         subCategory: productData.subCategory?._id || productData.subCategory || "",
//         defaultSupplier: productData.defaultSupplier?._id || productData.defaultSupplier || "",
//       });
//       setImagePreview(productData.image ? `${IMAGE_BASE}/${productData.image}` : null);
//     }
//   }, [isCreate, productData]);

//   useEffect(() => {
//     if (isCreate && open) {
//       setFormData(EMPTY_FORM);
//       setImagePreview(null);
//       setStep(0);
//       setErrors({});
//       setBanner(null);
//     }
//   }, [isCreate, open]);

//   useEffect(() => {
//     return () => { if (imagePreview?.startsWith?.("blob:")) URL.revokeObjectURL(imagePreview); };
//   }, [imagePreview]);

//   const updateField = (name, value) => {
//     setFormData(prev => ({ ...prev, [name]: value }));
//     setErrors(prev => (prev[name] ? { ...prev, [name]: undefined } : prev));
//   };

//   const generateSKU = () => updateField("hotKeySku", `SKU-${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
//   const generateBarcode = () => updateField("barcode", (Math.floor(Math.random() * 9000000000000) + 1000000000000).toString());

//   const handleImageChange = (file) => {
//     if (!file) return;
//     if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
//       setErrors(prev => ({ ...prev, image: "Only PNG, JPG, JPEG or WebP allowed" }));
//       return;
//     }
//     if (file.size > 5 * 1024 * 1024) {
//       setErrors(prev => ({ ...prev, image: "Max file size is 5MB" }));
//       return;
//     }
//     updateField("image", file);
//     setImagePreview(URL.createObjectURL(file));
//   };

//   const steps = useMemo(() => buildSteps({
//     categories, subCategories, currentCategory: formData.category,
//     openCategoryDialog: () => setShowCategoryDialog(true),
//     openSubCategoryDialog: () => setShowSubCategoryDialog(true),
//     generateSKU, generateBarcode,
//     openScanner: () => setIsBarcodeOpen(true),
//   }), [categories, subCategories, formData.category]);

//   const validateStep = (stepIndex) => {
//     const stepErrors = {};
//     for (const field of steps[stepIndex].fields) {
//       if (!field.required) continue;
//       const val = formData[field.name];
//       const isEmpty = val === "" || val === null || val === undefined || (typeof val === "number" && Number.isNaN(val));
//       if (isEmpty) stepErrors[field.name] = `${field.label} is required`;
//     }
//     return stepErrors;
//   };

//   const validateAll = () => {
//     for (let i = 0; i < steps.length; i++) {
//       const stepErrors = validateStep(i);
//       if (Object.keys(stepErrors).length > 0) {
//         setStep(i);
//         setErrors(stepErrors);
//         setBanner(`"${steps[i].title}" section has ${Object.keys(stepErrors).length} field(s) that still need to be filled.`);
//         return false;
//       }
//     }
//     setBanner(null);
//     return true;
//   };

//   const goNext = () => {
//     const stepErrors = validateStep(step);
//     if (Object.keys(stepErrors).length > 0) {
//       setErrors(stepErrors);
//       setBanner(`Please fill the required fields in "${steps[step].title}" before continuing.`);
//       return;
//     }
//     setBanner(null);
//     setStep(s => Math.min(s + 1, steps.length - 1));
//   };

//   const goBack = () => { setBanner(null); setStep(s => Math.max(s - 1, 0)); };

//   const onSubmit = async () => {
//     if (!validateAll()) return;
//     const payload = new FormData();
//     const excludeFields = ["batches", "createdAt", "updatedAt", "__v", "_id", "id", "batchSellingPrice"];
//     Object.entries(formData).forEach(([key, value]) => {
//       if (key === "image" || excludeFields.includes(key)) return;
//       if (value === undefined || value === null) return;
//       payload.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
//     });
//     if (formData.image instanceof File) {
//       payload.append("image", formData.image);
//     }
//     try {
//       if (isCreate) {
//         await createProduct(payload).unwrap();
//         showSuccess("Product created successfully");
//       } else {
//         await updateProduct({ payload, id: productData._id }).unwrap();
//         showSuccess("Product updated successfully");
//       }
//       onClose();
//     } catch (error) {
//       const errorMessage = error?.data?.message || error?.message || "Something went wrong while saving the product.";
//       showError(errorMessage);
//       setBanner(errorMessage);
//     }
//   };

//   if (!open) return null;
//   if (!isCreate && isFetching && !productData) {
//     return (
//       <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
//         <div className="bg-[var(--surface)] rounded-2xl p-8 text-[var(--muted)] text-sm">Product load ho raha hai...</div>
//       </div>
//     );
//   }

//   const current = steps[step];

//   return (
//     <>
//       {isBarcodeOpen && <Scanner isOpen={isBarcodeOpen} setIsOpen={setIsBarcodeOpen} valueSetter={(v) => updateField("barcode", v)} />}
//       {showCategoryDialog && <CategoryCRUDModal setVisibility={setShowCategoryDialog} operation="create" />}
//       {showSubCategoryDialog && <SubCategoryCrudModel catagId={formData.category} setVisibility={setShowSubCategoryDialog} />}

//       {/* ─── Overlay with blur ─── */}
//       <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
//         {/* ─── Card ─── */}
//         <div className="bg-[var(--surface)] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">

//           {/* Header */}
//           <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
//             <h2 className="text-lg font-semibold text-[var(--ink)]">
//               {isCreate ? "Add Product" : "Edit Product"}
//             </h2>
//             <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--ink)] text-sm transition-colors">
//               ✕
//             </button>
//           </div>

//           {/* Step Tabs */}
//           <div className="flex gap-1 px-6 pt-4 overflow-x-auto no-scrollbar">
//             {steps.map((s, i) => {
//               const hasError = i === step && banner && Object.keys(errors).some(k => s.fields.some(f => f.name === k));
//               return (
//                 <button
//                   key={s.id}
//                   type="button"
//                   onClick={() => setStep(i)}
//                   className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
//                     ${i === step
//                       ? "bg-[var(--accent-2)] text-white"
//                       : "text-[var(--muted)] hover:bg-[var(--app-bg)]"
//                     }`}
//                 >
//                   {hasError && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
//                   {i + 1}. {s.title}
//                 </button>
//               );
//             })}
//           </div>

//           {/* Banner */}
//           {banner && (
//             <div className="mx-6 mt-3 flex items-start gap-2 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">
//               <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
//               <span>{banner}</span>
//             </div>
//           )}

//           {/* Fields */}
//           <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//               {current.fields.map((field) => (
//                 <FieldRenderer
//                   key={field.name}
//                   field={field}
//                   value={formData[field.name]}
//                   error={errors[field.name]}
//                   onChange={(v) => updateField(field.name, v)}
//                   onImageChange={handleImageChange}
//                   imagePreview={imagePreview}
//                   fileInputRef={fileInputRef}
//                 />
//               ))}
//             </div>
//           </div>

//           {/* Footer */}
//           <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)] bg-[var(--app-bg)]">
//             <button
//               type="button"
//               onClick={goBack}
//               disabled={step === 0}
//               className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-[var(--muted)] disabled:opacity-40 hover:bg-[var(--surface)] transition-colors"
//             >
//               <ChevronLeft className="h-4 w-4" /> Back
//             </button>
//             {step < steps.length - 1 ? (
//               <button
//                 type="button"
//                 onClick={goNext}
//                 className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm bg-[var(--accent-2)] text-white hover:opacity-90 transition-opacity"
//               >
//                 Next <ChevronRight className="h-4 w-4" />
//               </button>
//             ) : (
//               <button
//                 type="button"
//                 onClick={onSubmit}
//                 disabled={isSaving}
//                 className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm bg-[var(--accent-2)] text-white hover:opacity-90 transition-opacity disabled:opacity-60"
//               >
//                 <Check className="h-4 w-4" /> {isSaving ? "Saving..." : isCreate ? "Save Product" : "Update Product"}
//               </button>
//             )}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// function FieldRenderer({ field, value, error, onChange, onImageChange, imagePreview, fileInputRef }) {
//   const baseInput = `w-full rounded-lg border px-3 py-2 text-sm bg-[var(--app-bg)] text-[var(--ink)]
//     placeholder:text-[var(--muted)] outline-none transition-colors
//     ${error ? "border-red-500 focus:border-red-500" : "border-[var(--border)] focus:border-[var(--accent-2)]"}`;

//   const wrapperSpan = field.span === "full" ? "sm:col-span-2" : "";

//   const Label = () => (
//     <label className="flex items-center justify-between text-xs font-medium text-[var(--muted)] mb-1">
//       <span>
//         {field.label}
//         {field.required && <span className="text-red-500 ml-0.5">*</span>}
//       </span>
//       {field.action && (
//         <button
//           type="button"
//           onClick={field.action.onClick}
//           className="flex items-center gap-1 text-[var(--accent-2)] hover:underline text-xs"
//         >
//           <field.action.icon className="h-3 w-3" /> {field.action.label}
//         </button>
//       )}
//     </label>
//   );

//   return (
//     <div className={wrapperSpan}>
//       {field.type !== "toggle" && <Label />}

//       {field.type === "text" && (
//         <input
//           className={baseInput}
//           value={value || ""}
//           placeholder={field.placeholder}
//           onChange={(e) => onChange(e.target.value)}
//         />
//       )}

//       {field.type === "number" && (
//         <input
//           type="number"
//           className={baseInput}
//           value={value ?? 0}
//           placeholder={field.placeholder}
//           onChange={(e) => onChange(e.target.valueAsNumber ?? 0)}
//         />
//       )}

//       {field.type === "textarea" && (
//         <textarea
//           rows={field.rows || 3}
//           className={baseInput}
//           value={value || ""}
//           placeholder={field.placeholder}
//           onChange={(e) => onChange(e.target.value)}
//         />
//       )}

//       {field.type === "select" && (
//         <select
//           disabled={field.disabled}
//           className={baseInput}
//           value={value || ""}
//           onChange={(e) => onChange(e.target.value)}
//         >
//           <option value="">{field.placeholder}</option>
//           {field.options.map((o) => (
//             <option key={o.value} value={o.value}>{o.label}</option>
//           ))}
//         </select>
//       )}

//       {field.type === "tags" && (
//         <input
//           className={baseInput}
//           placeholder={field.placeholder}
//           value={(value || []).join(", ")}
//           onChange={(e) => onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
//         />
//       )}

//       {field.type === "toggle" && (
//         <label className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--app-bg)] px-3 py-2 cursor-pointer">
//           <span className="text-sm text-[var(--ink)]">{field.label}</span>
//           <input
//             type="checkbox"
//             checked={!!value}
//             onChange={(e) => onChange(e.target.checked)}
//             className="h-4 w-4 accent-[var(--accent-2)]"
//           />
//         </label>
//       )}

//       {field.type === "image" && (
//         <div
//           onClick={() => fileInputRef.current?.click()}
//           onDragOver={(e) => e.preventDefault()}
//           onDrop={(e) => { e.preventDefault(); onImageChange(e.dataTransfer.files?.[0]); }}
//           className={`flex items-center gap-3 rounded-lg border border-dashed px-3 py-3 cursor-pointer
//             ${error ? "border-red-500" : "border-[var(--border)]"} bg-[var(--app-bg)]`}
//         >
//           {imagePreview ? (
//             <img src={imagePreview} alt="preview" className="h-14 w-14 rounded-md object-cover" />
//           ) : (
//             <div className="h-14 w-14 rounded-md bg-[var(--surface)] flex items-center justify-center text-[var(--muted)] text-xs">
//               No image
//             </div>
//           )}
//           <div className="text-xs text-[var(--muted)]">
//             <p className="text-[var(--ink)] text-sm">Click or drop to upload</p>
//             {field.hint && <p>{field.hint}</p>}
//           </div>
//           <input
//             ref={fileInputRef}
//             type="file"
//             accept="image/png,image/jpeg,image/jpg,image/webp"
//             className="hidden"
//             onChange={(e) => onImageChange(e.target.files?.[0])}
//           />
//         </div>
//       )}

//       {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
//       {field.hint && field.type !== "image" && !error && (
//         <p className="mt-1 text-xs text-[var(--muted)]">{field.hint}</p>
//       )}
//     </div>
//   );
// }











import { useState, useEffect } from "react";
import { useGetCategoriesQuery } from "../../productsModule/services/category.service.js";
import { useProductFilters } from "../../../shared/hooks/useProductFilters.js";
import { Filter, X, Check, ChevronDown, ChevronUp } from "lucide-react";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getPosLabels } from "../labels/posLabels.js";

const STOCK_STATUS_OPTIONS = (labels) => [
  { value: "", label: labels.allStock },
  { value: "in_stock", label: labels.inStock },
  { value: "out_of_stock", label: labels.outOfStock },
  { value: "low_stock", label: labels.lowStock },
];

const ACTIVE_STATUS_OPTIONS = (labels) => [
  { value: "", label: labels.allStatus },
  { value: "true", label: labels.active },
  { value: "false", label: labels.inactive },
];

const DEFAULT_PRICE_RANGES = (labels) => [
  { label: labels.allPrices, min: 0, max: 100000 },
  { label: labels.under100, min: 0, max: 100 },
  { label: labels.price100to500, min: 100, max: 500 },
  { label: labels.price500to1000, min: 500, max: 1000 },
  { label: labels.price1000to5000, min: 1000, max: 5000 },
  { label: labels.above5000, min: 5000, max: 100000 },
];

export default function PosFilterSidebar({ onFiltersChange, isOpen, onClose, brands = [] }) {
  const { settings } = useSettings();
  const language = settings?.language || "en";
  const labels = getPosLabels(language);

  const { data: categoriesResponse } = useGetCategoriesQuery();
  const categories = categoriesResponse?.data || [];

  const {
    filters,
    updateFilter,
    applyFilters,
    resetFilters,
    getActiveFilterParams,
    hasActiveFilters,
  } = useProductFilters();

  const stockStatusOptions = STOCK_STATUS_OPTIONS(labels);
  const activeStatusOptions = ACTIVE_STATUS_OPTIONS(labels);
  const defaultPriceRanges = DEFAULT_PRICE_RANGES(labels);

  const [expandedSections, setExpandedSections] = useState({
    category: true,
    brand: true,
    price: true,
    stock: true,
    status: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCategoryToggle = (categoryId) => {
    const currentCategories = filters.category || [];
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter((id) => id !== categoryId)
      : [...currentCategories, categoryId];
    updateFilter("category", newCategories);
  };

  const handleBrandToggle = (brandName) => {
    const currentBrands = filters.brandName || [];
    const newBrands = currentBrands.includes(brandName)
      ? currentBrands.filter((b) => b !== brandName)
      : [...currentBrands, brandName];
    updateFilter("brandName", newBrands);
  };

  const handlePriceRangeSelect = (min, max) => {
    updateFilter("minPrice", min);
    updateFilter("maxPrice", max);
  };

  const handleApply = () => {
    applyFilters();
    onFiltersChange(getActiveFilterParams());
  };

  const handleReset = () => {
    resetFilters();
    onFiltersChange({});
  };

  // Notify parent of filter changes when debounced filters update
  useEffect(() => {
    onFiltersChange(getActiveFilterParams());
  }, [filters, onFiltersChange, getActiveFilterParams]);

  if (!isOpen) return null;

  return (
    <div className="w-72 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-[var(--accent-2)]" />
          <h2 className="font-semibold text-[var(--ink)]">{labels.filters}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[var(--app-bg)] transition-colors"
        >
          <X size={18} className="text-[var(--muted)]" />
        </button>
      </div>

      {/* Filter Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Search */}
        <div>
          <label className="text-xs font-semibold text-[var(--muted)] mb-2 block">
            {labels.search}
          </label>
          <input
            type="text"
            placeholder={labels.searchProductsPlaceholder}
            value={filters.searchText}
            onChange={(e) => updateFilter("searchText", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--app-bg)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
          />
        </div>

        {/* Product Code Filter */}
        <div>
          <label className="text-xs font-semibold text-[var(--muted)] mb-2 block">
            Product Code
          </label>
          <input
            type="text"
            placeholder="Enter product code"
            value={filters.productCode || ""}
            onChange={(e) => updateFilter("productCode", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--app-bg)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
          />
        </div>

        {/* Category Filter */}
        <div>
          <button
            onClick={() => toggleSection("category")}
            className="w-full flex items-center justify-between text-xs font-semibold text-[var(--muted)] mb-2"
          >
            {labels.category}
            {expandedSections.category ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {expandedSections.category && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {categories.map((cat) => (
                <label
                  key={cat._id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-[var(--app-bg)] cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={filters.category?.includes(cat._id)}
                    onChange={() => handleCategoryToggle(cat._id)}
                    className="w-4 h-4 rounded border-[var(--border)] accent-[var(--accent-2)]"
                  />
                  <span className="text-sm text-[var(--ink)]">{cat.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Brand Filter */}
        <div>
          <button
            onClick={() => toggleSection("brand")}
            className="w-full flex items-center justify-between text-xs font-semibold text-[var(--muted)] mb-2"
          >
            {labels.brand}
            {expandedSections.brand ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {expandedSections.brand && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {brands.length > 0 ? (
                brands.map((brand) => (
                  <label
                    key={brand}
                    className="flex items-center gap-2 p-2 rounded hover:bg-[var(--app-bg)] cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filters.brandName?.includes(brand)}
                      onChange={() => handleBrandToggle(brand)}
                      className="w-4 h-4 rounded border-[var(--border)] accent-[var(--accent-2)]"
                    />
                    <span className="text-sm text-[var(--ink)]">{brand}</span>
                  </label>
                ))
              ) : (
                <p className="text-xs text-[var(--muted)] p-2">{labels.noBrandsAvailable}</p>
              )}
            </div>
          )}
        </div>

        {/* Price Range Filter */}
        <div>
          <button
            onClick={() => toggleSection("price")}
            className="w-full flex items-center justify-between text-xs font-semibold text-[var(--muted)] mb-2"
          >
            {labels.priceRange}
            {expandedSections.price ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {expandedSections.price && (
            <div className="space-y-1">
              {defaultPriceRanges.map((range) => (
                <label
                  key={range.label}
                  className="flex items-center gap-2 p-2 rounded hover:bg-[var(--app-bg)] cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="priceRange"
                    checked={
                      filters.minPrice === range.min && filters.maxPrice === range.max
                    }
                    onChange={() => handlePriceRangeSelect(range.min, range.max)}
                    className="w-4 h-4 border-[var(--border)] accent-[var(--accent-2)]"
                  />
                  <span className="text-sm text-[var(--ink)]">{range.label}</span>
                </label>
              ))}
              {/* Custom price range */}
              <div className="flex items-center gap-2 p-2">
                <input
                  type="number"
                  placeholder={labels.min}
                  value={filters.minPrice === 0 ? "" : filters.minPrice}
                  onChange={(e) => updateFilter("minPrice", Number(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-xs border border-[var(--border)] rounded bg-[var(--app-bg)] text-[var(--ink)]"
                />
                <span className="text-[var(--muted)]">-</span>
                <input
                  type="number"
                  placeholder={labels.max}
                  value={filters.maxPrice === 100000 ? "" : filters.maxPrice}
                  onChange={(e) => updateFilter("maxPrice", Number(e.target.value) || 100000)}
                  className="w-full px-2 py-1 text-xs border border-[var(--border)] rounded bg-[var(--app-bg)] text-[var(--ink)]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Stock Status Filter */}
        <div>
          <button
            onClick={() => toggleSection("stock")}
            className="w-full flex items-center justify-between text-xs font-semibold text-[var(--muted)] mb-2"
          >
            {labels.stockStatus}
            {expandedSections.stock ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {expandedSections.stock && (
            <div className="space-y-1">
              {stockStatusOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 p-2 rounded hover:bg-[var(--app-bg)] cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="stockStatus"
                    checked={filters.stockStatus === option.value}
                    onChange={() => updateFilter("stockStatus", option.value)}
                    className="w-4 h-4 border-[var(--border)] accent-[var(--accent-2)]"
                  />
                  <span className="text-sm text-[var(--ink)]">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Active Status Filter */}
        <div>
          <button
            onClick={() => toggleSection("status")}
            className="w-full flex items-center justify-between text-xs font-semibold text-[var(--muted)] mb-2"
          >
            {labels.status}
            {expandedSections.status ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {expandedSections.status && (
            <div className="space-y-1">
              {activeStatusOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 p-2 rounded hover:bg-[var(--app-bg)] cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="isActive"
                    checked={filters.isActive === option.value}
                    onChange={() => updateFilter("isActive", option.value)}
                    className="w-4 h-4 border-[var(--border)] accent-[var(--accent-2)]"
                  />
                  <span className="text-sm text-[var(--ink)]">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-[var(--border)] space-y-2">
        <button
          onClick={handleApply}
          className="w-full py-2 px-4 bg-[var(--accent-2)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Check size={16} />
          {labels.applyFilters}
        </button>
        <button
          onClick={handleReset}
          disabled={!hasActiveFilters()}
          className="w-full py-2 px-4 border border-[var(--border)] text-[var(--ink)] rounded-lg font-medium hover:bg-[var(--app-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {labels.resetFilters}
        </button>
      </div>
    </div>
  );
}

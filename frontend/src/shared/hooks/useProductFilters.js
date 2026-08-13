import { useState, useEffect, useCallback } from 'react';

const DEFAULT_PRICE_RANGE = { min: 0, max: 1000 };

const INITIAL_FILTERS = {
  categoryName: [],
  subCategoryName: [],
  brandName: [],
  minPrice: DEFAULT_PRICE_RANGE.min,
  maxPrice: DEFAULT_PRICE_RANGE.max,
  stockStatus: '',
  isActive: '',
  searchText: '',
  productCode: '',
  barcode: '',
};

export const useProductFilters = () => {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [debouncedFilters, setDebouncedFilters] = useState(INITIAL_FILTERS);
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(true);

  // Debounce filter changes (2 seconds)
  useEffect(() => {
    if (!autoApplyEnabled) return;

    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 2000);

    return () => clearTimeout(timer);
  }, [filters, autoApplyEnabled]);

  // Update a single filter
  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Update multiple filters at once
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  // Apply filters immediately
  const applyFilters = useCallback(() => {
    setDebouncedFilters(filters);
  }, [filters]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setDebouncedFilters(INITIAL_FILTERS);
  }, []);

  // Toggle auto-apply
  const toggleAutoApply = useCallback((enabled) => {
    setAutoApplyEnabled(enabled);
  }, []);

  // Get active filter params for API (exclude empty values)
  const getActiveFilterParams = useCallback(() => {
    const params = {};
    
    if (debouncedFilters.categoryName && debouncedFilters.categoryName.length > 0) {
      params.categoryName = debouncedFilters.categoryName;
    }
    if (debouncedFilters.subCategoryName && debouncedFilters.subCategoryName.length > 0) {
      params.subCategoryName = debouncedFilters.subCategoryName;
    }
    if (debouncedFilters.brandName && debouncedFilters.brandName.length > 0) {
      params.brandName = debouncedFilters.brandName;
    }
    if (debouncedFilters.minPrice !== undefined && debouncedFilters.minPrice !== DEFAULT_PRICE_RANGE.min) {
      params.minPrice = debouncedFilters.minPrice;
    }
    if (debouncedFilters.maxPrice !== undefined && debouncedFilters.maxPrice !== DEFAULT_PRICE_RANGE.max) {
      params.maxPrice = debouncedFilters.maxPrice;
    }
    if (debouncedFilters.stockStatus) {
      params.stockStatus = debouncedFilters.stockStatus;
    }
    if (debouncedFilters.isActive !== undefined && debouncedFilters.isActive !== '') {
      params.isActive = debouncedFilters.isActive;
    }
    if (debouncedFilters.searchText) {
      params.searchText = debouncedFilters.searchText;
    }
    if (debouncedFilters.productCode) {
      params.productCode = debouncedFilters.productCode;
    }
    if (debouncedFilters.barcode) {
      params.barcode = debouncedFilters.barcode;
    }

    return params;
  }, [debouncedFilters]);

  // Check if any filters are active
  const hasActiveFilters = useCallback(() => {
    return Object.keys(getActiveFilterParams()).length > 0;
  }, [getActiveFilterParams]);

  return {
    filters,
    debouncedFilters,
    updateFilter,
    updateFilters,
    applyFilters,
    resetFilters,
    toggleAutoApply,
    getActiveFilterParams,
    hasActiveFilters,
    autoApplyEnabled,
  };
};

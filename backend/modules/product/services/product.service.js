import {
    createProductService,
    findProductService,
    findOneProductService,
    findByIdProductService,
    updateProductService,
    deleteOneProductService,
    countProductService,
} from "./product.crud.js";
import { findBatchService, countBatchService, deleteManyBatchService } from "../../productPurchases/services/batch.crud.js";
import { filterEmptyValues } from "../../../common/services/filterEmptyFromObject.js";
import { deleteProductImage } from "./productImage.service.js";
import { getNextSequence } from "../../../common/services/db/mongodbCentralizedCrud.service.js";

// ───────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────

/**
 * Attach an effective selling price to each product.
 * Picks the soonest-expiring active batch with stock, falling back to the
 * most recently created one, and finally to the product's default sale price.
 */
const attachBatchSellingPrice = async (products) => {
    return Promise.all(
        products.map(async (product) => {
            const base = product.toObject ? product.toObject() : product;
            if (!base.batches || base.batches.length === 0) {
                return { ...base, batchSellingPrice: base.defaultSalePrice || 0 };
            }

            const activeBatches = await findBatchService({
                product: base._id,
                quantity: { $gt: 0 },
                isActive: true,
            });

            if (activeBatches.length === 0) {
                return { ...base, batchSellingPrice: base.defaultSalePrice || 0 };
            }

            const withExpiry = activeBatches.filter((b) => b.expiryDate);
            const selected = withExpiry.length > 0
                ? withExpiry.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))[0]
                : activeBatches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

            return { ...base, batchSellingPrice: selected.sellingPrice || base.defaultSalePrice || 0 };
        })
    );
};

// Search products by name, barcode, or productCode - without pagination
export const searchProducts = async (query = "", limit = 20) => {
    if (!query || query.length < 1) {
        return [];
    }

    const searchRegex = new RegExp(query, 'i');
    const startsWithRegex = new RegExp(`^${query}`, 'i');

    // Get results that start with the query (higher priority)
    const startsWithResults = await findProductService({
        $or: [
            { name: startsWithRegex },
            { barcode: startsWithRegex },
            { productCode: startsWithRegex }
        ],
        isActive: true
    }, {
        limit: parseInt(limit),
        sort: { name: 1 }
    });

    // If we have enough results from startsWith, return them
    if (startsWithResults.length >= limit) {
        return attachBatchSellingPrice(startsWithResults.slice(0, limit));
    }

    // Get results that contain the query anywhere (lower priority)
    const containsResults = await findProductService({
        $or: [
            { name: searchRegex },
            { barcode: searchRegex },
            { productCode: searchRegex }
        ],
        isActive: true,
        _id: { $nin: startsWithResults.map(p => p._id) } // Exclude already found
    }, {
        limit: parseInt(limit) - startsWithResults.length,
        sort: { name: 1 }
    });

    // Combine: startsWith results first, then contains results
    const allResults = [...startsWithResults, ...containsResults];
    return attachBatchSellingPrice(allResults);
};

/**
 * Ensure SKU / productCode / barcode uniqueness against OTHER products.
 * Returns the offending field's human label, or null if free.
 */
const findConflictingUnique = async (id, { hotKeySku, productCode, barcode }) => {
    const or = [];
    if (hotKeySku) or.push({ hotKeySku });
    if (productCode) or.push({ productCode });
    if (barcode) or.push({ barcode });
    if (or.length === 0) return null;

    const query = { _id: { $ne: id }, $or: or };
    const existing = await findOneProductService(query);
    return existing || null;
};

const createNextProductCode = async () => {
    let attempts = 0;
    while (attempts < 100) {
        const sequence = await getNextSequence({ sequenceName: "productCode" });
        const productCode = `${String(sequence).padStart(2, "0")}`;
        if (!(await findConflictingUnique(null, { productCode }))) return productCode;
        attempts += 1;
    }
    throw new Error("Unable to generate a unique Product Code");
};

// ───────────────────────────────────────────────────────────────────
// Read
// ───────────────────────────────────────────────────────────────────

const getProducts = async () => {
    const products = await findProductService({}, {
        populate: ["batches"],
        sort: { createdAt: -1 }
    });
    return attachBatchSellingPrice(products);
};

const getPaginationProduct = async (filters = {}) => {
    const { page = 1, limit = 20, ...filterParams } = filters;
    const skip = (page - 1) * limit;

    // Debug: Log incoming filter parameters
    console.log('=== Product Pagination Filters ===');
    console.log('Incoming filterParams:', JSON.stringify(filterParams, null, 2));

    // Build MongoDB query from filter parameters
    const query = {};

    // Helper function to normalize filter values to arrays
    const normalizeToArray = (value) => {
        if (!value) return null;
        if (Array.isArray(value)) return value.length > 0 ? value : null;
        // Handle string values (convert single value to array for $in query)
        return typeof value === 'string' ? [value] : null;
    };

    // Category filter (multiple selection)
    const categoryNames = normalizeToArray(filterParams.categoryName);
    if (categoryNames) {
        query.categoryName = categoryNames.length === 1 ? categoryNames[0] : { $in: categoryNames };
        console.log('Category filter applied:', query.categoryName);
    }

    // Subcategory filter (multiple selection)
    const subCategoryNames = normalizeToArray(filterParams.subCategoryName);
    if (subCategoryNames) {
        query.subCategoryName = subCategoryNames.length === 1 ? subCategoryNames[0] : { $in: subCategoryNames };
        console.log('Subcategory filter applied:', query.subCategoryName);
    }

    // Brand filter (multiple selection)
    const brandNames = normalizeToArray(filterParams.brandName);
    if (brandNames) {
        query.brandName = brandNames.length === 1 ? brandNames[0] : { $in: brandNames };
        console.log('Brand filter applied:', query.brandName);
    }

    // Price range filter
    if (filterParams.minPrice !== undefined || filterParams.maxPrice !== undefined) {
        query.defaultSalePrice = {};
        if (filterParams.minPrice !== undefined) {
            query.defaultSalePrice.$gte = Number(filterParams.minPrice);
        }
        if (filterParams.maxPrice !== undefined) {
            query.defaultSalePrice.$lte = Number(filterParams.maxPrice);
        }
    }

    // Stock status filter
    if (filterParams.stockStatus) {
        switch (filterParams.stockStatus) {
            case 'in_stock':
                query.currentStockLevel = { $gt: 0 };
                break;
            case 'out_of_stock':
                query.currentStockLevel = { $lte: 0 };
                break;
            case 'low_stock':
                query.currentStockLevel = { $gt: 0, $lt: 5 };
                break;
        }
    }

    // Active status filter
    if (filterParams.isActive !== undefined) {
        query.isActive = filterParams.isActive === 'true' || filterParams.isActive === true;
    }

    // Search text filter (name or barcode)
    if (filterParams.searchText) {
        const searchRegex = new RegExp(filterParams.searchText, 'i');
        query.$or = [
            { name: searchRegex },
            { barcode: searchRegex },
            { productCode: searchRegex }
        ];
    }

    // Product code filter (exact match or partial match)
    if (filterParams.productCode) {
        const codeRegex = new RegExp(filterParams.productCode, 'i');
        query.productCode = codeRegex;
    }

    // Barcode filter (exact match or partial match)
    if (filterParams.barcode) {
        const barcodeRegex = new RegExp(filterParams.barcode, 'i');
        query.barcode = barcodeRegex;
    }

    // Debug: Log the final MongoDB query
    console.log('Final MongoDB query:', JSON.stringify(query, null, 2));
    console.log('=== End Product Pagination Filters ===\n');

    const products = await findProductService(query, {
        sort: { createdAt: -1 },
        skip: skip,
        limit: parseInt(limit),
        populate: ["batches"]
    });

    const total = await countProductService(query);
    const data = await attachBatchSellingPrice(products);

    return {
        data,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
    };
};

const getProductById = async (id) => {
    return await findByIdProductService(id, {
        populate: ["batches"]
    });
};

// ───────────────────────────────────────────────────────────────────
// Create
// ───────────────────────────────────────────────────────────────────

const createProduct = async (productData) => {
    const cleaned = filterEmptyValues(productData);
    const { hotKeySku } = cleaned;
    const productCode = cleaned.productCode || await createNextProductCode();

    // SKU is the primary uniqueness key; productCode is secondary when present.
    const conflict = await findConflictingUnique(null, { hotKeySku, productCode });
    if (conflict) {
        throw new Error("Product with this SKU or Product Code already exists");
    }

    return await createProductService({ ...cleaned, productCode });
};

// ───────────────────────────────────────────────────────────────────
// Update
// ───────────────────────────────────────────────────────────────────

const updateProduct = async (id, updateData) => {
    const existing = await findByIdProductService(id);
    if (!existing) {
        throw new Error("Product not found");
    }

    // Uniqueness check only over the fields actually being changed.
    const { hotKeySku, productCode, barcode } = updateData;
    const conflict = await findConflictingUnique(id, { hotKeySku, productCode, barcode });
    if (conflict) {
        throw new Error("SKU, Product Code, or Barcode is already in use by another product");
    }

    // If a new image was uploaded, persist it and clean up the old file.
    if (updateData.image && updateData.image !== existing.image) {
        deleteProductImage(existing.image);
    }

    return await updateProductService(id, { ...updateData, updated: Date.now() });
};

// ───────────────────────────────────────────────────────────────────
// Delete
// ───────────────────────────────────────────────────────────────────

/**
 * Soft delete — refuses if the product still has batches. Returns the
 * batch count so the controller can give the caller a helpful message.
 */
const deleteProduct = async (id) => {
    const product = await findByIdProductService(id);
    if (!product) {
        throw new Error("Product not found");
    }

    const batchCount = await countBatchService({ product: id, isDeleted: false });
    if (batchCount > 0) {
        const err = new Error("Product has connected batches and cannot be deleted directly.");
        err.code = "PRODUCT_HAS_BATCHES";
        err.batchCount = batchCount;
        throw err;
    }

    deleteProductImage(product.image);
    return await deleteOneProductService(id);
};

/**
 * Hard delete — removes the product together with every batch connected to
 * it, plus the stored image. Used by the "delete with history & batches"
 * confirmation flow.
 */
const deleteProductWithBatches = async (id) => {
    const product = await findByIdProductService(id);
    if (!product) {
        throw new Error("Product not found");
    }

    const batchResult = await deleteManyBatchService({ product: id });
    deleteProductImage(product.image);
    await deleteOneProductService(id);

    return {
        deletedBatches: batchResult.deletedCount || 0,
    };
};

const checkProductCodeAvailability = async (productCode, excludeId = null) => {
    if (!productCode?.trim()) return false;
    const conflict = await findOneProductService({
        productCode: productCode.trim(),
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });
    return !conflict;
};

/**
 * Check if a product code exists in the database
 * @param {string} productCode - The product code to check
 * @returns {Promise<boolean>} - true if code exists, false otherwise
 */
const checkProductCodeExists = async (productCode) => {
    if (!productCode?.trim()) return false;
    const existing = await findOneProductService({
        productCode: productCode.trim()
    });
    return !!existing;
};

/**
 * Generate a unique product code
 * Gets the count of products, increments it, and checks if the code exists
 * If it exists, continues incrementing until a unique code is found
 * @returns {Promise<string>} - A unique product code
 */
const generateProductCode = async () => {
    // Get the current count of products using existing service
    const currentCount = await countProductService({});
    
    // Start with count + 1
    let nextNumber = currentCount + 1;
    let attempts = 0;
    const maxAttempts = 1000;
    
    while (attempts < maxAttempts) {
        const productCode = `${String(nextNumber).padStart(2, "0")}`;
        
        // Check if this product code exists in the database using existing service
        const codeExists = await checkProductCodeExists(productCode);
        
        if (!codeExists) {
            return productCode;
        }
        
        // If code exists, increment and try again
        nextNumber++;
        attempts++;
    }
    
    throw new Error("Unable to generate a unique Product Code after maximum attempts");
};

export {
    getProducts,
    getPaginationProduct,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    deleteProductWithBatches,
    checkProductCodeAvailability,
    checkProductCodeExists,
    generateProductCode,
};

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

// ───────────────────────────────────────────────────────────────────
// Read
// ───────────────────────────────────────────────────────────────────

const getProducts = async () => {
    const products = await findProductService()
        .populate("batches")
        .populate("category")
        .populate("subCategory")
        .sort({ createdAt: -1 });
    return attachBatchSellingPrice(products);
};

const getPaginationProduct = async (filters = {}) => {
    const { page = 1, limit = 20, ...filterParams } = filters;
    const skip = (page - 1) * limit;

    // Build MongoDB query from filter parameters
    const query = {};

    // Category filter (multiple selection)
    if (filterParams.category && Array.isArray(filterParams.category)) {
        query.category = { $in: filterParams.category };
    } else if (filterParams.category) {
        query.category = filterParams.category;
    }

    // Subcategory filter (multiple selection)
    if (filterParams.subCategory && Array.isArray(filterParams.subCategory)) {
        query.subCategory = { $in: filterParams.subCategory };
    } else if (filterParams.subCategory) {
        query.subCategory = filterParams.subCategory;
    }

    // Brand filter (multiple selection)
    if (filterParams.brandName && Array.isArray(filterParams.brandName)) {
        query.brandName = { $in: filterParams.brandName };
    } else if (filterParams.brandName) {
        query.brandName = filterParams.brandName;
    }

    // Price range filter
    if (filterParams.minPrice !== undefined || filterParams.maxPrice !== undefined) {
        query.defaultRetailPrice = {};
        if (filterParams.minPrice !== undefined) {
            query.defaultRetailPrice.$gte = Number(filterParams.minPrice);
        }
        if (filterParams.maxPrice !== undefined) {
            query.defaultRetailPrice.$lte = Number(filterParams.maxPrice);
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

    const products = await findProductService(query, {
        sort: { createdAt: -1 },
        skip: skip,
        limit: parseInt(limit),
        populate: ["batches", "category", "subCategory"]
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
    return await findByIdProductService(id)
        .populate("category", "name")
        .populate("subCategory", "name")
        .populate("batches");
};

// ───────────────────────────────────────────────────────────────────
// Create
// ───────────────────────────────────────────────────────────────────

const createProduct = async (productData) => {
    const cleaned = filterEmptyValues(productData);
    const { hotKeySku, productCode } = cleaned;

    // SKU is the primary uniqueness key; productCode is secondary when present.
    const conflict = await findConflictingUnique(null, { hotKeySku, productCode });
    if (conflict) {
        throw new Error("Product with this SKU or Product Code already exists");
    }

    return await createProductService(cleaned);
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

    const batchCount = await countBatchService({ product: id });
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

export {
    getProducts,
    getPaginationProduct,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    deleteProductWithBatches,
};

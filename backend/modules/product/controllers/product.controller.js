// src/controllers/product.subCategory.controller.js
import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import {
    getProducts, getPaginationProduct, getProductById,
    createProduct, updateProduct, deleteProduct, deleteProductWithBatches, checkProductCodeAvailability,
    generateProductCode,
} from "../services/product.service.js";
import {
    recalculateProductStock, recalculateAllStock,
} from "../services/stockRecalculation.service.js";
import { getStockHistory } from "../services/stockHistory.service.js";
import {
    getSubCategories, getPaginationSubCategories, createSubCategory,
    updateSubCategory, deleteSubCategory, getSubCategoriesById, getSubCategoriesByCatagId,
} from "../services/subCategory.service.js";
import { getLocalProductModel } from "../../../configs/connect.db.js";
import { imageChangeTrackDocsCreation } from "../../../common/services/onlineSync/imageChangeTrackModelCreation.js";

// ─── Product Controllers ───────────────────────────────────────────────────────

export const getProductsData = asyncHandler(async (req, res) => {
    const data = await getProducts();
    res.status(200).json({ success: true, message: "Products retrieved successfully", data });
});

export const getPaginationProductData = asyncHandler(async (req, res) => {
    const result = await getPaginationProduct(req.query);
    res.status(200).json({ success: true, message: "Products retrieved successfully", ...result });
});

export const checkProductCode = asyncHandler(async (req, res) => {
    const { productCode } = req.params;
    const available = await checkProductCodeAvailability(productCode, req.query.excludeId);
    res.status(200).json({ success: true, available, exists: !available, productCode });
});

export const generateProductCodeData = asyncHandler(async (req, res) => {
    const productCode = await generateProductCode();
    res.status(200).json({ success: true, message: "Product code generated successfully", productCode });
});

export const getProductDataById = asyncHandler(async (req, res, next) => {
    const data = await getProductById(req.params.id);
    if (!data) {
        return next(new ErrorResponse("Product not found", 404));
    }
    res.status(200).json({ success: true, message: "Product retrieved successfully", data });
});

const coerceBody = (body) => {
    const coerced = { ...body };
    for (const [key, val] of Object.entries(coerced)) {
        if (typeof val !== "string") continue;
        try { const p = JSON.parse(val); if (Array.isArray(p)) { coerced[key] = p; continue; } } catch { }
        if (val === "true" || val === "false") { coerced[key] = val === "true"; continue; }
        const n = Number(val);
        if (!Number.isNaN(n) && val.trim() !== "") coerced[key] = n;
    }
    return coerced;
};

export const createProductData = asyncHandler(async (req, res, next) => {
    try {
        const ProductModel = getLocalProductModel();
        const data = await createProduct({ ...coerceBody(req.body), image: req.file?.filename });
        
        // Track image creation if image was uploaded
        if (req.file?.filename) {
            await imageChangeTrackDocsCreation("create", ProductModel.modelName, data._id);
        }
        
        res.status(201).json({ success: true, message: "Product created successfully", data });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

export const updateProductData = asyncHandler(async (req, res, next) => {
    try {
        const ProductModel = getLocalProductModel();
        const body = coerceBody(req.body);
        
        // Get existing product to check for image change
        const existingProduct = await getProductById(req.params.id);
        
        if (req.file?.filename) {
            body.image = req.file.filename;
        }
        
        const data = await updateProduct(req.params.id, body);
        
        // Track image changes
        if (req.file?.filename) {
            // New image uploaded - delete old image from Cloudinary and track new one
            if (existingProduct?.cloudinaryPublicId) {
                await imageChangeTrackDocsCreation("delete", ProductModel.modelName, data._id, existingProduct.cloudinaryPublicId);
            }
            await imageChangeTrackDocsCreation("create", ProductModel.modelName, data._id);
        }
        
        res.status(200).json({ success: true, message: "Product updated successfully", data });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

export const deleteProductData = asyncHandler(async (req, res, next) => {
    try {
        await deleteProduct(req.params.id);
        res.status(200).json({ success: true, message: "Product deleted successfully", data: {} });
    } catch (error) {
        if (error.code === "PRODUCT_HAS_BATCHES") {
            return res.status(409).json({
                success: false, message: error.message,
                code: "PRODUCT_HAS_BATCHES", batchCount: error.batchCount,
            });
        }
        next(new ErrorResponse(error.message, 400));
    }
});

export const deleteProductWithBatchesData = asyncHandler(async (req, res, next) => {
    try {
        const result = await deleteProductWithBatches(req.params.id);
        res.status(200).json({ success: true, message: `Product deleted with ${result.deletedBatches} batch(es) and history.`, data: result });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

export const uploadProductImage = asyncHandler(async (req, res, next) => {
    if (!req.file) return next(new ErrorResponse("No image file provided", 400));
    res.status(200).json({ success: true, message: "Image uploaded successfully", filename: req.file.filename });
});

export const recalculateProductStockData = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await recalculateProductStock(id);
        res.status(200).json({ 
            success: true, 
            message: "Stock recalculated successfully", 
            data: result 
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

export const recalculateAllStockData = asyncHandler(async (req, res, next) => {
    try {
        const result = await recalculateAllStock();
        res.status(200).json(result);
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

export const getStockHistoryData = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await getStockHistory(id);
        res.status(200).json({ 
            success: true, 
            message: "Stock history retrieved successfully", 
            data: result 
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

// ─── SubCategory Controllers ───────────────────────────────────────────────────

export const getSubCategoriesData = asyncHandler(async (req, res) => {
    const data = await getSubCategories();
    res.status(200).json({ success: true, message: "Subcategories retrieved successfully", data });
});

export const getPaginationSubCategoriesData = asyncHandler(async (req, res) => {
    const result = await getPaginationSubCategories(req.query);
    res.status(200).json({ success: true, message: "Subcategories retrieved successfully", ...result });
});

export const createSubCategoryData = asyncHandler(async (req, res, next) => {
    try {
        const data = await createSubCategory(req.body);
        res.status(201).json({ success: true, message: "Subcategory created successfully", data });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

export const updateSubCategoryData = asyncHandler(async (req, res, next) => {
    try {
        const data = await updateSubCategory(req.params.id, req.body);
        res.status(200).json({ success: true, message: "Subcategory updated successfully", data });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

export const deleteSubCategoryData = asyncHandler(async (req, res, next) => {
    try {
        await deleteSubCategory(req.params.id);
        res.status(200).json({ success: true, message: "Subcategory deleted successfully", data: {} });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

export const getSubCategoriesDataById = asyncHandler(async (req, res, next) => {
    try {
        const data = await getSubCategoriesById(req.params.id);
        res.status(200).json({ success: true, message: "Subcategory retrieved successfully", data });
    } catch {
        next(new ErrorResponse("Subcategory not found", 404));
    }
});

export const getSubCategoriesDataByCatagId = asyncHandler(async (req, res, next) => {
    try {
        const data = await getSubCategoriesByCatagId(req.params.id);
        res.status(200).json({ success: true, message: "Subcategory retrieved successfully", data });
    } catch {
        next(new ErrorResponse("Subcategory not found", 404));
    }
});
import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import {
    createProductSchema,
    updateProductSchema,
} from "../schema/product.schema.js";
import {
    createSubCategorySchema,
    updateSubCategorySchema,
} from "../schema/subCategory.schema.js";
import { paginateModel } from "../../../common/services/common.service.js";
import {
    getProducts,
    getPaginationProduct,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    deleteProductWithBatches,
} from "../services/product.service.js";
import {
    getSubCategories,
    getPaginationSubCategories,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory,
    getSubCategoriesById,
    getSubCategoriesByCatagId,
} from "../services/subCategory.service.js";

export const getProductsData = asyncHandler(async (req, res, next) => {
    const products = await getProducts();
    res.status(200).json({
        success: true,
        message: "Products retrieved successfully",
        data: products,
    });
});

export const getPaginationProductData = asyncHandler(async (req, res, next) => {
    const result = await getPaginationProduct(req.query);
    res.status(200).json({
        success: true,
        message: "Products retrieved successfully",
        ...result
    });
});

export const getProductDataById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    try {
        const product = await getProductById(id);
        res.status(200).json({
            success: true,
            message: "Product retrieved successfully",
            data: product,
        });
    } catch (error) {
        return next(new ErrorResponse("Product not found", 404));
    }
});

/**
 * Multipart form-data sends everything as strings. This helper casts
 * boolean and numeric fields back to their real types so yup + Mongoose
 * don't choke on "true", "false", "500", etc.
 */
const coerceMultipartBody = (body, schema) => {
    const fields = schema.fields;
    const coerced = { ...body };
    for (const [key, field] of Object.entries(fields)) {
        if (coerced[key] === undefined) continue;
        if (typeof coerced[key] === "string") {
            try {
                const parsed = JSON.parse(coerced[key]);
                if (Array.isArray(parsed)) coerced[key] = parsed;
            } catch { }
        }
        if (field.type === "boolean" && typeof coerced[key] === "string") {
            coerced[key] = coerced[key] === "true";
        }
        if (field.type === "number" && typeof coerced[key] === "string") {
            const n = Number(coerced[key]);
            if (!Number.isNaN(n)) coerced[key] = n;
        }
    }
    return coerced;
};

export const createProductData = asyncHandler(async (req, res, next) => {
    try {
        // Coerce multipart string values to proper types before validation.
        const body = coerceMultipartBody(req.body, createProductSchema);
        const validatedBody = await createProductSchema.validate(body, {
            abortEarly: true,
            stripUnknown: true,
        });
        const product = await createProduct({
            ...validatedBody,
            image: req.file?.filename,
        });
        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product,
        });
    } catch (error) {
        return next(new ErrorResponse(error.message, 400));
    }
}); 

export const updateProductData = asyncHandler(async (req, res, next) => {
    const { id } = req.params; 
    console.log(req.body, req.params, req.file, req.files, "the update product data. ")
    try {
        const body = coerceMultipartBody(req.body, updateProductSchema);
        const validatedBody = await updateProductSchema.validate(body, {
            abortEarly: true,
            stripUnknown: true,
        });
        const updateData = { ...validatedBody };
        if (req.file?.filename) {
            updateData.image = req.file.filename;
        }
        const product = await updateProduct(id, updateData);
        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product,
        });
    } catch (error) {
        console.log("The error ", error)
        return next(new ErrorResponse(error.message, 400));
    }
});

export const deleteProductData = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    try {
        await deleteProduct(id);
        res.status(200).json({
            success: true,
            message: "Product deleted successfully",
            data: {},
        });
    } catch (error) {
        // Batch-connected products get a dedicated status + code so the
        // frontend can offer the "delete with history & batches" flow.
        if (error.code === "PRODUCT_HAS_BATCHES") {
            return res.status(409).json({
                success: false,
                message: error.message,
                code: "PRODUCT_HAS_BATCHES",
                batchCount: error.batchCount,
            });
        }
        return next(new ErrorResponse(error.message, 400));
    }
});

// Hard delete — removes the product along with every connected batch and
// its stored image. Triggered from the confirmation popup.
export const deleteProductWithBatchesData = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await deleteProductWithBatches(id);
        res.status(200).json({
            success: true,
            message: `Product deleted with ${result.deletedBatches} batch(es) and history.`,
            data: result,
        });
    } catch (error) {
        return next(new ErrorResponse(error.message, 400));
    }
});












































export const getSubCategoriesData = asyncHandler(async (req, res, next) => {
    const subcategories = await getSubCategories();
    res.status(200).json({
        success: true,
        message: "Subcategories retrieved successfully",
        data: subcategories,
    });
});




export const getPaginationSubCategoriesData = asyncHandler(async (req, res, next) => {
    const result = await getPaginationSubCategories(req.query);
    res.status(200).json({
        success: true,
        message: "Subcategories retrieved successfully",
        ...result
    });
});



export const createSubCategoryData = asyncHandler(async (req, res, next) => {
    try {
        const subcategory = await createSubCategory(req.body);
        res.status(201).json({
            success: true,
            message: "Subcategory created successfully",
            data: subcategory,
        });
    } catch (error) {
        return next(new ErrorResponse(error.message, 400));
    }
});

export const updateSubCategoryData = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    try {
        const subcategory = await updateSubCategory(id, req.body);
        res.status(200).json({
            success: true,
            message: "Subcategory updated successfully",
            data: subcategory,
        });
    } catch (error) {
        return next(new ErrorResponse(error.message, 400));
    }
});

export const deleteSubCategoryData = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    try {
        await deleteSubCategory(id);
        res.status(200).json({
            success: true,
            message: "Subcategory deleted successfully",
            data: {},
        });
    } catch (error) {
        return next(new ErrorResponse(error.message, 400));
    }
});

export const getSubCategoriesDataById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    try {
        const subcategory = await getSubCategoriesById(id);
        res.status(200).json({
            success: true,
            message: "Subcategory retrieved successfully",
            data: subcategory,
        });
    } catch (error) {
        return next(new ErrorResponse("Subcategory not found", 404));
    }
});









export const getSubCategoriesDataByCatagId = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    try {
        const subcategory = await getSubCategoriesByCatagId(id);
        res.status(200).json({
            success: true,
            message: "Subcategory retrieved successfully",
            data: subcategory,
        });
    } catch (error) {
        return next(new ErrorResponse("Subcategory not found", 404));
    }
});

export const uploadProductImage = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return next(new ErrorResponse("No image file provided", 400));
    }

    res.status(200).json({
        success: true,
        message: "Image uploaded successfully",
        filename: req.file.filename,
    });
});
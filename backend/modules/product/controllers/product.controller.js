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

export const getProducts = asyncHandler(async (req, res, next) => {
    const products = await getProducts();
    res.status(200).json({
        success: true,
        message: "Products retrieved successfully",
        data: products,
    });
});

export const getPaginationProduct = asyncHandler(async (req, res, next) => {
    const result = await getPaginationProduct(req.query);
    res.status(200).json({
        success: true,
        message: "Products retrieved successfully",
        ...result
    });
});

export const getProductById = asyncHandler(async (req, res, next) => {
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

export const createProduct = asyncHandler(async (req, res, next) => {
    try {
        const validatedData = await createProductSchema.validate(req.body, {
            abortEarly: true,
            stripUnknown: true,
        });
        const product = await createProduct(validatedData);
        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product,
        });
    } catch (error) {
        return next(new ErrorResponse(error.message, 400));
    }
});

export const updateProduct = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    try {
        const product = await updateProduct(id, req.body);
        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product,
        });
    } catch (error) {
        return next(new ErrorResponse(error.message, 400));
    }
});

export const deleteProduct = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    try {
        await deleteProduct(id);
        res.status(200).json({
            success: true,
            message: "Product deleted successfully",
            data: {},
        });
    } catch (error) {
        return next(new ErrorResponse(error.message, 400));
    }
});












































export const getSubCategories = asyncHandler(async (req, res, next) => {
    const subcategories = await getSubCategories();
    res.status(200).json({
        success: true,
        message: "Subcategories retrieved successfully",
        data: subcategories,
    });
});




export const getPaginationSubCategories = asyncHandler(async (req, res, next) => {
    const result = await getPaginationSubCategories(req.query);
    res.status(200).json({
        success: true,
        message: "Subcategories retrieved successfully",
        ...result
    });
});



export const createSubCategory = asyncHandler(async (req, res, next) => {
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

export const updateSubCategory = asyncHandler(async (req, res, next) => {
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

export const deleteSubCategory = asyncHandler(async (req, res, next) => {
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

export const getSubCategoriesById = asyncHandler(async (req, res, next) => {
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









export const getSubCategoriesByCatagId = asyncHandler(async (req, res, next) => {
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
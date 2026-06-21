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

export const createProductData = asyncHandler(async (req, res, next) => {
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

export const updateProductData = asyncHandler(async (req, res, next) => {
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
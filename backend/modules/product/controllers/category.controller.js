import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import {
    getCategories as getCategoriesService,
    getPaginationCategories as getPaginationCategoriesService,
    getCategoryById as getCategoryByIdService,
    createCategory as createCategoryService,
    updateCategory as updateCategoryService,
    deleteCategory as deleteCategoryService,
} from "../services/category.service.js";

export const getCategories = asyncHandler(async (req, res, next) => {
    const categories = await getCategoriesService();

    res.status(200).json({
        success: true,
        message: "Categories retrieved successfully",
        data: categories,
    });
});




export const getPaginationCategories = asyncHandler(async (req, res, next) => {
    const { page = 1, limit = 20 } = req.query;

    const result = await getPaginationCategoriesService({ page, limit });

    res.status(200).json({
        success: true,
        message: "Categories retrieved successfully",
        ...result
    });
});



export const createCategory = asyncHandler(async (req, res, next) => {
    const validatedData = req.body || {};

    try {
        const category = await createCategoryService(validatedData);

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: category,
        });
    } catch (error) {
        return next(new ErrorResponse(error.message, 400));
    }
});

export const updateCategory = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const validatedData = req.body || {};

    try {
        const category = await updateCategoryService(id, validatedData);

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: category,
        });
    } catch (error) {
        return next(new ErrorResponse(error.message, 404));
    }
});

export const deleteCategory = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    try {
        await deleteCategoryService(id);

        res.status(200).json({
            success: true,
            message: "Category deleted successfully",
            data: {},
        });
    } catch (error) {
        return next(new ErrorResponse(error.message, 404));
    }
});




export const getCategoryById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const category = await getCategoryByIdService(id);

    if (!category) {
        return next(new ErrorResponse("Category not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Category retrieved successfully",
        data: category,
    });
});
import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import { paginateModel } from '../../../common/services/common.service.js'
import {
    createCategorySchema,
    updateCategorySchema,
} from "../schema/category.schema.js";
import { getLocalCategoryModel } from "../../../configs/connect.db.js";

export const getCategories = asyncHandler(async (req, res, next) => {
    const CategoryModel = getLocalCategoryModel();

    const categories = await CategoryModel.find().sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        message: "Categories retrieved successfully",
        data: categories,
    });
});




export const getPaginationCategories = asyncHandler(async (req, res, next) => {
    const CategoryModel = getLocalCategoryModel();
    const { page = 1, limit = 20 } = req.query;

    const result = await paginateModel({
        model: CategoryModel,
        page,
        limit,
        sort: { createdAt: -1 }
    });

    res.status(200).json({
        success: true,
        message: "Categories retrieved successfully",
        ...result
    });
});



export const createCategory = asyncHandler(async (req, res, next) => {
    const CategoryModel = getLocalCategoryModel();

    const validatedData = await createCategorySchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    const { name } = validatedData;

    const categoryExists = await CategoryModel.findOne({ name });

    if (categoryExists) {
        return next(
            new ErrorResponse("Category with this name already exists", 400),
        );
    }

    const category = await CategoryModel.create(validatedData);

    res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: category,
    });
});

export const updateCategory = asyncHandler(async (req, res, next) => {
    const CategoryModel = getLocalCategoryModel();
    const { id } = req.params;

    let category = await CategoryModel.findById(id);

    if (!category) {
        return next(new ErrorResponse("Category not found", 404));
    }

    const validatedData = await updateCategorySchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (validatedData.name && validatedData.name !== category.name) {
        const nameExists = await CategoryModel.findOne({
            name: validatedData.name,
        });
        if (nameExists) {
            return next(
                new ErrorResponse(
                    "Category with this name already exists",
                    400,
                ),
            );
        }
    }

    category = await CategoryModel.findByIdAndUpdate(id, validatedData, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: category,
    });
});

export const deleteCategory = asyncHandler(async (req, res, next) => {
    const CategoryModel = getLocalCategoryModel();
    const { id } = req.params;

    const category = await CategoryModel.findById(id);

    if (!category) {
        return next(new ErrorResponse("Category not found", 404));
    }

    await category.deleteOne();

    res.status(200).json({
        success: true,
        message: "Category deleted successfully",
        data: {},
    });
});




export const getCategoryById = asyncHandler(async (req, res, next) => {
    const CategoryModel = getLocalCategoryModel();
    const { id } = req.params;

    const category = await CategoryModel.findById(id);

    if (!category) {
        return next(new ErrorResponse("Category not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Category retrieved successfully",
        data: category,
    });
});
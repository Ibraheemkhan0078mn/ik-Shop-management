import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import { getLocalSubCategoryModel } from "../../../configs/connect.db.js";

export const getSubCategories = asyncHandler(async (req, res, next) => {
    const SubCategoryModel = getLocalSubCategoryModel();

    const subcategories = await SubCategoryModel.find()
        .populate("category", "name")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        message: "Subcategories retrieved successfully",
        data: subcategories,
    });
});

export const createSubCategory = asyncHandler(async (req, res, next) => {
    const SubCategoryModel = getLocalSubCategoryModel();

    const validatedData = req.body || {};

    const { name, category } = validatedData;

    const subCategoryExists = await SubCategoryModel.findOne({
        name,
        category,
    });

    if (subCategoryExists) {
        return next(
            new ErrorResponse(
                "Subcategory with this name already exists in this category",
                400,
            ),
        );
    }

    const subcategory = await SubCategoryModel.create(validatedData);

    res.status(201).json({
        success: true,
        message: "Subcategory created successfully",
        data: subcategory,
    });
});

export const updateSubCategory = asyncHandler(async (req, res, next) => {
    const SubCategoryModel = getLocalSubCategoryModel();
    const { id } = req.params;

    let subcategory = await SubCategoryModel.findById(id);

    if (!subcategory) {
        return next(new ErrorResponse("Subcategory not found", 404));
    }

    const validatedData = req.body || {};

    if (validatedData.name) {
        const checkCategory = validatedData.category || subcategory.category;
        const nameExists = await SubCategoryModel.findOne({
            _id: { $ne: id },
            name: validatedData.name,
            category: checkCategory,
        });

        if (nameExists) {
            return next(
                new ErrorResponse(
                    "Subcategory name already exists in this category",
                    400,
                ),
            );
        }
    }

    subcategory = await SubCategoryModel.findByIdAndUpdate(id, validatedData, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        message: "Subcategory updated successfully",
        data: subcategory,
    });
});

export const deleteSubCategory = asyncHandler(async (req, res, next) => {
    const SubCategoryModel = getLocalSubCategoryModel();
    const { id } = req.params;

    const subcategory = await SubCategoryModel.findById(id);

    if (!subcategory) {
        return next(new ErrorResponse("Subcategory not found", 404));
    }

    await subcategory.deleteOne();

    res.status(200).json({
        success: true,
        message: "Subcategory deleted successfully",
        data: {},
    });
});

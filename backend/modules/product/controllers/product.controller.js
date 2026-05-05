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
import { getLocalProductModel, getLocalSubCategoryModel } from "../../../configs/connect.db.js";
import { paginateModel } from "../../../common/services/common.service.js";
import { filterEmptyValues } from "../../../common/services/filterEmptyFromObject.js";

export const getProducts = asyncHandler(async (req, res, next) => {
    const ProductModel = getLocalProductModel();

    const products = await ProductModel.find()
        .populate("batches")
        .populate("category")
        .populate("subCategory")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        message: "Products retrieved successfully",
        data: products,
    });
});



export const getPaginationProduct = asyncHandler(async (req, res, next) => {
    const ProductModel = getLocalProductModel();
    const { page = 1, limit = 20 } = req.query;

    const result = await paginateModel({
        model: ProductModel,
        page,
        limit,
        populate: ["batches", "category", "subCategory"],
        sort: { createdAt: -1 }
    });

    res.status(200).json({
        success: true,
        message: "Products retrieved successfully",
        ...result
    });
});

export const getProductById = asyncHandler(async (req, res, next) => {
    const ProductModel = getLocalProductModel();
    const { id } = req.params;

    const product = await ProductModel.findById(id)
        .populate("category", "name")
        .populate("subCategory", "name");

    if (!product) {
        return next(new ErrorResponse("Product not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Product retrieved successfully",
        data: product,
    });
});

export const createProduct = asyncHandler(async (req, res, next) => {
    const ProductModel = getLocalProductModel();
    console.log(req.body, "The create product body ")

    let validatedData = await createProductSchema.validate(req.body, {
        abortEarly: true,
        stripUnknown: true,
    });


    validatedData = filterEmptyValues(validatedData);
    const { hotKeySku, productCode, barcode } = validatedData;

    const existingProduct = await ProductModel.findOne({
        $or: [
            { hotKeySku },
            { productCode: { $ne: null, $eq: productCode } },
            // { barcode: { $ne: null, $eq: barcode } },
        ],
    });

    if (existingProduct) {
        return next(
            new ErrorResponse(
                "Product with this SKU, Product Code, or Barcode already exists",
                400,
            ),
        );
    }

    const product = await ProductModel.create(validatedData);

    res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product,
    });
});

export const updateProduct = asyncHandler(async (req, res, next) => {
    const ProductModel = getLocalProductModel();
    const { id } = req.params;

    let product = await ProductModel.findById(id);

    if (!product) {
        return next(new ErrorResponse("Product not found", 404));
    } 

    const validatedData =req.body

    if (
        validatedData.hotKeySku ||
        validatedData.productCode ||
        validatedData.barcode
    ) {
        const query = { _id: { $ne: id }, $or: [] };

        if (validatedData.hotKeySku)
            query.$or.push({ hotKeySku: validatedData.hotKeySku });
        if (validatedData.productCode)
            query.$or.push({ productCode: validatedData.productCode });
        if (validatedData.barcode)
            query.$or.push({ barcode: validatedData.barcode });

        if (query.$or.length > 0) {
            const duplicateCheck = await ProductModel.findOne(query);
            if (duplicateCheck) {
                return next(
                    new ErrorResponse(
                        "SKU, Product Code, or Barcode is already in use by another product",
                        400,
                    ),
                );
            }
        }
    }

    product = await ProductModel.findByIdAndUpdate(
        id,
        { ...validatedData, updated: Date.now() },
        {
            new: true,
            runValidators: true,
        },
    );

    res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: product,
    });
});

export const deleteProduct = asyncHandler(async (req, res, next) => {
    const ProductModel = getLocalProductModel();
    const { id } = req.params;

    const product = await ProductModel.findById(id);

    if (!product) {
        return next(new ErrorResponse("Product not found", 404));
    }

    await product.deleteOne();

    res.status(200).json({
        success: true,
        message: "Product deleted successfully",
        data: {},
    });
});












































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




export const getPaginationSubCategories = asyncHandler(async (req, res, next) => {
    const SubCategoryModel = getLocalSubCategoryModel();
    const { page = 1, limit = 20 } = req.query;

    const result = await paginateModel({
        model: SubCategoryModel,
        page,
        limit,
        populate: ["category"],
        sort: { createdAt: -1 }
    });

    res.status(200).json({
        success: true,
        message: "Subcategories retrieved successfully",
        ...result
    });
});



export const createSubCategory = asyncHandler(async (req, res, next) => {
    const SubCategoryModel = getLocalSubCategoryModel();

    // const validatedData = await createSubCategorySchema.validate(req.body, {
    //     abortEarly: false,
    //     stripUnknown: true,
    // });

    console.log(req.body)
    const { name, category } = req.body;

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

    const subcategory = await SubCategoryModel.create(req.body);

    res.status(201).json({
        success: true,
        message: "Subcategory created successfully",
        data: subcategory,
    });
});

export const updateSubCategory = asyncHandler(async (req, res, next) => {
    const SubCategoryModel = getLocalSubCategoryModel();
    const { id } = req.params;

    console.log(req.body)

    let subcategory = await SubCategoryModel.findById(id);

    if (!subcategory) {
        return next(new ErrorResponse("Subcategory not found", 404));
    }

    const validatedData = req.body;




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

export const getSubCategoriesById = asyncHandler(async (req, res, next) => {
    const SubCategoryModel = getLocalSubCategoryModel();
    const { id } = req.params;

    const subcategory = await SubCategoryModel.findById(id);

    if (!subcategory) {
        return next(new ErrorResponse("Subcategory not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Subcategory retrieved successfully",
        data: subcategory,
    });
})









export const getSubCategoriesByCatagId = asyncHandler(async (req, res, next) => {
    const SubCategoryModel = getLocalSubCategoryModel();
    const { id } = req.params;

    const subcategory = await SubCategoryModel.find({ category: id }).populate("category", "name");

    if (!subcategory) {
        return next(new ErrorResponse("Subcategory not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Subcategory retrieved successfully",
        data: subcategory,
    });
})
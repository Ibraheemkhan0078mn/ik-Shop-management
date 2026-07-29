import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import {
    getBrands, getPaginationBrands, getBrandById,
    createBrand, updateBrand, deleteBrand,
} from "../services/brand.service.js";

export const getBrandsData = asyncHandler(async (req, res) => {
    const data = await getBrands();
    res.status(200).json({ success: true, message: "Brands retrieved successfully", data });
});

export const getPaginationBrandsData = asyncHandler(async (req, res) => {
    const result = await getPaginationBrands(req.query);
    res.status(200).json({ success: true, message: "Brands retrieved successfully", ...result });
});

export const getBrandDataById = asyncHandler(async (req, res, next) => {
    const data = await getBrandById(req.params.id);
    if (!data) {
        return next(new ErrorResponse("Brand not found", 404));
    }
    res.status(200).json({ success: true, message: "Brand retrieved successfully", data });
});

export const createBrandData = asyncHandler(async (req, res, next) => {
    try {
        const data = await createBrand(req.body);
        res.status(201).json({ success: true, message: "Brand created successfully", data });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

export const updateBrandData = asyncHandler(async (req, res, next) => {
    try {
        const data = await updateBrand(req.params.id, req.body);
        res.status(200).json({ success: true, message: "Brand updated successfully", data });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

export const deleteBrandData = asyncHandler(async (req, res, next) => {
    try {
        await deleteBrand(req.params.id);
        res.status(200).json({ success: true, message: "Brand deleted successfully", data: {} });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import {
    createStaff,
    getAllStaff,
    getStaffById,
    updateStaff,
    deleteStaff,
    addDocumentToStaff,
    removeDocumentFromStaff,
} from "../services/staff.service.js";

// Create Staff
export const createStaffData = asyncHandler(async (req, res, next) => {
    const staffData = req.body;
    const staff = await createStaff(staffData);

    res.status(201).json({
        success: true,
        message: "Staff created successfully",
        data: staff,
    });
});

// Get All Staff
export const getAllStaffData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const result = await getAllStaff(filters);

    res.status(200).json({
        success: true,
        message: "Staff retrieved successfully",
        ...result,
    });
});

// Get Staff By ID
export const getStaffDataById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const staff = await getStaffById(id);

    res.status(200).json({
        success: true,
        message: "Staff retrieved successfully",
        data: staff,
    });
});

// Update Staff
export const updateStaffData = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const updateData = req.body;
    const staff = await updateStaff(id, updateData);

    res.status(200).json({
        success: true,
        message: "Staff updated successfully",
        data: staff,
    });
});

// Delete Staff
export const deleteStaffData = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const staff = await deleteStaff(id);

    res.status(200).json({
        success: true,
        message: "Staff deleted successfully",
        data: staff,
    });
});

// Add Images to Staff
export const addImagesToStaffData = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    
    if (!req.files || req.files.length === 0) {
        return next(new ErrorResponse("No images uploaded", 400));
    }

    const imageData = req.files.map(file => ({
        imageType: "document",
        imageName: file.filename,
        uploadedAt: new Date()
    }));

    const staff = await addDocumentToStaff(id, imageData);

    res.status(200).json({
        success: true,
        message: "Images added successfully",
        data: staff,
    });
});

// Remove Image from Staff
export const removeImageFromStaffData = asyncHandler(async (req, res, next) => {
    const { id, imageId } = req.params;
    const staff = await removeDocumentFromStaff(id, imageId);

    res.status(200).json({
        success: true,
        message: "Image removed successfully",
        data: staff,
    });
});

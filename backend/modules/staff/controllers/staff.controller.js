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

// Add Document to Staff
export const addDocumentToStaffData = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const documentData = req.body;
    const staff = await addDocumentToStaff(id, documentData);

    res.status(200).json({
        success: true,
        message: "Document added successfully",
        data: staff,
    });
});

// Remove Document from Staff
export const removeDocumentFromStaffData = asyncHandler(async (req, res, next) => {
    const { id, docId } = req.params;
    const staff = await removeDocumentFromStaff(id, docId);

    res.status(200).json({
        success: true,
        message: "Document removed successfully",
        data: staff,
    });
});

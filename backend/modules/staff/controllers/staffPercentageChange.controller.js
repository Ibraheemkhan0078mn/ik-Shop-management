import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import {
    createStaffPercentageChangeService,
    findStaffPercentageChangeService,
    findByIdStaffPercentageChangeService,
    updateStaffPercentageChangeService,
    deleteOneStaffPercentageChangeService
} from "../services/staffPercentageChange.crud.js";

// Create Percentage Change
export const createPercentageChangeData = asyncHandler(async (req, res, next) => {
    const percentageChangeData = req.body;
    
    const percentageChange = await createStaffPercentageChangeService(percentageChangeData);

    res.status(201).json({
        success: true,
        message: "Percentage change created successfully",
        data: percentageChange,
    });
});

// Get Percentage Changes by Staff ID
export const getPercentageChangesByStaffData = asyncHandler(async (req, res, next) => {
    const { staffId } = req.params;
    
    const percentageChanges = await findStaffPercentageChangeService(
        { staffId },
        { sort: { percentageChangeFromDate: -1 } }
    );

    res.status(200).json({
        success: true,
        message: "Percentage changes retrieved successfully",
        data: percentageChanges,
    });
});

// Get Percentage Change by ID
export const getPercentageChangeByIdData = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    
    const percentageChange = await findByIdStaffPercentageChangeService(id);
    if (!percentageChange) {
        return next(new ErrorResponse("Percentage change not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Percentage change retrieved successfully",
        data: percentageChange,
    });
});

// Update Percentage Change
export const updatePercentageChangeData = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const percentageChange = await updateStaffPercentageChangeService(id, updateData);
    if (!percentageChange) {
        return next(new ErrorResponse("Percentage change not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Percentage change updated successfully",
        data: percentageChange,
    });
});

// Delete Percentage Change
export const deletePercentageChangeData = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    
    const percentageChange = await deleteOneStaffPercentageChangeService(id);
    if (!percentageChange) {
        return next(new ErrorResponse("Percentage change not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Percentage change deleted successfully",
        data: percentageChange,
    });
});

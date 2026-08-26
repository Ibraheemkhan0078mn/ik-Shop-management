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
    
    // Auto-detect change type by comparing with previous percentage
    const { staffId, percentage } = percentageChangeData;
    if (staffId && percentage !== undefined) {
        const previousChanges = await findStaffPercentageChangeService(
            { staffId },
            { sort: { percentageChangeFromDate: -1 }, limit: 1 }
        );
        
        if (previousChanges && previousChanges.length > 0) {
            const lastChange = previousChanges[0];
            const newPercentage = parseFloat(percentage);
            const lastPercentage = parseFloat(lastChange.percentage);
            
            if (newPercentage > lastPercentage) {
                percentageChangeData.changeType = 'inc';
            } else if (newPercentage < lastPercentage) {
                percentageChangeData.changeType = 'decr';
            } else {
                percentageChangeData.changeType = 'set';
            }
        } else {
            // First percentage change - set as 'set'
            percentageChangeData.changeType = 'set';
        }
    }
    
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
    
    // Auto-detect change type when percentage is being updated
    const { percentage } = updateData;
    if (percentage !== undefined) {
        const existingChange = await findByIdStaffPercentageChangeService(id);
        if (existingChange) {
            // Get previous changes (excluding current one) to compare
            const previousChanges = await findStaffPercentageChangeService(
                { staffId: existingChange.staffId, _id: { $ne: id } },
                { sort: { percentageChangeFromDate: -1 }, limit: 1 }
            );
            
            const newPercentage = parseFloat(percentage);
            
            if (previousChanges && previousChanges.length > 0) {
                const lastChange = previousChanges[0];
                const lastPercentage = parseFloat(lastChange.percentage);
                
                if (newPercentage > lastPercentage) {
                    updateData.changeType = 'inc';
                } else if (newPercentage < lastPercentage) {
                    updateData.changeType = 'decr';
                } else {
                    updateData.changeType = 'set';
                }
            } else {
                // No previous changes - set as 'set'
                updateData.changeType = 'set';
            }
        }
    }
    
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

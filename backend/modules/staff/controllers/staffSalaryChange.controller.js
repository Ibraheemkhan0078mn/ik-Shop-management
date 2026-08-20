import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import {
    createStaffSalaryChangeService,
    findStaffSalaryChangeService,
    findByIdStaffSalaryChangeService,
    updateStaffSalaryChangeService,
    deleteOneStaffSalaryChangeService
} from "../services/staffSalaryChange.crud.js";

// Create Salary Change
export const createSalaryChangeData = asyncHandler(async (req, res, next) => {
    const salaryChangeData = req.body;
    
    const salaryChange = await createStaffSalaryChangeService(salaryChangeData);

    res.status(201).json({
        success: true,
        message: "Salary change created successfully",
        data: salaryChange,
    });
});

// Get Salary Changes by Staff ID
export const getSalaryChangesByStaffData = asyncHandler(async (req, res, next) => {
    const { staffId } = req.params;
    
    const salaryChanges = await findStaffSalaryChangeService(
        { staffId },
        { sort: { salaryChangeFromDate: -1 } }
    );

    res.status(200).json({
        success: true,
        message: "Salary changes retrieved successfully",
        data: salaryChanges,
    });
});

// Get Salary Change by ID
export const getSalaryChangeByIdData = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    
    const salaryChange = await findByIdStaffSalaryChangeService(id);
    if (!salaryChange) {
        return next(new ErrorResponse("Salary change not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Salary change retrieved successfully",
        data: salaryChange,
    });
});

// Update Salary Change
export const updateSalaryChangeData = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const salaryChange = await updateStaffSalaryChangeService(id, updateData);
    if (!salaryChange) {
        return next(new ErrorResponse("Salary change not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Salary change updated successfully",
        data: salaryChange,
    });
});

// Delete Salary Change
export const deleteSalaryChangeData = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    
    const salaryChange = await deleteOneStaffSalaryChangeService(id);
    if (!salaryChange) {
        return next(new ErrorResponse("Salary change not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Salary change deleted successfully",
        data: salaryChange,
    });
});

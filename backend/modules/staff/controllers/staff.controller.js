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
    getAttendanceByDate,
    createOrUpdateAttendance,
    getAttendanceHistory,
    getActiveStaff,
    calculateSalaryBreakdown,
    calculatePaymentSummary,
} from "../services/staff.service.js";

// Create Staff
export const createStaffData = asyncHandler(async (req, res, next) => {
    const staffData = req.body;
    
    // If a photo was uploaded, add its filename to the staff data
    if (req.file) {
        staffData.photo = req.file.filename;
    }
    
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
    
    // If a photo was uploaded, add its filename to the update data
    if (req.file) {
        updateData.photo = req.file.filename;
    }
    
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

// Get Attendance by Date
export const getAttendanceByDateData = asyncHandler(async (req, res, next) => {
    const { date } = req.query;
    const attendance = await getAttendanceByDate(date);

    res.status(200).json({
        success: true,
        message: "Attendance retrieved successfully",
        data: attendance,
    });
});

// Create or Update Attendance
export const createOrUpdateAttendanceData = asyncHandler(async (req, res, next) => {
    const { date, staff, status, lateHours } = req.body;
    const userId = req.user?._id;
console.log(req.body, "the body of staff attendance update")
    console.log('Received attendance data:', { date, staff, status, lateHours });

    // Validate required fields
    if (!staff) {
        console.error('Staff ID is missing from request body');
        return next(new ErrorResponse("Staff ID is required", 400));
    }
    if (!status) {
        return next(new ErrorResponse("Status is required", 400));
    }
    if (!date) {
        return next(new ErrorResponse("Date is required", 400));
    }

    const attendance = await createOrUpdateAttendance(
        date,
        { staff, status, lateHours },
        userId
    );

    res.status(200).json({
        success: true,
        message: "Attendance saved successfully",
        data: attendance,
    });
});

// Get Attendance History
export const getAttendanceHistoryData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const result = await getAttendanceHistory(filters);

    res.status(200).json({
        success: true,
        message: "Attendance history retrieved successfully",
        ...result,
    });
});

// Get Active Staff
export const getActiveStaffData = asyncHandler(async (req, res, next) => {
    const staff = await getActiveStaff();

    res.status(200).json({
        success: true,
        message: "Active staff retrieved successfully",
        data: staff,
    });
});

// Calculate Salary Breakdown
export const getSalaryBreakdownData = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return next(new ErrorResponse("Start date and end date are required", 400));
    }

    const breakdown = await calculateSalaryBreakdown(id, startDate, endDate);

    res.status(200).json({
        success: true,
        message: "Salary breakdown calculated successfully",
        data: breakdown,
    });
});

// Calculate Payment Summary
export const getPaymentSummaryData = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const summary = await calculatePaymentSummary(id);

    res.status(200).json({
        success: true,
        message: "Payment summary calculated successfully",
        data: summary,
    });
});

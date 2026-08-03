import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import {
    createSaleBill,
    getSaleBillsByStaff,
    markSaleBillAsPaid,
} from "../services/staff.service.js";

// Create Sale Bill
export const createSaleBillData = asyncHandler(async (req, res, next) => {
    const billData = req.body;
    const bill = await createSaleBill(billData);

    res.status(201).json({
        success: true,
        message: "Sale bill created successfully",
        data: bill,
    });
});

// Get Sale Bills by Staff
export const getSaleBillsByStaffData = asyncHandler(async (req, res, next) => {
    const { staffId } = req.params;
    const filters = req.query;
    const result = await getSaleBillsByStaff(staffId, filters);

    res.status(200).json({
        success: true,
        message: "Sale bills retrieved successfully",
        ...result,
    });
});

// Mark Sale Bill as Paid
export const markSaleBillAsPaidData = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const bill = await markSaleBillAsPaid(id);

    res.status(200).json({
        success: true,
        message: "Sale bill marked as paid successfully",
        data: bill,
    });
});

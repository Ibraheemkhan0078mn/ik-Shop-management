import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import {
    createSalaryPayment,
    getSalaryPaymentsByStaff,
} from "../services/staff.service.js";

// Create Salary Payment
export const createSalaryPaymentData = asyncHandler(async (req, res, next) => {
    const paymentData = req.body;
    const payment = await createSalaryPayment(paymentData);

    res.status(201).json({
        success: true,
        message: "Salary payment recorded successfully",
        data: payment,
    });
});

// Get Salary Payments by Staff
export const getSalaryPaymentsByStaffData = asyncHandler(async (req, res, next) => {
    const { staffId } = req.params;
    const filters = req.query;
    const result = await getSalaryPaymentsByStaff(staffId, filters);

    res.status(200).json({
        success: true,
        message: "Salary payments retrieved successfully",
        ...result,
    });
});

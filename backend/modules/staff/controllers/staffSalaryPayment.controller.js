import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import {
    createSalaryPayment,
    getSalaryPaymentsByStaff,
    deleteSalaryPayment,
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

// Delete Salary Payment
export const deleteSalaryPaymentData = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const payment = await deleteSalaryPayment(id);

    res.status(200).json({
        success: true,
        message: "Salary payment deleted successfully",
        data: payment,
    });
});

import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import {
    getAllPaymentMethods as getAllPaymentMethodsService,
    getPaymentMethodById as getPaymentMethodByIdService,
    createPaymentMethod as createPaymentMethodService,
    updatePaymentMethod as updatePaymentMethodService,
    deletePaymentMethod as deletePaymentMethodService,
} from "../services/paymentMethod.service.js";

// ─────────────────────────────────────────────────────────────────────────────
//  GET /payment-methods
//  Returns all payment methods
// ─────────────────────────────────────────────────────────────────────────────
export const getAllPaymentMethods = asyncHandler(async (req, res) => {
    const paymentMethods = await getAllPaymentMethodsService();

    res.status(200).json({
        success: true,
        message: "Payment methods fetched successfully",
        data: paymentMethods
    });
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /payment-methods/:id
//  Returns a single payment method by ID
// ─────────────────────────────────────────────────────────────────────────────
export const getPaymentMethodById = asyncHandler(async (req, res, next) => {
    const paymentMethod = await getPaymentMethodByIdService(req.params.id);

    if (!paymentMethod) {
        return next(new ErrorResponse("Payment method not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Payment method fetched successfully",
        data: paymentMethod
    });
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /payment-methods
//  Creates a new payment method
// ─────────────────────────────────────────────────────────────────────────────
export const createPaymentMethod = asyncHandler(async (req, res, next) => {
    const { name } = req.body;

    if (!name || name.trim() === "") {
        return next(new ErrorResponse("Payment method name is required", 400));
    }

    try {
        const paymentMethod = await createPaymentMethodService({ name });

        res.status(201).json({
            success: true,
            message: "Payment method created successfully",
            data: paymentMethod
        });
    } catch (error) {
        return next(new ErrorResponse(error.message, 400));
    }
});

// ─────────────────────────────────────────────────────────────────────────────
//  PUT /payment-methods/:id
//  Updates an existing payment method
// ─────────────────────────────────────────────────────────────────────────────
export const updatePaymentMethod = asyncHandler(async (req, res, next) => {
    const { name, isActive } = req.body;

    if (!name || name.trim() === "") {
        return next(new ErrorResponse("Payment method name is required", 400));
    }

    try {
        const paymentMethod = await updatePaymentMethodService(req.params.id, { name, isActive });

        res.status(200).json({
            success: true,
            message: "Payment method updated successfully",
            data: paymentMethod
        });
    } catch (error) {
        return next(new ErrorResponse(error.message, 404));
    }
});

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE /payment-methods/:id
//  Deletes a payment method
// ─────────────────────────────────────────────────────────────────────────────
export const deletePaymentMethod = asyncHandler(async (req, res, next) => {
    try {
        await deletePaymentMethodService(req.params.id);

        res.status(200).json({
            success: true,
            message: "Payment method deleted successfully",
            data: {}
        });
    } catch (error) {
        return next(new ErrorResponse(error.message, 404));
    }
});

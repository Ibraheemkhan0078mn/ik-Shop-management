import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import { getLocalPaymentMethodModel } from "../../../configs/connect.db.js";

// ─────────────────────────────────────────────────────────────────────────────
//  GET /payment-methods
//  Returns all payment methods
// ─────────────────────────────────────────────────────────────────────────────
export const getAllPaymentMethods = asyncHandler(async (req, res) => {
    const PaymentMethodModel = getLocalPaymentMethodModel();
    const paymentMethods = await PaymentMethodModel.find().sort({ name: 1 });

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
    const PaymentMethodModel = getLocalPaymentMethodModel();
    const paymentMethod = await PaymentMethodModel.findById(req.params.id);

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

    const PaymentMethodModel = getLocalPaymentMethodModel();

    // Check if payment method with same name already exists
    const existingMethod = await PaymentMethodModel.findOne({ name: name.trim() });
    if (existingMethod) {
        return next(new ErrorResponse("Payment method with this name already exists", 400));
    }

    const paymentMethod = await PaymentMethodModel.create({
        name: name.trim(),
        isActive: true
    });

    res.status(201).json({
        success: true,
        message: "Payment method created successfully",
        data: paymentMethod
    });
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

    const PaymentMethodModel = getLocalPaymentMethodModel();
    const paymentMethod = await PaymentMethodModel.findById(req.params.id);

    if (!paymentMethod) {
        return next(new ErrorResponse("Payment method not found", 404));
    }

    // Check if another payment method with same name exists
    const existingMethod = await PaymentMethodModel.findOne({ 
        name: name.trim(),
        _id: { $ne: req.params.id }
    });
    if (existingMethod) {
        return next(new ErrorResponse("Payment method with this name already exists", 400));
    }

    paymentMethod.name = name.trim();
    if (typeof isActive === "boolean") {
        paymentMethod.isActive = isActive;
    }

    await paymentMethod.save();

    res.status(200).json({
        success: true,
        message: "Payment method updated successfully",
        data: paymentMethod
    });
});

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE /payment-methods/:id
//  Deletes a payment method
// ─────────────────────────────────────────────────────────────────────────────
export const deletePaymentMethod = asyncHandler(async (req, res, next) => {
    const PaymentMethodModel = getLocalPaymentMethodModel();
    const paymentMethod = await PaymentMethodModel.findById(req.params.id);

    if (!paymentMethod) {
        return next(new ErrorResponse("Payment method not found", 404));
    }

    await paymentMethod.deleteOne();

    res.status(200).json({
        success: true,
        message: "Payment method deleted successfully",
        data: {}
    });
});

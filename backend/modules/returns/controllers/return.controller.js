// return.controller.js
import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import { createReturnSchema, updateReturnSchema } from "../schemas/return.schema.js";
import {
    getLocalReturnModel,
    getLocalProductModel,
} from "../../../configs/connect.db.js";

// ── GET ALL ──────────────────────────────────────────────────
export const getReturns = asyncHandler(async (req, res) => {
    const ReturnModel = getLocalReturnModel();
    const { status, returnType, startDate, endDate } = req.query;

    let query = {};
    if (status) query.status = status;
    if (returnType) query.returnType = returnType;
    if (startDate || endDate) {
        query.returnDate = {};
        if (startDate) query.returnDate.$gte = new Date(startDate);
        if (endDate) query.returnDate.$lte = new Date(endDate);
    }

    const returns = await ReturnModel.find(query)
        .populate("invoice")
        .populate("items.product")
        // .populate("createdBy", "name email")
        // .populate("approvedBy", "name email")
        .sort({ createdAt: -1 });

    res.status(200).json({ success: true, message: "Returns retrieved", data: returns });
});

// ── GET PAGINATED ────────────────────────────────────────────
export const getPaginatedReturns = asyncHandler(async (req, res) => {
    const ReturnModel = getLocalReturnModel();
    const { status, returnType, startDate, endDate } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;
    if (returnType) query.returnType = returnType;
    if (startDate || endDate) {
        query.returnDate = {};
        if (startDate) query.returnDate.$gte = new Date(startDate);
        if (endDate) query.returnDate.$lte = new Date(endDate);
    }

    const [returns, total] = await Promise.all([
        ReturnModel.find(query)
            .populate("invoice")
            .populate("items.product")
            // .populate("createdBy", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        ReturnModel.countDocuments(query),
    ]);

    res.status(200).json({
        success: true,
        message: "Returns retrieved",
        data:       returns,
        total:      total,
        page:       page,
        limit:      limit,
        totalPages: Math.ceil(total / limit),
    });
});

// ── GET SINGLE ───────────────────────────────────────────────
export const getReturn = asyncHandler(async (req, res, next) => {
    const ReturnModel = getLocalReturnModel();
    const ret = await ReturnModel.findById(req.params.id)
        .populate("invoice")
        .populate("items.product")
    // .populate("createdBy", "name email")
    // .populate("approvedBy", "name email");

    if (!ret) return next(new ErrorResponse("Return not found", 404));

    res.status(200).json({ success: true, message: "Return retrieved", data: ret });
});

// ── CREATE ───────────────────────────────────────────────────
export const createReturn = asyncHandler(async (req, res, next) => {
    const ReturnModel = getLocalReturnModel();

    const validatedData = await createReturnSchema.validate(req.body, {
        abortEarly: false, stripUnknown: true,
    });

    // auto-calculate per item refundAmount + totals
    let totalQuantity = 0;
    let totalRefund = 0;

    validatedData.items = validatedData.items.map((item) => {
        const refundAmount = (item.returnQuantity * (item.costPrice || 0)) - (item.cut || 0);
        totalQuantity += item.returnQuantity;
        totalRefund += refundAmount;
        return { ...item, refundAmount };
    });

    validatedData.totalItems = validatedData.items.length;
    validatedData.totalQuantity = totalQuantity;
    validatedData.totalRefund = totalRefund;
    validatedData.createdBy = req.user._id;

    const count = await ReturnModel.countDocuments();
    validatedData.returnNumber = `RET-${String(count + 1).padStart(5, "0")}`;

    const ret = await ReturnModel.create(validatedData);

    res.status(201).json({ success: true, message: "Return created", data: ret });
});

// ── UPDATE ───────────────────────────────────────────────────
export const updateReturn = asyncHandler(async (req, res, next) => {
    const ReturnModel = getLocalReturnModel();
    const { id } = req.params;

    let ret = await ReturnModel.findById(id);
    if (!ret) return next(new ErrorResponse("Return not found", 404));
    if (ret.status !== "draft") return next(new ErrorResponse(`Cannot edit a ${ret.status} return`, 400));

    const validatedData = await updateReturnSchema.validate(req.body, {
        abortEarly: false, stripUnknown: true,
    });

    if (validatedData.items?.length) {
        let totalQuantity = 0;
        let totalRefund = 0;
        validatedData.items = validatedData.items.map((item) => {
            const refundAmount = (item.returnQuantity * (item.costPrice || 0)) - (item.cut || 0);
            totalQuantity += item.returnQuantity;
            totalRefund += refundAmount;
            return { ...item, refundAmount };
        });
        validatedData.totalItems = validatedData.items.length;
        validatedData.totalQuantity = totalQuantity;
        validatedData.totalRefund = totalRefund;
    }

    validatedData.updatedBy = req.user._id;

    ret = await ReturnModel.findByIdAndUpdate(id, validatedData, { new: true, runValidators: true });

    res.status(200).json({ success: true, message: "Return updated", data: ret });
});

// ── DELETE ───────────────────────────────────────────────────
export const deleteReturn = asyncHandler(async (req, res, next) => {
    const ReturnModel = getLocalReturnModel();
    const ret = await ReturnModel.findById(req.params.id);

    if (!ret) return next(new ErrorResponse("Return not found", 404));
    if (ret.status !== "draft") return next(new ErrorResponse(`Cannot delete a ${ret.status} return`, 400));

    await ret.deleteOne();
    res.status(200).json({ success: true, message: "Return deleted", data: {} });
});

// ── SUBMIT ───────────────────────────────────────────────────
export const submitReturn = asyncHandler(async (req, res, next) => {
    const ReturnModel = getLocalReturnModel();
    const ret = await ReturnModel.findById(req.params.id);

    if (!ret) return next(new ErrorResponse("Return not found", 404));
    if (ret.status !== "draft") return next(new ErrorResponse("Only drafts can be submitted", 400));

    const submitted = await ReturnModel.findByIdAndUpdate(req.params.id, { status: "pending" }, { new: true });
    res.status(200).json({ success: true, message: "Return submitted for approval", data: submitted });
});

// ── APPROVE ──────────────────────────────────────────────────
export const approveReturn = asyncHandler(async (req, res, next) => {
    const ReturnModel = getLocalReturnModel();
    const ProductModel = getLocalProductModel();
    const ret = await ReturnModel.findById(req.params.id);

    if (!ret) return next(new ErrorResponse("Return not found", 404));
    if (ret.status !== "pending") return next(new ErrorResponse("Only pending returns can be approved", 400));

    // stock wapas sirf resalable items ka
    for (const item of ret.items) {
        if (item.condition === "resalable") {
            await ProductModel.findByIdAndUpdate(item.product, {
                $inc: { currentStock: item.returnQuantity },
            });
        }
    }

    const approved = await ReturnModel.findByIdAndUpdate(req.params.id, {
        status: "approved", approvedBy: req.user._id, approvedAt: new Date(),
    }, { new: true });

    res.status(200).json({ success: true, message: "Return approved", data: approved });
});

// ── REJECT ───────────────────────────────────────────────────
export const rejectReturn = asyncHandler(async (req, res, next) => {
    const ReturnModel = getLocalReturnModel();
    const ret = await ReturnModel.findById(req.params.id);

    if (!ret) return next(new ErrorResponse("Return not found", 404));
    if (ret.status !== "pending") return next(new ErrorResponse("Only pending returns can be rejected", 400));
    if (!req.body.rejectionReason) return next(new ErrorResponse("Rejection reason required", 400));

    const rejected = await ReturnModel.findByIdAndUpdate(req.params.id, {
        status: "rejected", rejectionReason: req.body.rejectionReason,
    }, { new: true });

    res.status(200).json({ success: true, message: "Return rejected", data: rejected });
});
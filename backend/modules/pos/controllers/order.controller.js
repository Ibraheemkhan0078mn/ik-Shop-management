import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import { createOrderSchema } from "../schemas/order.schema.js";
import { getLocalOrderModel } from "../../../configs/connect.db.js";

export const generateOrderNumber = asyncHandler(async (req, res, next) => {
    const OrderModel = getLocalOrderModel();

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const count = await OrderModel.countDocuments({
        createdAt: { $gte: startOfDay, $lt: endOfDay },
    });

    const dateStr = startOfDay.toISOString().slice(0, 10).replace(/-/g, "");
    const orderNumber = `ORD-${dateStr}-${(count + 1).toString().padStart(4, "0")}`;

    res.status(200).json({
        success: true,
        orderNumber,
    });
});

export const getOrders = asyncHandler(async (req, res, next) => {
    const OrderModel = getLocalOrderModel();

    const orders = await OrderModel.find().sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        message: "Orders retrieved successfully",
        data: orders,
    });
});

export const addOrder = asyncHandler(async (req, res, next) => {
    const OrderModel = getLocalOrderModel();

    const normalizedItems = req.body.items.map((item) => ({
        product: item.product || item._id,
        name: item.name,
        quantity: item.quantity || item.qty,
        unitPrice: item.unitPrice || item.price,
        originalPrice: item.originalPrice || item.unitPrice || item.price,
        lineTotal:
            item.lineTotal ||
            (item.unitPrice || item.price) * (item.quantity || item.qty),
        portionType: item.portionType || "full",
    }));

    const bodyToValidate = { ...req.body, items: normalizedItems };

    const validatedData = await createOrderSchema.validate(bodyToValidate, {
        abortEarly: false,
        stripUnknown: true,
    });

    const existingOrder = await OrderModel.findOne({
        orderNumber: validatedData.orderNumber,
    });

    if (existingOrder) {
        return next(new ErrorResponse("Order number already exists", 400));
    }

    const order = await OrderModel.create(validatedData);

    res.status(201).json({
        success: true,
        message: "Order created successfully",
        order,
    });
});

export const deleteOrder = asyncHandler(async (req, res, next) => {
    const OrderModel = getLocalOrderModel();
    const { id } = req.params;

    const order = await OrderModel.findById(id);

    if (!order) {
        return next(new ErrorResponse("Order not found", 404));
    }

    await order.deleteOne();

    res.status(200).json({
        success: true,
        message: "Order deleted successfully",
        data: {},
    });
});

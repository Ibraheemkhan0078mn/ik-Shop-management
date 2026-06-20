import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import {
    generateReturnNumber,
    getOrderByNumber,
    createProductReturn,
    getAllProductReturns,
    getProductReturnById,
    updateProductReturn,
    deleteProductReturn,
    updateReturnStatus,
} from "../services/productReturn.service.js";

// Generate return number
export const getReturnNumber = asyncHandler(async (req, res, next) => {
    const returnNumber = await generateReturnNumber();
    res.status(200).json({
        success: true,
        returnNumber,
    });
});

// Get order by order number
export const getOrderForReturn = asyncHandler(async (req, res, next) => {
    const { orderNumber } = req.params;
    const order = await getOrderByNumber(orderNumber);
    
    if (!order) {
        return next(new ErrorResponse("Order not found", 404));
    }
    
    res.status(200).json({
        success: true,
        data: order,
    });
});

// Create product return
export const createProductReturnData = asyncHandler(async (req, res, next) => {
    const productReturn = await createProductReturn(req.body);
    
    res.status(201).json({
        success: true,
        message: "Product return created successfully",
        data: productReturn,
    });
});

// Get all product returns
export const getAllProductReturnsData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const result = await getAllProductReturns(filters);
    
    res.status(200).json({
        success: true,
        message: "Product returns retrieved successfully",
        ...result,
    });
});

// Get product return by ID
export const getProductReturnData = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const productReturn = await getProductReturnById(id);
    
    if (!productReturn) {
        return next(new ErrorResponse("Product return not found", 404));
    }
    
    res.status(200).json({
        success: true,
        message: "Product return retrieved successfully",
        data: productReturn,
    });
});

// Update product return
export const updateProductReturnData = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const productReturn = await updateProductReturn(id, req.body);
    
    if (!productReturn) {
        return next(new ErrorResponse("Product return not found", 404));
    }
    
    res.status(200).json({
        success: true,
        message: "Product return updated successfully",
        data: productReturn,
    });
});

// Delete product return
export const deleteProductReturnData = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const productReturn = await deleteProductReturn(id);
    
    if (!productReturn) {
        return next(new ErrorResponse("Product return not found", 404));
    }
    
    res.status(200).json({
        success: true,
        message: "Product return deleted successfully",
        data: productReturn,
    });
});

// Update return status
export const updateReturnStatusData = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const productReturn = await updateReturnStatus(id, status);
    
    if (!productReturn) {
        return next(new ErrorResponse("Product return not found", 404));
    }
    
    res.status(200).json({
        success: true,
        message: "Return status updated successfully",
        data: productReturn,
    });
});

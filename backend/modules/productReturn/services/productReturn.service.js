import ProductReturn from "../models/productReturn.model.js";
import { getLocalOrderModel } from "../../../configs/connect.db.js";

// Generate return number
const generateReturnNumber = async () => {
    const lastReturn = await ProductReturn.findOne().sort({ createdAt: -1 });
    const lastNumber = lastReturn ? parseInt(lastReturn.returnNumber.replace("RET-", "")) : 0;
    const newNumber = lastNumber + 1;
    return `RET-${String(newNumber).padStart(6, "0")}`;
};

// Get order by order number
const getOrderByNumber = async (orderNumber) => {
    const OrderModel = getLocalOrderModel();
    const order = await OrderModel.findOne({ orderNumber });
    return order;
};

// Create product return
const createProductReturn = async (returnData) => {
    const returnNumber = await generateReturnNumber();
    
    // Calculate total refund amount
    const totalRefundAmount = returnData.items.reduce((sum, item) => sum + item.refundAmount, 0);
    
    const productReturn = await ProductReturn.create({
        returnNumber,
        referenceOrderId: returnData.referenceOrderId,
        referenceOrderNumber: returnData.referenceOrderNumber,
        items: returnData.items,
        totalRefundAmount,
        customerName: returnData.customerName,
        notes: returnData.notes,
    });
    
    return productReturn;
};

// Get all product returns
const getAllProductReturns = async (filters = {}) => {
    const { page = 1, limit = 10, status, search } = filters;
    const query = {};
    
    if (status) query.returnStatus = status;
    if (search) {
        query.$or = [
            { returnNumber: { $regex: search, $options: "i" } },
            { referenceOrderNumber: { $regex: search, $options: "i" } },
            { customerName: { $regex: search, $options: "i" } },
        ];
    }
    
    const productReturns = await ProductReturn.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate("referenceOrderId")
        .populate("items.productId");
    
    const total = await ProductReturn.countDocuments(query);
    
    return {
        data: productReturns,
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
    };
};

// Get paginated product returns (for PaginatedList component)
const getPaginatedProductReturns = async (filters = {}) => {
    const { page = 1, limit = 10, status, search } = filters;
    const query = {};
    
    if (status) query.returnStatus = status;
    if (search) {
        query.$or = [
            { returnNumber: { $regex: search, $options: "i" } },
            { referenceOrderNumber: { $regex: search, $options: "i" } },
            { customerName: { $regex: search, $options: "i" } },
        ];
    }
    
    const productReturns = await ProductReturn.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate("referenceOrderId")
        .populate("items.productId");
    
    const total = await ProductReturn.countDocuments(query);
    
    return {
        data: productReturns,
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
    };
};

// Get product return by ID
const getProductReturnById = async (id) => {
    const productReturn = await ProductReturn.findById(id)
        .populate("referenceOrderId")
        .populate("items.productId");
    return productReturn;
};

// Update product return
const updateProductReturn = async (id, updateData) => {
    const productReturn = await ProductReturn.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    ).populate("referenceOrderId").populate("items.productId");
    return productReturn;
};

// Delete product return
const deleteProductReturn = async (id) => {
    const productReturn = await ProductReturn.findByIdAndDelete(id);
    return productReturn;
};

// Update return status
const updateReturnStatus = async (id, status) => {
    const productReturn = await ProductReturn.findByIdAndUpdate(
        id,
        { returnStatus: status },
        { new: true, runValidators: true }
    ).populate("referenceOrderId").populate("items.productId");
    return productReturn;
};

export {
    generateReturnNumber,
    getOrderByNumber,
    createProductReturn,
    getAllProductReturns,
    getPaginatedProductReturns,
    getProductReturnById,
    updateProductReturn,
    deleteProductReturn,
    updateReturnStatus,
};

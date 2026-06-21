import { createProductReturnService, findProductReturnService, findOneProductReturnService, findByIdProductReturnService, updateProductReturnService, deleteOneProductReturnService, countProductReturnService } from "./productReturn.crud.js";
import { getLocalOrderModel } from "../../../configs/connect.db.js";

const generateReturnNumber = async () => {
    const lastReturn = await findProductReturnService({}).sort({ createdAt: -1 }).limit(1);
    const lastNumber = lastReturn.length ? parseInt(lastReturn[0].returnNumber.replace("RET-", "")) : 0;
    const newNumber = lastNumber + 1;
    return `RET-${String(newNumber).padStart(6, "0")}`;
};

const getOrderByNumber = async (orderNumber) => {
    const OrderModel = getLocalOrderModel();
    return await OrderModel.findOne({ orderNumber });
};

const createProductReturn = async (returnData) => {
    const returnNumber = await generateReturnNumber();
    const totalRefundAmount = returnData.items.reduce((sum, item) => sum + item.refundAmount, 0);
    return await createProductReturnService({
        returnNumber,
        referenceOrderId: returnData.referenceOrderId,
        referenceOrderNumber: returnData.referenceOrderNumber,
        items: returnData.items,
        totalRefundAmount,
        customerName: returnData.customerName,
        notes: returnData.notes,
    });
};

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
    const productReturns = await findProductReturnService(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate("referenceOrderId")
        .populate("items.productId");
    const total = await countProductReturnService(query);
    return {
        data: productReturns,
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
    };
};

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
    const productReturns = await findProductReturnService(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate("referenceOrderId")
        .populate("items.productId");
    const total = await countProductReturnService(query);
    return {
        data: productReturns,
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
    };
};

const getProductReturnById = async (id) => {
    return await findByIdProductReturnService(id).populate("referenceOrderId").populate("items.productId");
};

const updateProductReturn = async (id, updateData) => {
    return await updateProductReturnService(id, updateData).populate("referenceOrderId").populate("items.productId");
};

const deleteProductReturn = async (id) => {
    return await deleteOneProductReturnService(id);
};

const updateReturnStatus = async (id, status) => {
    return await updateProductReturnService(id, { returnStatus: status }).populate("referenceOrderId").populate("items.productId");
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

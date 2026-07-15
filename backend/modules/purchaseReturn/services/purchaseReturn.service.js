import {
    createPurchaseReturnService,
    findPurchaseReturnService,
    findOnePurchaseReturnService,
    findByIdPurchaseReturnService,
    updatePurchaseReturnService,
    deleteOnePurchaseReturnService,
    countPurchaseReturnService
} from "./purchaseReturn.crud.js";

const createPurchaseReturn = async (data) => {
    return await createPurchaseReturnService(data);
};

const getAllPurchaseReturns = async (query = {}) => {
    return await findPurchaseReturnService(query)
        .populate("purchase")
        .populate("products.productId")
        .populate("products.batchId")
        .sort({ createdAt: -1 });
};

const getPurchaseReturnById = async (id) => {
    return await findByIdPurchaseReturnService(id)
        .populate("purchase")
        .populate("products.productId")
        .populate("products.batchId");
};

const findPurchaseReturnByPurchase = async (purchaseId) => {
    return await findOnePurchaseReturnService({ purchase: purchaseId })
        .populate("purchase")
        .populate("products.productId")
        .populate("products.batchId");
};

const updatePurchaseReturn = async (id, data) => {
    return await updatePurchaseReturnService(id, data);
};

const deletePurchaseReturn = async (id) => {
    return await deleteOnePurchaseReturnService(id);
};

const countPurchaseReturns = async (query = {}) => {
    return await countPurchaseReturnService(query);
};

const getPaginatedPurchaseReturns = async (filters = {}) => {
    const { page = 1, limit = 20, status, search } = filters;
    const query = {};
    
    if (status) query.status = status;
    if (search) {
        query.$or = [
            { returnNumber: { $regex: search, $options: "i" } },
            { notes: { $regex: search, $options: "i" } }
        ];
    }
    
    const skip = (page - 1) * limit;
    
    const purchaseReturns = await findPurchaseReturnService(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("purchase")
        .populate("products.productId")
        .populate("products.batchId");
    
    const total = await countPurchaseReturnService(query);
    
    return {
        data: purchaseReturns,
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
    };
};

export {
    createPurchaseReturn,
    getAllPurchaseReturns,
    getPurchaseReturnById,
    findPurchaseReturnByPurchase,
    updatePurchaseReturn,
    deletePurchaseReturn,
    countPurchaseReturns,
    getPaginatedPurchaseReturns
};

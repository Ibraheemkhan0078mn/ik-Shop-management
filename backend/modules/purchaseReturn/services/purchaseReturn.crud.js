import { getLocalPurchaseReturnModel } from "../../../configs/connect.db.js";

const createPurchaseReturnService = (data) => {
    const PurchaseReturnModel = getLocalPurchaseReturnModel();
    return PurchaseReturnModel.create(data);
};

const findPurchaseReturnService = (query = {}) => {
    const PurchaseReturnModel = getLocalPurchaseReturnModel();
    return PurchaseReturnModel.find(query);
};

const findOnePurchaseReturnService = (query) => {
    const PurchaseReturnModel = getLocalPurchaseReturnModel();
    return PurchaseReturnModel.findOne(query);
};

const findByIdPurchaseReturnService = (id) => {
    const PurchaseReturnModel = getLocalPurchaseReturnModel();
    return PurchaseReturnModel.findById(id);
};

const updatePurchaseReturnService = (id, data) => {
    const PurchaseReturnModel = getLocalPurchaseReturnModel();
    return PurchaseReturnModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteOnePurchaseReturnService = (id) => {
    const PurchaseReturnModel = getLocalPurchaseReturnModel();
    return PurchaseReturnModel.findByIdAndDelete(id);
};

const countPurchaseReturnService = (query) => {
    const PurchaseReturnModel = getLocalPurchaseReturnModel();
    return PurchaseReturnModel.countDocuments(query);
};

export { createPurchaseReturnService, findPurchaseReturnService, findOnePurchaseReturnService, findByIdPurchaseReturnService, updatePurchaseReturnService, deleteOnePurchaseReturnService, countPurchaseReturnService };

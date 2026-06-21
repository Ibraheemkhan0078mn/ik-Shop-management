import { getLocalPurchaseModel } from "../../../configs/connect.db.js";

const createPurchaseService = (data) => {
    const PurchaseModel = getLocalPurchaseModel();
    return PurchaseModel.create(data);
};

const findPurchaseService = (query = {}) => {
    const PurchaseModel = getLocalPurchaseModel();
    return PurchaseModel.find(query);
};

const findOnePurchaseService = (query) => {
    const PurchaseModel = getLocalPurchaseModel();
    return PurchaseModel.findOne(query);
};

const findByIdPurchaseService = (id) => {
    const PurchaseModel = getLocalPurchaseModel();
    return PurchaseModel.findById(id);
};

const updatePurchaseService = (id, data) => {
    const PurchaseModel = getLocalPurchaseModel();
    return PurchaseModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteOnePurchaseService = (id) => {
    const PurchaseModel = getLocalPurchaseModel();
    return PurchaseModel.findByIdAndDelete(id);
};

const countPurchaseService = (query) => {
    const PurchaseModel = getLocalPurchaseModel();
    return PurchaseModel.countDocuments(query);
};

export { createPurchaseService, findPurchaseService, findOnePurchaseService, findByIdPurchaseService, updatePurchaseService, deleteOnePurchaseService, countPurchaseService };

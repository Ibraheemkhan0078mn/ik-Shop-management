import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalPurchaseReturnModel } from "../../../configs/connect.db.js";

const PurchaseReturnModel = getLocalPurchaseReturnModel();

const createPurchaseReturnService = (data) => {
    return createDoc({ model: PurchaseReturnModel, data });
};

const findPurchaseReturnService = (query = {}) => {
    return findDocs({ model: PurchaseReturnModel, filter: query });
};

const findOnePurchaseReturnService = (query) => {
    return findOneDoc({ model: PurchaseReturnModel, filter: query });
};

const findByIdPurchaseReturnService = (id) => {
    return findOneDoc({ model: PurchaseReturnModel, filter: { _id: id } });
};

const updatePurchaseReturnService = (id, data) => {
    return updateDocs({ model: PurchaseReturnModel, filter: { _id: id }, data });
};

const deleteOnePurchaseReturnService = (id) => {
    return deleteDocs({ model: PurchaseReturnModel, filter: { _id: id } });
};

const countPurchaseReturnService = (query) => {
    return PurchaseReturnModel.countDocuments(query);
};

export { 
    createPurchaseReturnService, 
    findPurchaseReturnService, 
    findOnePurchaseReturnService, 
    findByIdPurchaseReturnService, 
    updatePurchaseReturnService, 
    deleteOnePurchaseReturnService,
    countPurchaseReturnService 
};

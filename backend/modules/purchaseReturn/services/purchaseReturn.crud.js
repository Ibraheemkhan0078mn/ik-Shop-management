import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalPurchaseReturnModel } from "../../../configs/connect.db.js";

const createPurchaseReturnService = (data) => {
    const PurchaseReturnModel = getLocalPurchaseReturnModel();
    return createDoc({ model: PurchaseReturnModel, data });
};

const findPurchaseReturnService = (query = {}, options = {}) => {
    const PurchaseReturnModel = getLocalPurchaseReturnModel();
    return findDocs({ model: PurchaseReturnModel, filter: query, options });
};

const findOnePurchaseReturnService = (query, options = {}) => {
    const PurchaseReturnModel = getLocalPurchaseReturnModel();
    return findOneDoc({ model: PurchaseReturnModel, filter: query, options });
};

const findByIdPurchaseReturnService = (id, options = {}) => {
    const PurchaseReturnModel = getLocalPurchaseReturnModel();
    return findOneDoc({ model: PurchaseReturnModel, filter: { _id: id }, options });
};

const updatePurchaseReturnService = (id, data) => {
    const PurchaseReturnModel = getLocalPurchaseReturnModel();
    return updateDocs({ model: PurchaseReturnModel, filter: { _id: id }, data });
};

const deleteOnePurchaseReturnService = (id) => {
    const PurchaseReturnModel = getLocalPurchaseReturnModel();
    return deleteDocs({ model: PurchaseReturnModel, filter: { _id: id } });
};

const countPurchaseReturnService = (query) => {
    const PurchaseReturnModel = getLocalPurchaseReturnModel();
    return PurchaseReturnModel.countDocuments(query);
};

export { createPurchaseReturnService, findPurchaseReturnService, findOnePurchaseReturnService, findByIdPurchaseReturnService, updatePurchaseReturnService, deleteOnePurchaseReturnService, countPurchaseReturnService };

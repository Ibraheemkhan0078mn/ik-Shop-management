import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalPurchaseModel } from "../../../configs/connect.db.js";

const PurchaseModel = getLocalPurchaseModel();

const createPurchaseService = (data) => {
    return createDoc({ model: PurchaseModel, data });
};

const findPurchaseService = (query = {}) => {
    return findDocs({ model: PurchaseModel, filter: query });
};

const findOnePurchaseService = (query) => {
    return findOneDoc({ model: PurchaseModel, filter: query });
};

const findByIdPurchaseService = (id) => {
    return findOneDoc({ model: PurchaseModel, filter: { _id: id } });
};

const updatePurchaseService = (id, data) => {
    return updateDocs({ model: PurchaseModel, filter: { _id: id }, data });
};

const deleteOnePurchaseService = (id) => {
    return deleteDocs({ model: PurchaseModel, filter: { _id: id } });
};

const countPurchaseService = (query) => {
    return PurchaseModel.countDocuments(query);
};

export { createPurchaseService, findPurchaseService, findOnePurchaseService, findByIdPurchaseService, updatePurchaseService, deleteOnePurchaseService, countPurchaseService };

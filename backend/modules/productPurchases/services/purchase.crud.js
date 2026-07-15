import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalPurchaseModel } from "../../../configs/connect.db.js";

const createPurchaseService = (data) => {
    const PurchaseModel = getLocalPurchaseModel();
    return createDoc({ model: PurchaseModel, data });
};

const findPurchaseService = (query = {}) => {
    const PurchaseModel = getLocalPurchaseModel();
    return findDocs({ model: PurchaseModel, filter: query });
};

const findOnePurchaseService = (query) => {
    const PurchaseModel = getLocalPurchaseModel();
    return findOneDoc({ model: PurchaseModel, filter: query });
};

const findByIdPurchaseService = (id) => {
    const PurchaseModel = getLocalPurchaseModel();
    return findOneDoc({ model: PurchaseModel, filter: { _id: id } });
};

const updatePurchaseService = (id, data) => {
    const PurchaseModel = getLocalPurchaseModel();
    return updateDocs({ model: PurchaseModel, filter: { _id: id }, data });
};

const deleteOnePurchaseService = (id) => {
    const PurchaseModel = getLocalPurchaseModel();
    return deleteDocs({ model: PurchaseModel, filter: { _id: id } });
};

const countPurchaseService = (query) => {
    const PurchaseModel = getLocalPurchaseModel();
    return PurchaseModel.countDocuments(query);
};

export { createPurchaseService, findPurchaseService, findOnePurchaseService, findByIdPurchaseService, updatePurchaseService, deleteOnePurchaseService, countPurchaseService };

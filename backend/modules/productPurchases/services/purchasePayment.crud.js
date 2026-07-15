import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalPurchasePaymentModel } from "../../../configs/connect.db.js";

const PurchasePaymentModel = getLocalPurchasePaymentModel();

const createPurchasePaymentService = (data) => {
    return createDoc({ model: PurchasePaymentModel, data });
};

const findPurchasePaymentService = (query = {}) => {
    return findDocs({ model: PurchasePaymentModel, filter: query });
};

const findOnePurchasePaymentService = (query) => {
    return findOneDoc({ model: PurchasePaymentModel, filter: query });
};

const findByIdPurchasePaymentService = (id) => {
    return findOneDoc({ model: PurchasePaymentModel, filter: { _id: id } });
};

const updatePurchasePaymentService = (id, data) => {
    return updateDocs({ model: PurchasePaymentModel, filter: { _id: id }, data });
};

const deleteOnePurchasePaymentService = (id) => {
    return deleteDocs({ model: PurchasePaymentModel, filter: { _id: id } });
};

const countPurchasePaymentService = (query) => {
    return PurchasePaymentModel.countDocuments(query);
};

export { 
    createPurchasePaymentService, 
    findPurchasePaymentService, 
    findOnePurchasePaymentService, 
    findByIdPurchasePaymentService, 
    updatePurchasePaymentService, 
    deleteOnePurchasePaymentService,
    countPurchasePaymentService 
};

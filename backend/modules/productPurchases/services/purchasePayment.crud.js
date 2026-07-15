import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalPurchasePaymentModel } from "../../../configs/connect.db.js";

const createPurchasePaymentService = (data) => {
    const PurchasePaymentModel = getLocalPurchasePaymentModel();
    return createDoc({ model: PurchasePaymentModel, data });
};

const findPurchasePaymentService = (query = {}) => {
    const PurchasePaymentModel = getLocalPurchasePaymentModel();
    return findDocs({ model: PurchasePaymentModel, filter: query });
};

const findOnePurchasePaymentService = (query) => {
    const PurchasePaymentModel = getLocalPurchasePaymentModel();
    return findOneDoc({ model: PurchasePaymentModel, filter: query });
};

const findByIdPurchasePaymentService = (id) => {
    const PurchasePaymentModel = getLocalPurchasePaymentModel();
    return findOneDoc({ model: PurchasePaymentModel, filter: { _id: id } });
};

const updatePurchasePaymentService = (id, data) => {
    const PurchasePaymentModel = getLocalPurchasePaymentModel();
    return updateDocs({ model: PurchasePaymentModel, filter: { _id: id }, data });
};

const deleteOnePurchasePaymentService = (id) => {
    const PurchasePaymentModel = getLocalPurchasePaymentModel();
    return deleteDocs({ model: PurchasePaymentModel, filter: { _id: id } });
};

const countPurchasePaymentService = (query) => {
    const PurchasePaymentModel = getLocalPurchasePaymentModel();
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

import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalPaymentMethodModel } from "../../../configs/connect.db.js";

const PaymentMethodModel = getLocalPaymentMethodModel();

const createPaymentMethodService = (data) => {
    return createDoc({ model: PaymentMethodModel, data });
};

const findPaymentMethodService = (query = {}) => {
    return findDocs({ model: PaymentMethodModel, filter: query });
};

const findOnePaymentMethodService = (query) => {
    return findOneDoc({ model: PaymentMethodModel, filter: query });
};

const findByIdPaymentMethodService = (id) => {
    return findOneDoc({ model: PaymentMethodModel, filter: { _id: id } });
};

const updatePaymentMethodService = (id, data) => {
    return updateDocs({ model: PaymentMethodModel, filter: { _id: id }, data });
};

const deleteOnePaymentMethodService = (id) => {
    return deleteDocs({ model: PaymentMethodModel, filter: { _id: id } });
};

const countPaymentMethodService = (query) => {
    return PaymentMethodModel.countDocuments(query);
};

export { 
    createPaymentMethodService, 
    findPaymentMethodService, 
    findOnePaymentMethodService, 
    findByIdPaymentMethodService, 
    updatePaymentMethodService, 
    deleteOnePaymentMethodService,
    countPaymentMethodService 
};

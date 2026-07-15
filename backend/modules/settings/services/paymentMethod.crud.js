import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalPaymentMethodModel } from "../../../configs/connect.db.js";

const createPaymentMethodService = (data) => {
    const PaymentMethodModel = getLocalPaymentMethodModel();
    return createDoc({ model: PaymentMethodModel, data });
};

const findPaymentMethodService = (query = {}) => {
    const PaymentMethodModel = getLocalPaymentMethodModel();
    return findDocs({ model: PaymentMethodModel, filter: query });
};

const findOnePaymentMethodService = (query) => {
    const PaymentMethodModel = getLocalPaymentMethodModel();
    return findOneDoc({ model: PaymentMethodModel, filter: query });
};

const findByIdPaymentMethodService = (id) => {
    const PaymentMethodModel = getLocalPaymentMethodModel();
    return findOneDoc({ model: PaymentMethodModel, filter: { _id: id } });
};

const updatePaymentMethodService = (id, data) => {
    const PaymentMethodModel = getLocalPaymentMethodModel();
    return updateDocs({ model: PaymentMethodModel, filter: { _id: id }, data });
};

const deleteOnePaymentMethodService = (id) => {
    const PaymentMethodModel = getLocalPaymentMethodModel();
    return deleteDocs({ model: PaymentMethodModel, filter: { _id: id } });
};

const countPaymentMethodService = (query) => {
    const PaymentMethodModel = getLocalPaymentMethodModel();
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

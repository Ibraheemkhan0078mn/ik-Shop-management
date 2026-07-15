import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalCustomerModel } from "../../../configs/connect.db.js";

const CustomerModel = getLocalCustomerModel();

const createCustomerService = (data) => {
    return createDoc({ model: CustomerModel, data });
};

const findCustomerService = (query = {}) => {
    return findDocs({ model: CustomerModel, filter: query });
};

const findOneCustomerService = (query) => {
    return findOneDoc({ model: CustomerModel, filter: query });
};

const findByIdCustomerService = (id) => {
    return findOneDoc({ model: CustomerModel, filter: { _id: id } });
};

const updateCustomerService = (id, data) => {
    return updateDocs({ model: CustomerModel, filter: { _id: id }, data });
};

const deleteOneCustomerService = (id) => {
    return deleteDocs({ model: CustomerModel, filter: { _id: id } });
};

const countCustomerService = (query = {}) => {
    return CustomerModel.countDocuments(query);
};

export {
    createCustomerService,
    findCustomerService,
    findOneCustomerService,
    findByIdCustomerService,
    updateCustomerService,
    deleteOneCustomerService,
    countCustomerService,
};

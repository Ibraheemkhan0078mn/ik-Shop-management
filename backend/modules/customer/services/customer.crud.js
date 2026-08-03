import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalCustomerModel } from "../../../configs/connect.db.js";

const createCustomerService = (data) => {
    const CustomerModel = getLocalCustomerModel();
    return createDoc({ model: CustomerModel, data });
};

const findCustomerService = (query = {}, options = {}) => {
    const CustomerModel = getLocalCustomerModel();
    return findDocs({ model: CustomerModel, filter: query, options });
};

const findOneCustomerService = (query, options = {}) => {
    const CustomerModel = getLocalCustomerModel();
    return findOneDoc({ model: CustomerModel, filter: query, options });
};

const findByIdCustomerService = (id, options = {}) => {
    const CustomerModel = getLocalCustomerModel();
    return findOneDoc({ model: CustomerModel, filter: { _id: id }, options });
};

const updateCustomerService = (id, data) => {
    const CustomerModel = getLocalCustomerModel();
    return updateDocs({ model: CustomerModel, filter: { _id: id }, data });
};

const deleteOneCustomerService = (id) => {
    const CustomerModel = getLocalCustomerModel();
    return deleteDocs({ model: CustomerModel, filter: { _id: id } });
};

const countCustomerService = (query = {}) => {
    const CustomerModel = getLocalCustomerModel();
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

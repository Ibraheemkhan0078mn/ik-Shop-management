import { getLocalCustomerModel } from "../../../configs/connect.db.js";

const createCustomerService = (data) => {
    const CustomerModel = getLocalCustomerModel();
    return CustomerModel.create(data);
};

const findCustomerService = (query = {}) => {
    const CustomerModel = getLocalCustomerModel();
    return CustomerModel.find(query);
};

const findOneCustomerService = (query) => {
    const CustomerModel = getLocalCustomerModel();
    return CustomerModel.findOne(query);
};

const findByIdCustomerService = (id) => {
    const CustomerModel = getLocalCustomerModel();
    return CustomerModel.findById(id);
};

const updateCustomerService = (id, data) => {
    const CustomerModel = getLocalCustomerModel();
    return CustomerModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteOneCustomerService = (id) => {
    const CustomerModel = getLocalCustomerModel();
    return CustomerModel.findByIdAndDelete(id);
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

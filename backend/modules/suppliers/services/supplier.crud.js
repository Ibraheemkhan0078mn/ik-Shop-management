import { getLocalSupplierModel } from "../../../configs/connect.db.js";

const createSupplierService = (data) => {
    const SupplierModel = getLocalSupplierModel();
    return SupplierModel.create(data);
};

const findSupplierService = (query = {}) => {
    const SupplierModel = getLocalSupplierModel();
    return SupplierModel.find(query);
};

const findOneSupplierService = (query) => {
    const SupplierModel = getLocalSupplierModel();
    return SupplierModel.findOne(query);
};

const findByIdSupplierService = (id) => {
    const SupplierModel = getLocalSupplierModel();
    return SupplierModel.findById(id);
};

const updateSupplierService = (id, data) => {
    const SupplierModel = getLocalSupplierModel();
    return SupplierModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteOneSupplierService = (id) => {
    const SupplierModel = getLocalSupplierModel();
    return SupplierModel.findByIdAndDelete(id);
};

const countSupplierService = (query) => {
    const SupplierModel = getLocalSupplierModel();
    return SupplierModel.countDocuments(query);
};

export { createSupplierService, findSupplierService, findOneSupplierService, findByIdSupplierService, updateSupplierService, deleteOneSupplierService, countSupplierService };

import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalSupplierModel } from "../../../configs/connect.db.js";

const SupplierModel = getLocalSupplierModel();

const createSupplierService = (data) => {
    return createDoc({ model: SupplierModel, data });
};

const findSupplierService = (query = {}) => {
    return findDocs({ model: SupplierModel, filter: query });
};

const findOneSupplierService = (query) => {
    return findOneDoc({ model: SupplierModel, filter: query });
};

const findByIdSupplierService = (id) => {
    return findOneDoc({ model: SupplierModel, filter: { _id: id } });
};

const updateSupplierService = (id, data) => {
    return updateDocs({ model: SupplierModel, filter: { _id: id }, data });
};

const deleteOneSupplierService = (id) => {
    return deleteDocs({ model: SupplierModel, filter: { _id: id } });
};

const countSupplierService = (query) => {
    return SupplierModel.countDocuments(query);
};

export { createSupplierService, findSupplierService, findOneSupplierService, findByIdSupplierService, updateSupplierService, deleteOneSupplierService, countSupplierService };

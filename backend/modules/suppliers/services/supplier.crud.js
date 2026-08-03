import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalSupplierModel } from "../../../configs/connect.db.js";

const createSupplierService = (data) => {
    const SupplierModel = getLocalSupplierModel();
    return createDoc({ model: SupplierModel, data });
};

const findSupplierService = (query = {}, options = {}) => {
    const SupplierModel = getLocalSupplierModel();
    return findDocs({ model: SupplierModel, filter: query, options });
};

const findOneSupplierService = (query, options = {}) => {
    const SupplierModel = getLocalSupplierModel();
    return findOneDoc({ model: SupplierModel, filter: query, options });
};

const findByIdSupplierService = (id, options = {}) => {
    const SupplierModel = getLocalSupplierModel();
    return findOneDoc({ model: SupplierModel, filter: { _id: id }, options });
};

const updateSupplierService = (id, data) => {
    const SupplierModel = getLocalSupplierModel();
    return updateDocs({ model: SupplierModel, filter: { _id: id }, data });
};

const deleteOneSupplierService = (id) => {
    const SupplierModel = getLocalSupplierModel();
    return deleteDocs({ model: SupplierModel, filter: { _id: id } });
};

const countSupplierService = (query) => {
    const SupplierModel = getLocalSupplierModel();
    return SupplierModel.countDocuments(query);
};

export { createSupplierService, findSupplierService, findOneSupplierService, findByIdSupplierService, updateSupplierService, deleteOneSupplierService, countSupplierService };

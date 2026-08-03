import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalBrandModel } from "../../../configs/connect.db.js";

const createBrandService = (data) => {
    const BrandModel = getLocalBrandModel();
    return createDoc({ model: BrandModel, data });
};

const findBrandService = (query = {}, options = {}) => {
    const BrandModel = getLocalBrandModel();
    return findDocs({ model: BrandModel, filter: query, options });
};

const findOneBrandService = (query, options = {}) => {
    const BrandModel = getLocalBrandModel();
    return findOneDoc({ model: BrandModel, filter: query, options });
};

const findByIdBrandService = (id, options = {}) => {
    const BrandModel = getLocalBrandModel();
    return findOneDoc({ model: BrandModel, filter: { _id: id }, options });
};

const updateBrandService = (id, data) => {
    const BrandModel = getLocalBrandModel();
    return updateDocs({ model: BrandModel, filter: { _id: id }, data });
};

const deleteOneBrandService = (id) => {
    const BrandModel = getLocalBrandModel();
    return deleteDocs({ model: BrandModel, filter: { _id: id } });
};

const countBrandService = (query) => {
    const BrandModel = getLocalBrandModel();
    return BrandModel.countDocuments(query);
};

export { createBrandService, findBrandService, findOneBrandService, findByIdBrandService, updateBrandService, deleteOneBrandService, countBrandService };

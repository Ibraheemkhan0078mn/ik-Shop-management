import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalProductModel } from "../../../configs/connect.db.js";

const ProductModel = getLocalProductModel();

const createProductService = (data) => {
    return createDoc({ model: ProductModel, data });
};

const findProductService = (query = {}) => {
    return findDocs({ model: ProductModel, filter: query });
};

const findOneProductService = (query) => {
    return findOneDoc({ model: ProductModel, filter: query });
};

const findByIdProductService = (id) => {
    return findOneDoc({ model: ProductModel, filter: { _id: id } });
};

const updateProductService = (id, data) => {
    return updateDocs({ model: ProductModel, filter: { _id: id }, data });
};

const deleteOneProductService = (id) => {
    return deleteDocs({ model: ProductModel, filter: { _id: id } });
};

const countProductService = (query) => {
    return ProductModel.countDocuments(query);
};

export { createProductService, findProductService, findOneProductService, findByIdProductService, updateProductService, deleteOneProductService, countProductService };

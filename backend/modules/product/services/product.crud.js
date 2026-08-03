import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalProductModel } from "../../../configs/connect.db.js";

const createProductService = (data) => {
    const ProductModel = getLocalProductModel();
    return createDoc({ model: ProductModel, data });
};

const findProductService = (query = {}, options = {}) => {
    const ProductModel = getLocalProductModel();
    return findDocs({ model: ProductModel, filter: query, options });
};

const findOneProductService = (query) => {
    const ProductModel = getLocalProductModel();
    return findOneDoc({ model: ProductModel, filter: query });
};

const findByIdProductService = (id, options = {}) => {
    const ProductModel = getLocalProductModel();
    return findOneDoc({ model: ProductModel, filter: { _id: id }, options });
};

const updateProductService = (id, data) => {
    const ProductModel = getLocalProductModel();
    return updateDocs({ model: ProductModel, filter: { _id: id }, data });
};

const deleteOneProductService = (id) => {
    const ProductModel = getLocalProductModel();
    return deleteDocs({ model: ProductModel, filter: { _id: id } });
};

const countProductService = (query) => {
    const ProductModel = getLocalProductModel();
    return ProductModel.countDocuments(query);
};

export { createProductService, findProductService, findOneProductService, findByIdProductService, updateProductService, deleteOneProductService, countProductService };

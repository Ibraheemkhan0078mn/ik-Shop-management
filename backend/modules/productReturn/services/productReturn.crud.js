import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalProductReturnModel } from "../../../configs/connect.db.js";

const createProductReturnService = (data) => {
    const ProductReturnModel = getLocalProductReturnModel();
    if (!ProductReturnModel) throw new Error("Database not connected");
    return createDoc({ model: ProductReturnModel, data });
};

const findProductReturnService = (query = {}, options = {}) => {
    const ProductReturnModel = getLocalProductReturnModel();
    if (!ProductReturnModel) throw new Error("Database not connected");
    return findDocs({ model: ProductReturnModel, filter: query, options });
};

const findOneProductReturnService = (query, options = {}) => {
    const ProductReturnModel = getLocalProductReturnModel();
    if (!ProductReturnModel) throw new Error("Database not connected");
    return findOneDoc({ model: ProductReturnModel, filter: query, options });
};

const findByIdProductReturnService = (id, options = {}) => {
    const ProductReturnModel = getLocalProductReturnModel();
    if (!ProductReturnModel) throw new Error("Database not connected");
    return findOneDoc({ model: ProductReturnModel, filter: { _id: id }, options });
};

const updateProductReturnService = (id, data) => {
    const ProductReturnModel = getLocalProductReturnModel();
    if (!ProductReturnModel) throw new Error("Database not connected");
    return updateDocs({ model: ProductReturnModel, filter: { _id: id }, data });
};

const deleteOneProductReturnService = (id) => {
    const ProductReturnModel = getLocalProductReturnModel();
    if (!ProductReturnModel) throw new Error("Database not connected");
    return deleteDocs({ model: ProductReturnModel, filter: { _id: id } });
};

const countProductReturnService = (query) => {
    const ProductReturnModel = getLocalProductReturnModel();
    if (!ProductReturnModel) throw new Error("Database not connected");
    return ProductReturnModel.countDocuments(query);
};

export { createProductReturnService, findProductReturnService, findOneProductReturnService, findByIdProductReturnService, updateProductReturnService, deleteOneProductReturnService, countProductReturnService };

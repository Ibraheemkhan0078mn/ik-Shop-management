import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalProductReturnModel } from "../../../configs/connect.db.js";

const ProductReturnModel = getLocalProductReturnModel();

const createProductReturnService = (data) => {
    if (!ProductReturnModel) throw new Error("Database not connected");
    return createDoc({ model: ProductReturnModel, data });
};

const findProductReturnService = (query = {}) => {
    if (!ProductReturnModel) throw new Error("Database not connected");
    return findDocs({ model: ProductReturnModel, filter: query });
};

const findOneProductReturnService = (query) => {
    if (!ProductReturnModel) throw new Error("Database not connected");
    return findOneDoc({ model: ProductReturnModel, filter: query });
};

const findByIdProductReturnService = (id) => {
    if (!ProductReturnModel) throw new Error("Database not connected");
    return findOneDoc({ model: ProductReturnModel, filter: { _id: id } });
};

const updateProductReturnService = (id, data) => {
    if (!ProductReturnModel) throw new Error("Database not connected");
    return updateDocs({ model: ProductReturnModel, filter: { _id: id }, data });
};

const deleteOneProductReturnService = (id) => {
    if (!ProductReturnModel) throw new Error("Database not connected");
    return deleteDocs({ model: ProductReturnModel, filter: { _id: id } });
};

const countProductReturnService = (query) => {
    if (!ProductReturnModel) throw new Error("Database not connected");
    return ProductReturnModel.countDocuments(query);
};

export { createProductReturnService, findProductReturnService, findOneProductReturnService, findByIdProductReturnService, updateProductReturnService, deleteOneProductReturnService, countProductReturnService };

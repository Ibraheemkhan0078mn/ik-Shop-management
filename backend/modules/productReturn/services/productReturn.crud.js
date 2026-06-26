import { getLocalProductReturnModel } from "../../../configs/connect.db.js";

const createProductReturnService = (data) => {
    const ProductReturnModel = getLocalProductReturnModel();
    if (!ProductReturnModel) throw new Error("Database not connected");
    return ProductReturnModel.create(data);
};

const findProductReturnService = (query = {}) => {
    const ProductReturnModel = getLocalProductReturnModel();
    if (!ProductReturnModel) throw new Error("Database not connected");
    return ProductReturnModel.find(query);
};

const findOneProductReturnService = (query) => {
    const ProductReturnModel = getLocalProductReturnModel();
    if (!ProductReturnModel) throw new Error("Database not connected");
    return ProductReturnModel.findOne(query);
};

const findByIdProductReturnService = (id) => {
    const ProductReturnModel = getLocalProductReturnModel();
    if (!ProductReturnModel) throw new Error("Database not connected");
    return ProductReturnModel.findById(id);
};

const updateProductReturnService = (id, data) => {
    const ProductReturnModel = getLocalProductReturnModel();
    if (!ProductReturnModel) throw new Error("Database not connected");
    return ProductReturnModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteOneProductReturnService = (id) => {
    const ProductReturnModel = getLocalProductReturnModel();
    if (!ProductReturnModel) throw new Error("Database not connected");
    return ProductReturnModel.findByIdAndDelete(id);
};

const countProductReturnService = (query) => {
    const ProductReturnModel = getLocalProductReturnModel();
    if (!ProductReturnModel) throw new Error("Database not connected");
    return ProductReturnModel.countDocuments(query);
};

export { createProductReturnService, findProductReturnService, findOneProductReturnService, findByIdProductReturnService, updateProductReturnService, deleteOneProductReturnService, countProductReturnService };

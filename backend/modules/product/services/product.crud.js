import { getLocalProductModel } from "../../../configs/connect.db.js";

const createProductService = (data) => {
    const ProductModel = getLocalProductModel();
    return ProductModel.create(data);
};

const findProductService = (query = {}) => {
    const ProductModel = getLocalProductModel();
    return ProductModel.find(query);
};

const findOneProductService = (query) => {
    const ProductModel = getLocalProductModel();
    return ProductModel.findOne(query);
};

const findByIdProductService = (id) => {
    const ProductModel = getLocalProductModel();
    return ProductModel.findById(id);
};

const updateProductService = (id, data) => {
    const ProductModel = getLocalProductModel();
    return ProductModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteOneProductService = (id) => {
    const ProductModel = getLocalProductModel();
    return ProductModel.findByIdAndDelete(id);
};

const countProductService = (query) => {
    const ProductModel = getLocalProductModel();
    return ProductModel.countDocuments(query);
};

export { createProductService, findProductService, findOneProductService, findByIdProductService, updateProductService, deleteOneProductService, countProductService };

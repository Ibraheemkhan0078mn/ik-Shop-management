import ProductReturn from "../models/productReturn.model.js";

const createProductReturnService = (data) => ProductReturn.create(data);

const findProductReturnService = (query = {}) => ProductReturn.find(query);

const findOneProductReturnService = (query) => ProductReturn.findOne(query);

const findByIdProductReturnService = (id) => ProductReturn.findById(id);

const updateProductReturnService = (id, data) => ProductReturn.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deleteOneProductReturnService = (id) => ProductReturn.findByIdAndDelete(id);

const countProductReturnService = (query) => ProductReturn.countDocuments(query);

export { createProductReturnService, findProductReturnService, findOneProductReturnService, findByIdProductReturnService, updateProductReturnService, deleteOneProductReturnService, countProductReturnService };

import { getLocalProductReturnModel } from "../../../configs/connect.db.js";

const ProductReturnModel = getLocalProductReturnModel();

const createProductReturnService = (data) => ProductReturnModel.create(data);

const findProductReturnService = (query = {}) => ProductReturnModel.find(query);

const findOneProductReturnService = (query) => ProductReturnModel.findOne(query);

const findByIdProductReturnService = (id) => ProductReturnModel.findById(id);

const updateProductReturnService = (id, data) => ProductReturnModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deleteOneProductReturnService = (id) => ProductReturnModel.findByIdAndDelete(id);

const countProductReturnService = (query) => ProductReturnModel.countDocuments(query);

export { createProductReturnService, findProductReturnService, findOneProductReturnService, findByIdProductReturnService, updateProductReturnService, deleteOneProductReturnService, countProductReturnService };

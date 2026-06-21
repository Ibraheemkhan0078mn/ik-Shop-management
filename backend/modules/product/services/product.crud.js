import { getLocalProductModel } from "../../../configs/connect.db.js";

const ProductModel = getLocalProductModel();

const create = (data) => ProductModel.create(data);

const find = (query = {}) => ProductModel.find(query);

const findOne = (query) => ProductModel.findOne(query);

const findById = (id) => ProductModel.findById(id);

const update = (id, data) => ProductModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deleteOne = (id) => ProductModel.findByIdAndDelete(id);

const count = (query) => ProductModel.countDocuments(query);

export { create, find, findOne, findById, update, deleteOne, count };

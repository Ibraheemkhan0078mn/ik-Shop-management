import ProductReturn from "../models/productReturn.model.js";

const create = (data) => ProductReturn.create(data);

const find = (query = {}) => ProductReturn.find(query);

const findOne = (query) => ProductReturn.findOne(query);

const findById = (id) => ProductReturn.findById(id);

const update = (id, data) => ProductReturn.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deleteOne = (id) => ProductReturn.findByIdAndDelete(id);

const count = (query) => ProductReturn.countDocuments(query);

export { create, find, findOne, findById, update, deleteOne, count };

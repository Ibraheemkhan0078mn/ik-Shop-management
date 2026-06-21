import { getLocalInventoryCategoryModel } from "../../../configs/connect.db.js";

const InventoryCategoryModel = getLocalInventoryCategoryModel();

const create = (data) => InventoryCategoryModel.create(data);

const find = (query = {}) => InventoryCategoryModel.find(query);

const findOne = (query) => InventoryCategoryModel.findOne(query);

const findById = (id) => InventoryCategoryModel.findById(id);

const update = (id, data) => InventoryCategoryModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deleteOne = (id) => InventoryCategoryModel.findByIdAndDelete(id);

const count = (query) => InventoryCategoryModel.countDocuments(query);

export { create, find, findOne, findById, update, deleteOne, count };

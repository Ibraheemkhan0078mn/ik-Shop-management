import { getLocalInventoryModel } from "../../../configs/connect.db.js";

const InventoryModel = getLocalInventoryModel();

const create = (data) => InventoryModel.create(data);

const find = (query = {}) => InventoryModel.find(query);

const findOne = (query) => InventoryModel.findOne(query);

const findById = (id) => InventoryModel.findById(id);

const update = (id, data) => InventoryModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deleteOne = (id) => InventoryModel.findByIdAndDelete(id);

const count = (query) => InventoryModel.countDocuments(query);

export { create, find, findOne, findById, update, deleteOne, count };

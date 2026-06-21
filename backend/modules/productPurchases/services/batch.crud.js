import { getLocalBatchModel } from "../../../configs/connect.db.js";

const BatchModel = getLocalBatchModel();

const create = (data) => BatchModel.create(data);

const find = (query = {}) => BatchModel.find(query);

const findOne = (query) => BatchModel.findOne(query);

const findById = (id) => BatchModel.findById(id);

const update = (id, data) => BatchModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deleteOne = (id) => BatchModel.findByIdAndDelete(id);

const count = (query) => BatchModel.countDocuments(query);

export { create, find, findOne, findById, update, deleteOne, count };

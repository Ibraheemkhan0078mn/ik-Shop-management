import { getLocalWastageModel } from "../../../configs/connect.db.js";

const WastageModel = getLocalWastageModel();

const create = (data) => WastageModel.create(data);

const find = (query = {}) => WastageModel.find(query);

const findOne = (query) => WastageModel.findOne(query);

const findById = (id) => WastageModel.findById(id);

const update = (id, data) => WastageModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deleteOne = (id) => WastageModel.findByIdAndDelete(id);

const count = (query) => WastageModel.countDocuments(query);

export { create, find, findOne, findById, update, deleteOne, count };

import { getLocalUserModel } from "../../../configs/connect.db.js";

const UserModel = getLocalUserModel();

const create = (data) => UserModel.create(data);

const find = (query = {}) => UserModel.find(query);

const findOne = (query) => UserModel.findOne(query);

const findById = (id) => UserModel.findById(id);

const update = (id, data) => UserModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deleteOne = (id) => UserModel.findByIdAndDelete(id);

const count = (query) => UserModel.countDocuments(query);

export { create, find, findOne, findById, update, deleteOne, count };

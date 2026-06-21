import { getLocalQarzaAccountModel } from "../../../configs/connect.db.js";

const QarzaAccountModel = getLocalQarzaAccountModel();

const create = (data) => QarzaAccountModel.create(data);

const find = (query = {}) => QarzaAccountModel.find(query);

const findOne = (query) => QarzaAccountModel.findOne(query);

const findById = (id) => QarzaAccountModel.findById(id);

const update = (id, data) => QarzaAccountModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deleteOne = (id) => QarzaAccountModel.findByIdAndDelete(id);

const count = (query) => QarzaAccountModel.countDocuments(query);

export { create, find, findOne, findById, update, deleteOne, count };

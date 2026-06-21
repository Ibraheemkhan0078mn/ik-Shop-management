import { getLocalMemberModel } from "../../../configs/connect.db.js";

const MemberModel = getLocalMemberModel();

const create = (data) => MemberModel.create(data);

const find = (query = {}) => MemberModel.find(query);

const findOne = (query) => MemberModel.findOne(query);

const findById = (id) => MemberModel.findById(id);

const update = (id, data) => MemberModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deleteOne = (id) => MemberModel.findByIdAndDelete(id);

const count = (query) => MemberModel.countDocuments(query);

export { create, find, findOne, findById, update, deleteOne, count };

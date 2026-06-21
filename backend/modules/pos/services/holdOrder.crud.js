import { getLocalHoldOrderModel } from "../../../configs/connect.db.js";

const HoldOrderModel = getLocalHoldOrderModel();

const create = (data) => HoldOrderModel.create(data);

const find = (query = {}) => HoldOrderModel.find(query);

const findOne = (query) => HoldOrderModel.findOne(query);

const findById = (id) => HoldOrderModel.findById(id);

const update = (id, data) => HoldOrderModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deleteOne = (id) => HoldOrderModel.findByIdAndDelete(id);

const count = (query) => HoldOrderModel.countDocuments(query);

export { create, find, findOne, findById, update, deleteOne, count };

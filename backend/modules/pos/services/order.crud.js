import { getLocalOrderModel } from "../../../configs/connect.db.js";

const OrderModel = getLocalOrderModel();

const create = (data) => OrderModel.create(data);

const find = (query = {}) => OrderModel.find(query);

const findOne = (query) => OrderModel.findOne(query);

const findById = (id) => OrderModel.findById(id);

const update = (id, data) => OrderModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deleteOne = (id) => OrderModel.findByIdAndDelete(id);

const count = (query) => OrderModel.countDocuments(query);

export { create, find, findOne, findById, update, deleteOne, count };

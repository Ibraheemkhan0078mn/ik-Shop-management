import { getLocalPurchaseReturnModel } from "../../../configs/connect.db.js";

const PurchaseReturnModel = getLocalPurchaseReturnModel();

const create = (data) => PurchaseReturnModel.create(data);

const find = (query = {}) => PurchaseReturnModel.find(query);

const findOne = (query) => PurchaseReturnModel.findOne(query);

const findById = (id) => PurchaseReturnModel.findById(id);

const update = (id, data) => PurchaseReturnModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deleteOne = (id) => PurchaseReturnModel.findByIdAndDelete(id);

const count = (query) => PurchaseReturnModel.countDocuments(query);

export { create, find, findOne, findById, update, deleteOne, count };

import { getLocalPurchaseModel } from "../../../configs/connect.db.js";

const PurchaseModel = getLocalPurchaseModel();

const create = (data) => PurchaseModel.create(data);

const find = (query = {}) => PurchaseModel.find(query);

const findOne = (query) => PurchaseModel.findOne(query);

const findById = (id) => PurchaseModel.findById(id);

const update = (id, data) => PurchaseModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deleteOne = (id) => PurchaseModel.findByIdAndDelete(id);

const count = (query) => PurchaseModel.countDocuments(query);

export { create, find, findOne, findById, update, deleteOne, count };

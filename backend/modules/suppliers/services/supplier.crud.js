import { getLocalSupplierModel } from "../../../configs/connect.db.js";

const SupplierModel = getLocalSupplierModel();

const create = (data) => SupplierModel.create(data);

const find = (query = {}) => SupplierModel.find(query);

const findOne = (query) => SupplierModel.findOne(query);

const findById = (id) => SupplierModel.findById(id);

const update = (id, data) => SupplierModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deleteOne = (id) => SupplierModel.findByIdAndDelete(id);

const count = (query) => SupplierModel.countDocuments(query);

export { create, find, findOne, findById, update, deleteOne, count };

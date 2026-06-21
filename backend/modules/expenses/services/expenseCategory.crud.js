import { getLocalExpenseCategoryModel } from "../../../configs/connect.db.js";

const ExpenseCategoryModel = getLocalExpenseCategoryModel();

const create = (data) => ExpenseCategoryModel.create(data);

const find = (query = {}) => ExpenseCategoryModel.find(query);

const findOne = (query) => ExpenseCategoryModel.findOne(query);

const findById = (id) => ExpenseCategoryModel.findById(id);

const update = (id, data) => ExpenseCategoryModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deleteOne = (id) => ExpenseCategoryModel.findByIdAndDelete(id);

const count = (query) => ExpenseCategoryModel.countDocuments(query);

export { create, find, findOne, findById, update, deleteOne, count };

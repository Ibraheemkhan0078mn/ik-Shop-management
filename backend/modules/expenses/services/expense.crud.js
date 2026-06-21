import { getLocalExpensesModel } from "../../../configs/connect.db.js";

const ExpenseModel = getLocalExpensesModel();

const create = (data) => ExpenseModel.create(data);

const find = (query = {}) => ExpenseModel.find(query);

const findOne = (query) => ExpenseModel.findOne(query);

const findById = (id) => ExpenseModel.findById(id);

const update = (id, data) => ExpenseModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deleteOne = (id) => ExpenseModel.findByIdAndDelete(id);

const count = (query) => ExpenseModel.countDocuments(query);

export { create, find, findOne, findById, update, deleteOne, count };

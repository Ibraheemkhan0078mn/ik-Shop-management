import { getLocalSubCategoryModel } from "../../../configs/connect.db.js";

const SubCategoryModel = getLocalSubCategoryModel();

const create = (data) => SubCategoryModel.create(data);

const find = (query = {}) => SubCategoryModel.find(query);

const findOne = (query) => SubCategoryModel.findOne(query);

const findById = (id) => SubCategoryModel.findById(id);

const update = (id, data) => SubCategoryModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deleteOne = (id) => SubCategoryModel.findByIdAndDelete(id);

const count = (query) => SubCategoryModel.countDocuments(query);

export { create, find, findOne, findById, update, deleteOne, count };

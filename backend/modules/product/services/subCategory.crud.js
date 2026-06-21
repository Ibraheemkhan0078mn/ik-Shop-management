import { getLocalSubCategoryModel } from "../../../configs/connect.db.js";

const create = (data) => {
    const SubCategoryModel = getLocalSubCategoryModel();
    return SubCategoryModel.create(data);
};

const find = (query = {}) => {
    const SubCategoryModel = getLocalSubCategoryModel();
    return SubCategoryModel.find(query);
};

const findOne = (query) => {
    const SubCategoryModel = getLocalSubCategoryModel();
    return SubCategoryModel.findOne(query);
};

const findById = (id) => {
    const SubCategoryModel = getLocalSubCategoryModel();
    return SubCategoryModel.findById(id);
};

const update = (id, data) => {
    const SubCategoryModel = getLocalSubCategoryModel();
    return SubCategoryModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteOne = (id) => {
    const SubCategoryModel = getLocalSubCategoryModel();
    return SubCategoryModel.findByIdAndDelete(id);
};

const count = (query) => {
    const SubCategoryModel = getLocalSubCategoryModel();
    return SubCategoryModel.countDocuments(query);
};

export { create, find, findOne, findById, update, deleteOne, count };

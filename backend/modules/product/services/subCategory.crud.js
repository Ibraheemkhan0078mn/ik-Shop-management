import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalSubCategoryModel } from "../../../configs/connect.db.js";

const SubCategoryModel = getLocalSubCategoryModel();

const create = (data) => {
    return createDoc({ model: SubCategoryModel, data });
};

const find = (query = {}) => {
    return findDocs({ model: SubCategoryModel, filter: query });
};

const findOne = (query) => {
    return findOneDoc({ model: SubCategoryModel, filter: query });
};

const findById = (id) => {
    return findOneDoc({ model: SubCategoryModel, filter: { _id: id } });
};

const update = (id, data) => {
    return updateDocs({ model: SubCategoryModel, filter: { _id: id }, data });
};

const deleteOne = (id) => {
    return deleteDocs({ model: SubCategoryModel, filter: { _id: id } });
};

const count = (query) => {
    return SubCategoryModel.countDocuments(query);
};

export { create, find, findOne, findById, update, deleteOne, count };

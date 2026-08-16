import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs, countDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalSubCategoryModel } from "../../../configs/connect.db.js";

const create = (data) => {
    const SubCategoryModel = getLocalSubCategoryModel();
    return createDoc({ model: SubCategoryModel, data });
};

const find = (query = {}, options = {}) => {
    const SubCategoryModel = getLocalSubCategoryModel();
    return findDocs({ model: SubCategoryModel, filter: query, options });
};

const findOne = (query) => {
    const SubCategoryModel = getLocalSubCategoryModel();
    return findOneDoc({ model: SubCategoryModel, filter: query });
};

const findById = (id) => {
    const SubCategoryModel = getLocalSubCategoryModel();
    return findOneDoc({ model: SubCategoryModel, filter: { _id: id } });
};

const update = (id, data) => {
    const SubCategoryModel = getLocalSubCategoryModel();
    return updateDocs({ model: SubCategoryModel, filter: { _id: id }, data });
};

const deleteOne = (id) => {
    const SubCategoryModel = getLocalSubCategoryModel();
    return deleteDocs({ model: SubCategoryModel, filter: { _id: id } });
};

const count = (query) => {
    const SubCategoryModel = getLocalSubCategoryModel();
    return countDocs({ model: SubCategoryModel, filter: query });
};

export { create, find, findOne, findById, update, deleteOne, count };

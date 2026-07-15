import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalCategoryModel } from "../../../configs/connect.db.js";

const CategoryModel = getLocalCategoryModel();

const createCategoryService = (data) => {
    return createDoc({ model: CategoryModel, data });
};

const findCategoryService = (query = {}) => {
    return findDocs({ model: CategoryModel, filter: query });
};

const findOneCategoryService = (query) => {
    return findOneDoc({ model: CategoryModel, filter: query });
};

const findByIdCategoryService = (id) => {
    return findOneDoc({ model: CategoryModel, filter: { _id: id } });
};

const updateCategoryService = (id, data) => {
    return updateDocs({ model: CategoryModel, filter: { _id: id }, data });
};

const deleteOneCategoryService = (id) => {
    return deleteDocs({ model: CategoryModel, filter: { _id: id } });
};

const countCategoryService = (query) => {
    return CategoryModel.countDocuments(query);
};

export { createCategoryService, findCategoryService, findOneCategoryService, findByIdCategoryService, updateCategoryService, deleteOneCategoryService, countCategoryService };

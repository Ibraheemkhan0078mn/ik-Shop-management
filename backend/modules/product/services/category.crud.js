import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalCategoryModel } from "../../../configs/connect.db.js";

const createCategoryService = (data) => {
    const CategoryModel = getLocalCategoryModel();
    return createDoc({ model: CategoryModel, data });
};

const findCategoryService = (query = {}, options = {}) => {
    const CategoryModel = getLocalCategoryModel();
    return findDocs({ model: CategoryModel, filter: query, options });
};

const findOneCategoryService = (query, options = {}) => {
    const CategoryModel = getLocalCategoryModel();
    return findOneDoc({ model: CategoryModel, filter: query, options });
};

const findByIdCategoryService = (id, options = {}) => {
    const CategoryModel = getLocalCategoryModel();
    return findOneDoc({ model: CategoryModel, filter: { _id: id }, options });
};

const updateCategoryService = (id, data) => {
    const CategoryModel = getLocalCategoryModel();
    return updateDocs({ model: CategoryModel, filter: { _id: id }, data });
};

const deleteOneCategoryService = (id) => {
    const CategoryModel = getLocalCategoryModel();
    return deleteDocs({ model: CategoryModel, filter: { _id: id } });
};

const countCategoryService = (query) => {
    const CategoryModel = getLocalCategoryModel();
    return CategoryModel.countDocuments(query);
};

export { createCategoryService, findCategoryService, findOneCategoryService, findByIdCategoryService, updateCategoryService, deleteOneCategoryService, countCategoryService };

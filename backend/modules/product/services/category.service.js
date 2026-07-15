import {
    createCategoryService,
    findCategoryService,
    findOneCategoryService,
    findByIdCategoryService,
    updateCategoryService,
    deleteOneCategoryService,
    countCategoryService,
} from "./category.crud.js";
import { paginateModel } from '../../../common/services/common.service.js';
import { getLocalCategoryModel } from '../../../configs/connect.db.js';

export const getCategories = async () => {
    return findCategoryService({}, { sort: { createdAt: -1 } });
};

export const getPaginationCategories = async (filters = {}) => {
    const { page = 1, limit = 20 } = filters;
    const CategoryModel = getLocalCategoryModel();
    
    const result = await paginateModel({
        model: CategoryModel,
        page,
        limit,
        sort: { createdAt: -1 }
    });
    
    return result;
};

export const getCategoryById = async (id) => {
    return findByIdCategoryService(id);
};

export const createCategory = async (data) => {
    const { name } = data;
    const categoryExists = await findOneCategoryService({ name });
    
    if (categoryExists) {
        throw new Error("Category with this name already exists");
    }
    
    return createCategoryService(data);
};

export const updateCategory = async (id, data) => {
    const category = await findByIdCategoryService(id);
    
    if (!category) {
        throw new Error("Category not found");
    }
    
    if (data.name && data.name !== category.name) {
        const nameExists = await findOneCategoryService({ name: data.name });
        if (nameExists) {
            throw new Error("Category with this name already exists");
        }
    }
    
    return updateCategoryService(id, data);
};

export const deleteCategory = async (id) => {
    const category = await findByIdCategoryService(id);
    
    if (!category) {
        throw new Error("Category not found");
    }
    
    return deleteOneCategoryService(id);
};
